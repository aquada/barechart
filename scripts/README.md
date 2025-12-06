# Hugofy trades migration

This folder contains a migration helper to convert existing `content/trades` single-file posts into Hugo page bundles.

Script: `hugofy-trades.sh`

Usage:

- Dry-run (default):

```sh
sh scripts/hugofy-trades.sh
```

- Apply changes (be careful — commits will be made using `git mv` if available):

```sh
sh scripts/hugofy-trades.sh --apply
```

What it does:

- Renames `index.md.md` -> `index.md` under any bundle.
- Converts top-level `content/trades/*.md` files into bundle directories named by the filename (lowercased). E.g. `2025-12-01-foo.md` -> `content/trades/2025-12-01-foo/index.md`.
- Moves referenced images from repo paths into the new bundle if the files exist in the repo. It updates front matter `image` / `featured_image` fields and inline markdown image links to use the relative filename inside the bundle.

Notes & safety:

- The script is conservative and will not overwrite existing bundles; if a bundle path exists it appends `-1`, `-2`, etc.
- Always run the script in dry-run mode first, inspect the output, and then run with `--apply`.
- Make a backup branch before applying: `git checkout -b backup/trades-before-hugofy`.
