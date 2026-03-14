# PolyBot v6.0 — Product Requirements Document

**Author**: ian / Claude
**Date**: March 13, 2026
**Status**: Draft
**Based on**: [Top 300 Trader Analysis](./ANALYSIS-top300.md)

---

## Problem Statement

PolyBot v5.0 runs 23 technical signals against Polymarket's 5-minute crypto Up/Down markets, but accuracy is consistently poor. Our analysis of the top 300 traders by P/L confirms why: **crypto is the lowest-ROI category on Polymarket (3.4% avg ROI for top 20 traders), and the winners are market makers running high-frequency algorithms, not directional predictors.** Meanwhile, categories like Weather (8.4% ROI), Sports (9.2%), and Politics (37.8%) offer dramatically better edge — and the top traders in those categories use information asymmetry and data-driven models, not technical analysis on random 5-minute candles.

PolyBot users currently have no way to identify *where* the edge actually lives, no way to follow proven profitable traders, and no way to detect risk-free arbitrage opportunities. The result is a dashboard that looks impressive but loses money.

---

## Goals

1. **Achieve >60% signal accuracy** across all features (measured over 100+ resolved predictions per feature)
2. **Surface at least 3 actionable trades per day** with positive expected value, across all market categories
3. **Reduce user research time by 80%** — instead of manually scanning hundreds of markets, PolyBot surfaces the best opportunities automatically
4. **Track and display prediction accuracy in real-time** so users can see which strategies actually work and which don't
5. **Outperform random chance** in every market category — if we can't beat 50%, we shouldn't signal

---

## Non-Goals

1. **Automated trade execution** — v6 surfaces opportunities, it doesn't place orders. Execution is a separate initiative with regulatory/custody implications.
2. **Cross-platform arbitrage (Polymarket vs Kalshi)** — requires Kalshi API integration, separate auth, and different order book structure. Future consideration.
3. **Political/event market predictions** — the 37.8% ROI in politics comes from human research and information edge, not algorithms. We won't pretend an algo can replicate Theo4's domain expertise.
4. **Real-time WebSocket streaming** — v6 uses polling (30s intervals). WebSocket integration for sub-second latency is a v7 feature for the crypto sniper module.
5. **Mobile app** — dashboard remains web-based. Native mobile is out of scope.

---

## Feature 1: Smart Money Tracker

### Problem

Only 7.6% of Polymarket wallets are profitable. The top 300 traders have earned $412M combined, but 92% are anonymous — users can't find or follow them. When a trader with 50%+ ROI enters a new position, that's an extremely valuable signal that currently goes unnoticed by retail users.

### User Stories

- **As a PolyBot user**, I want to see which markets the top traders are entering, so that I can follow proven smart money instead of guessing.
- **As a PolyBot user**, I want to filter tracked traders by category (crypto, politics, weather, sports), ROI tier, and activity recency, so that I can focus on traders relevant to my strategy.
- **As a PolyBot user**, I want to be alerted when multiple high-ROI traders cluster on the same side of a market, so that I can identify high-conviction opportunities.
- **As a PolyBot user**, I want to see each tracked trader's historical accuracy, win rate, and category breakdown, so that I can assess how much to trust their signals.

### Requirements

**P0 — Must Have**

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 1.1 | **Trader Watchlist** — Maintain a configurable list of top traders to track, seeded with top 50 by ROI (>$500k volume filter) | Default list loads from leaderboard API. User can add/remove wallets. Minimum 20, maximum 200 tracked wallets. |
| 1.2 | **Activity Feed** — Poll `data-api.polymarket.com/v1/trades?user={wallet}` for each tracked trader every 60 seconds | Feed shows trader name/wallet, market title, side (BUY/SELL), size, price, and timestamp. Sorted by recency. |
| 1.3 | **Whale Consensus Indicator** — For each active market, count how many tracked traders hold positions and on which side | Display as "X/Y whales bullish" with aggregate position size. Highlight markets where ≥3 high-ROI traders agree on direction. |
| 1.4 | **Trader Profile Cards** — Show each tracker's P/L, volume, ROI, category breakdown, and last 20 trades | Pull from leaderboard API + trades endpoint. Calculate ROI as P/L ÷ Volume. Show category distribution pie. |
| 1.5 | **Accuracy Tracking** — For every smart money signal (whale enters a market), track whether the market resolved in their favor | Log every tracked trade, match to resolution, compute running accuracy %. Display per-trader and aggregate. Target: prove >55% accuracy to validate the feature. |

