// Produce the same public fields as normalizeAlerts, inside MongoDB so the
// server only receives the requested page and aggregates, not the full archive.
const trim = (input) => ({ $trim: { input: { $convert: { input, to: 'string', onNull: '', onError: '' } } } });
const fallback = (input, otherwise) => ({ $cond: [{ $ne: [trim(input), ''] }, trim(input), otherwise] });

export const normalizedAlertStage = {
    $project: {
        _id: 0, id: { $toString: '$_id' }, date: 1, vbucks: 1,
        mission: fallback('$zone.mission', { $cond: [{ $gt: ['$vbucks', 0] }, 'Alert mission', 'No V-Buck missions'] }),
        location: trim('$zone.variant'), zone: fallback('$zone.name', 'Unknown zone'),
        powerLevel: { $max: [0, { $ifNull: ['$powerLevel', 0] }] },
        afterReset: { $eq: [{ $ifNull: ['$afterReset', false] }, true] },
    },
};

// $regexMatch does not honor accent-insensitive collations. Expand the Latin
// letters used by mission/zone names, while escaping user input as literal text.
const accents = {
    a: 'aàáâãäåāăą', c: 'cçćĉċč', d: 'dď', e: 'eèéêëēĕėęě',
    g: 'gĝğġģ', h: 'hĥ', i: 'iìíîïĩīĭįı', j: 'jĵ', k: 'kķ', l: 'lĺļľ',
    n: 'nñńņň', o: 'oòóôõöōŏő', r: 'rŕŗř', s: 'sśŝşš',
    t: 'tţť', u: 'uùúûüũūŭůűų', w: 'wŵ', y: 'yýÿŷ', z: 'zźżž',
};

export function literalSearchPattern(search) {
    const folded = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return [...folded].map((char) => {
        const literal = accents[char] ? `[${accents[char]}]` : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return `${literal}[\u0300-\u036f]*`;
    }).join('');
}

export function historySelection(filters) {
    const date = {};
    if (filters.from) date.$gte = filters.from;
    if (filters.to) date.$lte = filters.to;
    const stages = Object.keys(date).length ? [{ $match: { date } }] : [];
    // This sort can use the date/reward index before projecting public fields.
    if (filters.sort === 'recent') stages.push({ $sort: { date: -1, vbucks: -1, _id: 1 } });
    stages.push(normalizedAlertStage);
    if (filters.zone) stages.push({ $match: { zone: filters.zone } });
    if (filters.q) stages.push({ $match: { $expr: { $regexMatch: {
        input: { $concat: ['$mission', ' ', '$zone', ' ', { $toString: '$powerLevel' }] },
        regex: literalSearchPattern(filters.q), options: 'i',
    } } } });
    return stages;
}

export function historySort(sort) {
    if (sort === 'reward') return { vbucks: -1, date: -1, id: 1 };
    if (sort === 'power') return { powerLevel: 1, date: -1, id: 1 };
    return { date: -1, vbucks: -1, id: 1 };
}

export function historyFacet(filters) {
    const mission = { $gt: ['$vbucks', 0] };
    const skip = Math.min(Number.MAX_SAFE_INTEGER, (filters.page - 1) * filters.limit);
    return { $facet: {
        data: [{ $sort: historySort(filters.sort) }, { $skip: skip }, { $limit: filters.limit }],
        summary: [{ $group: {
            _id: null, total: { $sum: 1 }, totalVbucks: { $sum: '$vbucks' },
            missions: { $sum: { $cond: [mission, 1, 0] } },
            zones: { $addToSet: { $cond: [{ $and: [mission, { $ne: ['$zone', 'Unknown zone'] }] }, '$zone', null] } },
            minPower: { $min: { $cond: [{ $and: [mission, { $gt: ['$powerLevel', 0] }] }, '$powerLevel', null] } },
            days: { $addToSet: '$date' },
        } }, { $project: {
            _id: 0, total: 1, totalVbucks: 1, missions: 1, minPower: 1,
            zones: { $size: { $setDifference: ['$zones', [null]] } }, days: { $size: '$days' },
        } }],
        dailyRewards: [
            { $group: { _id: '$date', vbucks: { $sum: '$vbucks' }, missions: { $sum: { $cond: [mission, 1, 0] } } } },
            { $sort: { _id: -1 } }, { $limit: 30 }, { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', vbucks: 1, missions: 1 } },
        ],
    } };
}
