#!/usr/bin/env node
// Weekly "week ahead" market review post, run by
// .github/workflows/market-review.yml every Monday morning.
//
// Calls the Anthropic API directly (ANTHROPIC_API_KEY, pay-as-you-go billing —
// independent of any claude.ai subscription plan) with the web_search and
// web_fetch server tools to research current price action and the coming
// week's calendar for DAX/Dow/Nasdaq (in focus) plus S&P 500/UK100/Gold/EURUSD
// (shorter summaries), then writes a new dated post straight into
// content/blog/. Unlike the prop-firms/brokers refresh scripts, this is meant
// to be committed and pushed directly to main with no PR review step — see
// the workflow file for why.
//
// Data-quality gate: if the model can't ground the in-focus instruments in
// current, dated, mutually-consistent research this run, it must say so
// (dataQuality.clean = false) instead of writing a plausible-sounding guess.
// main() exits non-zero in that case so the workflow fails loudly rather than
// silently skipping.

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BLOG_DIR = fileURLToPath(new URL('../content/blog/', import.meta.url));
const MODEL = 'claude-sonnet-5';
const API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are writing the weekly "week ahead" market review for barechart.com, a Hugo blog for CFD/index day traders, mostly trading the London session on DAX, Dow, and Nasdaq. The audience already knows the shorthand (DAX, Dow, Nasdaq, US500, UK100, XAUUSD, EURUSD, FVG, ABC, AC, ONH, HTF) — do not gloss basic terms for beginners.

## Research requirement

Use web_search and web_fetch to find, as of today:
1. Last week's price action and the current key technical levels (recent high/low, any level a trader would actually watch) for the three in-focus instruments: DAX (Germany 40), Dow (US30), Nasdaq (US100 / Nasdaq 100).
2. This coming week's economic calendar for anything that could move those three: central bank meetings/speeches (Fed, ECB, BoE), major data releases (CPI, NFP, PMI, GDP), and notable earnings clusters for Dow/Nasdaq specifically.
3. A shorter read on four more instruments — S&P 500 (US500), UK100 (FTSE 100), Gold (XAUUSD), EURUSD — last week's move plus the single most relevant thing to watch this week for each.

Prefer primary sources and recent, dated coverage (this week or last week specifically) over generic "2026 outlook" evergreen content that could be stale. Cross-check headline levels against more than one source where you can.

## The data-quality gate — this is more important than producing a post

A skipped week beats a wrong one. Set \`dataQuality.clean\` to \`false\`, with a clear \`reason\`, if ANY of the following is true:
- You cannot find current, dated research for all three in-focus instruments (DAX, Dow, Nasdaq).
- Sources conflict sharply on a headline level or event and you can't resolve which is current.
- Search results are clearly stale (older than this week, or you can't tell whether they're current) and you have no fresher source to confirm or replace them.
- You would need to invent or estimate a specific number or date to complete the post.

Do not fabricate a plausible-sounding level, headline, or calendar date to fill a gap. If \`clean\` is false, set title/description/tags to empty strings/arrays and body to an empty string — none of it will be used.

## Voice — this is a hard requirement, not a suggestion

Write in the site's established voice: warm, observational, curiosity-driven (think a good science communicator explaining what's in front of them, not a dry analyst memo), with longer sentences that join related facts using conjunctions (but, and, while, though, which) rather than short choppy declaratives. Light personification of price/the market is welcome where it fits naturally ("the index spent the week testing...", "buyers didn't show up until...") but don't force an extended metaphor.

Specifically avoid, because these read as AI-generated and have been flagged before on this site:
- Em-dash tail clauses used as a repeated structural tic (occasional genuine em-dash asides are fine, density is the issue).
- "Worth watching/trading/noting/knowing" and similar "worth [X]ing" constructions.
- Overusing "rather than", "since" (as a causal connector), "actually", "genuinely", "matter/matters", "still", "exactly", "entirely" as filler connectors or intensifiers.
- Epigrammatic tail clauses for false weight ("X — nothing more", "just X, and that's it").
- Tidy parallel-construction slogans ("The wick is the rejection. The body is the confirmation.") or callback punchlines.
- Observational framing clichés ("here's an honest complication", "this is the part that...").
- Forced extended metaphors (archaeology, anatomy, etc.) run for more than a light touch.

## Structure

One opening paragraph setting the tone for the week overall. Then "## In focus" covering DAX, Dow, and Nasdaq — each gets its own short paragraph: last week's move, the levels that matter, and what's on the calendar that could move it this week. Then "## Elsewhere this week" covering S&P 500, UK100, Gold, and EURUSD more briefly — a sentence or two each. Then one short closing paragraph. Use \`##\` for section headers, nothing higher. Do not include a top-level title heading (the page template supplies the title from frontmatter) and do not include any disclaimer — that's appended separately.

## Output

Return ONLY structured JSON matching the provided schema. \`body\` is the post content as markdown starting from the first paragraph (no frontmatter). \`title\` should name the week naturally (e.g. "Week ahead: DAX, Dow, and Nasdaq into [date range]"). \`tags\` should include at minimum "DAX", "Dow", "Nasdaq".`;

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    dataQuality: {
      type: 'object',
      properties: {
        clean: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['clean', 'reason'],
      additionalProperties: false,
    },
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    body: { type: 'string' },
  },
  required: ['dataQuality', 'title', 'description', 'tags', 'body'],
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