**P1 — Nice to Have**

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 1.6 | **Trader Archetypes** — Auto-classify traders as "Sniper" (>30% ROI, <50 trades/month), "Sharp" (10-30% ROI), "Grinder" (<10% ROI) | Classification updates weekly based on rolling 90-day performance. Show archetype badge on profile cards. |
| 1.7 | **Category Affinity** — Show which categories each trader is strongest in | Pull from category leaderboards. Cross-reference wallet addresses. |
| 1.8 | **Smart Money Momentum** — Show aggregate smart money flow direction across all active markets | Bar chart: net whale position (long vs short) per market category over last 24h. |

**P2 — Future**

| # | Requirement |
|---|---|
| 1.9 | Push notifications when a Sniper-tier trader opens a new position |
| 1.10 | "Follow" a trader — auto-surface all their new positions in a dedicated feed |
| 1.11 | One-click copy trade (requires wallet integration) |

### Data Sources

| Source | Endpoint | Rate Limit | Data |
|---|---|---|---|
| Leaderboard | `data-api.polymarket.com/v1/leaderboard` | ~60/min | Rank, wallet, P/L, volume, username |
| Trader Trades | `data-api.polymarket.com/v1/trades?user={wallet}` | ~60/min | Side, size, price, market, timestamp |
| Trader Activity | `data-api.polymarket.com/activity?user={wallet}` | ~60/min | BUY/SELL/REDEEM events |
| Market Context | `gamma-api.polymarket.com/events` | ~120/min | Market titles, outcomes, prices |

### Accuracy Measurement

- **Primary metric**: % of whale-signaled trades that resolve profitably
- **Baseline**: Random = 50%. Target = >60%.
- **Measurement window**: Rolling 30-day window, minimum 50 resolved trades before displaying accuracy
- **Confidence display**: Show sample size alongside accuracy ("63% accurate over 127 trades")
- **Per-tier accuracy**: Track separately for Snipers, Sharps, and Grinders to prove which tier is worth following
- **Control**: Also track "anti-smart-money" (betting against whales) to verify signal isn't random

---

## Feature 2: Weather Forecast Arbitrage Scanner

### Problem

Weather markets on Polymarket offer 2.5x better ROI than crypto (8.4% vs 3.4%), and weather is genuinely predictable with free forecast data — 85-95% accuracy 24-48 hours out. Yet most retail bettors trade weather markets on gut feel. Our analysis found "automatedAItradingbot" in the weather top 10, confirming algorithmic approaches work here. There are currently 30+ active weather/temperature markets on Polymarket with ~$1k liquidity each.

### User Stories

- **As a PolyBot user**, I want to see all active weather markets alongside professional forecast data, so that I can identify mispriced markets instantly.
- **As a PolyBot user**, I want to see the forecast-implied probability vs. the current market price for each weather market, so that I can quantify my edge before placing a trade.
- **As a PolyBot user**, I want the dashboard to highlight weather markets where the forecast disagrees with the market by more than 10%, so that I only trade when there's meaningful edge.
- **As a PolyBot user**, I want to see forecast confidence intervals and multi-model agreement, so that I can size my positions according to forecast certainty.
- **As a PolyBot user**, I want to track how often the forecast-based signals resolve correctly, so that I can trust the system.

### Requirements

