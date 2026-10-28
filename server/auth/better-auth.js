import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { jwt } from 'better-auth/plugins';
import { mcp } from '@better-auth/mcp';
import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { isOwner, MCP_SCOPE } from './config.js';

export function createMcpAuth(config, database, { metadataFetch = fetchClientMetadataResource } = {}) {
    return betterAuth({
        appName: 'STW Alerts',
        baseURL: config.origin,
        basePath: '/api/auth',
        secret: config.secret,
        database,
        trustedOrigins: [config.origin],
        disabledPaths: [
            '/sign-up/email', '/token', '/update-user', '/change-email', '/delete-user',
            '/request-password-reset', '/reset-password', '/change-password',
        ],
        emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 16, maxPasswordLength: 128 },
        user: { modelName: 'mcpUser' },
        account: { modelName: 'mcpAccount', accountLinking: { enabled: false } },
        session: { modelName: 'mcpSession', expiresIn: 60 * 60 * 24, cookieCache: { enabled: false } },
        verification: { modelName: 'mcpVerification' },
        advanced: { cookiePrefix: 'stw-mcp' },
        rateLimit: {
            enabled: true,
            storage: 'database',
            modelName: 'mcpRateLimit',
            window: 60,
            max: 60,
            customRules: { '/sign-in/email': { window: 60, max: 5 } },
        },
        databaseHooks: {
            session: { create: { before: async (session) => {
                if (!isOwner(session.userId, config)) throw new APIError('FORBIDDEN', { message: 'Access is restricted to the owner.' });
            } } },
        },
        plugins: [
            jwt({ disableSettingJwtHeader: true, schema: { jwks: { modelName: 'mcpJwks' } } }),
            mcp({
                resource: config.resource,
                loginPage: '/mcp/auth/sign-in',
                consentPage: '/mcp/auth/consent',
                scopes: [MCP_SCOPE, 'offline_access'],
                grantTypes: ['authorization_code', 'refresh_token'],
                accessTokenExpiresIn: 60 * 15,
                refreshTokenExpiresIn: 60 * 60 * 24 * 30,
                allowDynamicClientRegistration: false,
                allowUnauthenticatedClientRegistration: false,
                clientPrivileges: ({ user }) => isOwner(user?.id, config),
                customAccessTokenClaims: ({ user }) => {
                    if (!isOwner(user?.id, config)) throw new APIError('FORBIDDEN', { message: 'Access is restricted to the owner.' });
                    return {};
                },
                schema: Object.fromEntries([
                    'oauthClient', 'oauthAccessToken', 'oauthRefreshToken', 'oauthConsent',
                    'oauthClientAssertion', 'oauthResource', 'oauthClientResource',
                ].map((name) => [name, { modelName: `mcp${name[0].toUpperCase()}${name.slice(1)}` }])),
            }),
            cimd({ fetchClientMetadataResource: metadataFetch, metadataProfile: 'mcp-2026-07-28' }),
        ],
    });
}

export function mongoAuthDatabase(connection) {
    return mongodbAdapter(connection.db, { client: connection.getClient() });
}
