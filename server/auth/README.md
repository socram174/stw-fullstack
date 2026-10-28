# Private MCP access

The backend exposes a read-only MCP at `/mcp`, protected by Better Auth's OAuth
authorization server. It runs in the existing Express process and reuses the
alerts repository. No Auth0, Google account, email service or separate deployment
is required. The public alerts API keeps its existing access policy.

MCP is disabled by default. Enabling it without complete configuration stops
startup rather than exposing an unauthenticated endpoint.

## Create the owner

Use Node.js 24 and run these commands from `server/`.

1. Generate a private secret:

   ```sh
   node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('base64url'))"
   ```

2. Add the following values to your local, ignored `server/.env`. Use the same
   database and public backend origin that production will use:

   ```dotenv
   MONGO_URL=your-existing-mongodb-connection-string
   MCP_ENABLED=false
   BETTER_AUTH_URL=https://stwbe.onrender.com
   BETTER_AUTH_SECRET=your-generated-secret
   ```

   `BETTER_AUTH_URL` is the origin only, with no `/mcp` or `/api/auth` suffix.
   For local development, use `http://localhost:6001` consistently in both the
   browser and configuration. HTTP is allowed only on loopback hosts.

3. Create your account:

   ```sh
   npm run mcp:create-owner
   ```

   Enter your email and a unique password of 16–128 characters. Password entry
   is hidden, requires confirmation, and is never accepted as a command-line
   argument. The email is only an account identifier; no message is sent.

   The command writes an owner and hashed credential account transactionally,
   refuses to create another user, and prints `MCP_OWNER_ID`. It does not start
   the server, create a browser session, or modify alerts or collection logs.
   The fixed owner primary key also makes concurrent bootstrap attempts conflict.
   MongoDB must support transactions, as Atlas does.

4. Set these environment variables on the Render backend:

   ```dotenv
   MCP_ENABLED=true
   BETTER_AUTH_URL=https://stwbe.onrender.com
   BETTER_AUTH_SECRET=the-same-secret
   MCP_OWNER_ID=the-id-printed-by-the-command
   ```

   Keep the existing `MONGO_URL`, `PORT` and Node.js 24 configuration. Restart
   locally or deploy the backend to activate the routes. The frontend does not
   need a new environment variable or deployment for this feature.

Do not commit `.env`, passwords, signing keys, access tokens or refresh tokens.
The example file `server/.env.example` contains no credentials.

## Connect ChatGPT web

Add a custom MCP server with URL `https://stwbe.onrender.com/mcp` and select
**OAuth**. Use Client ID Metadata Documents (CIMD) / automatic client discovery;
leave manually supplied client credentials empty. The server advertises CIMD
and uses Better Auth's hardened metadata fetcher. Public dynamic registration
is disabled; client discovery never creates a user account.

ChatGPT opens the backend's sign-in page. Sign in with the account created above,
review the read permissions and choose **Allow access**. The protocol handles
the registered callback, PKCE, issuer identification, resource-bound access
tokens and refresh tokens. The login and consent pages are served on the backend
origin so no cross-site session cookies are needed.

Tools:

| Tool | Parameters | Result |
| --- | --- | --- |
| `get_latest_alerts` | None | Latest recorded collection, missions and totals. |
| `search_alert_history` | Optional `from`, `to`, `q`, `zone`, `sort`, `page`, `limit` | Page of missions, selection totals, daily rewards and available zones. |
| `get_reward_summary` | Optional `period`: `7d`, `1m`, `6m`, `1y`, `all` | Reward buckets and recording coverage, matching the history chart. |

History uses the API's date and filter validation. The default page size is 15
and the maximum is 100. Latest means the latest stored date, not necessarily
today. Calendar dates use America/Santiago. Missing reward data is not zero.
Tools cannot run the scraper, write data, send notifications or delete records.

The official MCP SDK handles Streamable HTTP. Current requests and 2025 protocol
clients are both supported in stateless mode; no sticky process-local MCP
sessions are required. This protocol compatibility does not add legacy database
date checks.

## Routes and storage

- `/mcp`: authenticated MCP transport.
- `/api/auth/*`: Better Auth login, session, OAuth, token and public-key endpoints.
- `/mcp/auth/sign-in`, `/mcp/auth/consent`, `/mcp/auth/connected`: account pages.
- `/.well-known/oauth-protected-resource` and its `/mcp` alias: public MCP discovery.
- `/.well-known/oauth-authorization-server/api/auth` and
  `/api/auth/.well-known/oauth-authorization-server`: public issuer discovery.

Discovery documents and public signing keys must be readable without signing
in. They contain no credentials and do not grant access to tools.

Auth uses the existing MongoDB connection and separate collections with the
`mcp` prefix: users, credential accounts, sessions, verification records, public
and encrypted private signing keys, OAuth clients/resources/consents/tokens,
client assertions and rate-limit records. Better Auth's MongoDB adapter creates
its schema indexes. Alert documents and alert indexes are not modified.

Public sign-up and password-reset-by-email routes are disabled. Successful login
requires the configured owner ID, and the same owner restriction is enforced
again when issuing tokens and on every MCP request. Knowing the MCP URL or
registering a client does not grant access.

Bearer verification checks signature, issuer, audience, expiry and the
`alerts:read` scope. Login attempts are rate limited to five per minute. Cookie
sessions last up to one day; access tokens last 15 minutes and refresh tokens
have a maximum lifetime of 30 days, subject to session/token validity. Signing
out ends the browser session; already issued access tokens can remain valid
until their short expiry. Set `MCP_ENABLED=false` and redeploy to disable access
entirely. HTTP request logs omit authentication and MCP query strings.

The feature intentionally has no public signup or email password recovery. Keep
the owner password in your password manager. Any future account recovery should
be an explicit administrative operation that also revokes existing credentials.

## Validation

`npm test` covers the public API and the real Better Auth/MCP handlers using an
isolated in-memory auth database and a fake alerts repository. It tests owner
provisioning, public discovery, denied signup, owner-only sessions, signed-query
validation, bad tokens, the CIMD → PKCE → sign-in → consent → tools → refresh
flow, and authorization-code replay. Tests do not read `.env`, connect to Atlas
or contact a real identity provider. ChatGPT account linking must be verified
against the deployed HTTPS service after configuring your private credentials.

References: [Better Auth MCP](https://better-auth.com/docs/plugins/mcp),
[Express integration](https://better-auth.com/docs/integrations/express),
[MongoDB adapter](https://better-auth.com/docs/adapters/mongo), and
[ChatGPT authentication](https://developers.openai.com/plugins/build/auth).
