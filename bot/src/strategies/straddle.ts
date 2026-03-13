/**
 * Straddle Strategy - 5-Minute Crypto Markets
 *
 * Targets Polymarket's 5-minute "Up or Down" crypto markets.
 * These markets resolve based on whether an asset's price goes
 * up or down within a 5-minute window.
 *
 * Strategy:
 * 1. Scan all active 5-minute markets (BTC, ETH, SOL, XRP)
 * 2. Buy both "Up" and "Down" when total cost < $1.00
 * 3. One side always resolves to $1.00, the other to $0
 * 4. Profit = $1.00 - total_entry_cost
 *
 * Market structure (from Polymarket Gamma API):
 * - Slug pattern: {asset}-updown-5m-{unix_timestamp}
 * - Tag: "5M" (id: 102892), "Up or Down", "Crypto Prices"
 * - Outcomes: ["Up", "Down"]
 * - Resolution: Chainlink oracle BTC/USD price comparison
 * - New markets created every 5 minutes
 * - ~17K liquidity per market
 *
 * Discovery:
 *   GET /events?order=startDate&ascending=false&active=true&closed=false
 *   Filter slugs containing "-updown-5m-"
 */

import { PolymarketAPIClient } from '../services/api-client';
import {
  Config, Market, TradeSignal, StrategyResult,
  Opportunity, StraddleConfig
} from '../types';

interface FiveMinMarket {
  market: Market;
  asset: string;
  endTime: Date;
  upPrice: number;
  downPrice: number;
  totalCost: number;
  profit: number;
  profitPct: number;
  upTokenId: string;
  downTokenId: string;
  minutesUntilClose: number;
}

export class StraddleStrategy {
  private api: PolymarketAPIClient;
  private config: StraddleConfig;
  private tradingConfig: Config['trading'];
  private targetAssets = ['btc', 'eth', 'sol', 'xrp'];

  constructor(api: PolymarketAPIClient, config: Config) {
    this.api = api;
    this.config = config.straddle;
    this.tradingConfig = config.trading;
  }

  /**
   * Find all active 5-minute "Up or Down" markets from Gamma API.
   */
  async findFiveMinMarkets(): Promise<FiveMinMarket[]> {
    const results: FiveMinMarket[] = [];

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

      if (!response.ok) {
        console.error(`[Straddle] Gamma API error: ${response.status}`);
        return results;
      }

      const events = (await response.json()) as any[];
      const now = new Date();

      for (const event of events) {
        const slug: string = event.slug || '';
        if (!slug.includes('-updown-5m-')) continue;

        const asset = slug.split('-updown')[0];
        if (!this.targetAssets.includes(asset)) continue;

        const markets = event.markets || [];
        for (const m of markets) {
          if (!m.acceptingOrders || !m.active) continue;

          const outcomes: string[] = typeof m.outcomes === 'string'
            ? JSON.parse(m.outcomes) : m.outcomes || [];
          const prices: string[] = typeof m.outcomePrices === 'string'
            ? JSON.parse(m.outcomePrices) : m.outcomePrices || [];
          const tokenIds: string[] = typeof m.clobTokenIds === 'string'
            ? JSON.parse(m.clobTokenIds) : m.clobTokenIds || [];

          if (outcomes.length !== 2 || prices.length !== 2 || tokenIds.length !== 2) continue;

          const upIdx = outcomes.indexOf('Up');
          const downIdx = outcomes.indexOf('Down');
          if (upIdx === -1 || downIdx === -1) continue;

          const upPrice = parseFloat(prices[upIdx]);
          const downPrice = parseFloat(prices[downIdx]);
          const totalCost = upPrice + downPrice;
          const profit = 1.0 - totalCost;
          const profitPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

          const endDate = m.endDate ? new Date(m.endDate) : new Date(now.getTime() + 300000);
          const minutesUntilClose = (endDate.getTime() - now.getTime()) / 60000;

          const market: Market = {
            conditionId: m.conditionId || '',
            question: m.question || event.title || '',
            slug: m.slug || slug,
            outcomes,
            outcomePrices: [upPrice, downPrice],
            volume: parseFloat(m.volume || '0'),
            liquidity: parseFloat(m.liquidity || '0'),
            endDate: m.endDate,
            category: 'crypto-5m',
            active: true,
            tokens: [
              { token_id: tokenIds[upIdx], outcome: 'Up', price: upPrice },
              { token_id: tokenIds[downIdx], outcome: 'Down', price: downPrice },
            ],
          };

          results.push({
            market,
            asset: asset.toUpperCase(),
            endTime: endDate,
            upPrice,
            downPrice,
            totalCost,
            profit,
            profitPct,
            upTokenId: tokenIds[upIdx],
            downTokenId: tokenIds[downIdx],
            minutesUntilClose,
          });
        }
      }
    } catch (error: any) {
      console.error(`[Straddle] Error: ${error.message}`);
    }

