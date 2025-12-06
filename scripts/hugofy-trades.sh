#!/bin/sh
# Hugofy trades migration script
# - Dry-run by default; use --apply to perform changes

set -eu

DRY_RUN=1
if [ "$1" = "--apply" ] 2>/dev/null; then
  DRY_RUN=0
fi

GIT_OK=0
if command -v git >/dev/null 2>&1; then
  GIT_OK=1
fi

echo "Hugofy trades: dry-run=$DRY_RUN"

TRADES_DIR="content/trades"

if [ ! -d "$TRADES_DIR" ]; then
  echo "Directory $TRADES_DIR not found" >&2
  exit 1
fi

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY: $@"
  else
    echo "DO: $@"
    eval "$@"
  fi
}

# Helper: perform git mv if present, otherwise mv
git_mv() {
  src=$1
  dst=$2
  if [ $GIT_OK -eq 1 ]; then
    run git mv -f "$src" "$dst"
  else
    run mkdir -p "$(dirname "$dst")" && run mv -f "$src" "$dst"
  fi
}

# 1) Fix any index.md.md files by renaming to index.md
echo "Scanning for duplicated index filenames..."
find "$TRADES_DIR" -type f -name "index.md.md" | while read -r f; do
  target="$(dirname "$f")/index.md"
  echo "Found $f -> $target"
  git_mv "$f" "$target"
done

# 2) Convert top-level .md files into bundles
echo "Scanning for top-level markdown files to bundle..."
find "$TRADES_DIR" -maxdepth 1 -type f -name "*.md" ! -name "_index.md" | while read -r md; do
  base=$(basename "$md" .md)
  # normalize to lowercase slug
  slug=$(printf "%s" "$base" | tr '[:upper:]' '[:lower:]')
  bundle="$TRADES_DIR/$slug"

  # If bundle already exists, append -1, -2 to avoid clobbering
  if [ -e "$bundle" ]; then
    i=1
    while [ -e "${bundle}-${i}" ]; do
      i=$((i + 1))
    done
    bundle="${bundle}-${i}"
  fi

  echo "Bundle $md -> $bundle/index.md"
  run mkdir -p "$bundle"
  git_mv "$md" "$bundle/index.md"

  # 2a) Move images referenced inside the markdown/front-matter into the bundle
  # We'll look for common patterns: image: path, featured_image: path, and markdown image links
  grep -Eo "(image|featured_image):[[:space:]]*\S+" "$bundle/index.md" 2>/dev/null | sed -E 's/^[^:]+:[[:space:]]*//' | while read -r img; do
    # strip surrounding quotes if present
    img=$(printf "%s" "$img" | sed -E 's/^\"|\"$|^\'\'|\'\'$//g')
    # if it's an absolute site path starting with /, try to map to repo path
    if printf "%s" "$img" | grep -qE '^/'; then
      # remove leading /\n      candidate="${img#/}"
    else
      candidate="$img"
    fi
    # Only move if file exists in repo
    if [ -f "$candidate" ]; then
      dest="$bundle/$(basename "$candidate")"
      echo "  Move referenced image $candidate -> $dest"
      git_mv "$candidate" "$dest"
      # Update reference in index.md to the relative filename
      run sed -i.bak "s|${img}|\"$(basename "$candidate")\"|g" "$bundle/index.md" && run rm -f "$bundle/index.md.bak"
    else
      echo "  Referenced image not found in repo: $candidate"
    fi
  done

  # scan inline markdown image links ![alt](path)
  grep -Eo '!\[[^]]*\]\([^)]*\)' "$bundle/index.md" 2>/dev/null | sed -E 's/^!\[[^]]*\]\(([^)]*)\)$/\1/' | while read -r img; do
    img=$(printf "%s" "$img" | sed -E 's/^\"|\"$|^\'\'|\'\'$//g')
    if printf "%s" "$img" | grep -qE '^/'; then
      candidate="${img#/}"
    else
      candidate="$img"
    fi
    if [ -f "$candidate" ]; then
      dest="$bundle/$(basename "$candidate")"
      echo "  Move inline image $candidate -> $dest"
      git_mv "$candidate" "$dest"
      # Update link to relative path
      run sed -i.bak "s|(${img})|($(basename "$candidate"))|g" "$bundle/index.md" && run rm -f "$bundle/index.md.bak"
    else
      echo "  Inline image not found: $candidate"
    fi
  done

done

echo "Hugofy dry-run complete. To apply changes re-run with --apply"
if [ "$DRY_RUN" -eq 0 ]; then
  echo "Finished applying changes. You may want to run: git status && hugo --gc --minify"
fi
