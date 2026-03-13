/**
 * Arbitrage Strategy
 *
 * Exploits pricing inefficiencies where YES + NO prices don't sum to $1.00.
 * When sum < 1.0: buy both sides, guaranteed profit when market resolves.
 *
 * This is the lowest-risk strategy available on Polymarket.
 *
 * Entry conditions:
 * - YES + NO < 1.0 (spread exists)
 * - Spread exceeds minimum threshold (after fees)
 * - Sufficient liquidity on both sides
 *
 * Exit: Market resolves naturally (one side = $1, other = $0)
 * Net profit = $1.00 - (YES_price + NO_price)
 */

import { PolymarketAPIClient } from '../services/api-client';
import {
  Config, Market, TradeSignal, StrategyResult,
  Opportunity, ArbitrageConfig
} from '../types';

export class ArbitrageStrategy {
  private api: PolymarketAPIClient;
  private config: ArbitrageConfig;
  private tradingConfig: Config['trading'];

  constructor(api: PolymarketAPIClient, config: Config) {
    this.api = api;
    this.config = config.arbitrage;
    this.tradingConfig = config.trading;
  }

  async evaluate(): Promise<StrategyResult> {
    const signals: TradeSignal[] = [];
    const opportunities: Opportunity[] = [];

    // Scan all active markets
    const markets = await this.api.getMarkets({ limit: 200, active: true });
    console.log(`[Arbitrage] Scanning ${markets.length} markets...`);

    for (const market of markets) {
      if (market.outcomePrices.length !== 2) continue;

      const yesPrice = market.outcomePrices[0];
      const noPrice = market.outcomePrices[1];
      const total = yesPrice + noPrice;

      // Skip markets with zero prices (resolved/inactive)
      if (yesPrice <= 0.001 && noPrice <= 0.001) continue;
      if (total <= 0.01) continue;

      // Skip markets with extremely low liquidity
      if (market.liquidity < 100) continue;

      // Only interested if total < 1.0 (arbitrage exists)
      if (total >= 1.0) continue;

      const spread = 1.0 - total;
      const spreadPct = (spread / total) * 100;

      // Check minimum spread threshold
      if (spreadPct < this.config.min_spread_pct) continue;

      // Check minimum profit in USD terms
      const profitPerContract = spread;
      const contractsAtMax = Math.floor(this.tradingConfig.max_position_size_usd / total);
      const potentialProfit = profitPerContract * contractsAtMax;

      if (potentialProfit < this.config.min_profit_usd) continue;

      // Check liquidity - need enough on both sides
      const hasLiquidity = market.liquidity > (total * contractsAtMax * 2);

      // Calculate confidence
      let confidence = 0;
      if (spreadPct > 2.0) confidence += 30;
      else if (spreadPct > 1.0) confidence += 20;
      else confidence += 10;

      if (hasLiquidity) confidence += 30;
      else confidence += 10;

      if (market.volume > 10000) confidence += 20;
      else if (market.volume > 1000) confidence += 10;

      // Time to resolution (prefer markets resolving soon)
      if (market.endDate) {
        const hoursToEnd = (new Date(market.endDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursToEnd < 24) confidence += 20;
        else if (hoursToEnd < 72) confidence += 10;
      }

      opportunities.push({
        type: 'arbitrage',
        market,
        expectedProfitPct: spreadPct,
        risk: spreadPct > 2 ? 'low' : 'medium',
        confidence: Math.min(confidence, 100),
        details: {
          yesPrice,
          noPrice,
          total,
          spread,
          spreadPct: spreadPct.toFixed(2),
          profitPerContract: profitPerContract.toFixed(4),
          contractsAtMax,
          potentialProfit: potentialProfit.toFixed(2),
          hasLiquidity,
        }
      });

      // Generate signals if confidence is sufficient
      if (confidence >= 50) {
        const size = Math.min(contractsAtMax, 50); // Conservative sizing

        signals.push({
          strategy: 'arbitrage',
          market,
          action: 'BUY',
          side: 'YES',
          price: yesPrice,
          size,
          confidence,
          reason: `Arb: YES@${yesPrice.toFixed(3)} + NO@${noPrice.toFixed(3)} = ${total.toFixed(3)} | Spread: ${spreadPct.toFixed(2)}%`,
          timestamp: Date.now(),
        });

        signals.push({
          strategy: 'arbitrage',
          market,
          action: 'BUY',
          side: 'NO',
          price: noPrice,
          size,
          confidence,
          reason: `Arb: YES@${yesPrice.toFixed(3)} + NO@${noPrice.toFixed(3)} = ${total.toFixed(3)} | Spread: ${spreadPct.toFixed(2)}%`,
          timestamp: Date.now(),
        });
      }
    }

    // Sort by spread (best first)
    opportunities.sort((a, b) => b.expectedProfitPct - a.expectedProfitPct);

    return {
      signals,
      opportunities,
      metadata: {
        marketsScanned: markets.length,
        opportunitiesFound: opportunities.length,
        signalsGenerated: signals.length,
        bestSpread: opportunities[0]?.expectedProfitPct.toFixed(2) || '0',
      }
    };
  }
}
