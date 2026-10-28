import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { InvalidQuery, parseAlertQuery, parseRewardQuery } from '../validation/alert-query.js';
import { MCP_SCOPE } from '../auth/config.js';

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const securitySchemes = [{ type: 'oauth2', scopes: [MCP_SCOPE] }];

function toolResult(data) {
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data };
}

function safely(run) {
    return async (input) => {
        try { return toolResult(await run(input)); }
        catch (error) {
            return { isError: true, content: [{ type: 'text', text: error instanceof InvalidQuery
                ? error.message : 'Unable to load alerts. Please try again later.' }] };
        }
    };
}

export function createAlertsMcpServer(repository) {
    const server = new McpServer({ name: 'stw-alerts', version: '1.0.0' }, {
        instructions: 'Read-only Fortnite Save the World V-Buck alerts. Dates are America/Santiago calendar dates. Latest means the newest stored date, which may differ from today. Missing reward buckets are unknown, not zero. History summaries cover all matches, not only the returned page.',
    });
    const register = (name, description, inputSchema, run) => server.registerTool(name, {
        description, inputSchema, annotations, _meta: { securitySchemes },
    }, safely(run));
    register('get_latest_alerts',
        'Use this to retrieve the latest recorded V-Buck missions, their collection date and reward totals.',
        z.object({}).strict(), () => repository.getLatest());
    register('search_alert_history',
        'Use this to search past missions by inclusive ISO dates, zone or text. Returns a bounded page and totals for the full selection.',
        z.object({
            from: z.string().describe('Inclusive YYYY-MM-DD date.').optional(),
            to: z.string().describe('Inclusive YYYY-MM-DD date.').optional(),
            q: z.string().max(200).describe('Search mission, zone or power level.').optional(),
            zone: z.string().max(100).describe('Exact zone name, such as Canny Valley.').optional(),
            sort: z.enum(['recent', 'reward', 'power']).default('recent'),
            page: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
            limit: z.number().int().min(1).max(100).default(15),
        }).strict(), (input) => repository.getHistory(parseAlertQuery(
            Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value)])),
        )));
    register('get_reward_summary',
        'Use this for V-Buck reward trends and totals across all zones for 7 days, 30 days, 6 months, a year or all recorded history. Null rewards mean missing data.',
        z.object({ period: z.enum(['7d', '1m', '6m', '1y', 'all']).default('1m') }).strict(),
        ({ period }) => repository.getRewards(parseRewardQuery({ period })));
    return server;
}
