import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ObjectId } from 'bson';
import { planDateMigration, snapshotSummary, verifyDateMigration } from '../migrations/alert-dates.js';
import { literalSearchPattern } from '../services/alert-pipeline.js';

const old = [
    { _id: new ObjectId(), date: '12/31/25', vbucks: 30, zone: { name: ' Stonewood' } },
    { _id: new ObjectId(), date: '01/01/2026', vbucks: 0, afterReset: true },
];

test('migration only sets dates and guards against concurrent changes', () => {
    const plan = planDateMigration(old, 'date');
    assert.equal(plan.length, 2);
    assert.equal(plan[0].updateOne.filter._id, old[0]._id);
    assert.equal(plan[0].updateOne.filter.date, '12/31/25');
    assert.deepEqual(plan[0].updateOne.update, { $set: { date: '2025-12-31' } });
});

test('migration is idempotent for alerts and logs', () => {
    assert.deepEqual(planDateMigration([{ _id: 'a', date: '2026-01-01' }], 'date'), []);
    assert.deepEqual(planDateMigration([{ _id: 'b', lastUpdated: '1/1/26' }], 'lastUpdated')[0].updateOne.update, { $set: { lastUpdated: '2026-01-01' } });
    assert.throws(() => planDateMigration([{ date: '02/30/2026' }], 'date'));
});

test('verification preserves every ID, zero-reward day and non-date field', () => {
    const updated = old.map((doc, i) => ({ ...doc, date: ['2025-12-31', '2026-01-01'][i] }));
    assert.equal(verifyDateMigration(old, updated, 'date'), true);
    assert.deepEqual(snapshotSummary(old), snapshotSummary(updated));
    assert.throws(() => verifyDateMigration(old, [{ ...updated[0], vbucks: 99 }, updated[1]], 'date'));
    assert.throws(() => verifyDateMigration(old, updated.slice(0, 1), 'date'));
    assert.throws(() => verifyDateMigration(old, [{ ...updated[0], _id: 'different' }, updated[1]], 'date'));
});

test('MongoDB search escapes special characters and matches composed/decomposed accents', () => {
    const search = new RegExp(literalSearchPattern('MISION'), 'i');
    assert.ok(search.test('Misión de evacuación'));
    assert.ok(search.test('Misio\u0301n de evacuación'));
    assert.ok(!new RegExp(literalSearchPattern('.*'), 'i').test('Repair the Shelter'));
    assert.ok(new RegExp(literalSearchPattern('[abc]'), 'i').test('[abc]'));
});