    results.sort((a, b) => b.profitPct - a.profitPct);
    return results;
  }

  /**
   * Evaluate the straddle strategy across all active 5-minute markets.
   */
  async evaluate(): Promise<StrategyResult> {
    const signals: TradeSignal[] = [];
    const opportunities: Opportunity[] = [];

    const fiveMinMarkets = await this.findFiveMinMarkets();
    console.log(`[Straddle] Found ${fiveMinMarkets.length} active 5-minute markets`);

    if (fiveMinMarkets.length > 0) {
      const byAsset: Record<string, FiveMinMarket[]> = {};
      for (const m of fiveMinMarkets) {
        if (!byAsset[m.asset]) byAsset[m.asset] = [];
        byAsset[m.asset].push(m);
      }

      for (const [asset, markets] of Object.entries(byAsset)) {
        const avgCost = markets.reduce((s, m) => s + m.totalCost, 0) / markets.length;
        console.log(
          `  ${asset}: ${markets.length} markets | ` +
          `Best profit: ${markets[0]?.profitPct.toFixed(2)}% | ` +
          `Avg total cost: $${avgCost.toFixed(4)} | ` +
          `Nearest close: ${markets.reduce((min, m) => Math.min(min, m.minutesUntilClose), Infinity).toFixed(1)}min`
        );
      }
    }

    for (const fmm of fiveMinMarkets) {
      // Skip if no profit possible
      if (fmm.totalCost >= 1.0) continue;

      // Skip if profit too small (< 1% after potential fees)
      if (fmm.profitPct < 1.0) continue;

      // Skip markets closing too soon (< 30s — can't fill orders)
      if (fmm.minutesUntilClose < 0.5) continue;

      // Confidence scoring
      let confidence = 0;

      // Profit potential
      if (fmm.profitPct > 10) confidence += 35;
      else if (fmm.profitPct > 5) confidence += 25;
      else if (fmm.profitPct > 2) confidence += 15;
      else confidence += 5;

      // Liquidity
      if (fmm.market.liquidity > 15000) confidence += 25;
      else if (fmm.market.liquidity > 5000) confidence += 15;
      else confidence += 5;

      // Price symmetry (closer to 50/50 = more liquid on both sides)
      const priceSkew = Math.abs(fmm.upPrice - fmm.downPrice);
      if (priceSkew < 0.02) confidence += 15;
      else if (priceSkew < 0.05) confidence += 10;
      else if (priceSkew < 0.10) confidence += 5;

      // Timing bonus: 1-4 minutes before close is ideal
      if (fmm.minutesUntilClose >= 1 && fmm.minutesUntilClose <= 4) {
        confidence += 15;
      } else if (fmm.minutesUntilClose > 4) {
        confidence += 5;
      }

      confidence = Math.min(confidence, 100);

      opportunities.push({
        type: 'straddle',
        market: fmm.market,
        expectedProfitPct: fmm.profitPct,
        risk: fmm.profitPct > 5 ? 'medium' : 'low',
        confidence,
        details: {
          asset: fmm.asset,
          upPrice: fmm.upPrice.toFixed(4),
          downPrice: fmm.downPrice.toFixed(4),
          totalCost: fmm.totalCost.toFixed(4),
          profit: '$' + fmm.profit.toFixed(4),
          profitPct: fmm.profitPct.toFixed(2) + '%',
          minutesUntilClose: fmm.minutesUntilClose.toFixed(1) + 'min',
          liquidity: '$' + fmm.market.liquidity.toFixed(0),
        }
      });

      // Generate trade signals
      if (confidence >= 30) {
        const positionSize = Math.min(
          this.tradingConfig.max_position_size_usd,
          fmm.market.liquidity * 0.03  // Max 3% of liquidity
        );

        const upContracts = Math.floor(positionSize / 2 / fmm.upPrice);
        const downContracts = Math.floor(positionSize / 2 / fmm.downPrice);

        signals.push({
          strategy: 'straddle',
          market: fmm.market,
          action: 'BUY',
          side: 'YES',
          price: fmm.upPrice,
          size: upContracts,
          confidence,
          reason: `5m ${fmm.asset} Straddle: UP@${fmm.upPrice.toFixed(3)} + DOWN@${fmm.downPrice.toFixed(3)} = $${fmm.totalCost.toFixed(4)} | Profit: ${fmm.profitPct.toFixed(2)}% | ${fmm.minutesUntilClose.toFixed(1)}min`,
          timestamp: Date.now(),
        });

        signals.push({
          strategy: 'straddle',
          market: fmm.market,
          action: 'BUY',
          side: 'NO',
          price: fmm.downPrice,
          size: downContracts,
          confidence,
          reason: `5m ${fmm.asset} Straddle: UP@${fmm.upPrice.toFixed(3)} + DOWN@${fmm.downPrice.toFixed(3)} = $${fmm.totalCost.toFixed(4)} | Profit: ${fmm.profitPct.toFixed(2)}% | ${fmm.minutesUntilClose.toFixed(1)}min`,
          timestamp: Date.now(),
        });
      }
    }

    opportunities.sort((a, b) => b.confidence - a.confidence);
    signals.sort((a, b) => b.confidence - a.confidence);

    return {
      signals,
      opportunities,
      metadata: {
        totalFiveMinMarkets: fiveMinMarkets.length,
        profitableMarkets: opportunities.length,
        signalsGenerated: signals.length,
        assets: [...new Set(fiveMinMarkets.map(m => m.asset))],
      }
    };
  }
}
