/**
 * Directional Prediction Strategy v2 - 5-Minute Crypto Markets
 *
 * UPGRADED with validated indicators from top Polymarket bots:
 *
 * Signal Sources (weighted composite):
 * 1. Window Delta (weight 5-7) - Price change from window open (MOST CRITICAL)
 * 2. Micro Momentum (weight 2) - Last 2 candle direction
 * 3. Acceleration (weight 1.5) - Momentum building or fading
 * 4. EMA Crossover 9/21 (weight 1) - Short-term trend
 * 5. RSI 14 (weight 1-2) - Overbought/oversold extremes
 * 6. Volume Surge (weight 1) - Unusual volume detection
 * 7. Order Book Imbalance (weight 2) - Buy vs sell pressure
 * 8. Bybit Funding (weight 0.5) - Contrarian sentiment
 * 9. Kraken Deviation (weight 1) - Cross-exchange lead/lag
 *
 * Based on research from validated bots:
 * - Archetapp PolymarketBot (composite weighted signal, 7 indicators)
 * - demphu.finite ($91K profit, HFT on 5-min markets)
 * - PolyBackTest backtested strategies
 */

import axios from 'axios';
import {
  Config, Market, TradeSignal, StrategyResult,
  Opportunity, StraddleConfig
} from '../types';

interface DirectionalSignal {
  source: string;
  direction: 'up' | 'down' | 'neutral';
  strength: number;  // 0-100
  weight: number;    // signal importance weight
  reason: string;
  data?: Record<string, any>;
}

interface PredictionResult {
  direction: 'up' | 'down' | 'neutral';
  confidence: number;  // 0-100
  signals: DirectionalSignal[];
  compositeScore: number;  // -100 to +100
}

interface FiveMinMarketData {
  asset: string;
  slug: string;
  conditionId: string;
  question: string;
  upPrice: number;
  downPrice: number;
  upTokenId: string;
  downTokenId: string;
  liquidity: number;
  minutesLeft: number;
  endDate: string;
}

