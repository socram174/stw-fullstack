import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { createAlertRouter } from '../routes/alerts-v1.js';
import { buildHistory, buildLatest, normalizeAlerts, parseAlertDate } from '../services/alert-data.js';
import { parseAlertQuery } from '../validation/alert-query.js';
import { buildRewardSeries, groupRewardDays, rewardWindow } from '../services/alert-rewards.js';

const records = [
    { _id: 'a', date: '12/31/25', vbucks: 30, powerLevel: 15, zone: { name: ' Stonewood ', mission: ' Misión de evacuación ', variant: ' Forest ' } },
    { _id: 'b', date: '01/01/2026', vbucks: 40, powerLevel: 70, zone: { name: 'Canny Valley', mission: 'Repair the Shelter' }, afterReset: true },
    { _id: 'c', date: '2026-01-01', vbucks: 35, powerLevel: 28, zone: { name: 'Plankerton', mission: 'Retrieve the Data' } },
    { _id: 'zero', date: '01/02/26', vbucks: 0, zone: 'N/A' },
];
const alerts = normalizeAlerts(records);
const history = (query = {}, data = alerts) => buildHistory(data, parseAlertQuery(query));

async function withApi(repository, run) {
    const app = express();
    app.use('/api/v1/alerts', createAlertRouter(repository));
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const request = async (path = '', options) => {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/alerts${path}`, options);
        return { status: response.status, body: await response.json() };
    };
    try { await run(request); }
    finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

const repository = {
    getRewards: async (period) => buildRewardSeries(groupRewardDays(alerts), rewardWindow(period, new Date('2026-01-02T15:00:00Z'))),
    getHistory: async (filters) => buildHistory(alerts, filters),
    getLatest: async () => buildLatest(alerts, [{ lastUpdated: '01/02/2026' }]),
};

test('legacy and ISO calendar dates normalize without timezone shifts', () => {
    for (const [input, expected] of [['11/27/22', '2022-11-27'], ['1/1/2026', '2026-01-01'], ['2024-02-29', '2024-02-29']]) {
        assert.equal(parseAlertDate(input), expected);
    }
    for (const input of ['02/29/2025', '02/30/2024', '13/01/2026', '2026-04-31', '', null]) assert.throws(() => parseAlertDate(input));
});

test('normalization trims scraped strings and preserves IDs and reset flags', () => {
    assert.equal(alerts[0].mission, 'Misión de evacuación');
    assert.equal(alerts[0].zone, 'Stonewood');
    assert.equal(alerts[0].location, 'Forest');
    assert.equal(alerts[1].id, 'b');
    assert.equal(alerts[1].afterReset, true);
    const [missing] = normalizeAlerts([{ date: '2026-01-01', vbucks: 40, powerLevel: -1 }]);
    assert.equal(missing.powerLevel, 0);
    assert.equal(missing.zone, 'Unknown zone');
    assert.equal(missing.mission, 'Alert mission');
});

test('invalid rewards fail rather than silently reducing totals', () => {
    for (const vbucks of ['40', -1, Infinity, NaN, null]) assert.throws(() => normalizeAlerts([{ date: '2026-01-01', vbucks }]));
});

test('summary and chart cover the entire selection, independent of pagination', () => {
    const first = history({ limit: '1' });
    const second = history({ limit: '1', page: '2' });
    assert.deepEqual(first.pagination, { page: 1, limit: 1, total: 4, totalPages: 4 });
    assert.notDeepEqual(first.data, second.data);
    assert.deepEqual(first.summary, { totalVbucks: 105, missions: 3, zones: 3, minPower: 15, days: 3 });
    assert.deepEqual(first.summary, second.summary);
    assert.deepEqual(first.dailyRewards, [
        { date: '2025-12-31', vbucks: 30, missions: 1 },
        { date: '2026-01-01', vbucks: 75, missions: 2 },
        { date: '2026-01-02', vbucks: 0, missions: 0 },
    ]);
    assert.deepEqual(first.dailyRewards, second.dailyRewards);
    assert.equal(first.data[0].mission, 'No V-Buck missions');
});

test('inclusive dates, zone and search combine before totals and pagination', () => {
    const result = history({ from: '2026-01-01', to: '2026-01-01', zone: 'Canny Valley', q: ' REPAIR ' });
    assert.deepEqual(result.data.map((alert) => alert.id), ['b']);
    assert.equal(result.summary.totalVbucks, 40);
    assert.equal(result.pagination.total, 1);
    assert.deepEqual(history({ q: 'mision' }).data.map((alert) => alert.id), ['a']);
    assert.deepEqual(history({ q: '70' }).data.map((alert) => alert.id), ['b']);
});

test('all sorts are stable and do not mutate the underlying records', () => {
    const before = structuredClone(alerts);
    assert.deepEqual(history({ sort: 'reward' }).data.map((alert) => alert.id), ['b', 'c', 'a', 'zero']);
    assert.deepEqual(history({ sort: 'power' }).data.map((alert) => alert.id), ['zero', 'a', 'c', 'b']);
    const tied = [alerts[0], { ...alerts[0], id: 'a0' }];
    assert.deepEqual(history({}, tied.reverse()).data.map((alert) => alert.id), ['a', 'a0']);
    assert.deepEqual(alerts, before);
});

test('empty results succeed and excessive pages clamp to the last page', () => {
    const result = history({ q: 'not present', page: '5' });
    assert.deepEqual(result.data, []);
    assert.equal(result.pagination.total, 0);
    assert.equal(result.pagination.page, 1);
    assert.equal(result.summary.totalVbucks, 0);
    assert.deepEqual(result.dailyRewards, []);
    assert.deepEqual(result.zones, ['Canny Valley', 'Plankerton', 'Stonewood']);
    assert.equal(history({ page: '999', limit: '3' }).pagination.page, 2);
});

test('chart contains only the latest 30 recorded dates without filling gaps', () => {
    const data = Array.from({ length: 40 }, (_, i) => ({ ...alerts[0], id: String(i), date: new Date(Date.UTC(2026, 0, i * 2 + 1)).toISOString().slice(0, 10) }));
    const result = history({}, data);
    assert.equal(result.summary.days, 40);
    assert.equal(result.dailyRewards.length, 30);
    assert.equal(result.dailyRewards[0].date, data[10].date);
    assert.equal(result.dailyRewards.at(-1).date, data.at(-1).date);
});

test('missing power levels and unknown zones do not affect minimum or zone count', () => {
    const result = history({}, normalizeAlerts([{ ...records[0], powerLevel: undefined, zone: 0 }, records[1]]));
    assert.equal(result.summary.minPower, 70);
    assert.equal(result.summary.zones, 1);
});

test('latest rotation uses normalized dates rather than log insertion order or today', () => {
    const result = buildLatest(alerts, [{ lastUpdated: '12/31/25' }, { lastUpdated: '01/02/2026', afterReset: true }]);
    assert.deepEqual(result.rotation, { date: '2026-01-02', afterReset: true });
    assert.equal(result.data[0].id, 'zero');
    assert.equal(result.summary.missions, 0);
    assert.equal(result.summary.days, 1);
    assert.equal(buildLatest(alerts, []).rotation.date, '2026-01-02');
});

test('latest keeps rotation metadata with no missions and supports an empty database', () => {
    assert.deepEqual(buildLatest([], []).rotation, null);
    const result = buildLatest([], [{ lastUpdated: '01/02/26' }]);
    assert.deepEqual(result.data, []);
    assert.deepEqual(result.rotation, { date: '2026-01-02', afterReset: false });
    assert.equal(result.summary.totalVbucks, 0);
});

test('HTTP endpoints expose the versioned contract and reject invalid requests before database reads', async () => {
    let reads = 0;
    await withApi({ ...repository, getHistory: async (filters) => { reads++; return repository.getHistory(filters); } }, async (request) => {
        const first = await request('?limit=1');
        assert.equal(first.status, 200);
        assert.equal(first.body.data.length, 1);
        assert.equal(first.body.summary.totalVbucks, 105);
        const latest = await request('/latest');
        assert.equal(latest.status, 200);
        assert.equal(latest.body.rotation.date, '2026-01-02');
        const before = reads;
        for (const query of ['limit=101', 'page=0', 'page=1.2', 'page=1e2', 'page=9007199254740992', 'sort=invalid', 'from=01/01/26', 'from=2026-02-30', 'from=2026-02-01&to=2026-01-01', 'zone=a&zone=b', 'q[x]=a', 'extra=1']) {
            const invalid = await request(`?${query}`);
            assert.equal(invalid.status, 400, query);
            assert.equal(invalid.body.error.code, 'INVALID_QUERY');
        }
        assert.equal(reads, before);
        assert.equal((await request('/missing')).status, 404);
        assert.equal((await request('/latest', { method: 'POST' })).status, 404);
    });
});

test('database and log failures return JSON 500 without leaking internal details', async (t) => {
    t.mock.method(console, 'error', () => {});
    for (const failed of ['getHistory', 'getLatest', 'getRewards']) {
        await withApi({ ...repository, [failed]: async () => { throw new Error('private connection details'); } }, async (request) => {
            const result = await request(failed === 'getLatest' ? '/latest' : failed === 'getRewards' ? '/rewards' : '');
            assert.equal(result.status, 500);
            assert.equal(result.body.error.code, 'INTERNAL_ERROR');
            assert.doesNotMatch(JSON.stringify(result.body), /private/);
        });
    }
});

test('chart HTTP periods are independent and invalid requests do not read the database', async () => {
    let reads = 0;
    await withApi({ ...repository, getRewards: async (period) => { reads++; return repository.getRewards(period); } }, async (request) => {
        const defaultChart = await request('/rewards');
        assert.equal(defaultChart.status, 200);
        assert.equal(defaultChart.body.period, '1m');
        for (const period of ['7d', '1m', '6m', '1y']) {
            const result = await request(`/rewards?period=${period}`);
            assert.equal(result.status, 200);
            assert.equal(result.body.period, period);
        }
        const before = reads;
        for (const query of ['period=invalid', 'period=', 'period=7d&period=1m', 'period[x]=7d', 'page=2', 'from=2026-01-01']) {
            const invalid = await request(`/rewards?${query}`);
            assert.equal(invalid.status, 400, query);
            assert.equal(invalid.body.error.code, 'INVALID_QUERY');
        }
        assert.equal(reads, before);
    });
});
