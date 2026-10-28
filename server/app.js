import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import alertRoutes from './routes/alerts.js';
import { createAlertRouter } from './routes/alerts-v1.js';
import { createMcpRouter } from './auth/routes.js';

export function safeRequestUrl(req) {
    const url = req.originalUrl || req.url;
    return /^\/(?:mcp(?:\/|\?|$)|api\/auth(?:\/|\?|$)|\.well-known\/)/.test(url) ? url.split('?')[0] : url;
}

morgan.token('safe-url', safeRequestUrl);

export function createApp({ repository, auth = null, mcpConfig = null, logging = true }) {
    const app = express();
    app.disable('x-powered-by');
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
    if (logging) app.use(morgan(morgan.common.replace(':url', ':safe-url')));
    app.use(cors());
    // Better Auth and the MCP transport must receive the unread request stream.
    if (auth && mcpConfig) app.use(createMcpRouter(auth, mcpConfig, repository));
    app.use(express.json());
    app.use('/alerts', alertRoutes);
    app.use('/api/v1/alerts', createAlertRouter(repository));
    return app;
}
