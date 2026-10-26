// Read-only integration check against MongoDB's actual aggregation engine.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createAlertRepository } from '../repositories/alerts.js';
import { buildHistory, buildLatest, normalizeAlerts, parseAlertDate } from '../services/alert-data.js';
import { historyFacet, historySelection } from '../services/alert-pipeline.js';
import { parseAlertQuery } from '../validation/alert-query.js';
import { buildRewardSeries, groupRewardDays, rewardWindow } from '../services/alert-rewards.js';
import { parseMigrationDate } from '../migrations/alert-dates.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const preflight = process.argv.includes('--preflight');
try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000, autoIndex: false });
    const collection = mongoose.connection.db.collection('alerts');
    const records = await collection.find().toArray();
    assert.ok(records.length > 0, 'No alerts to verify');
    const source = preflight ? records.map((row) => ({ ...row, date: parseMigrationDate(row.date) })) : records;
    const dates = normalizeAlerts(source).map((row) => row.date).sort();
    const latestDate = dates[dates.length - 1];
    const chartStartDate = dates.slice(-30)[0];
    const queries = [
        {}, { page: '2', limit: '15' }, { sort: 'reward', limit: '1' }, { sort: 'power', page: '2' },
        { from: chartStartDate, to: latestDate }, { from: '2025-12-25', to: '2026-01-05' },
        { from: '2022-11-27', to: '2022-12-31' }, { from: '2099-01-01' },
        { zone: 'Canny Valley', q: 'REPAIR', from: '2026-10-01', to: '2026-10-25' },
        { q: '70', sort: 'power' }, { q: '.*' }, { zone: 'not present' },
    ];
    if (preflight) {
        const fixtures = [
            ...source,
            { _id: 'fixture-accent', date: '2025-01-01', vbucks: 50, zone: { name: ' New zone ', mission: ' Misión de evacuación ' } },
            { _id: 'fixture-zero', date: '2025-01-02', vbucks: 0, zone: 0 },
        ];
        const normalized = normalizeAlerts(fixtures);
        const prefix = [{ $limit: 1 }, { $project: { fixtures: { $literal: fixtures } } }, { $unwind: '$fixtures' }, { $replaceRoot: { newRoot: '$fixtures' } }];
        for (const query of [...queries, { q: 'MISION' }, { q: 'mision', zone: 'New zone', sort: 'power' }]) {
            const filters = parseAlertQuery(query);
            const expected = buildHistory(normalized, filters);
            const [facet] = await collection.aggregate([...prefix, ...historySelection(filters), historyFacet(filters)]).toArray();
            const { total = 0, ...summary } = facet.summary[0] ?? { total: 0, totalVbucks: 0, missions: 0, zones: 0, minPower: null, days: 0 };
            assert.equal(total, expected.pagination.total, JSON.stringify(query));
            assert.deepEqual(summary, expected.summary, `Summary: ${JSON.stringify(query)}`);
            assert.deepEqual(facet.dailyRewards, expected.dailyRewards, `Chart: ${JSON.stringify(query)}`);
            assert.deepEqual(facet.data, expected.data, `Page: ${JSON.stringify(query)}`);
        }
        console.log(JSON.stringify({ mode: 'preflight', queries: queries.length + 2, sourceDocuments: records.length, syntheticFixtures: 2, writes: 0, verified: true }));
    } else {
        assert.ok(records.every((row) => row.date === parseAlertDate(row.date)), 'Legacy dates remain');
        const repository = createAlertRepository();
        for (const query of [...queries, { page: '999999', limit: '15' }]) {
            const filters = parseAlertQuery(query);
            assert.deepEqual(await repository.getHistory(filters), buildHistory(normalizeAlerts(records), filters), JSON.stringify(query));
        }
        const logs = await mongoose.connection.db.collection('logs').find().toArray();
        assert.deepEqual(await repository.getLatest(), buildLatest(normalizeAlerts(records), logs));
        const now = new Date();
        for (const period of ['7d', '1m', '6m', '1y', 'all']) {
            assert.deepEqual(await repository.getRewards(period, now), buildRewardSeries(groupRewardDays(normalizeAlerts(records)), rewardWindow(period, now)), `Rewards: ${period}`);
        }
        const allTime = await repository.getRewards('all', now);
        const summary = buildHistory(normalizeAlerts(records), parseAlertQuery({})).summary;
        assert.equal(allTime.data.reduce((total, bucket) => total + (bucket.vbucks ?? 0), 0), summary.totalVbucks);
        assert.equal(allTime.data.reduce((total, bucket) => total + bucket.missions, 0), summary.missions);
        assert.equal(allTime.data.reduce((total, bucket) => total + bucket.recordedDays, 0), summary.days);
        const explanation = await collection.find({ date: { $gte: chartStartDate, $lte: latestDate } })
            .sort({ date: -1, vbucks: -1, _id: 1 }).limit(15).explain('queryPlanner');
        const plan = JSON.stringify(explanation.queryPlanner.winningPlan);
        assert.ok(plan.includes('alerts_date_reward_id'), 'Expected date index was not selected');
        console.log(JSON.stringify({ mode: 'repository', rewardQueries: 5, allTimeTotalsVerified: true, historyQueries: queries.length + 1, latestVerified: true, documents: records.length, totalVbucks: summary.totalVbucks, dateIndexUsed: true, writes: 0 }));
    }
} catch (error) {
    console.error(error.name, error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[redacted connection]'));
    process.exitCode = 1;
} finally { await mongoose.disconnect(); }
