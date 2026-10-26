import { parseAlertQuery, parseRewardQuery } from '../validation/alert-query.js';

export function createAlertControllers(repository) {
    return {
        rewards: async (req, res) => {
            res.json(await repository.getRewards(parseRewardQuery(req.query)));
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
