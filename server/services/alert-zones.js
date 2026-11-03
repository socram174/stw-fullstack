import { normalizedAlertStage } from './alert-pipeline.js';

export function zoneStatsPipeline(window) {
    return [
        ...(window.period === 'all' ? [] : [{ $match: { date: { $gte: window.from, $lte: window.to } } }]),
        normalizedAlertStage,
        { $facet: {
            coverage: [
                { $group: { _id: '$date' } },
                { $group: { _id: null, from: { $min: '$_id' }, to: { $max: '$_id' }, recordedDays: { $sum: 1 } } },
            ],
            zones: [
                { $match: { vbucks: { $gt: 0 } } },
                { $group: { _id: '$zone', vbucks: { $sum: '$vbucks' }, missions: { $sum: 1 } } },
                { $project: { _id: 0, zone: '$_id', vbucks: 1, missions: 1 } },
                { $sort: { vbucks: -1, zone: 1 } },
            ],
        } },
    ];
}

export function buildZoneStats(facet, window) {
    const coverage = facet?.coverage[0];
    const from = window.period === 'all' && coverage ? coverage.from : window.from;
    const to = window.period === 'all' && coverage ? coverage.to : window.to;
    return {
        period: window.period, from, to,
        recordedDays: coverage?.recordedDays ?? 0,
        totalDays: Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1,
        data: facet?.zones ?? [],
    };
}
