# PolyBot - Multi-Strategy Polymarket Trading System

A two-part trading system for Polymarket: **Python analytics** for research and market scanning, plus a **TypeScript bot** for automated multi-strategy trading.

## Architecture

```
PolyBot/
├── analytics/          # Python - Market research & wallet analysis
│   ├── polymarket_client.py   # API client + wallet analyzer
│   ├── scanner.py             # Market scanner (arbitrage, straddle detection)
│   └── requirements.txt
├── bot/                # TypeScript - Trading execution engine
│   ├── src/
│   │   ├── index.ts                   # Main entry point
│   │   ├── types.ts                   # Type definitions
│   │   ├── services/
│   │   │   └── api-client.ts          # Polymarket API + WebSocket client
│   │   ├── strategies/
│   │   │   ├── straddle.ts            # Straddle strategy (BTC short-term)
│   │   │   ├── arbitrage.ts           # Arbitrage (YES+NO < $1.00)
│   │   │   └── market-making.ts       # Market making (spread earning)
│   │   └── utils/
│   │       ├── risk-manager.ts        # Position limits, drawdown, Kelly
│   │       └── paper-trader.ts        # Paper trading simulator
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── config/
    └── settings.json          # Shared configuration
```

## Strategies

### 1. Straddle (Primary)
Buys both YES and NO on short-term BTC markets when prices are near 50/50. One side resolves to ~$1.00, the other to ~$0. Profit = $1.00 - entry cost.

**When it works:** BTC 5min/15min markets where both sides trade between $0.15-$0.40.

### 2. Arbitrage (Lowest Risk)
Exploits markets where YES + NO prices sum to less than $1.00. Buying both sides guarantees profit at resolution.

**When it works:** Whenever the price sum drops below $1.00 minus fees.

### 3. Market Making (Steady Income)
Places orders on both sides of a market, earning the bid-ask spread. Lower returns but more consistent.

**When it works:** High-liquidity markets with wide spreads.

### 4. Auto Mode
Evaluates all three strategies each cycle and picks whichever has the best risk-adjusted opportunities.

## Quick Start

### Analytics (Python)

```bash
cd analytics
pip install -r requirements.txt

# Run a single market scan
python scanner.py

# Run continuous scanning (every 5 minutes)
python scanner.py --loop 300
```

### Trading Bot (TypeScript)

```bash
cd bot
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Single scan (paper mode - default)
npx ts-node src/index.ts

# Continuous paper trading
npx ts-node src/index.ts --loop

# Scan only (no trades)
npx ts-node src/index.ts --scan

# Custom interval (seconds)
npx ts-node src/index.ts --loop --interval 120
```

## Configuration

Edit `config/settings.json` to adjust:

- **Trading mode:** `paper` (simulated) or `live` (real money)
- **Position limits:** Max size per trade, daily loss limit, max open positions
- **Strategy parameters:** Entry prices, volatility thresholds, spread minimums
- **Risk management:** Max drawdown, Kelly fraction, cooldown periods

## Risk Warnings

1. **Start with paper trading.** Run in paper mode for at least 2 weeks before considering live trading.
2. **Arbitrage opportunities are rare and fast.** Most are captured by bots with sub-100ms latency.
3. **Straddle is not risk-free.** You can lose the entire entry cost if the losing side goes to $0 and the winning side doesn't reach $1.
4. **Market making carries inventory risk.** If the market moves against your inventory, you can lose money.
5. **Only trade with money you can afford to lose.**
6. **Check your local regulations.** Polymarket has CFTC approval but state-level rules vary.

## Going Live

To trade with real money, you need:

1. A Polygon wallet with USDC
2. Polymarket API credentials (from polymarket.com settings)
3. Set `TRADING_MODE=live` in `.env`
4. Install the `@polymarket/clob-client` SDK for order submission
5. Implement the live order execution in `index.ts` (marked with TODO)

## API Reference

The system uses these Polymarket APIs:

- **Gamma API** (`gamma-api.polymarket.com`) - Markets, events, categories
- **CLOB API** (`clob.polymarket.com`) - Order books, prices, trade execution
- **Data API** (`data-api.polymarket.com`) - Trade history, positions
- **WebSocket** (`ws-subscriptions-clob.polymarket.com`) - Real-time price updates
