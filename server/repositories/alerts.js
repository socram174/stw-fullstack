import Alert from '../models/Alert.js';
import Log from '../models/Log.js';
import { buildLatest, normalizeAlerts, parseAlertDate } from '../services/alert-data.js';
import { historyFacet, historySelection, historySort, normalizedAlertStage } from '../services/alert-pipeline.js';
import { buildRewardSeries, rewardWindow } from '../services/alert-rewards.js';

const emptySummary = { totalVbucks: 0, missions: 0, zones: 0, minPower: null, days: 0 };

export function createAlertRepository(AlertModel = Alert, LogModel = Log) {
    const findLogs = () => LogModel.find().select('lastUpdated afterReset').lean().exec();
    return {
        async getRewards(period, now) {
            const window = rewardWindow(period, now);
            const days = await AlertModel.aggregate([
                ...(period === 'all' ? [] : [{ $match: { date: { $gte: window.from, $lte: window.to } } }]),
                { $group: {
                    _id: '$date', vbucks: { $sum: '$vbucks' },
                    missions: { $sum: { $cond: [{ $gt: ['$vbucks', 0] }, 1, 0] } },
                } },
                { $project: { _id: 0, date: '$_id', vbucks: 1, missions: 1 } },
            ]).exec();
            return buildRewardSeries(days, window);
        },
        async getHistory(filters) {
            const [result, zoneRows] = await Promise.all([
                AlertModel.aggregate([...historySelection(filters), historyFacet(filters)]).exec(),
                AlertModel.aggregate([
                    { $match: { vbucks: { $gt: 0 } } }, normalizedAlertStage,
                    { $group: { _id: '$zone' } }, { $sort: { _id: 1 } },
                ]).exec(),
            ]);
            const facet = result[0];
            const { total = 0, ...summary } = facet.summary[0] ?? { total: 0, ...emptySummary };
            const totalPages = Math.max(1, Math.ceil(total / filters.limit));
            const page = Math.min(filters.page, totalPages);
            let data = facet.data;
            if (page !== filters.page && total > 0) {
                data = await AlertModel.aggregate([
                    ...historySelection(filters), { $sort: historySort(filters.sort) },
                    { $skip: (page - 1) * filters.limit }, { $limit: filters.limit },
                ]).exec();
            }
            return {
                data, pagination: { page, limit: filters.limit, total, totalPages },
                summary, dailyRewards: facet.dailyRewards, zones: zoneRows.map((row) => row._id).sort(),
            };
        },
        async getLatest() {
            const [newest, logs] = await Promise.all([
                AlertModel.findOne().sort({ date: -1, vbucks: -1, _id: 1 }).select('date').lean().exec(),
                findLogs(),
            ]);
            const date = [newest?.date, ...logs.map((log) => parseAlertDate(log.lastUpdated))].filter(Boolean).sort().pop();
            const records = date ? await AlertModel.find({ date }).lean().exec() : [];
            return buildLatest(normalizeAlerts(records), logs);
        },
    };
}

export const alertRepository = createAlertRepository();
