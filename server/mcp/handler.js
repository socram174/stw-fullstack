import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { requireMcpAuth } from '@better-auth/mcp';
import { createAlertsMcpServer } from './tools.js';
import { isOwner, MCP_SCOPE } from '../auth/config.js';

export function createPrivateMcpHandler(auth, config, repository) {
    // Serve both current and 2025 MCP clients without keeping process-local sessions.
    const protocol = createMcpHandler(() => createAlertsMcpServer(repository), {
        legacy: 'stateless', maxRequestBodySize: 64 * 1024,
    });
    const authorized = requireMcpAuth(auth, async (request, claims) => {
        if (!isOwner(claims.sub, config)) return Response.json({ error: 'Access is restricted to the owner.' }, { status: 403 });
        if (!['POST', 'GET', 'DELETE'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'POST' } });
        return protocol.fetch(request);
    }, { resource: config.resource, requiredScopes: [MCP_SCOPE], challengeScopes: [MCP_SCOPE, 'offline_access'] });
    // The Node adapter sees HTTP behind Render's TLS proxy. Use our configured
    // canonical URL for audience-bound proofs instead of trusting forwarded headers.
    const fetch = (request) => authorized(new Request(config.resource, request));
    return toNodeHandler({ fetch }, {
        maxRequestBodySize: 64 * 1024,
        onerror: () => console.error('MCP request failed.'),
    });
}
