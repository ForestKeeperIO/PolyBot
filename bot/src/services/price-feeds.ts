/**
 * Multi-Source Price Feed Aggregator
 *
 * Pulls real-time BTC/ETH price data from multiple exchanges to:
 * 1. Validate Polymarket prices against real market data
 * 2. Detect volatility compression for straddle entries
 * 3. Cross-validate signals before execution
 *
 * Sources: Binance, Bybit, CoinGecko, Kraken
 */

import axios from 'axios';

export interface PriceData {
  source: string;
  symbol: string;
  price: number;
  timestamp: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
  change24hPct?: number;
}

export interface AggregatedPrice {
  symbol: string;
  median: number;
  mean: number;
  sources: PriceData[];
  spread: number;       // Max deviation between sources (%)
  confidence: number;   // 0-100, higher = more agreement
  timestamp: number;
  volatility1m?: number;
  volatility5m?: number;
}

export class PriceFeedAggregator {
  private priceHistory: Map<string, PriceData[]> = new Map();
  private readonly maxHistorySize = 3000; // ~50 min at 1s intervals

  // ── Individual Exchange Feeds ──────────────────────────

  async getBinancePrice(symbol: string = 'BTCUSDT'): Promise<PriceData | null> {
    try {
      const { data } = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
        params: { symbol },
        timeout: 5000,
      });
      return {
        source: 'binance',
        symbol: symbol.replace('USDT', ''),
        price: parseFloat(data.lastPrice),
        timestamp: Date.now(),
        volume24h: parseFloat(data.quoteVolume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        change24hPct: parseFloat(data.priceChangePercent),
      };
    } catch (error: any) {
      console.error(`[Feed:Binance] Error: ${error.message}`);
      return null;
    }
  }

  async getBybitPrice(symbol: string = 'BTCUSDT'): Promise<PriceData | null> {
    try {
      const { data } = await axios.get('https://api.bybit.com/v5/market/tickers', {
        params: { category: 'spot', symbol },
        timeout: 5000,
      });
      const ticker = data?.result?.list?.[0];
      if (!ticker) return null;
      return {
        source: 'bybit',
        symbol: symbol.replace('USDT', ''),
        price: parseFloat(ticker.lastPrice),
        timestamp: Date.now(),
        volume24h: parseFloat(ticker.turnover24h),
        high24h: parseFloat(ticker.highPrice24h),
        low24h: parseFloat(ticker.lowPrice24h),
        change24hPct: parseFloat(ticker.price24hPcnt) * 100,
      };
    } catch (error: any) {
      console.error(`[Feed:Bybit] Error: ${error.message}`);
      return null;
    }
  }

  async getCoinGeckoPrice(coinId: string = 'bitcoin'): Promise<PriceData | null> {
    try {
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`, {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
            include_24hr_vol: true,
            include_24hr_change: true,
          },
          timeout: 5000,
        }
      );
      const coin = data[coinId];
      if (!coin) return null;
      return {
        source: 'coingecko',
        symbol: coinId === 'bitcoin' ? 'BTC' : coinId === 'ethereum' ? 'ETH' : coinId.toUpperCase(),
        price: coin.usd,
        timestamp: Date.now(),
        volume24h: coin.usd_24h_vol,
        change24hPct: coin.usd_24h_change,
      };
    } catch (error: any) {
      console.error(`[Feed:CoinGecko] Error: ${error.message}`);
      return null;
    }
  }

  async getKrakenPrice(pair: string = 'XBTUSD'): Promise<PriceData | null> {
    try {
      const { data } = await axios.get('https://api.kraken.com/0/public/Ticker', {
        params: { pair },
        timeout: 5000,
      });
      const result = data?.result;
      if (!result) return null;
      const key = Object.keys(result)[0];
      const ticker = result[key];
      return {
        source: 'kraken',
        symbol: pair.startsWith('XBT') ? 'BTC' : pair.replace('USD', ''),
        price: parseFloat(ticker.c[0]),    // Last trade price
        timestamp: Date.now(),
        volume24h: parseFloat(ticker.v[1]) * parseFloat(ticker.c[0]),
        high24h: parseFloat(ticker.h[1]),
        low24h: parseFloat(ticker.l[1]),
      };
    } catch (error: any) {
      console.error(`[Feed:Kraken] Error: ${error.message}`);
      return null;
    }
  }

  // ── Aggregated Price ───────────────────────────────────

  async getAggregatedBTCPrice(): Promise<AggregatedPrice> {
    return this.getAggregatedPrice('BTC');
  }

  async getAggregatedPrice(symbol: string = 'BTC'): Promise<AggregatedPrice> {
    const symbolMap: Record<string, { binance: string; bybit: string; coingecko: string; kraken: string }> = {
      BTC: { binance: 'BTCUSDT', bybit: 'BTCUSDT', coingecko: 'bitcoin', kraken: 'XBTUSD' },
      ETH: { binance: 'ETHUSDT', bybit: 'ETHUSDT', coingecko: 'ethereum', kraken: 'ETHUSD' },
      SOL: { binance: 'SOLUSDT', bybit: 'SOLUSDT', coingecko: 'solana', kraken: 'SOLUSD' },
    };

    const config = symbolMap[symbol] || symbolMap.BTC;

    // Fetch from all sources in parallel
    const [binance, bybit, coingecko, kraken] = await Promise.all([
      this.getBinancePrice(config.binance),
      this.getBybitPrice(config.bybit),
      this.getCoinGeckoPrice(config.coingecko),
      this.getKrakenPrice(config.kraken),
    ]);

    const sources = [binance, bybit, coingecko, kraken].filter(Boolean) as PriceData[];

    if (sources.length === 0) {
      return {
        symbol,
        median: 0,
        mean: 0,
        sources: [],
        spread: 100,
        confidence: 0,
        timestamp: Date.now(),
      };
    }

    // Store in history for volatility calculation
    for (const src of sources) {
      this.addToHistory(src);
    }

    const prices = sources.map(s => s.price).sort((a, b) => a - b);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const median = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

    // Calculate spread (max deviation between sources)
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const spread = maxPrice > 0 ? ((maxPrice - minPrice) / mean) * 100 : 0;

    // Confidence: inversely proportional to spread, boosted by source count
    const sourceCountBonus = (sources.length / 4) * 25;
    const spreadPenalty = Math.min(spread * 20, 75);
    const confidence = Math.min(100, Math.max(0, sourceCountBonus + 75 - spreadPenalty));

    // Calculate volatility from history
    const vol1m = this.calculateVolatility(symbol, 60);
    const vol5m = this.calculateVolatility(symbol, 300);

    return {
      symbol,
      median,
      mean,
      sources,
      spread: parseFloat(spread.toFixed(4)),
      confidence: Math.round(confidence),
      timestamp: Date.now(),
      volatility1m: vol1m,
      volatility5m: vol5m,
    };
  }

  // ── Volatility Detection ───────────────────────────────

  /**
   * Calculate realized volatility over a lookback period.
   * Used to detect volatility compression for straddle timing.
   */
  calculateVolatility(symbol: string, lookbackSeconds: number): number | undefined {
    const key = `${symbol}_aggregated`;
    const history = this.priceHistory.get(key);
    if (!history || history.length < 10) return undefined;

    const cutoff = Date.now() - (lookbackSeconds * 1000);
    const recentPrices = history
      .filter(h => h.timestamp >= cutoff)
      .map(h => h.price);

    if (recentPrices.length < 5) return undefined;

    // Calculate standard deviation as volatility measure
    const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / recentPrices.length;
    const stdDev = Math.sqrt(variance);

    // Return as percentage of mean
    return parseFloat(((stdDev / mean) * 100).toFixed(6));
  }

  /**
   * Check if volatility is below a threshold (compressed).
   * Volatility compression is the key entry signal for straddles.
   */
  isVolatilityCompressed(symbol: string, threshold: number = 0.08): boolean {
    const vol5m = this.calculateVolatility(symbol, 300);
    if (vol5m === undefined) return false;
    return vol5m < threshold;
  }

  /**
   * Detect if a sudden volatility expansion is happening.
   * Useful to avoid entering straddles during a breakout.
   */
  isVolatilityExpanding(symbol: string): boolean {
    const vol1m = this.calculateVolatility(symbol, 60);
    const vol5m = this.calculateVolatility(symbol, 300);
    if (vol1m === undefined || vol5m === undefined) return false;
    return vol1m > vol5m * 2; // 1-min vol is 2x the 5-min vol = expanding
  }

  // ── Price Validation ───────────────────────────────────

  /**
   * Validate a Polymarket price against external sources.
   * Returns true if the Polymarket implied price is reasonable.
   */
  async validatePolymarketPrice(
    polymarketYesPrice: number,
    targetPriceUSD: number,
    symbol: string = 'BTC'
  ): Promise<{ valid: boolean; reason: string; currentPrice: number }> {
    const agg = await this.getAggregatedPrice(symbol);

    if (agg.sources.length < 2) {
      return {
        valid: false,
        reason: `Insufficient price sources (${agg.sources.length}/4)`,
        currentPrice: agg.median,
      };
    }

    if (agg.spread > 1.0) {
      return {
        valid: false,
        reason: `Price sources disagree too much (spread: ${agg.spread.toFixed(2)}%)`,
        currentPrice: agg.median,
      };
    }

    // Check if the Polymarket's implied probability aligns with the actual price
    const distancePct = ((targetPriceUSD - agg.median) / agg.median) * 100;
    const impliedProbability = polymarketYesPrice; // YES price ≈ probability

    // If target is far above current price, YES should be low
    // If target is close to current price, YES should be near 0.5
    let expectedYesRange: [number, number];

    if (distancePct > 5) {
      expectedYesRange = [0.01, 0.30]; // Far above → low probability
    } else if (distancePct > 1) {
      expectedYesRange = [0.15, 0.55]; // Slightly above → medium
    } else if (distancePct > -1) {
      expectedYesRange = [0.35, 0.65]; // Near current → ~50/50
    } else if (distancePct > -5) {
      expectedYesRange = [0.45, 0.85]; // Below → higher probability
    } else {
      expectedYesRange = [0.70, 0.99]; // Far below → very likely YES
    }

    const isReasonable = impliedProbability >= expectedYesRange[0] && impliedProbability <= expectedYesRange[1];

    return {
      valid: isReasonable,
      reason: isReasonable
        ? `Price validated: ${symbol} at $${agg.median.toFixed(2)}, target $${targetPriceUSD}, YES@${polymarketYesPrice} in expected range`
        : `Price anomaly: ${symbol} at $${agg.median.toFixed(2)}, target $${targetPriceUSD}, YES@${polymarketYesPrice} outside expected [${expectedYesRange}]`,
      currentPrice: agg.median,
    };
  }

  // ── Helpers ────────────────────────────────────────────

  private addToHistory(priceData: PriceData): void {
    // Per-source history
    const sourceKey = `${priceData.symbol}_${priceData.source}`;
    if (!this.priceHistory.has(sourceKey)) {
      this.priceHistory.set(sourceKey, []);
    }
    const sourceHistory = this.priceHistory.get(sourceKey)!;
    sourceHistory.push(priceData);
    if (sourceHistory.length > this.maxHistorySize) {
      sourceHistory.splice(0, sourceHistory.length - this.maxHistorySize);
    }

    // Aggregated history (for volatility)
    const aggKey = `${priceData.symbol}_aggregated`;
    if (!this.priceHistory.has(aggKey)) {
      this.priceHistory.set(aggKey, []);
    }
    const aggHistory = this.priceHistory.get(aggKey)!;
    aggHistory.push(priceData);
    if (aggHistory.length > this.maxHistorySize) {
      aggHistory.splice(0, aggHistory.length - this.maxHistorySize);
    }
  }

  printStatus(symbol: string = 'BTC'): void {
    const vol1m = this.calculateVolatility(symbol, 60);
    const vol5m = this.calculateVolatility(symbol, 300);
    const compressed = this.isVolatilityCompressed(symbol);
    const expanding = this.isVolatilityExpanding(symbol);

    console.log(`\n[PriceFeeds] ${symbol} Volatility Status:`);
    console.log(`  1min vol: ${vol1m !== undefined ? vol1m.toFixed(6) + '%' : 'N/A'}`);
    console.log(`  5min vol: ${vol5m !== undefined ? vol5m.toFixed(6) + '%' : 'N/A'}`);
    console.log(`  Compressed: ${compressed} | Expanding: ${expanding}`);
  }
}