// Kline data type for readability
interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class DirectionalStrategy {
  private config: StraddleConfig;
  private tradingConfig: Config['trading'];
  private readonly SIGNAL_THRESHOLD = 20;  // Lowered: validated bots use 20-30%
  private readonly MIN_SIGNALS = 3;  // Need at least 3 signals agreeing

  constructor(config: Config) {
    this.config = config.straddle;
    this.tradingConfig = config.trading;
  }

  /**
   * Main evaluation: find 5-min markets, predict direction, generate signals.
   */
  async evaluate(): Promise<StrategyResult> {
    const signals: TradeSignal[] = [];
    const opportunities: Opportunity[] = [];

    const markets = await this.fetchFiveMinMarkets();
    console.log(`[Directional] Found ${markets.length} active 5-minute markets`);

    if (markets.length === 0) return { signals, opportunities, metadata: {} };

    // Group by asset
    const byAsset = new Map<string, FiveMinMarketData[]>();
    for (const m of markets) {
      if (!byAsset.has(m.asset)) byAsset.set(m.asset, []);
      byAsset.get(m.asset)!.push(m);
    }

    for (const [asset, assetMarkets] of byAsset) {
      // Pick market 1-4 minutes from closing (optimal window)
      const ideal = assetMarkets
        .filter(m => m.minutesLeft >= 1 && m.minutesLeft <= 5)
        .sort((a, b) => a.minutesLeft - b.minutesLeft);

      const target = ideal[0] || assetMarkets[0];
      if (!target || target.minutesLeft < 0.5) continue;

      const prediction = await this.predictDirection(asset);

      console.log(
        `  ${asset}: ${prediction.direction.toUpperCase()} ` +
        `(score: ${prediction.compositeScore > 0 ? '+' : ''}${prediction.compositeScore.toFixed(1)}, ` +
        `confidence: ${prediction.confidence}%) | ` +
        `${target.minutesLeft.toFixed(1)}min left | ` +
        `Up: $${target.upPrice.toFixed(3)} Down: $${target.downPrice.toFixed(3)}`
      );

      for (const sig of prediction.signals) {
        const arrow = sig.direction === 'up' ? '↑' : sig.direction === 'down' ? '↓' : '→';
        console.log(`    [${sig.source}] ${arrow} ${sig.direction} (str:${sig.strength}% w:${sig.weight}) - ${sig.reason}`);
      }

      const market: Market = {
        conditionId: target.conditionId,
        question: target.question,
        slug: target.slug,
        outcomes: ['Up', 'Down'],
        outcomePrices: [target.upPrice, target.downPrice],
        volume: 0,
        liquidity: target.liquidity,
        endDate: target.endDate,
        category: 'crypto-5m',
        active: true,
        tokens: [
          { token_id: target.upTokenId, outcome: 'Up', price: target.upPrice },
          { token_id: target.downTokenId, outcome: 'Down', price: target.downPrice },
        ],
      };

      const chosenSide = prediction.direction === 'up' ? 'Up' : 'Down';
      const chosenPrice = prediction.direction === 'up' ? target.upPrice : target.downPrice;
      const potentialProfit = ((1.0 - chosenPrice) / chosenPrice) * 100;

      opportunities.push({
        type: 'straddle',
        market,
        expectedProfitPct: potentialProfit,
        risk: prediction.confidence > 60 ? 'medium' : 'high',
        confidence: prediction.confidence,
        details: {
          asset,
          prediction: prediction.direction,
          compositeScore: prediction.compositeScore.toFixed(1),
          chosenSide,
          chosenPrice: chosenPrice.toFixed(4),
          potentialProfit: potentialProfit.toFixed(1) + '%',
          minutesLeft: target.minutesLeft.toFixed(1) + 'min',
          signalCount: prediction.signals.length,
          agreeingSignals: prediction.signals.filter(s => s.direction === prediction.direction).length,
          signals: prediction.signals.map(s => `${s.source}:${s.direction}(${s.strength}%,w${s.weight})`).join(', '),
        }
      });

      // Generate trade signal if meets threshold
      const agreeingCount = prediction.signals.filter(s => s.direction === prediction.direction).length;
      if (
        prediction.direction !== 'neutral' &&
        prediction.confidence >= this.SIGNAL_THRESHOLD &&
        agreeingCount >= this.MIN_SIGNALS
      ) {
        const positionSize = Math.min(
          this.tradingConfig.max_position_size_usd,
          target.liquidity * 0.02
        );
        const contracts = Math.floor(positionSize / chosenPrice);

        signals.push({
          strategy: 'straddle',
          market,
          action: 'BUY',
          side: prediction.direction === 'up' ? 'YES' : 'NO',
          price: chosenPrice,
          size: contracts,
          confidence: prediction.confidence,
          reason:
            `5m ${asset} DIRECTIONAL: ${chosenSide}@$${chosenPrice.toFixed(3)} | ` +
            `Score: ${prediction.compositeScore > 0 ? '+' : ''}${prediction.compositeScore.toFixed(1)} | ` +
            `Agree: ${agreeingCount}/${prediction.signals.length} | ` +
            `Profit: ${potentialProfit.toFixed(1)}% | ` +
            `${target.minutesLeft.toFixed(1)}min`,
          timestamp: Date.now(),
        });
      }
    }

    return {
      signals,
      opportunities,
      metadata: {
        marketsScanned: markets.length,
        predictions: opportunities.length,
        tradesGenerated: signals.length,
      }
    };
  }

  /**
   * Predict direction using weighted composite of 9 signal sources.
   * Based on validated bot strategies from Archetapp and top traders.
   */
  async predictDirection(asset: string): Promise<PredictionResult> {
    const signals: DirectionalSignal[] = [];

    const symbolMap: Record<string, { binance: string; bybit: string; kraken: string }> = {
      BTC: { binance: 'BTCUSDT', bybit: 'BTCUSDT', kraken: 'XBTUSD' },
      ETH: { binance: 'ETHUSDT', bybit: 'ETHUSDT', kraken: 'ETHUSD' },
      SOL: { binance: 'SOLUSDT', bybit: 'SOLUSDT', kraken: 'SOLUSD' },
      XRP: { binance: 'XRPUSDT', bybit: 'XRPUSDT', kraken: 'XRPUSD' },
    };

    const sym = symbolMap[asset] || symbolMap.BTC;

    // Fetch Binance klines first (used by multiple signals)
    let klines: Kline[] = [];
    try {
      const { data } = await axios.get('https://api.binance.com/api/v3/klines', {
        params: { symbol: sym.binance, interval: '1m', limit: 25 },
        timeout: 5000,
      });
      klines = (data as any[]).map((k: any[]) => ({
        openTime: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      }));
    } catch (e) {
      // Will have empty klines, signals depending on them will be skipped
    }

    // Run all signal generators in parallel
    const [obResult, fundingResult, krakenResult] = await Promise.allSettled([
      this.getOrderBookImbalance(sym.binance),
      this.getBybitFunding(sym.bybit),
      this.getKrakenDeviation(sym.kraken, sym.binance),
    ]);

    // 1. WINDOW DELTA (weight 5-7) — Most critical signal
    if (klines.length >= 5) {
      const sig = this.calcWindowDelta(klines);
      if (sig) signals.push(sig);
    }

    // 2. MICRO MOMENTUM (weight 2) — Last 2 candles
    if (klines.length >= 2) {
      const sig = this.calcMicroMomentum(klines);
      if (sig) signals.push(sig);
    }

    // 3. ACCELERATION (weight 1.5) — Momentum building or fading
    if (klines.length >= 4) {
      const sig = this.calcAcceleration(klines);
      if (sig) signals.push(sig);
    }

    // 4. EMA CROSSOVER 9/21 (weight 1)
    if (klines.length >= 21) {
      const sig = this.calcEMACrossover(klines);
      if (sig) signals.push(sig);
    }

    // 5. RSI 14 (weight 1-2) — Only at extremes
    if (klines.length >= 15) {
      const sig = this.calcRSI(klines);
      if (sig) signals.push(sig);
    }

    // 6. VOLUME SURGE (weight 1)
    if (klines.length >= 6) {
      const sig = this.calcVolumeSurge(klines);
      if (sig) signals.push(sig);
    }

    // 7. ORDER BOOK IMBALANCE (weight 2)
    if (obResult.status === 'fulfilled' && obResult.value) {
      signals.push(obResult.value);
    }

    // 8. BYBIT FUNDING (weight 0.5)
    if (fundingResult.status === 'fulfilled' && fundingResult.value) {
      signals.push(fundingResult.value);
    }

    // 9. KRAKEN DEVIATION (weight 1)
    if (krakenResult.status === 'fulfilled' && krakenResult.value) {
      signals.push(krakenResult.value);
    }

    // Calculate composite weighted score (-100 to +100)
    let totalWeight = 0;
    let weightedScore = 0;

    for (const sig of signals) {
      const dirMult = sig.direction === 'up' ? 1 : sig.direction === 'down' ? -1 : 0;
      const contribution = dirMult * sig.strength * sig.weight;
      weightedScore += contribution;
      totalWeight += sig.weight;
    }

    const compositeScore = totalWeight > 0 ? (weightedScore / totalWeight) : 0;

    // Cap at -100 to +100
    const clampedScore = Math.max(-100, Math.min(100, compositeScore));

    let direction: 'up' | 'down' | 'neutral';
    let confidence: number;

    if (Math.abs(clampedScore) < this.SIGNAL_THRESHOLD) {
      direction = 'neutral';
      confidence = Math.round(Math.abs(clampedScore));
    } else {
      direction = clampedScore > 0 ? 'up' : 'down';
      confidence = Math.min(100, Math.round(Math.abs(clampedScore)));
    }

    return { direction, confidence, signals, compositeScore: clampedScore };
  }

  // ── SIGNAL GENERATORS ─────────────────────────────────

  /**
   * 1. Window Delta — Price change from ~5 minutes ago.
   * This is the MOST IMPORTANT signal per validated bots.
   * weight: 5-7 depending on magnitude.
   */
  private calcWindowDelta(klines: Kline[]): DirectionalSignal | null {
    const recent = klines.slice(-5);
    if (recent.length < 5) return null;

    const windowOpen = recent[0].open;
    const currentClose = recent[recent.length - 1].close;
    const pctChange = ((currentClose - windowOpen) / windowOpen) * 100;

    let weight: number;
    let strength: number;

    const absPct = Math.abs(pctChange);
    if (absPct > 0.10) { weight = 7; strength = 90; }
    else if (absPct > 0.05) { weight = 6; strength = 70; }
    else if (absPct > 0.02) { weight = 5; strength = 50; }
    else if (absPct > 0.005) { weight = 5; strength = 30; }
    else if (absPct > 0.001) { weight = 3; strength = 15; }
    else { weight = 1; strength = 5; }

    const direction: 'up' | 'down' | 'neutral' =
      absPct < 0.001 ? 'neutral' : pctChange > 0 ? 'up' : 'down';

    return {
      source: 'window_delta',
      direction,
      strength,
      weight,
      reason: `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(4)}% 5min | $${windowOpen.toFixed(2)} → $${currentClose.toFixed(2)}`,
      data: { pctChange, windowOpen, currentClose },
    };
  }

  /**
   * 2. Micro Momentum — Direction of last 2 candles.
   */
  private calcMicroMomentum(klines: Kline[]): DirectionalSignal | null {
    const last2 = klines.slice(-2);
    const c1Bullish = last2[0].close > last2[0].open;
    const c2Bullish = last2[1].close > last2[1].open;

    let direction: 'up' | 'down' | 'neutral';
    let strength: number;

    if (c1Bullish && c2Bullish) {
      direction = 'up';
      strength = 60;
    } else if (!c1Bullish && !c2Bullish) {
      direction = 'down';
      strength = 60;
    } else {
      direction = 'neutral';
      strength = 10;
    }

    return {
      source: 'micro_momentum',
      direction,
      strength,
      weight: 2,
      reason: `Last 2 candles: ${c1Bullish ? '🟢' : '🔴'}${c2Bullish ? '🟢' : '🔴'} | ${direction}`,
    };
  }

  /**
   * 3. Acceleration — Is momentum building or fading?
   */
  private calcAcceleration(klines: Kline[]): DirectionalSignal | null {
    const recent = klines.slice(-4);
    if (recent.length < 4) return null;

    // Latest candle move vs candle from 2 periods ago
    const latestMove = recent[3].close - recent[3].open;
    const olderMove = recent[1].close - recent[1].open;

    // If both positive and latest is bigger = accelerating up
    // If both negative and latest is more negative = accelerating down
    const isAccelerating = Math.abs(latestMove) > Math.abs(olderMove);
    const sameDirection = (latestMove > 0 && olderMove > 0) || (latestMove < 0 && olderMove < 0);

    let direction: 'up' | 'down' | 'neutral';
    let strength: number;

    if (sameDirection && isAccelerating) {
      direction = latestMove > 0 ? 'up' : 'down';
      strength = 55;
    } else if (sameDirection && !isAccelerating) {
      // Same direction but fading — weaker signal
      direction = latestMove > 0 ? 'up' : 'down';
      strength = 25;
    } else {
      direction = 'neutral';
      strength = 10;
    }

    return {
      source: 'acceleration',
      direction,
      strength,
      weight: 1.5,
      reason: `${isAccelerating ? 'Accelerating' : 'Fading'} ${sameDirection ? direction : 'mixed'} | Move: ${latestMove.toFixed(2)} vs ${olderMove.toFixed(2)}`,
    };
  }

  /**
   * 4. EMA Crossover 9/21 — Short-term trend detection.
   */
  private calcEMACrossover(klines: Kline[]): DirectionalSignal | null {
    const closes = klines.map(k => k.close);

    const ema9 = this.calcEMA(closes, 9);
    const ema21 = this.calcEMA(closes, 21);

    if (ema9 === null || ema21 === null) return null;

    const diff = ((ema9 - ema21) / ema21) * 100;

    let direction: 'up' | 'down' | 'neutral';
    let strength: number;

    if (Math.abs(diff) < 0.001) {
      direction = 'neutral';
      strength = 5;
    } else {
      direction = diff > 0 ? 'up' : 'down';
      strength = Math.min(50, Math.round(Math.abs(diff) * 200));
    }

    return {
      source: 'ema_crossover',
      direction,
      strength,
      weight: 1,
      reason: `EMA9=${ema9.toFixed(2)} ${direction === 'up' ? '>' : '<'} EMA21=${ema21.toFixed(2)} | Diff: ${diff > 0 ? '+' : ''}${diff.toFixed(4)}%`,
    };
  }

  /**
   * 5. RSI 14 — Only fires at extremes (>75 or <25).
   */
  private calcRSI(klines: Kline[]): DirectionalSignal | null {
    const closes = klines.map(k => k.close);
    if (closes.length < 15) return null;

    let gains = 0, losses = 0;
    for (let i = closes.length - 14; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    let direction: 'up' | 'down' | 'neutral';
    let strength: number;
    let weight: number;

    if (rsi > 75) {
      // Overbought — contrarian signal: likely to go down
      direction = 'down';
      strength = Math.min(70, Math.round((rsi - 75) * 3));
      weight = 2;
    } else if (rsi < 25) {
      // Oversold — contrarian signal: likely to go up
      direction = 'up';
      strength = Math.min(70, Math.round((25 - rsi) * 3));
      weight = 2;
    } else {
      direction = 'neutral';
      strength = 0;
      weight = 0;  // Don't include in scoring when neutral
    }

    return {
      source: 'rsi_14',
      direction,
      strength,
      weight,
      reason: `RSI(14): ${rsi.toFixed(1)} | ${rsi > 75 ? 'OVERBOUGHT → down' : rsi < 25 ? 'OVERSOLD → up' : 'Neutral range'}`,
      data: { rsi },
    };
  }

  /**
   * 6. Volume Surge — Unusual volume = strong move coming.
   */
  private calcVolumeSurge(klines: Kline[]): DirectionalSignal | null {
    const recent = klines.slice(-6);
    if (recent.length < 6) return null;

    const recentAvgVol = (recent[3].volume + recent[4].volume + recent[5].volume) / 3;
    const olderAvgVol = (recent[0].volume + recent[1].volume + recent[2].volume) / 3;

    if (olderAvgVol === 0) return null;

    const volRatio = recentAvgVol / olderAvgVol;
    const isSurge = volRatio > 1.5;

    // Volume surge direction = direction of the latest candle
    const latestCandle = recent[recent.length - 1];
    const candleDir = latestCandle.close > latestCandle.open ? 'up' : 'down';

    let direction: 'up' | 'down' | 'neutral';
    let strength: number;

    if (isSurge) {
      direction = candleDir;
      strength = Math.min(60, Math.round((volRatio - 1) * 40));
    } else {
      direction = 'neutral';
      strength = 5;
    }

    return {
      source: 'volume_surge',
      direction,
      strength,
      weight: 1,
      reason: `Vol ratio: ${volRatio.toFixed(2)}x | ${isSurge ? `SURGE → ${direction}` : 'Normal volume'}`,
      data: { volRatio, isSurge },
    };
  }

  /**
   * 7. Order Book Imbalance — Buy vs sell pressure.
   */
  private async getOrderBookImbalance(symbol: string): Promise<DirectionalSignal | null> {
    try {
      const { data } = await axios.get('https://api.binance.com/api/v3/depth', {
        params: { symbol, limit: 20 },
        timeout: 5000,
      });

      if (!data?.bids || !data?.asks) return null;

      const bidVol = data.bids.reduce((s: number, b: [string, string]) => s + parseFloat(b[1]), 0);
      const askVol = data.asks.reduce((s: number, a: [string, string]) => s + parseFloat(a[1]), 0);
      const total = bidVol + askVol;
      if (total === 0) return null;

      const bidPct = (bidVol / total) * 100;
      const imbalance = bidPct - 50;

      let direction: 'up' | 'down' | 'neutral';
      let strength: number;

      if (Math.abs(imbalance) < 3) {
        direction = 'neutral';
        strength = 5;
      } else {
        direction = imbalance > 0 ? 'up' : 'down';
        strength = Math.min(80, Math.round(Math.abs(imbalance) * 2));
      }

      return {
        source: 'orderbook',
        direction,
        strength,
        weight: 2,
        reason: `Bid/Ask: ${bidPct.toFixed(1)}%/${(100 - bidPct).toFixed(1)}% | Imbalance: ${imbalance > 0 ? '+' : ''}${imbalance.toFixed(1)}%`,
        data: { bidPct, imbalance },
      };
    } catch { return null; }
  }

  /**
   * 8. Bybit Funding Rate — Contrarian signal.
   */
  private async getBybitFunding(symbol: string): Promise<DirectionalSignal | null> {
    try {
      const { data } = await axios.get('https://api.bybit.com/v5/market/tickers', {
        params: { category: 'linear', symbol },
        timeout: 5000,
      });

      const ticker = data?.result?.list?.[0];
      if (!ticker) return null;

      const fundingRate = parseFloat(ticker.fundingRate || '0');

      let direction: 'up' | 'down' | 'neutral';
      let strength: number;

      if (Math.abs(fundingRate) < 0.0001) {
        direction = 'neutral';
        strength = 5;
      } else {
        direction = fundingRate > 0 ? 'down' : 'up';
        strength = Math.min(40, Math.round(Math.abs(fundingRate) * 10000));
      }

      return {
        source: 'bybit_funding',
        direction,
        strength,
        weight: 0.5,
        reason: `Funding: ${(fundingRate * 100).toFixed(4)}% | ${direction === 'neutral' ? 'Neutral' : `Contrarian → ${direction}`}`,
        data: { fundingRate },
      };
    } catch { return null; }
  }

  /**
   * 9. Kraken-Binance Price Deviation — Cross-exchange lead/lag.
   */
  private async getKrakenDeviation(krakenPair: string, binanceSymbol: string): Promise<DirectionalSignal | null> {
    try {
      const [krakenRes, binanceRes] = await Promise.all([
        axios.get('https://api.kraken.com/0/public/Ticker', {
          params: { pair: krakenPair }, timeout: 5000,
        }),
        axios.get('https://api.binance.com/api/v3/ticker/price', {
          params: { symbol: binanceSymbol }, timeout: 5000,
        }),
      ]);

      const krakenResult = krakenRes.data?.result;
      if (!krakenResult) return null;
      const krakenKey = Object.keys(krakenResult)[0];
      const krakenPrice = parseFloat(krakenResult[krakenKey].c[0]);
      const binancePrice = parseFloat(binanceRes.data?.price);

      if (!krakenPrice || !binancePrice) return null;

      const deviation = ((binancePrice - krakenPrice) / krakenPrice) * 100;

      let direction: 'up' | 'down' | 'neutral';
      let strength: number;

      if (Math.abs(deviation) < 0.005) {
        direction = 'neutral';
        strength = 5;
      } else {
        direction = deviation > 0 ? 'up' : 'down';
        strength = Math.min(50, Math.round(Math.abs(deviation) * 500));
      }

      return {
        source: 'kraken_dev',
        direction,
        strength,
        weight: 1,
        reason: `Binance-Kraken: ${deviation > 0 ? '+' : ''}${deviation.toFixed(4)}% | ${direction === 'neutral' ? 'In sync' : `Binance leads ${direction}`}`,
        data: { krakenPrice, binancePrice, deviation },
      };
    } catch { return null; }
  }

  // ── HELPERS ──────────────────────────────────────────────

  private calcEMA(data: number[], period: number): number | null {
    if (data.length < period) return null;
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b) / period;
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  }

  // ── MARKET DISCOVERY ─────────────────────────────────────

  private async fetchFiveMinMarkets(): Promise<FiveMinMarketData[]> {
    const results: FiveMinMarketData[] = [];

    try {
      const response = await fetch(
        'https://gamma-api.polymarket.com/events?' +
        new URLSearchParams({
          limit: '100',
          active: 'true',
          closed: 'false',
          order: 'startDate',
          ascending: 'false',
        })
      );

      if (!response.ok) return results;
      const events = (await response.json()) as any[];
      const now = new Date();

      for (const event of events) {
        const slug: string = event.slug || '';
        if (!slug.includes('-updown-5m-')) continue;

        const asset = slug.split('-updown')[0].toUpperCase();
        if (!['BTC', 'ETH', 'SOL', 'XRP'].includes(asset)) continue;

        for (const m of event.markets || []) {
          if (!m.acceptingOrders || !m.active) continue;

          const outcomes: string[] = typeof m.outcomes === 'string' ? JSON.parse(m.outcomes) : m.outcomes || [];
          const prices: string[] = typeof m.outcomePrices === 'string' ? JSON.parse(m.outcomePrices) : m.outcomePrices || [];
          const tokenIds: string[] = typeof m.clobTokenIds === 'string' ? JSON.parse(m.clobTokenIds) : m.clobTokenIds || [];

          if (outcomes.length !== 2 || prices.length !== 2 || tokenIds.length !== 2) continue;

          const upIdx = outcomes.indexOf('Up');
          const downIdx = outcomes.indexOf('Down');
          if (upIdx === -1 || downIdx === -1) continue;

          const endDate = m.endDate ? new Date(m.endDate) : new Date(now.getTime() + 300000);
          const minutesLeft = (endDate.getTime() - now.getTime()) / 60000;

          results.push({
            asset,
            slug,
            conditionId: m.conditionId || '',
            question: m.question || event.title || '',
            upPrice: parseFloat(prices[upIdx]),
            downPrice: parseFloat(prices[downIdx]),
            upTokenId: tokenIds[upIdx],
            downTokenId: tokenIds[downIdx],
            liquidity: parseFloat(m.liquidity || '0'),
            minutesLeft,
            endDate: m.endDate || '',
          });
        }
      }
    } catch (error: any) {
      console.error(`[Directional] Market fetch error: ${error.message}`);
    }

    return results.sort((a, b) => a.minutesLeft - b.minutesLeft);
  }
}
