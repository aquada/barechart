# Mistakes.md

A running log of genuine mistakes made while working on this repo — wrong
analysis, bugs shipped before being caught, mischaracterized results — kept
separate from ordinary bug fixes and feature work. The point isn't blame,
it's a place to check before repeating the same error. Newest entries at
the top. Each entry: what went wrong, how it was caught, the fix, and the
generalisable lesson if there is one.

---

- **2026-08-19 — contradictory example in "Price Action vs Indicators":
  "three lower highs into a resistance zone."** Lower highs, by definition,
  fall short of the previous high each time, so they can't be repeatedly
  testing into the same resistance zone. Written and shipped without
  noticing the contradiction. **Caught by Dan**, reading the published
  article. **Fix**: rewrote the example as three rallies stalling out at
  the same zone with fading strength each time, real momentum divergence
  visible in price action without contradicting itself. **Lesson**: when
  an example leans on a specific technical claim (a chart pattern, a
  price relationship), trace the logic all the way through before
  publishing, not just check that the sentence reads smoothly.

- **2026-08-19 — six Foundations diagrams (plus order-blocks) never
  migrated to the site's teal/red colour scheme, shipped 2026-08-04,
  not caught for two weeks.** The colour migration that session covered
  every Reading Charts, Market Structure, and Price Action diagram
  individually worked on, but Foundations' diagrams (spread.png,
  leverage.png, influence.png, gap.png, sessions-overlap.png,
  pip-move.png) and Market Structure's order-block.png were missed
  entirely, still showing the old blue/orange pair. **Caught by** a
  full-section audit run across every Learn diagram, not by anyone
  noticing the mismatch on the live site. **Fix**: pixel-level RGB swap
  on all seven, with two (influence.png, sessions-overlap.png) mapped to
  a teal-shade gradient instead of a straight swap, since they show 3-4
  categories, not a bull/bear pair. **Lesson**: when a sitewide visual or
  copy change is announced as "done," verify it against every file that
  should have been touched (`grep` for the old value across the whole
  content tree), not just the files that were open during that session —
  a change scoped to "whatever I'm looking at right now" silently leaves
  out whatever wasn't.

- **2026-08-10 to 2026-08-19 — two confident wrong diagnoses of a Netlify
  deploy delay, in sequence, on the same underlying incident.** First
  diagnosis: "no GitHub webhook exists, so push-triggered deploys never
  worked," based on empty results from the classic webhooks/commit-status/
  check-runs APIs. Disproven when previously-pushed posts were confirmed
  live — Netlify's GitHub App integration simply doesn't surface in those
  APIs. Second diagnosis, after a different post sat un-published for 40+
  minutes past its scheduled time: Netlify's "locked deploy" (auto-publish
  paused) feature was the cause. Disproven when a screenshot showed
  auto-publish had been on the whole time, unchanged. **Caught by**
  contradicting evidence each time (live posts existing; a screenshot),
  not by catching the flaw before stating the theory. **Fix**: no fix
  found, the actual root cause is still unknown — the honest resolution
  was documenting both ruled-out theories and moving to a practical
  workaround (`gh workflow run scheduled-publish.yml` after verifying
  live) rather than a third guess. **Lesson**: a plausible-sounding
  mechanism backed by a docs page is still a guess until it's checked
  against the specific evidence in front of you — state uncertainty
  explicitly instead of presenting the current best theory as the
  diagnosis, especially on a second attempt right after the first one
  was wrong.
