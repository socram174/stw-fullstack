import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { createAlertRouter } from '../routes/alerts-v1.js';
import { createAlertRepository } from '../repositories/alerts.js';
import { buildZoneStats, zoneStatsPipeline } from '../services/alert-zones.js';
import { rewardWindow } from '../services/alert-rewards.js';
import { parseZoneQuery } from '../validation/alert-query.js';

const now = new Date('2026-11-03T15:00:00Z');

test('zone totals cover the full date selection and keep zero-reward days in coverage', async () => {
    const facet = { coverage: [{ from: '2026-10-28', to: '2026-11-03', recordedDays: 7 }], zones: [
        { zone: 'Canny Valley', vbucks: 500, missions: 10 },
        { zone: 'Stonewood', vbucks: 50, missions: 1 },
    ] };
    let pipeline;
    const repository = createAlertRepository({
        find: () => { throw new Error('Do not load individual missions'); },
        aggregate: (stages) => { pipeline = stages; return { exec: async () => [facet] }; },
    });
    const response = await repository.getZones('7d', now);
    assert.deepEqual(response, { period: '7d', from: '2026-10-28', to: '2026-11-03', recordedDays: 7, totalDays: 7, data: facet.zones });
    assert.deepEqual(pipeline[0], { $match: { date: { $gte: '2026-10-28', $lte: '2026-11-03' } } });
    const branches = pipeline.at(-1).$facet;
    assert.ok(!JSON.stringify(branches.coverage).includes('vbucks'), 'Coverage must include recorded zero-reward days');
    assert.ok(!JSON.stringify(pipeline).includes('$limit'), 'Zone totals must not be limited by table pagination');
    assert.deepEqual(branches.zones[0], { $match: { vbucks: { $gt: 0 } } });
});

test('all-time zone bounds include the archive even when its first date has no missions', () => {
    const window = rewardWindow('all', now);
    const response = buildZoneStats({ coverage: [{ from: '2024-02-28', to: '2024-03-01', recordedDays: 3 }], zones: [] }, window);
    assert.equal(response.from, '2024-02-28');
    assert.equal(response.to, '2024-03-01');
    assert.equal(response.totalDays, 3);
    assert.equal(response.recordedDays, 3);
    assert.deepEqual(response.data, []);
    assert.ok(!zoneStatsPipeline(window)[0].$match, 'All-time must not filter to today');
});

test('missing data is not counted as recorded coverage and empty all-time bounds use today', () => {
    const response = buildZoneStats(undefined, rewardWindow('all', now));
    assert.equal(response.from, '2026-11-03');
    assert.equal(response.to, '2026-11-03');
    assert.equal(response.recordedDays, 0);
    assert.equal(response.totalDays, 1);
    assert.deepEqual(response.data, []);
    assert.equal(buildZoneStats({ coverage: [], zones: [] }, rewardWindow('7d', now)).totalDays, 7);
});

test('zone queries only accept a single valid period', () => {
    assert.equal(parseZoneQuery({}), '1m');
    for (const period of ['7d', '1m', '6m', '1y', 'all']) assert.equal(parseZoneQuery({ period }), period);
    for (const query of [{ period: 'bad' }, { period: '' }, { period: ['7d', '1m'] }, { period: { x: '7d' } }, { interval: 'day' }, { page: '2' }, { zone: 'Stonewood' }]) assert.throws(() => parseZoneQuery(query));
});

test('zone HTTP endpoint rejects invalid queries before reading and hides internal errors', async (t) => {
    let reads = 0;
    let fail = false;
    t.mock.method(console, 'error', () => {});
    const app = express();
    app.use('/api/v1/alerts', createAlertRouter({ getZones: async (period) => {
        reads++;
        if (fail) throw new Error('private database details');
        return buildZoneStats(undefined, rewardWindow(period, now));
    } }));
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const request = (query = '') => fetch(`http://127.0.0.1:${server.address().port}/api/v1/alerts/zones${query}`);
    try {
        assert.equal((await request()).status, 200);
        for (const period of ['7d', '1m', '6m', '1y', 'all']) {
            const response = await request(`?period=${period}`);
            assert.equal(response.status, 200);
            assert.equal((await response.json()).period, period);
        }
        const before = reads;
        for (const query of ['?period=bad', '?period=7d&period=all', '?period[x]=all', '?interval=day', '?limit=15']) assert.equal((await request(query)).status, 400);
        assert.equal(reads, before);
        fail = true;
        const response = await request();
        assert.equal(response.status, 500);
        assert.doesNotMatch(JSON.stringify(await response.json()), /private/);
    } finally {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
});
