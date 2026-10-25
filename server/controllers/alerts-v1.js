import { buildHistory, buildLatest, normalizeAlerts } from '../services/alert-data.js';
import { parseAlertQuery } from '../validation/alert-query.js';

export function createAlertControllers(repository) {
    return {
        history: async (req, res, next) => {
            try {
                const filters = parseAlertQuery(req.query);
                const alerts = normalizeAlerts(await repository.findAlerts());
                res.json(buildHistory(alerts, filters));
            } catch (error) { next(error); }
        },
        latest: async (req, res, next) => {
            try {
                const [records, logs] = await Promise.all([repository.findAlerts(), repository.findLogs()]);
                res.json(buildLatest(normalizeAlerts(records), logs));
            } catch (error) { next(error); }
        },
    };
}
