import { parseAlertQuery, parseRewardQuery } from '../validation/alert-query.js';

export function createAlertControllers(repository) {
    return {
        rewards: async (req, res) => {
            const period = parseRewardQuery(req.query);
            res.json(await repository.getRewards(period, undefined, req.query.interval));
        },
        history: async (req, res) => {
            const filters = parseAlertQuery(req.query);
            res.json(await repository.getHistory(filters));
        },
        latest: async (req, res) => {
            res.json(await repository.getLatest());
        },
    };
}
