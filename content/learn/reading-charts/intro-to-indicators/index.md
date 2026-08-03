---
title: "Intro to Indicators"
description: "What indicators calculate under the hood, and where they help versus get in the way."
section: "Reading Charts"
section_slug: "reading-charts"
order: 6
weight: 6
status: "published"
tags: ["indicators", "reading charts"]
related: ["volume", "trendlines"]
---

Every indicator is derived from price, not separate from it, and knowing what maths is running underneath one changes how much weight it deserves on your chart.

---

## They're all just price, transformed

{{< figure src="ma-lag.png" caption="A moving average smooths price into a lagging line. Useful for context, always a step behind." >}}

A moving average takes the last N closes and averages them, which smooths out the noise but means the line is always describing where price has already been rather than where it's heading. An oscillator like RSI takes recent gains and losses and turns them into a bounded number, so it can flag when a move looks stretched, but it's still built entirely from the same closes a chart already shows you. Nothing an indicator displays is new information; it's existing price data run through a formula to make one property of it easier to see at a glance.

## Where they genuinely help

Indicators are good at making a pattern easier to see than the raw candles alone would, and at giving a consistent, repeatable rule instead of an eyeballed judgement call. A moving average crossing from below to above price can flag a shift in short-term momentum faster than staring at candle colours would, and RSI holding above 70 for an extended stretch is a decent shorthand for "this move has been one-sided for a while." Used this way, an indicator adds a layer of confirmation on top of what the chart is already showing.

## Where they get in the way

Because every indicator lags the closes it's built from, it will always confirm a move after it's underway rather than before, and trading purely off an indicator crossing a threshold means reacting to old information dressed up as a signal. Stacking several indicators built from the same price data doesn't add independent confirmation either, it just repeats the same signal in different clothing. The more useful habit is reading price action first and letting an indicator support that read, rather than the other way around.

*Example: a moving average crossover flags a new uptrend just as price is already three candles into a pullback, because the average needed those candles to catch up. Anyone reading price action directly would have seen the pullback starting well before the crossover confirmed it.*

---

## Key takeaways

- Every indicator is price run through a formula; none of them add information a chart doesn't already contain
- Moving averages smooth price into a lagging line; oscillators like RSI turn recent gains and losses into a bounded, readable number
- Indicators are genuinely useful for confirmation and consistency, spotting what the eye might miss
- They always lag, because they're built from closes that have already happened
- Stacking multiple indicators built from the same price data isn't extra confirmation, it's repetition
- Read price action first and use an indicator to support that read, not replace it

---

*Nothing on this page is financial advice. Trade your own account, manage your own risk.*
