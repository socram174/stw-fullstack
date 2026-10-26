import assert from 'node:assert/strict';
import { EJSON } from 'bson';
import { parseAlertDate } from '../services/alert-data.js';

export function parseMigrationDate(value) {
    if (typeof value !== 'string') throw new Error('Invalid stored alert date.');
    const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
    if (!legacy) return parseAlertDate(value);
    const year = Number(legacy[3]) + (legacy[3].length === 2 ? 2000 : 0);
    return parseAlertDate(`${String(year).padStart(4, '0')}-${legacy[1].padStart(2, '0')}-${legacy[2].padStart(2, '0')}`);
}

export function planDateMigration(documents, field) {
    return documents.flatMap((document) => {
        const date = parseMigrationDate(document[field]);
        return date === document[field] ? [] : [{ updateOne: {
            filter: { _id: document._id, [field]: document[field] },
            update: { $set: { [field]: date } },
        } }];
    });
}

export function verifyDateMigration(before, after, field) {
    assert.equal(after.length, before.length, 'Document count changed');
    const byId = new Map(after.map((document) => [String(document._id), document]));
    assert.equal(byId.size, after.length, 'Duplicate IDs');
    for (const document of before) {
        const updated = byId.get(String(document._id));
        assert.ok(updated, 'A document ID is missing');
        assert.equal(updated[field], parseMigrationDate(document[field]), 'Date conversion mismatch');
        const { [field]: oldDate, ...originalFields } = document;
        const { [field]: newDate, ...updatedFields } = updated;
        assert.equal(EJSON.stringify(updatedFields, { relaxed: false }), EJSON.stringify(originalFields, { relaxed: false }), 'A field other than the date changed');
    }
    return true;
}

export function snapshotSummary(alerts) {
    const days = new Map();
    let totalVbucks = 0;
    for (const alert of alerts) {
        const date = parseMigrationDate(alert.date);
        const reward = Number(alert.vbucks);
        assert.ok(Number.isFinite(reward) && reward >= 0, 'Invalid stored reward');
        totalVbucks += reward;
        days.set(date, (days.get(date) ?? 0) + reward);
    }
    return { documents: alerts.length, totalVbucks, days: [...days].sort(([a], [b]) => a.localeCompare(b)) };
}
