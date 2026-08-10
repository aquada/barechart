# BareChart

Source for [barechart.com](https://barechart.com) — a Hugo static site covering trading education (Learn), a blog, tool reviews/affiliate content, and comparison tools for prop firms and brokers.

## Stack

- **Hugo** (extended, v0.162.1 — see `netlify.toml`) with the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme as a git submodule under `themes/PaperMod`.
- **Netlify** for hosting/deploys. `netlify.toml` runs `hugo --gc --minify` and publishes `public/` (gitignored, not committed).
- No JS build step and no `package.json` — everything is plain Hugo templates/content.

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

## Data refresh and content research

`static/data/propfirms.json` and `static/data/brokers.json` need periodic re-verification against live sources, and the weekly blog cadence includes research-driven posts (market reviews, tool comparisons). This is done live in a Claude Code session rather than via a scheduled headless API job — there's no `ANTHROPIC_API_KEY`-driven automation in this repo. (An earlier version of this repo had one; it was removed 2026-08-10 since it required separate pay-as-you-go Anthropic Console billing on top of a Claude subscription plan.)

`.github/workflows/scheduled-publish.yml` runs weekly (Monday 06:00 UTC) and triggers a Netlify rebuild via a `NETLIFY_BUILD_HOOK` repo secret, so future-dated blog posts go live even on a week with no other push. In practice, pushing to `main` also deploys immediately via Netlify's own GitHub integration — this job only matters for a post whose `date` crosses into the past with no push happening that day.

## Deployment

Netlify builds on every push to `main` (and via the weekly scheduled-publish workflow above). There's no separate staging environment — `hugo server` locally is the way to preview changes before pushing.
