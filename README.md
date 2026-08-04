# BareChart

Source for [barechart.com](https://barechart.com) — a Hugo static site covering trading education (Learn), a blog, tool reviews/affiliate content, and comparison tools for prop firms and brokers.

## Stack

- **Hugo** (extended, v0.162.1 — see `netlify.toml`) with the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme as a git submodule under `themes/PaperMod`.
- **Netlify** for hosting/deploys. `netlify.toml` runs `hugo --gc --minify` and publishes `public/` (gitignored, not committed).
- No JS build step and no `package.json` — everything is plain Hugo templates/content, and the automation scripts under `scripts/` use only Node's built-in `fetch`.

## Local development

```sh
git clone --recurse-submodules git@github.com:aquada/barechart.git
cd barechart
hugo server -D --baseURL http://localhost:1313/
```

- `--recurse-submodules` matters — the theme lives in a submodule (`git submodule update --init` if you forgot).
- Always pass `--baseURL` for local dev; the config's `baseURL` is the production domain, and Hugo will otherwise generate absolute links pointing at `barechart.com`.
- Don't run a production build (`hugo --gc --minify`) into `public/` while `hugo server` is running — they can race on the same output directory.
- `netlify.toml`'s `[[redirects]]` (`/go/*` affiliate links) only work on the deployed site, not under `hugo server` — a local 404 on one of those is expected.

## Content layout

- `content/learn/` — structured trading curriculum, organised by section (Foundations, Reading Charts, Market Structure, Risk Management, …). Each topic is a Hugo page bundle (`index.md` + co-located images).
- `content/blog/` — blog posts and trader interviews, also page bundles where they carry images.
- `content/prop-firms/` and `content/brokers/` — comparison tools. Data lives in `static/data/propfirms.json` / `static/data/brokers.json`; the client-side compare/filter UI is in `layouts/prop-firms/` and `layouts/brokers/`.
- `content/tools/` — affiliate write-ups for third-party trading tools.
- `content/shop/`, `content/services/` — commercial pages.

## Automated data refresh

`static/data/propfirms.json` and `static/data/brokers.json` are re-verified monthly against live sources via the Claude API:

- `.github/workflows/prop-firms-refresh.yml` — 1st of the month, 00:00 UTC
- `.github/workflows/brokers-refresh.yml` — 2nd of the month, 00:00 UTC (staggered so the two don't run concurrently)

Both call `scripts/refresh-propfirms.mjs` / `scripts/refresh-brokers.mjs`, which need an `ANTHROPIC_API_KEY` repo secret. Each run opens a PR against the relevant JSON file rather than committing straight to `main` — **the diff should be reviewed before merging**, since this is financial/affiliate content.

`.github/workflows/scheduled-publish.yml` runs weekly (Monday 06:00 UTC) and triggers a Netlify rebuild via a `NETLIFY_BUILD_HOOK` repo secret, so future-dated blog posts and anything merged from the refresh PRs above go live without a manual `git push`.

## Deployment

Netlify builds on every push to `main` (and via the weekly scheduled-publish workflow above). There's no separate staging environment — `hugo server` locally is the way to preview changes before pushing.
