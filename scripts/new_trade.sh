#!/usr/bin/env bash
# Creates a new journal entry with prompted values
set -e
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT_DIR="$REPO_DIR/content/journal"

today=$(date +%Y-%m-%d)
now=$(date +%H:%M)

# Session
echo "Session: 1) LO  2) NYO"
read -rp "> " s
case $s in 1) session="LO";; 2) session="NYO";; *) session="$s";; esac

# Check for existing entry today
slug="$today-$session"
if [[ -d "$CONTENT_DIR/$slug" ]]; then
  n=2
  while [[ -d "$CONTENT_DIR/$slug-$n" ]]; do ((n++)); done
  slug="$slug-$n"
fi

# Direction
echo "Direction: 1) Long  2) Short"
read -rp "> " d
case $d in 1) direction="Long";; 2) direction="Short";; *) direction="$d";; esac

# Setup
echo "Setup: 1) TLB  2) SDF  3) AC  4) Flip"
read -rp "> " st
case $st in 1) setup="TLB";; 2) setup="SDF";; 3) setup="AC";; 4) setup="Flip";; *) setup="$st";; esac

# Level
read -rp "Level (FO/LO/ONL/ON50/SD Demand Top/etc): " level

# Target level
read -rp "Target level (TZ1/TZ2/EQ/etc): " target_level

# R target
read -rp "Target R: " target_r

# Result R
read -rp "Result R: " result_r

# Rules followed
echo "Rules followed? 1) Yes  2) No"
read -rp "> " rf
case $rf in 2) rules_followed="false";; *) rules_followed="true";; esac

# Trade time
read -rp "Trade time (HH:MM) [$now]: " trade_time
trade_time="${trade_time:-$now}"

# Notes
read -rp "Notes: " notes

# Write file
entry_dir="$CONTENT_DIR/$slug"
mkdir -p "$entry_dir"
description="$direction $setup at $level → $target_level | ${result_r}R"

cat > "$entry_dir/index.md" <<EOF
---
title: "$today"
date: $(date +%Y-%m-%dT%H:%M:%S%z)
trade_date: "$today"
trade_time: "$trade_time"
draft: true
description: "$description"
session: "$session"
direction: "$direction"
setup: "$setup"
level: "$level"
target_level: "$target_level"
target_r: $target_r
result_r: $result_r
rules_followed: $rules_followed
notes: "$notes"
cover:
  image: "chart.png"
  alt: "$today $session $direction — $setup at $level"
  caption: ""
tags: ["DAX"]
---

## Setup

## Result

## Notes
EOF

echo ""
echo "Created: $entry_dir/index.md"
echo "Drop screenshot as: $entry_dir/chart.png"
