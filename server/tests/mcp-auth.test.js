import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { test } from 'node:test';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createApp, safeRequestUrl } from '../app.js';
import { createMcpAuth } from '../auth/better-auth.js';
import { readMcpConfig } from '../auth/config.js';
import { provisionOwner } from '../auth/provision-owner.js';

const password = 'Unit-test-only-owner-password-2026!';
const repository = {
    getLatest: async () => ({ data: [], rotation: null, summary: { totalVbucks: 0, missions: 0 } }),
    getHistory: async (filters) => ({ data: [], pagination: { page: filters.page, limit: filters.limit }, summary: { totalVbucks: 50 } }),
    getRewards: async (period) => ({ period, interval: 'day', from: '2026-10-01', to: '2026-10-01', data: [] }),
};

async function withMcp(run, { enabled = true, repo = repository, metadataFetch } = {}) {
    const server = createServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const origin = `http://127.0.0.1:${server.address().port}`;
    const config = readMcpConfig({
        MCP_ENABLED: 'true', BETTER_AUTH_URL: origin,
        BETTER_AUTH_SECRET: randomBytes(32).toString('hex'), MCP_OWNER_ID: '000000000000000000000001',
    });
    const database = Object.fromEntries([
        'mcpUser', 'mcpAccount', 'mcpSession', 'mcpVerification', 'mcpJwks', 'mcpRateLimit',
        'mcpOauthClient', 'mcpOauthAccessToken', 'mcpOauthRefreshToken', 'mcpOauthConsent',
        'mcpOauthClientAssertion', 'mcpOauthResource', 'mcpOauthClientResource',
    ].map((name) => [name, []]));
    const auth = createMcpAuth(config, memoryAdapter(database), { metadataFetch });
    let owner;
    try {
        owner = await provisionOwner(auth, { email: 'owner@example.com', password });
        assert.equal(owner.id, config.ownerId);
    } catch (error) {
        await new Promise((resolve) => server.close(resolve));
        throw error;
    }
    server.on('request', createApp({ repository: repo, auth: enabled ? auth : null, mcpConfig: enabled ? config : null, logging: false }));
    const request = (path, options = {}) => fetch(new URL(path, origin), { redirect: 'manual', ...options });
    const post = (path, body, cookie = '') => request(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Accept: 'application/json', Cookie: cookie },
        body: JSON.stringify(body),
    });
    const login = async () => {
        const response = await post('/api/auth/sign-in/email', { email: owner.email, password });
        assert.equal(response.status, 200, await response.clone().text());
        return response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
    };
    try { await run({ request, post, login, config, auth, database, owner, origin }); }
    finally {
        server.closeAllConnections();
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
}