**P0 — Must Have**

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 2.1 | **Weather Market Scanner** — Discover all active temperature/weather markets on Polymarket via gamma API | Scan `gamma-api.polymarket.com/markets` with keyword filtering for "temperature", "°F", "°C", "weather", "precipitation". Refresh every 5 minutes. |
| 2.2 | **Forecast Data Integration** — Pull professional weather forecasts for each city/date referenced in active markets | Use OpenWeatherMap API (free tier: 1000 calls/day) or WeatherAPI.com. Parse market questions to extract: city, date, temperature threshold, comparison operator (above/below/between). |
| 2.3 | **Edge Calculator** — For each market, compute forecast-implied probability and compare to Polymarket price | Example: market asks "Will NYC be above 46°F on March 14?" → forecast says 52°F with σ=3°F → implied probability ≈ 97.7% → market price is $0.82 → **edge = +15.7%**. Display: forecast value, market price, edge %, and signal strength. |
| 2.4 | **Signal Threshold** — Only flag markets where edge exceeds fee-adjusted threshold | Default threshold: 8% edge (accounting for ~2% round-trip fees). User-configurable from 5% to 20%. Markets below threshold shown but grayed out. |
| 2.5 | **Accuracy Tracking** — Log every weather signal and track resolution accuracy | For each signaled market, record: forecast probability, market price at signal time, edge %, and eventual resolution (YES/NO). Compute running accuracy. Target: >70% (weather is more predictable than other categories). |
| 2.6 | **Multi-Model Consensus** — Show agreement across 2+ forecast sources | When multiple models agree (e.g., OpenWeatherMap + WeatherAPI both say >90% chance of exceeding threshold), flag as "high confidence". Track whether multi-model consensus signals outperform single-model. |

**P1 — Nice to Have**

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 2.7 | **Ladder Strategy Helper** — For temperature range markets (e.g., "between 44-45°F"), show the full probability distribution across all buckets | Display as histogram: each bucket's forecast probability vs. market price. Highlight all buckets with positive edge. Suggest optimal position allocation across the ladder. |
| 2.8 | **Forecast Timeline** — Show how the forecast has changed over the last 24-48 hours | If forecast is converging toward a value (decreasing uncertainty), signal confidence is increasing. If forecast is shifting, warn of instability. |
| 2.9 | **Historical Weather Accuracy** — Show forecast model accuracy for each city over past 30 days | Pull historical forecast vs. actual data. Display as calibration chart. Use to adjust edge calculations (if model is biased, apply correction). |

**P2 — Future**

| # | Requirement |
|---|---|
| 2.10 | Precipitation, wind speed, and snow market support |
| 2.11 | NOAA GFS/ECMWF model integration for higher-accuracy forecasts |
| 2.12 | Automated position sizing based on Kelly criterion and edge % |

### Data Sources

| Source | Endpoint | Rate Limit | Data |
|---|---|---|---|
| Polymarket Markets | `gamma-api.polymarket.com/markets` | ~120/min | Active weather markets, prices, liquidity |
| OpenWeatherMap | `api.openweathermap.org/data/3.0/onecall` | 1000/day (free) | Temperature forecasts, hourly + daily |
| WeatherAPI | `api.weatherapi.com/v1/forecast.json` | 1M/month (free) | Temperature, precipitation, multi-day |
| CLOB Prices | `clob.polymarket.com/price` | ~120/min | Real-time YES/NO prices for edge calc |

### Market Question Parsing

Weather markets follow predictable patterns. The parser must extract:

| Component | Example | Extraction Method |
|---|---|---|
| City | "New York City", "Tokyo", "London" | Named entity recognition or city dictionary lookup |
| Date | "March 14", "March 16" | Date regex extraction |
| Threshold | "46°F", "18°C", "between 44-45°F" | Number + unit regex |
| Operator | "or higher", "or below", "between" | Keyword matching |
| Metric | "highest temperature", "precipitation" | Keyword classification |

### Accuracy Measurement

