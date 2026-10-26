import { parseAlertDate } from '../services/alert-data.js';

export class InvalidQuery extends Error {}

export function parseRewardQuery(query) {
    if (Object.keys(query).some((key) => key !== 'period')) {
        throw new InvalidQuery('Only period is supported for reward charts.');
    }
    const period = query.period ?? '1m';
    if (!['7d', '1m', '6m', '1y', 'all'].includes(period)) {
        throw new InvalidQuery('period must be 7d, 1m, 6m, 1y or all.');
    }
    return period;
}

export function parseAlertQuery(query) {
    const allowed = new Set(['from', 'to', 'q', 'zone', 'sort', 'page', 'limit']);
    for (const key of Object.keys(query)) {
        if (!allowed.has(key)) throw new InvalidQuery(`Unknown query parameter: ${key}.`);
        if (typeof query[key] !== 'string') throw new InvalidQuery(`${key} must be a single string value.`);
    }
    const filters = {
        from: query.from ?? '', to: query.to ?? '',
        q: (query.q ?? '').trim(), zone: (query.zone ?? '').trim(),
        sort: query.sort ?? 'recent', page: 1, limit: 25,
    };
    for (const key of ['from', 'to']) {
        if (!filters[key]) continue;
        try {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(filters[key]) || parseAlertDate(filters[key]) !== filters[key]) throw new Error();
        } catch {
            throw new InvalidQuery(`${key} must be a valid YYYY-MM-DD date.`);
        }
    }
    if (filters.from && filters.to && filters.from > filters.to) throw new InvalidQuery('from must be on or before to.');
    if (filters.q.length > 200 || filters.zone.length > 100) throw new InvalidQuery('Search or zone is too long.');
    if (!['recent', 'reward', 'power'].includes(filters.sort)) throw new InvalidQuery('sort must be recent, reward or power.');
    for (const [key, max] of [['page', Number.MAX_SAFE_INTEGER], ['limit', 100]]) {
        if (query[key] === undefined) continue;
        const value = Number(query[key]);
        if (!/^[1-9]\d*$/.test(query[key]) || !Number.isSafeInteger(value) || value > max) {
            throw new InvalidQuery(`${key} must be an integer between 1 and ${max}.`);
        }
        filters[key] = value;
    }
    return filters;
}
