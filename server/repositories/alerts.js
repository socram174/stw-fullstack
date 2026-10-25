import Alert from '../models/Alert.js';
import Log from '../models/Log.js';
import { buildHistory, buildLatest, normalizeAlerts, parseAlertDate } from '../services/alert-data.js';
import { historyFacet, historySelection, historySort, normalizedAlertStage } from '../services/alert-pipeline.js';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const emptySummary = { totalVbucks: 0, missions: 0, zones: 0, minPower: null, days: 0 };

export function createAlertRepository(AlertModel = Alert, LogModel = Log) {
    const findAlerts = () => AlertModel.find().select('date powerLevel vbucks zone afterReset').lean().exec();
    const findLogs = () => LogModel.find().select('lastUpdated afterReset').lean().exec();
    // Keep rolling deployments safe until the external collector is published.
    const hasLegacyDates = async () => Boolean(await AlertModel.exists({ date: { $not: isoDate } }));
    return {
        async getHistory(filters) {
            if (await hasLegacyDates()) return buildHistory(normalizeAlerts(await findAlerts()), filters);
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
            if (await hasLegacyDates()) {
                const [records, logs] = await Promise.all([findAlerts(), findLogs()]);
                return buildLatest(normalizeAlerts(records), logs);
            }
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