- **Primary metric**: % of weather signals that resolve correctly
- **Baseline**: Random ≈ 50%. Target: **>70%** (weather is inherently more predictable)
- **Secondary metric**: Expected value per trade = (accuracy × avg_win) - ((1-accuracy) × avg_loss)
- **Calibration check**: Are our 80% confidence signals actually right 80% of the time? Plot calibration curve.
- **Per-city accuracy**: Some cities have more predictable weather. Track and display separately.
- **Edge decay tracking**: How does accuracy change as edge % decreases? Find the minimum profitable edge.

---

## Feature 3: Arbitrage & Straddle Scanner

### Problem

Academic research documented $40M+ in arbitrage profits extracted from Polymarket. When YES + NO prices sum to less than $1.00, buying both sides guarantees risk-free profit regardless of the outcome. Researchers found 7,000+ markets with measurable combinatorial mispricings. Currently, PolyBot users have no way to detect these opportunities, which often appear and disappear within minutes.

### User Stories

- **As a PolyBot user**, I want to see all markets where YES + NO < $0.98, so that I can lock in guaranteed profit by buying both sides.
- **As a PolyBot user**, I want to see logically related markets that misprice their relationship, so that I can exploit combinatorial arbitrage.
- **As a PolyBot user**, I want to see the net profit per dollar invested and available liquidity for each arbitrage opportunity, so that I can prioritize the most capital-efficient trades.
- **As a PolyBot user**, I want to be alerted the moment a new arbitrage opportunity appears, so that I can act before the window closes.
- **As a PolyBot user**, I want to track how often these opportunities actually resolve as expected, so I can trust the scanner.

### Requirements