export function buildRequestBody(todayISO) {
  return {
    model: MODEL,
    max_tokens: 8000,
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    tools: [
      { type: 'web_search_20260209', name: 'web_search', max_uses: 10 },
      { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 10 },
    ],
    output_config: {
      format: { type: 'json_schema', schema: REVIEW_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: `Today's date is ${todayISO}. Write this week's review for the trading week starting today.`,
      },
    ],
  };
}

export async function generateReview(todayISO) {
  const body = buildRequestBody(todayISO);

  let response = await callMessages(body);
  let messages = body.messages;

  // Server-tool loop can pause after its default iteration cap; resume until done.
  let guard = 0;
  while (response.stop_reason === 'pause_turn' && guard < 5) {
    messages = [...messages, { role: 'assistant', content: response.content }];
    response = await callMessages({ ...body, messages });
    guard += 1;
  }

  if (response.stop_reason === 'refusal') {
    throw new Error('Model refused the request.');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) {
    throw new Error('No text output in model response.');
  }

  return JSON.parse(textBlock.text);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const DISCLAIMER = '*Nothing on this page is financial advice. Levels and views here are a starting point for your own analysis, not a signal to trade.*';

async function main() {
  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }

  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);

  console.log(`Generating market review for ${todayISO}...`);
  const result = await generateReview(todayISO);

  if (!result.dataQuality?.clean) {
    console.error(`Skipping publish — data quality gate failed: ${result.dataQuality?.reason ?? 'no reason given'}`);
    process.exit(1);
  }

  // SAST (UTC+2), matching netlify.toml's build TZ and the rest of the site's dated posts.
  const sastDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const dateStr = `${sastDate.toISOString().slice(0, 19)}+02:00`;

  const slug = `${todayISO}-week-ahead`;
  const dir = path.join(BLOG_DIR, slug);
  await mkdir(dir, { recursive: true });

  const frontmatter = [
    '---',
    `title: "${result.title.replace(/"/g, '\\"')}"`,
    `date: ${dateStr}`,
    'draft: false',
    `description: "${result.description.replace(/"/g, '\\"')}"`,
    'categories: ["Market Review"]',
    `tags: [${result.tags.map((t) => `"${t}"`).join(', ')}]`,
    '---',
    '',
  ].join('\n');

  const content = `${frontmatter}${result.body.trim()}\n\n---\n\n${DISCLAIMER}\n`;

  await writeFile(path.join(dir, 'index.md'), content, 'utf8');
  console.log(`Wrote content/blog/${slug}/index.md`);
}

// Only run when executed directly (not when imported for testing).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
