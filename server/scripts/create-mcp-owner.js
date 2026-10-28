import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { readMcpConfig } from '../auth/config.js';
import { createMcpAuth, mongoAuthDatabase } from '../auth/better-auth.js';
import { provisionOwner } from '../auth/provision-owner.js';

function secretQuestion(prompt) {
    process.stdout.write(prompt);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise((resolve, reject) => {
        let value = '';
        const finish = (error) => {
            process.stdin.removeListener('keypress', keypress);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write('\n');
            error ? reject(error) : resolve(value);
        };
        const keypress = (text, key) => {
            if (key?.ctrl && key.name === 'c') return finish(new Error('Cancelled.'));
            if (key?.name === 'return') return finish();
            if (key?.name === 'backspace') value = [...value].slice(0, -1).join('');
            else if (text && !key?.ctrl && !key?.meta && !/[\x00-\x1f\x7f]/.test(text)) value += text;
        };
        process.stdin.on('keypress', keypress);
    });
}

async function main() {
    dotenv.config({ quiet: true });
    const config = readMcpConfig(process.env, { provisioning: true });
    if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal. Passwords are never accepted as command-line arguments.');
    if (!process.env.MONGO_URL) throw new Error('Set MONGO_URL before creating the owner account.');
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    const email = await terminal.question('Owner email: ');
    terminal.close();
    const password = await secretQuestion('Password (16–128 characters, hidden): ');
    const confirmation = await secretQuestion('Confirm password (hidden): ');
    if (password !== confirmation) throw new Error('Passwords do not match.');
    await mongoose.connect(process.env.MONGO_URL, { autoIndex: false });
    const auth = createMcpAuth(config, mongoAuthDatabase(mongoose.connection));
    const owner = await provisionOwner(auth, { email, password });
    console.log(`Owner account created. Set MCP_OWNER_ID=${owner.id} and MCP_ENABLED=true in the backend environment.`);
}

try { await main(); }
catch (error) {
    // Database errors may contain connection details. Only display our own validation messages.
    const safeMessages = /^(Set |Run this command|Enter a valid|Use a password|An owner account|Passwords do not match|Cancelled\.)/;
    console.error(safeMessages.test(error.message) ? error.message : 'Unable to create the owner. Check the database configuration.');
    process.exitCode = 1;
} finally { await mongoose.disconnect(); }
