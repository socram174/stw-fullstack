import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { EJSON } from 'bson';
import { planDateMigration, snapshotSummary, verifyDateMigration } from '../migrations/alert-dates.js';

const flags = process.argv.slice(2);
if (flags.some((flag) => flag !== '--apply')) throw new Error('Only --apply is supported; default mode is a dry run.');
const apply = flags.includes('--apply');
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

async function backup(documents, collection, stamp) {
    const path = fileURLToPath(new URL(`../../${collection}-backup-before-date-migration-${stamp}.json`, import.meta.url));
    const content = EJSON.stringify(documents, null, 2, { relaxed: false }) + '\n';
    await writeFile(path, content, { encoding: 'utf8', flag: 'wx' });
    const bytes = await readFile(path);
    assert.equal(EJSON.stringify(EJSON.parse(bytes.toString('utf8'), { relaxed: false }), null, 2, { relaxed: false }) + '\n', content);
    return { path, documents: documents.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

try {
    if (!process.env.MONGO_URL) throw new Error('MONGO_URL is not configured');
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000, autoIndex: false });
    const db = mongoose.connection.db;
    const alerts = db.collection('alerts');
    const logs = db.collection('logs');
    const read = (collection, session) => collection.find({}, { session, promoteValues: false, promoteLongs: false }).toArray();
    const session = await mongoose.startSession();
    let report;
    try {
        await session.withTransaction(async () => {
            const originalAlerts = await read(alerts, session);
            const originalLogs = await read(logs, session);
            assert.ok(originalAlerts.length > 0, 'Refusing to migrate an empty alert collection');
            const alertUpdates = planDateMigration(originalAlerts, 'date');
            const logUpdates = planDateMigration(originalLogs, 'lastUpdated');
            const before = snapshotSummary(originalAlerts);
            report = {
                mode: apply ? 'apply' : 'dry-run', alertDocuments: originalAlerts.length,
                alertsToUpdate: alertUpdates.length, logDocuments: originalLogs.length,
                logsToUpdate: logUpdates.length, totalVbucks: before.totalVbucks, recordedDays: before.days.length,
            };
            if (!apply) return;
            // Back up the same snapshot the transaction will modify. Retries
            // create fresh files rather than overwriting the first snapshot.
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            report.backups = [await backup(originalAlerts, 'alerts', stamp), await backup(originalLogs, 'logs', stamp)];
            for (const [collection, operations] of [[alerts, alertUpdates], [logs, logUpdates]]) {
                if (!operations.length) continue;
                const result = await collection.bulkWrite(operations, { session, ordered: true });
                assert.equal(result.matchedCount, operations.length, 'Concurrent modification detected');
                assert.equal(result.modifiedCount, operations.length, 'Some dates were not converted');
            }
            const updatedAlerts = await read(alerts, session);
            const updatedLogs = await read(logs, session);
            verifyDateMigration(originalAlerts, updatedAlerts, 'date');
            verifyDateMigration(originalLogs, updatedLogs, 'lastUpdated');
            assert.deepEqual(snapshotSummary(updatedAlerts), before, 'Daily rewards changed');
            report.verified = { idsAndOtherFieldsUnchanged: true, countsAndDailyRewardsUnchanged: true };
        }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    } finally { await session.endSession(); }
    if (apply) {
        report.index = await alerts.createIndex({ date: -1, vbucks: -1, _id: 1 }, { name: 'alerts_date_reward_id' });
    }
    console.log(JSON.stringify(report, null, 2));
} catch (error) {
    // Do not include connection strings in terminal output.
    console.error(`Date migration failed: ${error.name}: ${error.message.replace(/mongodb(?:\+srv)?:\/\/[^\s]+/g, '[redacted connection]')}`);
    process.exitCode = 1;
} finally { await mongoose.disconnect(); }
