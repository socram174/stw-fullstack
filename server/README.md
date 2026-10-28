# Alerts API

Optional owner-only MCP access is documented in [Private MCP access](auth/README.md).
It uses Better Auth and is disabled until explicitly configured.

Use Node.js 24.x, matching the frontend. Run `npm install` and `npm start` from `server/`. The existing `MONGO_URL`
and `PORT` environment variables still apply. Run `npm test` for unit, migration
and HTTP contract tests; these do not connect to MongoDB.

On Render, check the backend service's `NODE_VERSION` environment variable: it
overrides the version declared in `package.json`. Set it to `24` if configured.
Version precedence is documented in [Render's Node.js version guide](https://render.com/docs/node-version).

The backend uses Express 5 and Mongoose 9. Express forwards rejected async route
handlers to the API error middleware. MongoDB connections use the current driver
defaults; the obsolete `useNewUrlParser` and `useUnifiedTopology` options must not
be passed to `mongoose.connect()`.

## Version 1

All endpoints below are read-only. They do not run the collector or send notifications.

### `GET /api/v1/alerts/latest`

Returns `{ data, rotation, summary }` for the latest recorded calendar date.
`rotation` is `{ date: "YYYY-MM-DD", afterReset: boolean }`, or `null` when
neither alerts nor collection logs exist. Its date comes from the newest stored
alert or log, independent of insertion order and the server's current date.
A known rotation may have an empty `data` array and zero rewards.

### `GET /api/v1/alerts/rewards`

Independent chart data across all zones, without table filters or pagination.
The only parameter is `period`, defaulting to `1m`:

| Period | Inclusive window | Bars |
| --- | --- | --- |
| `7d` | Last 7 calendar days | Daily |
| `1m` | Last 30 calendar days | Daily |
| `6m` | Last 6 months | Weekly, starting Monday |
| `1y` | Last year | Monthly |
| `all` | First through last recorded date | Monthly |

Today is determined in `America/Santiago`. Month/year windows clamp month-end
dates; the first and last week/month are clipped to the selected window.
`all` covers every stored alert, including records older than a year, and uses
the first/last recorded dates as bounds. An empty archive uses today with no
recorded rewards. The default period remains `1m`.
Returns `{ period, interval, from, to, data }`. Each data point contains
`date`, `endDate`, `vbucks`, `missions`, `recordedDays` and `totalDays`.
Missing periods have `vbucks: null`; recorded zero-reward days have `vbucks: 0`.
Weekly/monthly totals include only recorded days, with coverage counts to
identify incomplete totals. MongoDB aggregates the selected dates before
grouping into chart buckets; no new documents or indexes are required.
Unknown, repeated or unsupported parameters return `400`.

### `GET /api/v1/alerts`

Example: `/api/v1/alerts?from=2026-10-01&to=2026-10-31&sort=recent&page=1&limit=15`

| Query | Meaning | Default |
| --- | --- | --- |
| `from`, `to` | Inclusive calendar dates, `YYYY-MM-DD` | Unbounded |
| `q` | Mission, zone or power-level search; case and accent insensitive; up to 200 characters | Empty |
| `zone` | Exact normalized zone name; up to 100 characters | All zones |
| `sort` | `recent`, `reward` or `power` | `recent` |
| `page` | Positive integer, clamped to the last available page | `1` |
| `limit` | Integer from 1 to 100 | `25` |

Returns:

```json
{
  "data": [],
  "pagination": { "page": 1, "limit": 15, "total": 0, "totalPages": 1 },
  "summary": { "totalVbucks": 0, "missions": 0, "zones": 0, "minPower": null, "days": 0 },
  "dailyRewards": [],
  "zones": []
}
```

`data` contains only the requested page. `summary` and `dailyRewards` use the
**entire filtered selection**, before pagination. `dailyRewards` contains up to
30 recorded dates in ascending order, with `{ date, vbucks, missions }` per date.
Missing calendar dates are not inferred as zero-reward days. `zones` lists the
available zones across the archive so changing a filter does not hide options.

Both endpoints return alerts with the same shape:

```json
{
  "id": "mongodb-document-id",
  "date": "2026-10-25",
  "mission": "Repair the Shelter",
  "location": "Thunder Route 99",
  "zone": "Canny Valley",
  "powerLevel": 46,
  "vbucks": 50,
  "afterReset": false
}
```

Strings are trimmed. Alert dates and collection log dates must already be valid
ISO calendar strings (`YYYY-MM-DD`); API requests do not convert legacy dates.
Zero-reward placeholders remain in history but do not count as missions.
Unknown power levels are `0`; `minPower` excludes these. Unknown zones use
`Unknown zone` and do not inflate the summary zone count.

Invalid query parameters return HTTP `400`. Empty selections return `200`.
Storage or normalization failures return `500`, without exposing internal
details. Unknown versioned alert routes return `404`. Error bodies use:

```json
{ "error": { "code": "INVALID_QUERY", "message": "from must be a valid YYYY-MM-DD date." } }
```

## Structure and compatibility

- `routes/alerts-v1.js`: routes and errors scoped to this API.
- `controllers/alerts-v1.js`: request orchestration.
- `validation/alert-query.js`: query validation.
- `services/alert-data.js`: normalization, filtering, summaries and pagination.
- `services/alert-pipeline.js`: MongoDB projections, filters and aggregate summaries.
- `repositories/alerts.js`: read-only database access.

`GET /alerts` and `POST /alerts/update` remain available with their original
array response for older clients. New clients should use `/api/v1/alerts`.

Dates are stored as ISO calendar strings, using the collector's existing
`America/Santiago` day without shifting historical dates. Date range filtering,
sorting, pagination, totals and daily rewards run in MongoDB. The repository
returns only the requested page, aggregates and zone options. The compound
`alerts_date_reward_id` index supports date ranges and recent-date ordering.

Versioned endpoints query the ISO data directly, without checking for legacy
dates or loading the archive into Node.js as a fallback. Legacy date conversion
is confined to the explicit migration tools below.

## Date migration

```sh
# Read-only simulation; validates all dates and reports affected documents.
npm run migrate:dates

# Creates backups, migrates dates transactionally and creates the date index.
npm run migrate:dates -- --apply

# Read-only integration checks against MongoDB, including index selection.
node scripts/verify-alert-queries.js
```

The migration reads `server/.env` and requires MongoDB transactions (a replica
set or sharded cluster, including Atlas). Both `alerts.date` and
`logs.lastUpdated` are converted in the same transaction. Each update guards the
original date and ID; verification checks every other field, document count and
daily reward total before commit. Invalid dates or mismatches abort the entire
transaction. Running it again leaves ISO dates unchanged.

Before updates, complete canonical Extended JSON backups of `alerts` and `logs`
are written in the project root, preserving BSON types and IDs. Backup files are
read back and verified; their paths and SHA-256 hashes are printed in the report.
They are local backup artifacts and should be kept out of application commits.

`node scripts/verify-alert-queries.js --preflight` exercises the MongoDB pipelines
before migration using normalized copies of the real records plus accent and
zero-reward fixtures. It performs no writes. Default verification compares the
actual repository with the original full-archive results after migration.

Deploy the backend before the new frontend. The legacy routes let the previous
frontend continue working during the transition. Restart an already running
backend to load the new routes.
