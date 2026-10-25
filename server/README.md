# Alerts API

Run `npm install` and `npm start` from `server/`. The existing `MONGO_URL`
and `PORT` environment variables still apply. Run `npm test` for unit and HTTP
contract tests; they use an in-memory repository and do not connect to MongoDB.

## Version 1

All endpoints below are read-only. They do not run the collector or send notifications.

### `GET /api/v1/alerts/latest`

Returns `{ data, rotation, summary }` for the latest recorded calendar date.
`rotation` is `{ date: "YYYY-MM-DD", afterReset: boolean }`, or `null` when
neither alerts nor collection logs exist. Its date comes from the newest stored
alert or log, independent of insertion order and the server's current date.
A known rotation may have an empty `data` array and zero rewards.

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

Strings are trimmed; legacy `MM/DD/YY` and `MM/DD/YYYY` dates are normalized to
ISO dates without timezone conversion. Two-digit years refer to the 2000s.
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
- `repositories/alerts.js`: read-only database access.

`GET /alerts` and `POST /alerts/update` remain available with their original
array response for older clients. New clients should use `/api/v1/alerts`.
Email routes and controllers are unchanged.

The external collector and existing MongoDB documents are unchanged. Because
stored dates mix multiple string formats, the repository currently reads the
archive and the service filters/paginates it in memory. Pagination reduces the
client payload; it does not yet reduce database reads. Moving filtering to
indexed MongoDB queries requires coordinating an ISO date migration with the
collector. This boundary keeps that future change out of route and UI code.

Deploy the backend before the new frontend. The legacy routes let the previous
frontend continue working during the transition. Restart an already running
backend to load the new routes.
