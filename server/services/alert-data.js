// Accept legacy dates during migration/rolling deployment. New collector writes
// ISO calendar dates; nested zone fields remain compatible with old clients.
export function parseAlertDate(value) {
    if (typeof value !== 'string') throw new Error('Invalid stored alert date.');
    const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const rawYear = legacy?.[3] ?? iso?.[1];
    const year = Number(rawYear) + (rawYear?.length === 2 ? 2000 : 0);
    const month = Number(legacy?.[1] ?? iso?.[2]);
    const day = Number(legacy?.[2] ?? iso?.[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new Error('Invalid stored alert date.');
    }
    return date.toISOString().slice(0, 10);
}

const text = (value) => typeof value === 'string' ? value.trim() : '';

export function normalizeAlerts(records) {
    return records.map((record, index) => {
        if (!record || typeof record.vbucks !== 'number' ||
            !Number.isFinite(record.vbucks) || record.vbucks < 0) {
            throw new Error('Invalid stored alert reward.');
        }
        const date = parseAlertDate(record.date);
        return {
            id: record._id != null ? String(record._id) : `${date}-${index}`,
            date,
            mission: text(record.zone?.mission) ||
                (record.vbucks > 0 ? 'Alert mission' : 'No V-Buck missions'),
            location: text(record.zone?.variant),
            zone: text(record.zone?.name) || 'Unknown zone',
            powerLevel: Number.isFinite(record.powerLevel) ? Math.max(0, record.powerLevel) : 0,
            vbucks: record.vbucks,
            afterReset: record.afterReset === true,
        };
    });
}

export function summarizeAlerts(alerts) {
    const missions = alerts.filter((alert) => alert.vbucks > 0);
    const levels = missions.map((alert) => alert.powerLevel).filter((level) => level > 0);
    return {
        totalVbucks: missions.reduce((total, alert) => total + alert.vbucks, 0),
        missions: missions.length,
        zones: new Set(missions.map((alert) => alert.zone).filter((zone) => zone !== 'Unknown zone')).size,
        minPower: levels.length ? Math.min(...levels) : null,
        days: new Set(alerts.map((alert) => alert.date)).size,
    };
}

function dailyRewards(alerts) {
    const days = new Map();
    for (const alert of alerts) {
        const day = days.get(alert.date) ?? { date: alert.date, vbucks: 0, missions: 0 };
        day.vbucks += alert.vbucks;
        if (alert.vbucks > 0) day.missions += 1;
        days.set(alert.date, day);
    }
    return [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
}

const searchText = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function buildHistory(alerts, filters) {
    const search = searchText(filters.q);
    const matches = alerts.filter((alert) =>
        (!filters.from || alert.date >= filters.from) &&
        (!filters.to || alert.date <= filters.to) &&
        (!filters.zone || alert.zone === filters.zone) &&
        (!search || searchText(`${alert.mission} ${alert.zone} ${alert.powerLevel}`).includes(search))
    ).sort((a, b) => {
        if (filters.sort === 'reward') return b.vbucks - a.vbucks || b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
        if (filters.sort === 'power') return a.powerLevel - b.powerLevel || b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
        return b.date.localeCompare(a.date) || b.vbucks - a.vbucks || a.id.localeCompare(b.id);
    });
    const total = matches.length;
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));
    const page = Math.min(filters.page, totalPages);
    return {
        data: matches.slice((page - 1) * filters.limit, page * filters.limit),
        pagination: { page, limit: filters.limit, total, totalPages },
        summary: summarizeAlerts(matches),
        dailyRewards: dailyRewards(matches),
        // Keep all available zones selectable even when the selection is empty.
        zones: [...new Set(alerts.filter((alert) => alert.vbucks > 0).map((alert) => alert.zone))].sort(),
    };
}

export function buildLatest(alerts, logs) {
    // Never depend on MongoDB's natural order or assume the record is for today.
    const dates = [...alerts.map((alert) => alert.date), ...logs.map((log) => parseAlertDate(log.lastUpdated))];
    const date = dates.sort().at(-1);
    const data = date ? alerts.filter((alert) => alert.date === date).sort((a, b) => a.powerLevel - b.powerLevel || a.id.localeCompare(b.id)) : [];
    return {
        data,
        rotation: date ? {
            date,
            afterReset: data.some((alert) => alert.afterReset) ||
                logs.some((log) => parseAlertDate(log.lastUpdated) === date && log.afterReset === true),
        } : null,
        summary: summarizeAlerts(data),
    };
}
