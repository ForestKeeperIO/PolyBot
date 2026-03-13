# PolyBot - $15 Live Test Setup Guide

## What You Need Before Starting

1. A Polymarket account (polymarket.com)
2. $15 in USDC.e on Polygon network
3. A wallet (MetaMask recommended)
4. Node.js 18+ installed

## Step 1: Get USDC on Polymarket

### Option A: Deposit via Polymarket UI (Easiest)
1. Go to polymarket.com → login with your wallet
2. Click "Deposit" → send USDC from any chain
3. Polymarket bridges it to Polygon automatically
4. Deposit $15 USDC minimum

### Option B: Bridge yourself
1. Buy $15 USDC on Coinbase/Binance
2. Send to your MetaMask on Polygon network
3. Make sure you also have ~0.1 POL for gas fees

## Step 2: Generate Polymarket API Keys

1. Go to polymarket.com
2. Click your profile → Settings → API Keys
3. Click "Create API Key"
4. Save these 3 values (you'll only see them once):
   - API Key
   - API Secret
   - Passphrase

## Step 3: Export Your Private Key

### From MetaMask:
1. Click ⋮ (three dots) → Account Details
2. Click "Show Private Key" → enter password
3. Copy the key (starts with 0x...)
4. **NEVER share this with anyone**

## Step 4: Configure the Bot

```bash
cd bot

# Copy the env template
cp .env.example .env
```

Edit `.env` with your values:
```
TRADING_MODE=live
POLY_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
POLY_API_KEY=your_api_key
POLY_API_SECRET=your_api_secret
POLY_API_PASSPHRASE=your_passphrase
POLY_SIGNATURE_TYPE=0
```

## Step 5: Install Live Trading Dependencies

```bash
npm install @polymarket/clob-client ethers@5
```

## Step 6: Run Paper Mode First (Recommended!)

Test with paper trading to make sure signals look good:
```bash
npx ts-node src/index.ts --scan           # Single scan
npx ts-node src/index.ts --loop           # Continuous (Ctrl+C to stop)
```

## Step 7: Go Live

Use the $15 config with conservative limits:
```bash
# Single scan + execute with $15 limits
npx ts-node src/index.ts --config ../config/settings-live-15usd.json

# Continuous loop (runs every 5 minutes)
npx ts-node src/index.ts --config ../config/settings-live-15usd.json --loop --interval 60
```

## $15 Safety Settings

The `settings-live-15usd.json` config uses:
- Max $3 per position (20% of capital)
- Max $5 daily loss (33% of capital — hard stop)
- Max 3 open positions at once
- Scans every 60 seconds in loop mode
- Targets all 4 assets: BTC, ETH, SOL, XRP

## What the Bot Does

1. Fetches 5-minute "Up or Down" markets from Polymarket
2. Analyzes 9 indicators from Binance, Bybit, Kraken:
   - Window Delta (price change from window open)
   - Micro Momentum (last 2 candles)
   - Acceleration (momentum building/fading)
   - EMA 9/21 Crossover
   - RSI 14 (overbought/oversold)
   - Volume Surge detection
   - Order Book Imbalance
   - Bybit Funding Rate (contrarian)
   - Kraken-Binance Price Deviation
3. Generates a composite weighted score (-100 to +100)
4. If score > 20 and 3+ signals agree → places BUY order
5. Each 5-min market resolves: winner gets $1, loser gets $0

## Expected Returns (Theoretical)

- If prediction accuracy > 55%: profitable after fees
- At 60% accuracy: ~20% return per day on capital traded
- At 50% accuracy: break-even to slight loss (fees)
- **Reality check**: Most bots achieve 52-58% accuracy on 5-min markets

## Risk Warning

- You can lose your entire $15
- Past bot performance doesn't guarantee future results
- The $15 is your learning cost — treat it as tuition
- Start with paper mode and only go live when you see consistent predictions
- 5-minute markets are the hardest to predict — consider 15-min or 1-hour for higher accuracy
