import express from 'express';
import { fileURLToPath } from 'node:url';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { verifyOAuthQueryParams } from '@better-auth/oauth-provider';
import { isOwner, MCP_SCOPE } from './config.js';
import { signInPage, consentPage, connectedPage, errorPage } from './views.js';
import { createPrivateMcpHandler } from '../mcp/handler.js';

export function createMcpRouter(auth, config, repository) {
    const router = express.Router();
    const authHandler = toNodeHandler(auth);
    const originAllowed = (origin) => [config.origin, 'https://chatgpt.com', 'https://chat.openai.com'].includes(origin);
    const authPaths = ['/api/auth', '/api/auth/{*path}', '/mcp', '/mcp/{*path}', '/.well-known/{*path}'];
    router.use(authPaths, (req, res, next) => {
        res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' });
        if (req.headers.host !== new URL(config.origin).host || (req.headers.origin && !originAllowed(req.headers.origin))) {
            return res.status(403).json({ error: 'Origin is not allowed.' });
        }
        next();
    });
    router.use('/mcp/auth/assets', express.static(fileURLToPath(new URL('./public/', import.meta.url)), { index: false, redirect: false }));
    router.get('/mcp/auth/sign-in', async (req, res) => {
        const query = new URL(req.originalUrl, config.origin).search.slice(1);
        if (query && !await verifyOAuthQueryParams(query, config.secret)) {
            return res.status(400).send(errorPage('This connection request is invalid or has expired.'));
        }
        res.send(signInPage(query));
    });
    router.get('/mcp/auth/consent', async (req, res) => {
        const query = new URL(req.originalUrl, config.origin).search.slice(1);
        if (!query || !await verifyOAuthQueryParams(query, config.secret)) {
            return res.status(400).send(errorPage('This connection request is invalid or has expired.'));
        }
        const headers = fromNodeHeaders(req.headers);
        const session = await auth.api.getSession({ headers });
        if (!session) return res.redirect(`/mcp/auth/sign-in?${query}`);
        if (!isOwner(session.user.id, config)) return res.status(403).send(errorPage('Access is restricted to the owner.'));
        const params = new URLSearchParams(query);
        const scopes = [...new Set((params.get('scope') || '').split(' ').filter(Boolean))];
        if (scopes.some((scope) => ![MCP_SCOPE, 'offline_access'].includes(scope))) {
            return res.status(400).send(errorPage('This application requested unsupported permissions.'));
        }
        const client = await auth.api.getOAuthClientPublic({ headers, query: { client_id: params.get('client_id') } });
        res.send(consentPage({ query, clientName: client.client_name || 'This application', scopes, email: session.user.email }));
    });
    router.get('/mcp/auth/connected', async (req, res) => {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        if (!session) return res.redirect('/mcp/auth/sign-in');
        if (!isOwner(session.user.id, config)) return res.status(403).send(errorPage('Access is restricted to the owner.'));
        res.send(connectedPage(session.user.email));
    });
    router.all(['/api/auth', '/api/auth/{*path}', '/.well-known/{*path}'], authHandler);
    router.all('/mcp', createPrivateMcpHandler(auth, config, repository));
    router.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        console.error('MCP authentication request failed.');
        if (req.path.startsWith('/mcp/auth/')) return res.status(500).send(errorPage('Unable to complete the connection. Please try again.'));
        res.status(500).json({ error: 'Unable to complete the request.' });
    });
    return router;
}
