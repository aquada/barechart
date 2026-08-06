---
title: "Two new brokers on the compare tool: Exness and IG, and where they don't fit"
date: 2026-08-06T08:00:00+02:00
draft: false
description: "Exness and IG join the Brokers compare tool. What each one is good at, where the marketing overstates it, and why three other candidates didn't make the cut."
cover:
  image: "trust-score-comparison.png"
  alt: "Bar chart of trust scores across all 11 brokers on the compare tool, Exness and IG highlighted"
  caption: "Trust score across the roster — IG lands near the top on regulatory pedigree, Exness lower despite a strong review record, mostly on offshore-entity routing"
categories: ["Guides"]
tags: ["brokers", "Exness", "IG", "regulation"]
---

The [Brokers compare tool](/brokers/compare/) started with nine brokers, mostly ECN-style firms built around the MT4/MT5/cTrader/TradingView stack that suits an EA or algo trader. A fresh round of research turned up five more candidates, and two of them earned a spot: Exness and IG. The other three, HFM, AvaTrade, and XM, didn't, and I want to explain both calls rather than just drop two new rows into the table and move on.

## Exness

Exness's whole reputation rests on withdrawals, and that part holds up. It's one of the few brokers where "instant" isn't just marketing copy, and that shows up consistently across independent reviews, not just the broker's own claims. The regulatory picture is messier than the marketing suggests, though. The FCA licence Exness holds is a B2B/institutional one, not a retail authorisation, so most retail clients, South African traders included, end up onboarded through the Seychelles entity or another offshore book instead of CySEC or FSCA. That's not unusual for this tier of broker, but don't assume "FCA-regulated" covers your account the way it would at Pepperstone.

Spreads are where I'd push back hardest on the marketing. Exness advertises tight index spreads, and independent testing backs that up during peak session overlap, with BrokerChooser measuring US30 around 0.10 points. An older Finance Magnates test recorded 6 to 7 points on the same instruments though, almost certainly during quieter hours, and that gap is wide enough that quoting one number would be misleading. Real cost swings hard with when you're trading, more than the marketing lets on. One correction from the research I reviewed too: Exness's "Terminal" borrows TradingView's charting library for its visuals, but that isn't the same as real TradingView broker execution the way Pepperstone, IC Markets, and Fusion Markets offer it, so I've marked it unsupported on the compare tool instead of overstating what's there.

## IG

IG is a different kind of broker, and the compare tool's ECN-focused filters don't flatter it, so I'll say that plainly upfront. It's been FCA-regulated since 2001, publicly listed, and trading since 1974, about as established as this industry gets. But it deals as principal on a single spread-only CFD account instead of offering a commission-based raw-spread tier, so unlike every ECN broker on the list, there's no lower-cost tier to switch into as your volume grows. No MT5, no cTrader, and the minimum deposit sits around £250, several times higher than anything else tracked here. If you're coming from the EA/algo-trading angle this site is mostly built around, IG is going to feel like the odd one out, and that's a fair read.

Where it earns its place is the ground the ECN brokers don't cover: depth, longevity, and a real TradingView execution integration, not a charting widget wearing the name. One change South African readers should know about: IG closed its FSCA-regulated local entity in mid-2025, and SA clients are now onboarded through IG International Limited under the Bermuda Monetary Authority, a materially lighter protection regime than the FCA/ASIC entities everyone else on the list falls under.

## Why HFM, AvaTrade, and XM didn't make the cut

All three are legitimate, regulated brokers, so this isn't a red-flag call. It's a fit call. HFM and XM don't offer cTrader or TradingView, both are built around fixed or wider spreads instead of raw ECN pricing, and both lean toward copy-trading or beginner-education audiences over EA/algo traders. AvaTrade adds a specific caution on top of that: 2025 saw a documented run of Trustpilot complaints about platform and margin-calculation failures on options trades, including one account frozen for 15 hours over a falsely-reported balance. None of that makes these bad brokers for the traders they're built for, they're just not a strong match for what this tool filters on.

## Trust score vs. cost

I try to hold to one rule across every broker on this tool: trust and cost get scored separately, on purpose. A tight spread doesn't make up for weak regulation, and solid regulation doesn't excuse a wide spread. Exness's Trustpilot number is excellent, 4.7 from close to 27,000 reviews, but its regulatory tier for most retail clients is the offshore kind, which is why its trust score sits lower than the review count alone would suggest. IG sits close to the opposite: strong regulatory pedigree and a long operating history, but a noticeably softer Trustpilot record (3.8, with a real split between 5-star and 1-star reviews) than the ECN brokers at the top of the list.

Neither broker has an affiliate link on the site yet. They're added as straight comparisons, same as most of the roster.

---

*Nothing on this page is financial advice. Verify current regulation, spreads, and terms directly with the broker and the relevant regulator before opening an account.*
