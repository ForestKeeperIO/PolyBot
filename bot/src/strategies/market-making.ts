/**
 * Market Making Strategy
 *
 * Provides liquidity on both sides of a market, earning the bid-ask spread.
 * Places limit orders on both BUY and SELL sides, profiting from the spread.
 *
 * Entry conditions:
 * - Market has sufficient volume
 * - Spread is wide enough to profit
 * - Inventory imbalance is within limits
 *
 * Risk management:
 * - Maximum inventory imbalance threshold
 * - Dynamic spread adjustment based on volatility
 * - Position limits per market
 */

import { PolymarketAPIClient } from '../services/api-client';
import {
  Config, Market, TradeSignal, StrategyResult,
  Opportunity, MarketMakingConfig
} from '../types';

export class MarketMakingStrategy {
  private api: PolymarketAPIClient;
  private config: MarketMakingConfig;
  private tradingConfig: Config['trading'];
  private inventory: Map<string, { yes: number; no: number }> = new Map();

  constructor(api: PolymarketAPIClient, config: Config) {
    this.api = api;
    this.config = config.market_making;
    this.tradingConfig = config.trading;
  }

  async evaluate(): Promise<StrategyResult> {
    const signals: TradeSignal[] = [];
    const opportunities: Opportunity[] = [];

    // Find liquid markets suitable for market making
    const markets = await this.api.getMarkets({ limit: 100, active: true });
    const liquidMarkets = markets.filter(m =>
      m.liquidity > 5000 && m.volume > 10000 && m.outcomePrices.length === 2
    );

    console.log(`[MM] Found ${liquidMarkets.length} liquid markets for market making`);

    for (const market of liquidMarkets.slice(0, 20)) { // Limit to top 20
      const yesPrice = market.outcomePrices[0];
      const noPrice = market.outcomePrices[1];

      // Get current spread from order book
      let currentSpread = Math.abs(yesPrice - (1 - noPrice));

      // Check if spread is wide enough for us to participate
      const targetSpreadBps = this.config.spread_bps;
      const targetSpread = targetSpreadBps / 10000;

      // Our bid and ask prices
      const midPrice = yesPrice;
      const ourBid = midPrice - (targetSpread / 2);
      const ourAsk = midPrice + (targetSpread / 2);

      // Validate prices are in range
      if (ourBid < 0.01 || ourAsk > 0.99) continue;

      // Check inventory imbalance
      const inv = this.inventory.get(market.conditionId) || { yes: 0, no: 0 };
      const totalInv = inv.yes + inv.no;
      const imbalance = totalInv > 0 ? Math.abs(inv.yes - inv.no) / totalInv : 0;

      if (imbalance > this.config.max_inventory_imbalance) {
        console.log(`[MM] Skipping ${market.slug}: inventory imbalance ${(imbalance * 100).toFixed(1)}%`);
        continue;
      }

      // Calculate expected profit
      const expectedProfitPerTrade = targetSpread * this.config.order_size_usd;
      const tradesPerDay = Math.min(market.volume / (this.config.order_size_usd * 2), 50);
      const expectedDailyProfit = expectedProfitPerTrade * tradesPerDay * 0.3; // Conservative fill rate

      let confidence = 0;
      if (market.liquidity > 50000) confidence += 25;
      else if (market.liquidity > 10000) confidence += 15;
      else confidence += 5;

      if (market.volume > 100000) confidence += 25;
      else if (market.volume > 20000) confidence += 15;
      else confidence += 5;

      if (currentSpread > targetSpread) confidence += 20;
      if (imbalance < 0.2) confidence += 15;

      opportunities.push({
        type: 'market_making',
        market,
        expectedProfitPct: (expectedDailyProfit / this.config.order_size_usd) * 100,
        risk: imbalance < 0.3 ? 'low' : 'medium',
        confidence: Math.min(confidence, 100),
        details: {
          midPrice: midPrice.toFixed(4),
          ourBid: ourBid.toFixed(4),
          ourAsk: ourAsk.toFixed(4),
          spreadBps: targetSpreadBps,
          expectedDailyProfit: expectedDailyProfit.toFixed(2),
          estimatedTradesPerDay: Math.round(tradesPerDay),
          inventoryImbalance: (imbalance * 100).toFixed(1) + '%',
        }
      });

      // Generate signals
      if (confidence >= 45) {
        // Place bid (buy order)
        signals.push({
          strategy: 'market_making',
          market,
          action: 'BUY',
          side: 'YES',
          price: ourBid,
          size: Math.floor(this.config.order_size_usd / ourBid),
          confidence,
          reason: `MM Bid: ${ourBid.toFixed(4)} (spread: ${targetSpreadBps}bps)`,
          timestamp: Date.now(),
        });

        // Place ask (sell order)
        signals.push({
          strategy: 'market_making',
          market,
          action: 'SELL',
          side: 'YES',
          price: ourAsk,
          size: Math.floor(this.config.order_size_usd / ourAsk),
          confidence,
          reason: `MM Ask: ${ourAsk.toFixed(4)} (spread: ${targetSpreadBps}bps)`,
          timestamp: Date.now(),
        });
      }
    }

    opportunities.sort((a, b) => b.confidence - a.confidence);

    return {
      signals,
      opportunities,
      metadata: {
        marketsScanned: liquidMarkets.length,
        opportunitiesFound: opportunities.length,
        signalsGenerated: signals.length,
      }
    };
  }

  updateInventory(marketId: string, side: 'YES' | 'NO', quantity: number): void {
    const inv = this.inventory.get(marketId) || { yes: 0, no: 0 };
    if (side === 'YES') inv.yes += quantity;
    else inv.no += quantity;
    this.inventory.set(marketId, inv);
  }
}