test('MCP configuration is opt-in and fails closed for incomplete or unsafe settings', () => {
    assert.equal(readMcpConfig({}), null);
    assert.equal(readMcpConfig({ MCP_ENABLED: 'false' }), null);
    assert.throws(() => readMcpConfig({ MCP_ENABLED: 'yes' }));
    const good = { MCP_ENABLED: 'true', BETTER_AUTH_URL: 'https://stw.example.com', BETTER_AUTH_SECRET: 'a'.repeat(64), MCP_OWNER_ID: 'owner' };
    assert.equal(readMcpConfig(good).resource, 'https://stw.example.com/mcp');
    for (const url of ['http://public.example.com', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com/?secret=x']) {
        assert.throws(() => readMcpConfig({ ...good, BETTER_AUTH_URL: url }));
    }
    assert.throws(() => readMcpConfig({ ...good, BETTER_AUTH_SECRET: '' }));
    assert.throws(() => readMcpConfig({ ...good, MCP_OWNER_ID: '' }));
});

test('sensitive query strings are removed from request logs', () => {
    for (const path of ['/mcp', '/mcp/auth/consent', '/api/auth/oauth2/authorize', '/.well-known/oauth-protected-resource/mcp']) {
        assert.equal(safeRequestUrl({ originalUrl: `${path}?code=private&sig=private` }), path);
    }
    assert.equal(safeRequestUrl({ url: '/api/v1/alerts?page=2' }), '/api/v1/alerts?page=2');
});

test('disabled MCP does not expose auth routes and leaves the public alerts API usable', async () => {
    await withMcp(async ({ request }) => {
        assert.equal((await request('/mcp')).status, 404);
        assert.equal((await request('/api/auth/ok')).status, 404);
        assert.equal((await request('/api/v1/alerts/latest')).status, 200);
    }, { enabled: false });
});

test('owner bootstrap hashes credentials, refuses another owner and never creates a session', async () => {
    await withMcp(async ({ auth, database }) => {
        assert.equal(database.mcpUser.length, 1);
        assert.notEqual(database.mcpAccount[0].password, password);
        assert.equal(database.mcpSession?.length ?? 0, 0);
        await assert.rejects(provisionOwner(auth, { email: 'another@example.com', password }), /already exists/);
        await assert.rejects(provisionOwner(auth, { email: 'owner@example.com', password: 'short' }), /16 and 128/);
    });
});

test('discovery is public, MCP requires bearer auth, browser origins and public signup are rejected', async () => {
    let reads = 0;
    await withMcp(async ({ request, post, config }) => {
        const resource = await request('/.well-known/oauth-protected-resource/mcp');
        assert.equal(resource.status, 200, await resource.clone().text());
        assert.deepEqual((await resource.json()).authorization_servers, [config.issuer]);
        const metadata = await request('/.well-known/oauth-authorization-server/api/auth');
        assert.equal(metadata.status, 200);
        const body = await metadata.json();
        assert.equal(body.issuer, config.issuer);
        assert.equal(body.client_id_metadata_document_supported, true);
        assert.equal(body.registration_endpoint, undefined);
        for (const method of ['GET', 'POST', 'DELETE']) {
            const response = await request('/mcp', { method, ...(method === 'POST' ? { headers: { 'Content-Type': 'application/json' }, body: '{}' } : {}) });
            assert.equal(response.status, 401);
            assert.match(response.headers.get('www-authenticate'), /oauth-protected-resource/);
        }
        assert.equal(reads, 0);
        assert.equal((await request('/mcp', { headers: { Origin: 'https://untrusted.example.com' } })).status, 403);
        assert.equal((await post('/api/auth/sign-up/email', { name: 'Intruder', email: 'intruder@example.com', password })).status, 404);
        assert.equal((await post('/api/auth/oauth2/register', { redirect_uris: ['https://evil.example.com'] })).status, 403);
        assert.equal((await request('/api/v1/alerts/latest')).status, 200);
    }, { repo: { ...repository, getLatest: async () => { reads++; return repository.getLatest(); } } });
});

test('owner login succeeds, other accounts are rejected and tampered OAuth pages fail before rendering', async () => {
    await withMcp(async ({ request, post, login, auth }) => {
        const cookie = await login();
        const page = await request('/mcp/auth/connected', { headers: { Cookie: cookie } });
        assert.equal(page.status, 200);
        assert.match(await page.text(), /owner@example.com/);
        const context = await auth.$context;
        const other = await context.adapter.create({ model: 'user', data: {
            email: 'other@example.com', name: 'Other', emailVerified: true, createdAt: new Date(), updatedAt: new Date(),
        } });
        await assert.rejects(context.internalAdapter.createSession(other.id), /restricted to the owner/);
        assert.equal((await post('/api/auth/sign-in/email', { email: 'owner@example.com', password: 'wrong-password-123456' })).status, 401);
        for (const path of ['/mcp/auth/consent?client_id=evil', '/mcp/auth/sign-in?redirect_uri=https://evil.example.com']) {
            const response = await request(path);
            assert.equal(response.status, 400);
            assert.match(await response.text(), /invalid or has expired/);
        }
    });
});

test('login attempts are rate limited even when no client IP can be determined', async () => {
    await withMcp(async ({ post }) => {
        for (let attempt = 0; attempt < 5; attempt++) {
            const response = await post('/api/auth/sign-in/email', { email: 'owner@example.com', password: 'incorrect-password-12345' });
            assert.equal(response.status, 401);
        }
        const limited = await post('/api/auth/sign-in/email', { email: 'owner@example.com', password });
        assert.equal(limited.status, 429);
        assert.ok(Number(limited.headers.get('x-retry-after')) > 0);
    });
});

test('signed tokens still require the correct owner, issuer, audience, expiration and read scope', async () => {
    let reads = 0;
    await withMcp(async ({ request, auth, config }) => {
        const claims = {
            sub: config.ownerId, azp: 'test-client', scope: 'alerts:read',
            iss: config.issuer, aud: config.resource, exp: Math.floor(Date.now() / 1000) + 300,
        };
        const call = async (payload) => {
            const { token } = await auth.api.signJWT({ body: { payload } });
            return request('/mcp', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_latest_alerts', arguments: {} } }),
            });
        };
        for (const [changed, status] of [
            [{ sub: 'another-user' }, 403], [{ iss: 'https://wrong.example.com' }, 401],
            [{ aud: 'https://wrong.example.com/mcp' }, 401], [{ exp: 1 }, 401], [{ scope: 'other:read' }, 403],
        ]) {
            const response = await call({ ...claims, ...changed });
            assert.equal(response.status, status, await response.clone().text());
        }
        assert.equal(reads, 0);
        const allowed = await call(claims);
        assert.equal(allowed.status, 200, await allowed.clone().text());
        await allowed.text();
        assert.equal(reads, 1);
    }, { repo: { ...repository, getLatest: async () => { reads++; return repository.getLatest(); } } });
});

