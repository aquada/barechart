#!/usr/bin/env node
// Monthly data-freshness pass over static/data/propfirms.json, run by
// .github/workflows/prop-firms-refresh.yml on a cron schedule.
//
// Calls the Anthropic API directly (ANTHROPIC_API_KEY, pay-as-you-go billing —
// independent of any claude.ai subscription plan) with the web_search and
// web_fetch server tools, one firm at a time, and asks for a structured JSON
// object back matching each firm's existing schema. Requires no npm install —
// uses Node's built-in fetch.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA_PATH = fileURLToPath(new URL('../static/data/propfirms.json', import.meta.url));
const MODEL = 'claude-sonnet-5'; // cost-sensitive recurring batch job — see PR description for rationale
const API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are doing a monthly data-freshness check for one firm entry in barechart.com's prop-firms comparison tool JSON dataset.

For the firm described in the user message, use web_search and web_fetch to verify, as of today:
1. Is it still operating under this name, or has it rebranded, been acquired, or shut down?
2. Current pricing/account tiers, and the currency they're actually priced in.
3. Current rules: profit target %, max drawdown %, daily loss %, payout/profit-split %, minimum trading days, payout frequency, reset fee, consistency rule.
4. Whether EA/algo trading, indices, forex, copy trading, news trading, and weekend holding are currently allowed.
5. Current Trustpilot rating + review count, and ForexPeaceArmy rating + review count where available.
6. Any NEW complaints, lawsuits, regulatory actions, or evidence of fake/paid review manipulation since the existing "notes" field was written — factor this into trustScore (0-10, higher = more trustworthy; use the existing value as your calibration anchor, not an absolute scale) and set manipulationFlag if warranted.

Be skeptical of generic SEO "review 2026" aggregator content. Prefer primary sources (the firm's own current pages), Trustpilot/ForexPeaceArmy specific numbers, court records, BBB, and dated news coverage over a single flattering source.

Do not invent precision. If you cannot confirm a value, keep the existing value and say so explicitly in "notes" (in the same style as the existing notes — e.g. "unconfirmed, site blocks automated access"). Only change "name" or "website" if you find clear evidence of a rebrand or domain change; otherwise return them unchanged.

Set "lastVerified" to today's date (YYYY-MM-DD).

Return ONLY the updated firm object as structured JSON matching the provided schema — every field the schema requires, even if unchanged from the input.`;

const REVIEW_SCHEMA = {
  type: ['object', 'null'],
  properties: {
    source: { type: 'string' },
    rating: { type: ['number', 'null'] },
    reviewCount: { type: ['number', 'null'] },
    url: { type: 'string' },
    asOf: { type: 'string' },
    note: { type: 'string' },
  },
  required: ['source', 'rating', 'reviewCount', 'url', 'asOf', 'note'],
  additionalProperties: false,
};

const FIRM_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    website: { type: 'string' },
    active: { type: 'boolean' },
    notes: { type: 'string' },
    ea: { type: 'boolean' },
    indices: { type: 'boolean' },
    forex: { type: 'boolean' },
    copyTrading: { type: 'boolean' },
    newsTrading: { type: 'boolean' },
    weekendHolding: { type: 'boolean' },
    consistencyRule: { type: 'boolean' },
    trustScore: { type: 'number' },
    manipulationFlag: { type: 'boolean' },
    profitTarget: { type: 'number' },
    maxDrawdown: { type: 'number' },
    dailyLoss: { type: 'number' },
    payout: { type: 'number' },
    payoutFreq: { type: 'string' },
    minDays: { type: 'number' },
    resetFee: { type: 'boolean' },
    country: { type: 'string' },
    currency: { type: 'string', enum: ['USD', 'GBP', 'EUR'] },
    lastVerified: { type: 'string' },
    accounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          size: { type: 'number' },
          cost: { type: 'number' },
        },
        required: ['size', 'cost'],
        additionalProperties: false,
      },
    },
    externalReview: REVIEW_SCHEMA,
    secondaryReview: REVIEW_SCHEMA,
  },
  required: [
    'name', 'website', 'active', 'notes', 'ea', 'indices', 'forex',
    'copyTrading', 'newsTrading', 'weekendHolding', 'consistencyRule',
    'trustScore', 'manipulationFlag', 'profitTarget', 'maxDrawdown',
    'dailyLoss', 'payout', 'payoutFreq', 'minDays', 'resetFee', 'country',
    'currency', 'lastVerified', 'accounts', 'externalReview', 'secondaryReview',
  ],
  additionalProperties: false,
};

export async function callMessages(body) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  return res.json();
}

export function buildRequestBody(firm) {
  const { id, affiliateUrl, ...researchable } = firm;
  return {
    model: MODEL,
    max_tokens: 8000,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    tools: [
      { type: 'web_search_20260209', name: 'web_search', max_uses: 8 },
      { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 8 },
    ],
    output_config: {
      format: { type: 'json_schema', schema: FIRM_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Current data for this firm:\n\n${JSON.stringify(researchable, null, 2)}`,
      },
    ],
  };
}

export async function refreshFirm(firm) {
  const { id, affiliateUrl } = firm;
  const body = buildRequestBody(firm);

  let response = await callMessages(body);
  let messages = body.messages;

  // Server-tool loop can pause after its default iteration cap; resume until done.
  let guard = 0;
  while (response.stop_reason === 'pause_turn' && guard < 3) {
    messages = [...messages, { role: 'assistant', content: response.content }];
    response = await callMessages({ ...body, messages });
    guard += 1;
  }

  if (response.stop_reason === 'refusal') {
    console.warn(`  refused for ${firm.name} — leaving unchanged`);
    return firm;
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    console.warn(`  no text output for ${firm.name} — leaving unchanged`);
    return firm;
  }

  let patch;
  try {
    patch = JSON.parse(textBlock.text);
  } catch (err) {
    console.warn(`  could not parse JSON for ${firm.name} — leaving unchanged (${err.message})`);
    return firm;
  }

  return { id, ...patch, affiliateUrl };
}

async function main() {
  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }

  const raw = await readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  const results = [];
  for (const firm of data.firms) {
    console.log(`Refreshing ${firm.name}...`);
    try {
      results.push(await refreshFirm(firm));
    } catch (err) {
      console.error(`  failed for ${firm.name}, leaving unchanged: ${err.message}`);
      results.push(firm);
    }
  }

  data.firms = results;
  data.lastUpdated = new Date().toISOString().slice(0, 10);

  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Wrote updated static/data/propfirms.json');
}

// Only run when executed directly (not when imported for testing).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
