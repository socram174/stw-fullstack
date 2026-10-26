const dayMilliseconds = 86400000;
const iso = (date) => date.toISOString().slice(0, 10);
const calendarDate = (date) => new Date(`${date}T00:00:00Z`);
const shiftDays = (date, days) => new Date(date.getTime() + days * dayMilliseconds);
const santiagoDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function rewardWindow(period, now = new Date()) {
    const parts = Object.fromEntries(santiagoDate.formatToParts(now).map(({ type, value }) => [type, value]));
    const to = `${parts.year}-${parts.month}-${parts.day}`;
    // The full archive's bounds are resolved from its aggregated dates below.
    if (period === 'all') return { period, interval: 'month', from: to, to };
    const end = calendarDate(to);
    let start;
    if (period === '7d' || period === '1m') {
        start = shiftDays(end, period === '7d' ? -6 : -29);
    } else if (period === '6m' || period === '1y') {
        // Clamp month-end dates before adding one day for an inclusive window.
        start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (period === '6m' ? 6 : 12), 1));
        const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
        start.setUTCDate(Math.min(end.getUTCDate(), lastDay));
        start = shiftDays(start, 1);
    } else {
        throw new Error('Unsupported rewards period.');
    }
    return { period, interval: period === '6m' ? 'week' : period === '1y' ? 'month' : 'day', from: iso(start), to };
}

export function groupRewardDays(alerts) {
    const days = new Map();
    for (const alert of alerts) {
        const day = days.get(alert.date) ?? { date: alert.date, vbucks: 0, missions: 0 };
        day.vbucks += alert.vbucks;
        if (alert.vbucks > 0) day.missions++;
        days.set(alert.date, day);
    }
    return [...days.values()];
}

export function buildRewardSeries(days, window) {
    if (window.period === 'all' && days.length) {
        const dates = days.map((day) => day.date).sort();
        window = { ...window, from: dates[0], to: dates[dates.length - 1] };
    }
    const recorded = new Map(days.map((day) => [day.date, day]));
    const buckets = new Map();
    for (let cursor = calendarDate(window.from); iso(cursor) <= window.to; cursor = shiftDays(cursor, 1)) {
        const date = iso(cursor);
        let start = cursor;
        if (window.interval === 'week') start = shiftDays(cursor, -((cursor.getUTCDay() + 6) % 7));
        if (window.interval === 'month') start = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
        const key = iso(start) < window.from ? window.from : iso(start);
        const bucket = buckets.get(key) ?? {
            date: key, endDate: date, vbucks: null, missions: 0, recordedDays: 0, totalDays: 0,
        };
        bucket.endDate = date;
        bucket.totalDays++;
        const day = recorded.get(date);
        if (day) {
            bucket.vbucks = (bucket.vbucks ?? 0) + day.vbucks;
            bucket.missions += day.missions;
            bucket.recordedDays++;
        }
        buckets.set(key, bucket);
    }
    return { ...window, data: [...buckets.values()] };
}
