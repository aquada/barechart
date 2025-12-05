<!-- .github/copilot-instructions.md - guidance for AI coding agents -->

# Copilot Instructions — barechart

Purpose: give an AI coding agent the minimal, actionable knowledge to be productive in this Hugo-based site.

- **Big picture**: This repository is a Hugo static site. Content lives under `content/`, templates under `layouts/`, theme assets under `themes/blowfish/`, and generated output lands in `public/`.
- **Why**: The repo ships both source (Hugo content/layouts/assets) and a built `public/` folder. Treat `public/` as generated output unless instructed otherwise.

Key files & directories (quick map):

- `config/_default/hugo.toml` — primary site config used by Hugo.
- `archetypes/default.md` — archetype used when creating new content via Hugo.
- `content/` — markdown content; section-specific templates exist in `layouts/` (`personal-log`, `teamwork`, etc.).
- `layouts/` — Hugo templates. Examples: `layouts/personal-log/single.html` shows how front-matter fields like `trader`, `instrument`, `time`, and `notes` are consumed.
- `themes/blowfish/` — theme; includes a Tailwind CSS pipeline (`themes/blowfish/package.json`) and `exampleSite/`.
- `assets/` and `resources/_gen/` — used by Hugo Pipes and theme build steps.
- `public/` — generated site (do not edit manually unless asked).
- `netlify.toml` — deploy config; Netlify runs `hugo --gc --minify` and expects `public` as the publish directory. Hugo version set to `0.147.3` here.

Common patterns & conventions (project-specific):

- Front matter formats: both TOML (`+++` in `archetypes/default.md`) and YAML (`---` in many `content/*` files) are used. Preserve the existing format for a file when editing.
- Filename/date patterns: many posts use date-prefixed filenames, e.g. `content/personal-log/2025-12-01-4c15e4a3cc25.md`. Use `archetypes/default.md` when creating via `hugo new`.
- Section templates: sections like `personal-log` have dedicated templates under `layouts/personal-log/` — check those templates for the exact front-matter keys to populate (e.g., `trader`, `setup`, `confluence`).
- Assets: Tailwind CSS is built inside `themes/blowfish` — use the theme `package.json` scripts rather than editing already-compiled files in `public/`.

Build / dev / deploy commands (exact):

- Local dev server (watch content + templates):
```
hugo server -D
```
- Production build (same command Netlify uses):
```
hugo --gc --minify
```
- Theme CSS (Tailwind) — run from `themes/blowfish`:
```
cd themes/blowfish
npx @tailwindcss/cli -c ./tailwind.config.js -i ./assets/css/main.css -o ./assets/css/compiled/main.css --jit
```
or use the scripts in the theme:
```
cd themes/blowfish
npm run build    # production CSS
npm run dev      # watch mode during development
```

Notes about CI / deploy:

- `netlify.toml` sets `publish = "public"` and runs `hugo --gc --minify`. Netlify's Hugo version is pinned to `0.147.3` via environment in that file — match this locally if you need exact parity.
- Because `public/` exists in the repo, verify whether you should commit generated changes before pushing. Default workflow: change source, run `hugo --gc --minify`, then commit only if the team expects `public/` to be tracked.

Examples (concrete):

- Add a new blog post using archetype and Hugo:
```
hugo new posts/my-new-post.md
# edit content/posts/my-new-post.md (use YAML front matter if existing file uses YAML)
hugo server -D
```
- Add a trade log entry matching templates used by `layouts/personal-log/single.html`:
```
# create file
mkdir -p content/personal-log
cat > content/personal-log/2025-12-05-my-trade.md <<'EOF'
---
trader: Dan
date: 2025-12-05T09:00:00
time: 09:00
instrument: DAX
setup: breakout
confluence: support
tags: [trade]
---

Trade notes go here.
EOF

hugo server -D
```

Troubleshooting tips (quick):

- If CSS changes don't appear, rebuild Tailwind under `themes/blowfish` (`npm run build` or `npm run dev`).
- If templates change but the server shows stale output, run `hugo server -D --disableFastRender` to avoid fast-render caching.
- Use `public/` as a quick way to inspect a built site — run `hugo --gc --minify` and open `public/index.html`.

When to edit generated files: only when explicitly requested. Default: change source (`content/`, `layouts/`, or `themes/*`) and regenerate.

If you need more details (example of a front-matter schema for a section, or to list all templates referencing a param), ask and I will enumerate the exact files that use the parameter.

---
Please review these items and tell me if you want additional examples or if any project-specific workflows are missing.