**P0 — Must Have**

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 3.1 | **Same-Market Arb Scanner** — Continuously scan all active markets for YES + NO prices that sum to < $1.00 | Poll CLOB price endpoints for all active binary markets. Flag any where `yesPrice + noPrice < 0.98` (accounting for 1% fee each side). Refresh every 30 seconds. |
| 3.2 | **Opportunity Card** — For each arb, display: market title, YES price, NO price, total cost, guaranteed profit per $1, available liquidity (min of YES and NO order book depth), and estimated max position size | All values real-time from CLOB API. Profit calculation: `$1.00 - (yesAsk + noAsk) - fees`. |
| 3.3 | **Straddle Scanner** — Identify markets where you can hedge 80/20 with positive expected value | For markets where one side is priced 60-80¢: compute EV of buying 80% main position + 20% hedge. Signal when EV > 3% after fees. |
| 3.4 | **Alert Ranking** — Sort opportunities by edge × liquidity (profit potential) | Highest-value opportunities first. Gray out opportunities with <$50 available liquidity (not worth the gas). |
| 3.5 | **Accuracy / Resolution Tracking** — Log every flagged arb and track actual resolution | For same-market arb: did we correctly identify that YES+NO < $1? (Should be 100% — it's math, not prediction). For straddles: track the EV calculation accuracy. Display running stats. |

**P1 — Nice to Have**

| # | Requirement | Acceptance Criteria |
|---|---|---|
| 3.6 | **Combinatorial Arb** — Detect logically related markets that misprice their relationship | Example: "Trump wins" at 60¢ + "Republican wins" at 55¢ = inconsistency (Trump winning implies Republican winning). Flag when P(A) > P(B) but A implies B. Requires building a market relationship graph. |
| 3.7 | **Historical Arb Feed** — Show past arb opportunities, how long they lasted, and what the profit would have been | Track appearance timestamp, disappearance timestamp, and max edge. Show "you would have made $X" for motivation. |
| 3.8 | **Arb Decay Timer** — Show how long the current arb has been open and a prediction for how long it will last | Based on historical duration of similar arbs (by liquidity tier and edge size). |

**P2 — Future**

| # | Requirement |
|---|---|
| 3.9 | Cross-platform arb scanning (Polymarket vs Kalshi vs other prediction markets) |
| 3.10 | One-click dual-side execution (buy both YES and NO atomically) |
| 3.11 | Multi-market combinatorial arb with 3+ related markets |

### Data Sources

| Source | Endpoint | Rate Limit | Data |
|---|---|---|---|
| All Active Markets | `gamma-api.polymarket.com/markets?active=true&closed=false` | ~120/min | Market list with outcome prices |
| CLOB Prices | `clob.polymarket.com/price?token_id={id}&side=buy` | ~120/min | Real-time best ask prices |
| CLOB Books | `clob.polymarket.com/book?token_id={id}` | ~60/min | Full order book depth for liquidity calc |
| Market Metadata | `gamma-api.polymarket.com/events` | ~120/min | Event grouping for combinatorial detection |

### Accuracy Measurement

- **Same-market arb accuracy**: Should be **100%** — this is pure math (YES + NO < $1). If we flag an arb and it doesn't resolve as profit, something is wrong with our fee calculation or price data.
- **Straddle EV accuracy**: Track predicted EV vs actual P/L. Target: **>55%** of straddles profitable after fees.
- **Opportunity detection rate**: How many arbs exist that we *miss*? Compare our scanner against historical CLOB data. Target: detect >90% of arbs that last >30 seconds.
- **Latency metric**: Time from arb appearing in order book to our dashboard displaying it. Target: <5 seconds.

---

## Cross-Feature: Accuracy Dashboard

All three features feed into a unified accuracy tracking system.

| Metric | Feature 1 (Smart Money) | Feature 2 (Weather) | Feature 3 (Arb) |
|---|---|---|---|
| **Target accuracy** | >60% | >70% | >95% (arb), >55% (straddle) |
| **Baseline (random)** | 50% | 50% | N/A (deterministic) |
| **Min sample size** | 50 resolved | 30 resolved | 10 resolved |
| **Display** | Per-trader + aggregate | Per-city + aggregate | Per-type |
| **Kill switch** | Disable if <52% after 100 trades | Disable if <55% after 50 trades | Alert if any arb fails |
| **Backtest** | Replay last 30d of top trader trades | Replay last 30d of weather forecasts vs markets | Replay last 7d of CLOB prices |

The dashboard header (currently showing "ACCURACY: --") will display a combined accuracy score weighted by trade count per feature, plus a breakdown by feature on hover/click.

---

## Timeline Considerations

| Phase | Scope | Duration | Dependency |
|---|---|---|---|
| **Phase 1** | Arb Scanner (Feature 3) — simplest to build, deterministic, proves infrastructure | 1 week | Vercel proxy for CLOB API access |
| **Phase 2** | Smart Money Tracker (Feature 1) — highest user value, moderate complexity | 1-2 weeks | Phase 1 (reuses market data pipeline) |
| **Phase 3** | Weather Scanner (Feature 2) — requires weather API integration + question parser | 2 weeks | Weather API key (free), Phase 1 |
| **Phase 4** | Accuracy dashboard + backtesting | 1 week | Phases 1-3 complete |

---

## Open Questions

| # | Question | Owner | Impact |
|---|---|---|---|
| 1 | **Rate limits**: What are the actual rate limits on `data-api.polymarket.com`? We'll be polling 50+ wallets every 60s for Smart Money. | Engineering | May need to batch requests or cache |
| 2 | **Weather API choice**: OpenWeatherMap free tier is 1000 calls/day. With 30+ weather markets × multiple forecast checks, is that enough? Do we need WeatherAPI.com as secondary? | Engineering | Budget: $0 (free tier) vs $10/mo (paid) |
| 3 | **Straddle fee model**: What are the exact fee structures for buying YES and NO on the same market? Is there a maker/taker split? | Research | Directly affects straddle EV calculations |
| 4 | **Arb execution window**: How fast do same-market arbs close? If <5 seconds, our 30s polling won't catch them. | Research | May require WebSocket upgrade (v7) |
| 5 | **Legal**: Is copy trading (even signal-based, not automated) subject to any regulatory requirements? | Legal | Could affect Feature 1 scope |
| 6 | **Backtest data**: Can we get historical CLOB price data (not just current) for backtesting? The API seems to only serve live data. | Engineering | Affects Phase 4 accuracy validation |
