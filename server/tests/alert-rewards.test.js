import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildRewardSeries, groupRewardDays, rewardWindow } from '../services/alert-rewards.js';
import { normalizeAlerts } from '../services/alert-data.js';
import { createAlertRepository } from '../repositories/alerts.js';

const now = new Date('2026-10-26T01:00:00Z');

test('chart windows use Santiago dates across UTC midnight and daylight saving offsets', () => {
    assert.deepEqual(rewardWindow('7d', now), { period: '7d', interval: 'day', from: '2026-10-19', to: '2026-10-25' });
    assert.equal(rewardWindow('1m', now).from, '2026-09-26');
    assert.equal(rewardWindow('7d', new Date('2026-07-01T03:30:00Z')).to, '2026-06-30');
    assert.equal(rewardWindow('7d', new Date('2026-10-01T03:30:00Z')).to, '2026-10-01');
});

test('long chart windows clamp month ends and include leap days correctly', () => {
    assert.equal(rewardWindow('6m', new Date('2026-08-31T15:00:00Z')).from, '2026-03-01');
    const leap = rewardWindow('1y', new Date('2024-02-29T15:00:00Z'));
    assert.equal(leap.from, '2023-03-01');
    assert.equal(buildRewardSeries([], leap).data.reduce((sum, bucket) => sum + bucket.totalDays, 0), 366);
    assert.throws(() => rewardWindow('invalid', now));
});

test('daily chart distinguishes missing days from confirmed zero rewards and sums all missions', () => {
    const days = groupRewardDays([
        { date: '2026-10-19', vbucks: 30 }, { date: '2026-10-19', vbucks: 50 },
        { date: '2026-10-20', vbucks: 0 }, { date: '2026-10-18', vbucks: 200 },
    ]);
    const result = buildRewardSeries(days, rewardWindow('7d', now));
    assert.equal(result.data.length, 7);
    assert.deepEqual(result.data[0], { date: '2026-10-19', endDate: '2026-10-19', vbucks: 80, missions: 2, recordedDays: 1, totalDays: 1 });
    assert.equal(result.data[1].vbucks, 0);
    assert.equal(result.data[1].recordedDays, 1);
    assert.equal(result.data[2].vbucks, null);
    assert.equal(result.data[2].recordedDays, 0);
});

test('weekly buckets start on Monday and clip partial weeks to the selected range', () => {
    const result = buildRewardSeries([
        { date: '2026-01-04', vbucks: 30, missions: 1 },
        { date: '2026-01-05', vbucks: 50, missions: 1 },
        { date: '2026-01-07', vbucks: 0, missions: 0 },
        { date: '2025-07-07', vbucks: 999, missions: 1 },
    ], rewardWindow('6m', new Date('2026-01-07T15:00:00Z')));
    assert.equal(result.data[0].date, result.from);
    assert.deepEqual(result.data.at(-1), { date: '2026-01-05', endDate: '2026-01-07', vbucks: 50, missions: 1, recordedDays: 2, totalDays: 3 });
    assert.equal(result.data.at(-2).vbucks, 30);
    assert.equal(result.data.reduce((sum, bucket) => sum + (bucket.vbucks ?? 0), 0), 80);
});

test('yearly chart groups by calendar month and preserves missing months', () => {
    const result = buildRewardSeries([
        { date: '2026-09-30', vbucks: 100, missions: 2 },
        { date: '2026-10-01', vbucks: 50, missions: 1 },
    ], rewardWindow('1y', now));
    assert.equal(result.interval, 'month');
    assert.equal(result.data.at(-2).vbucks, 100);
    assert.equal(result.data.at(-1).vbucks, 50);
    assert.equal(result.data.at(-1).endDate, '2026-10-25');
    assert.equal(result.data[0].vbucks, null);
    assert.equal(result.data.reduce((sum, bucket) => sum + bucket.totalDays, 0), 365);
});

test('reward repository keeps the same chart for legacy dates and ISO aggregates', async () => {
    const records = [ { date: '10/19/26', vbucks: 50 }, { date: '10/20/2026', vbucks: 0 } ];
    const legacy = createAlertRepository({
        exists: async () => ({ _id: 'legacy' }),
        find: () => ({ select() { return this; }, lean() { return this; }, exec: async () => records }),
    });
    const iso = createAlertRepository({
        exists: async () => null,
        aggregate: () => ({ exec: async () => groupRewardDays(normalizeAlerts(records)) }),
    });
    assert.deepEqual(await legacy.getRewards('7d', now), await iso.getRewards('7d', now));
    assert.deepEqual(await legacy.getRewards('all', now), await iso.getRewards('all', now));
});

test('all-time rewards include the complete archive with monthly bars and preserve missing months', () => {
    const days = groupRewardDays([
        { date: '2026-10-25', vbucks: 50 },
        { date: '2022-11-27', vbucks: 0 },
        { date: '2024-02-29', vbucks: 30 },
        { date: '2024-02-29', vbucks: 40 },
    ]);
    const result = buildRewardSeries(days, rewardWindow('all', now));
    assert.equal(result.from, '2022-11-27');
    assert.equal(result.to, '2026-10-25');
    assert.equal(result.interval, 'month');
    assert.equal(result.data.length, 48);
    assert.equal(result.data[0].vbucks, 0);
    assert.equal(result.data[1].vbucks, null);
    assert.deepEqual(result.data.find((bucket) => bucket.date === '2024-02-01'), {
        date: '2024-02-01', endDate: '2024-02-29', vbucks: 70, missions: 2, recordedDays: 1, totalDays: 29,
    });
    assert.equal(result.data.reduce((total, bucket) => total + (bucket.vbucks ?? 0), 0), 120);
    assert.equal(result.data.reduce((total, bucket) => total + bucket.missions, 0), 3);
    assert.equal(result.data.reduce((total, bucket) => total + bucket.recordedDays, 0), 3);
});

test('an empty all-time archive returns an unknown total for today without inventing rewards', () => {
    const result = buildRewardSeries([], rewardWindow('all', now));
    assert.equal(result.from, '2026-10-25');
    assert.equal(result.to, '2026-10-25');
    assert.deepEqual(result.data, [{ date: '2026-10-25', endDate: '2026-10-25', vbucks: null, missions: 0, recordedDays: 0, totalDays: 1 }]);
});
