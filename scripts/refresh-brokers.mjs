#!/usr/bin/env node
// Monthly data-freshness pass over static/data/brokers.json, run by
// .github/workflows/brokers-refresh.yml on a cron schedule.
//
// Calls the Anthropic API directly (ANTHROPIC_API_KEY, pay-as-you-go billing —
// independent of any claude.ai subscription plan) with the web_search and
// web_fetch server tools, one broker at a time, and asks for a structured JSON
// object back matching each broker's existing schema. Requires no npm install —
// uses Node's built-in fetch.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA_PATH = fileURLToPath(new URL('../static/data/brokers.json', import.meta.url));
const MODEL = 'claude-sonnet-5'; // cost-sensitive recurring batch job — see PR description for rationale
const API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are doing a monthly data-freshness check for one broker entry in barechart.com's brokers comparison tool JSON dataset.

For the broker described in the user message, use web_search and web_fetch to verify, as of today:
1. Is it still operating under this name, or has it rebranded, been acquired, shut down, or changed domains?
2. Current regulatory licenses ("regulation" array) — additions, removals, warnings, or fines from any regulator.
3. Current minimum deposit, execution type, and which platforms are actually offered (MT4, MT5, cTrader, TradingView) — confirm each one directly, don't assume.
4. Whether EA/algo trading, scalping, news trading, and weekend holding are currently allowed, and whether client funds are segregated.
5. Current spread and commission for each account tier, specifically for three instruments: an S&P 500 style index CFD ("index"), EURUSD ("forex"), and Gold/XAUUSD ("gold"). Check each instrument's own page or live spread feed directly — a broker's generic "commission from $X" marketing blurb is not reliable evidence for a specific instrument, since commission patterns vary by instrument even within the same broker (most brokers are commission-free on indices even when they charge commission on forex and gold — verify per instrument, don't assume the pattern holds).
6. Current Trustpilot rating + review count, and ForexPeaceArmy rating + review count where available.
7. Any NEW complaints, lawsuits, regulatory actions, or evidence of fake/paid review manipulation since the existing "notes" field was written — factor this into trustScore (0-10, higher = more trustworthy; use the existing value as your calibration anchor, not an absolute scale) and mention confirmed manipulation directly in "notes".

Be skeptical of generic SEO "review 2026" aggregator content. Prefer primary sources (the broker's own current pages, live per-instrument spread pages), Trustpilot/ForexPeaceArmy specific numbers, regulator registers, and dated news coverage over a single flattering source.

Do not invent precision. If you cannot confirm a value, keep the existing value and say so explicitly in "notes" (in the same style as the existing notes — e.g. "unconfirmed, site blocks automated access"). Only change "name" or "website" if you find clear evidence of a rebrand or domain change; otherwise return them unchanged.

Keep "notes" limited to what actually helps someone choose a broker — regulation status, real red flags (fines, warnings, complaint patterns), corporate relationships, clone-site risks. Do not narrate how or when the data was gathered — no "CORRECTED (date):" framing, no research-process commentary, no mention of this being an automated refresh. State corrected facts plainly, aiming for roughly 400-900 characters.

Set "lastVerified" to today's date (YYYY-MM-DD).

Return ONLY the updated broker object as structured JSON matching the provided schema — every field the schema requires, even if unchanged from the input.`;

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

const INSTRUMENT_COST_SCHEMA = {
  type: 'object',
  properties: {
    spread: { type: 'number' },
    commission: { type: 'number' },
  },
  required: ['spread', 'commission'],
  additionalProperties: false,
};

const ACCOUNT_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    index: INSTRUMENT_COST_SCHEMA,
    forex: INSTRUMENT_COST_SCHEMA,
    gold: INSTRUMENT_COST_SCHEMA,
  },
  required: ['type', 'index', 'forex', 'gold'],
  additionalProperties: false,
};

const BROKER_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    website: { type: 'string' },
    active: { type: 'boolean' },
    notes: { type: 'string' },
    regulation: { type: 'array', items: { type: 'string' } },
    minDeposit: { type: 'number' },
    executionType: { type: 'string' },
    mt4: { type: 'boolean' },
    mt5: { type: 'boolean' },
    ctrader: { type: 'boolean' },
    tradingview: { type: 'boolean' },
    eaAllowed: { type: 'boolean' },
    scalping: { type: 'boolean' },
    newsTrading: { type: 'boolean' },
    weekendHolding: { type: 'boolean' },
    segregatedFunds: { type: 'boolean' },
    instruments: { type: 'array', items: { type: 'string' } },
    accounts: { type: 'array', items: ACCOUNT_SCHEMA },
    leverage: { type: 'string' },
    depositMethods: { type: 'array', items: { type: 'string' } },
    trustScore: { type: 'number' },
    country: { type: 'string' },
    lastVerified: { type: 'string' },
    externalReview: REVIEW_SCHEMA,
    secondaryReview: REVIEW_SCHEMA,
  },
  required: [
    'name', 'website', 'active', 'notes', 'regulation', 'minDeposit',
    'executionType', 'mt4', 'mt5', 'ctrader', 'tradingview', 'eaAllowed',
    'scalping', 'newsTrading', 'weekendHolding', 'segregatedFunds',
    'instruments', 'accounts', 'leverage', 'depositMethods', 'trustScore',
    'country', 'lastVerified', 'externalReview', 'secondaryReview',
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

export function buildRequestBody(broker) {
  const { id, affiliateUrl, personal, ...researchable } = broker;
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
      format: { type: 'json_schema', schema: BROKER_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Current data for this broker:\n\n${JSON.stringify(researchable, null, 2)}`,
      },
    ],
  };
}

export async function refreshBroker(broker) {
  const { id, affiliateUrl, personal } = broker;
  const body = buildRequestBody(broker);

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
    console.warn(`  refused for ${broker.name} — leaving unchanged`);
    return broker;
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    console.warn(`  no text output for ${broker.name} — leaving unchanged`);
    return broker;
  }

  let patch;
  try {
    patch = JSON.parse(textBlock.text);
  } catch (err) {
    console.warn(`  could not parse JSON for ${broker.name} — leaving unchanged (${err.message})`);
    return broker;
  }

  return { id, ...patch, affiliateUrl, personal };
}

async function main() {
  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }

  const raw = await readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  const results = [];
  for (const broker of data.brokers) {
    console.log(`Refreshing ${broker.name}...`);
    try {
      results.push(await refreshBroker(broker));
    } catch (err) {
      console.error(`  failed for ${broker.name}, leaving unchanged: ${err.message}`);
      results.push(broker);
    }
  }

  data.brokers = results;
  data.lastUpdated = new Date().toISOString().slice(0, 10);

  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Wrote updated static/data/brokers.json');
}

// Only run when executed directly (not when imported for testing).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
