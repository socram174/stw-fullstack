import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAlertRepository } from '../repositories/alerts.js';

function query(value) {
    return {
        sort() { return this; },
        select() { return this; },
        lean() { return this; },
        async exec() { return value; },
    };
}

function repository(records, logs) {
    return createAlertRepository({
        findOne: () => query(records[0] ?? null),
        find: (filter) => {
            assert.ok(filter?.date, 'Latest must only fetch alerts for its selected date');
            return query(records.filter((row) => row.date === filter.date));
        },
    }, { find: () => query(logs) });
}

async function withoutArrayAt(run) {
    const descriptor = Object.getOwnPropertyDescriptor(Array.prototype, 'at');
    Object.defineProperty(Array.prototype, 'at', { configurable: true, writable: true, value: undefined });
    try { return await run(); }
    finally {
        if (descriptor) Object.defineProperty(Array.prototype, 'at', descriptor);
        else delete Array.prototype.at;
    }
}

test('ISO latest alerts work without Array.prototype.at', async () => {
    const repo = repository([
        { _id: 'a', date: '2026-10-25', vbucks: 50, powerLevel: 46 },
    ], [{ lastUpdated: '2026-10-25' }, { lastUpdated: '2026-10-24' }]);
    const result = await withoutArrayAt(() => repo.getLatest());
    assert.equal(result.rotation.date, '2026-10-25');
    assert.equal(result.summary.totalVbucks, 50);
    assert.equal(result.data[0].id, 'a');
});

test('latest rejects a legacy log date instead of converting it at request time', async () => {
    const repo = repository([
        { _id: 'a', date: '2026-10-25', vbucks: 50 },
    ], [{ lastUpdated: '10/25/2026' }]);
    await assert.rejects(repo.getLatest(), /Invalid stored alert date/);
});

test('missing alerts and logs work without Array.prototype.at', async () => {
    const result = await withoutArrayAt(() => repository([], []).getLatest());
    assert.equal(result.rotation, null);
    assert.deepEqual(result.data, []);
});

test('a newer log keeps its rotation date even with no missions', async () => {
    const repo = repository([{ _id: 'a', date: '2026-10-24', vbucks: 50 }], [{ lastUpdated: '2026-10-25' }]);
    const result = await withoutArrayAt(() => repo.getLatest());
    assert.equal(result.rotation.date, '2026-10-25');
    assert.deepEqual(result.data, []);
    assert.equal(result.summary.totalVbucks, 0);
});
