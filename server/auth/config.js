export const MCP_SCOPE = 'alerts:read';

export function readMcpConfig(env = process.env, { provisioning = false } = {}) {
    if (!provisioning && env.MCP_ENABLED !== 'true') {
        if (env.MCP_ENABLED && env.MCP_ENABLED !== 'false') throw new Error('MCP_ENABLED must be true or false.');
        return null;
    }
    let url;
    try { url = new URL(env.BETTER_AUTH_URL); }
    catch { throw new Error('Set BETTER_AUTH_URL to the public backend origin.'); }
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error('BETTER_AUTH_URL must be an HTTPS origin (HTTP is allowed on localhost).');
    }
    if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
        throw new Error('Set BETTER_AUTH_SECRET to a random secret of at least 32 characters.');
    }
    if (!provisioning && !env.MCP_OWNER_ID?.trim()) throw new Error('Set MCP_OWNER_ID to the provisioned account ID.');
    return {
        origin: url.origin,
        issuer: `${url.origin}/api/auth`,
        resource: `${url.origin}/mcp`,
        secret: env.BETTER_AUTH_SECRET,
        ownerId: env.MCP_OWNER_ID?.trim() || null,
    };
}

export function isOwner(userId, config) {
    return typeof userId === 'string' && Boolean(config.ownerId) && userId === config.ownerId;
}