test('CIMD discovery, OAuth PKCE login, consent, tools and refresh work end-to-end without external services', async () => {
    let metadataReads = 0;
    const client = { client_id: 'https://client.example.com/oauth-client.json' };
    await withMcp(async ({ request, post, login, auth, config }) => {
        const cookie = await login();
        const verifier = randomBytes(32).toString('base64url');
        const query = new URLSearchParams({
            client_id: client.client_id, redirect_uri: 'https://chatgpt.com/test-callback', response_type: 'code',
            scope: 'alerts:read offline_access', resource: config.resource, state: 'test-state',
            code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
        });
        const authorize = await request(`/api/auth/oauth2/authorize?${query}`);
        assert.equal(authorize.status, 200, await authorize.clone().text());
        const signIn = new URL((await authorize.json()).url, config.origin);
        assert.equal(signIn.pathname, '/mcp/auth/sign-in');
        assert.equal((await request(signIn)).status, 200);
        const resumed = await post('/api/auth/sign-in/email', {
            email: 'owner@example.com', password, callbackURL: '/mcp/auth/connected', oauth_query: signIn.search.slice(1),
        });
        assert.equal(resumed.status, 200, await resumed.clone().text());
        const consent = new URL((await resumed.json()).url, config.origin);
        assert.equal(consent.pathname, '/mcp/auth/consent');
        const consentPage = await request(consent, { headers: { Cookie: cookie } });
        assert.equal(consentPage.status, 200, await consentPage.clone().text());
        assert.match(await consentPage.text(), /ChatGPT test client/);
        const accepted = await post('/api/auth/oauth2/consent', { accept: true, oauth_query: consent.search.slice(1) }, cookie);
        assert.equal(accepted.status, 200, await accepted.clone().text());
        const callback = new URL((await accepted.json()).url);
        assert.equal(callback.searchParams.get('state'), 'test-state');
        const tokenResponse = await request('/api/auth/oauth2/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.client_id,
                code: callback.searchParams.get('code'), redirect_uri: 'https://chatgpt.com/test-callback',
                code_verifier: verifier, resource: config.resource }),
        });
        assert.equal(tokenResponse.status, 200, await tokenResponse.clone().text());
        const tokens = await tokenResponse.json();
        assert.ok(tokens.access_token);
        assert.ok(tokens.refresh_token);
        assert.equal(metadataReads, 1);
        const rpc = (method, params, token = tokens.access_token) => request('/mcp', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        const list = await rpc('tools/list', {});
        assert.equal(list.status, 200, await list.clone().text());
        // Legacy stateless requests are returned as SSE by the official SDK.
        const parseRpc = async (response) => {
            const text = await response.text();
            return JSON.parse(text.startsWith('event:') ? text.split('\n').find((line) => line.startsWith('data: ')).slice(6) : text);
        };
        assert.deepEqual((await parseRpc(list)).result.tools.map((tool) => tool.name).sort(), ['get_latest_alerts', 'get_reward_summary', 'search_alert_history']);
        const latest = await parseRpc(await rpc('tools/call', { name: 'get_latest_alerts', arguments: {} }));
        assert.equal(latest.result.structuredContent.summary.totalVbucks, 0);
        const history = await parseRpc(await rpc('tools/call', { name: 'search_alert_history', arguments: { page: 2, limit: 10 } }));
        assert.equal(history.result.structuredContent.pagination.page, 2);
        assert.equal(history.result.structuredContent.pagination.limit, 10);
        const rewards = await parseRpc(await rpc('tools/call', { name: 'get_reward_summary', arguments: { period: 'all' } }));
        assert.equal(rewards.result.structuredContent.period, 'all');
        const invalid = await parseRpc(await rpc('tools/call', { name: 'search_alert_history', arguments: { from: '2026-02-30' } }));
        assert.equal(invalid.result.isError, true);
        const invalidToken = await rpc('tools/list', {}, `${tokens.access_token}tampered`);
        assert.equal(invalidToken.status, 401);
        const refresh = await request('/api/auth/oauth2/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'refresh_token', client_id: client.client_id, refresh_token: tokens.refresh_token, resource: config.resource }),
        });
        assert.equal(refresh.status, 200, await refresh.clone().text());
        assert.ok((await refresh.json()).access_token);
        const replay = await request('/api/auth/oauth2/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.client_id,
                code: callback.searchParams.get('code'), redirect_uri: 'https://chatgpt.com/test-callback',
                code_verifier: verifier, resource: config.resource }),
        });
        assert.equal(replay.status, 400);
    }, { metadataFetch: async (url) => {
        assert.equal(String(url), client.client_id);
        metadataReads++;
        return Response.json({
            ...client, client_name: 'ChatGPT test client', redirect_uris: ['https://chatgpt.com/test-callback'],
            token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'],
            scope: 'alerts:read offline_access',
        }, { headers: { 'Cache-Control': 'max-age=3600' } });
    } });
});
