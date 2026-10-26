import express from 'express';
import { createAlertControllers } from '../controllers/alerts-v1.js';
import { InvalidQuery } from '../validation/alert-query.js';

export function createAlertRouter(repository) {
    const router = express.Router();
    const controllers = createAlertControllers(repository);
    router.get('/latest', controllers.latest);
    router.get('/rewards', controllers.rewards);
    router.get('/', controllers.history);
    router.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Alert endpoint not found.' } }));
    router.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        const invalid = error instanceof InvalidQuery;
        if (!invalid) console.error('Alerts API request failed:', error);
        res.status(invalid ? 400 : 500).json({ error: {
            code: invalid ? 'INVALID_QUERY' : 'INTERNAL_ERROR',
            message: invalid ? error.message : 'Unable to load alerts. Please try again later.',
        } });
    });
    return router;
}
