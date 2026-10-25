import { parseAlertQuery } from '../validation/alert-query.js';

export function createAlertControllers(repository) {
    return {
        history: async (req, res, next) => {
            try {
                const filters = parseAlertQuery(req.query);
                res.json(await repository.getHistory(filters));
            } catch (error) { next(error); }
        },
        latest: async (req, res, next) => {
            try {
                res.json(await repository.getLatest());
            } catch (error) { next(error); }
        },
    };
}
