import { parseAlertQuery } from '../validation/alert-query.js';

export function createAlertControllers(repository) {
    return {
        history: async (req, res) => {
            const filters = parseAlertQuery(req.query);
            res.json(await repository.getHistory(filters));
        },
        latest: async (req, res) => {
            res.json(await repository.getLatest());
        },
    };
}
