/**
 * PolyBot - Multi-Strategy Polymarket Trading Bot
 *
 * Strategies:
 *   - Straddle: Buy both YES/NO on short-term BTC markets
 *   - Arbitrage: Exploit YES+NO < $1.00 mispricings
 *   - Market Making: Provide liquidity and earn spread
 *   - Auto: Evaluates all strategies and picks the best one
 *
 * Modes:
 *   - Paper: Simulated trading (default)
 *   - Live: Real trading (requires wallet + API keys)
 *
 * Usage:
 *   npx ts-node src/index.ts              # Single scan (paper mode)
 *   npx ts-node src/index.ts --loop       # Continuous scanning
 *   npx ts-node src/index.ts --mode paper # Paper trading
 *   npx ts-node src/index.ts --scan       # Scan-only (no trades)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, StrategyName, StrategyResult, TradeSignal } from './types';
import { PolymarketAPIClient } from './services/api-client';
import { StraddleStrategy } from './strategies/straddle';
import { ArbitrageStrategy } from './strategies/arbitrage';
import { MarketMakingStrategy } from './strategies/market-making';
import { DirectionalStrategy } from './strategies/directional';
import { RiskManager } from './utils/risk-manager';
import { PaperTrader } from './utils/paper-trader';
import { PriceFeedAggregator } from './services/price-feeds';
import { LiveTrader, createLiveTraderFromEnv } from './services/live-trader';

class PolyBot {
  private config: Config;
  private api: PolymarketAPIClient;
  private feeds: PriceFeedAggregator;
  private straddle: StraddleStrategy;
  private directional: DirectionalStrategy;
  private arbitrage: ArbitrageStrategy;
  private marketMaking: MarketMakingStrategy;
  private risk: RiskManager;
  private paper: PaperTrader;
  private live: LiveTrader | null = null;
  private running = false;
  private scanCount = 0;

  constructor(configPath: string) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(raw) as Config;

    // Override mode from env
    const envMode = process.env.TRADING_MODE;
    if (envMode === 'live' || envMode === 'paper') {
      this.config.trading.mode = envMode;
    }

    this.api = new PolymarketAPIClient(this.config);
    this.feeds = new PriceFeedAggregator();
    this.straddle = new StraddleStrategy(this.api, this.config);
    this.directional = new DirectionalStrategy(this.config);
    this.arbitrage = new ArbitrageStrategy(this.api, this.config);
    this.marketMaking = new MarketMakingStrategy(this.api, this.config);
    this.risk = new RiskManager(this.config);
    this.paper = new PaperTrader(1000); // Start with $1000 paper balance

    // Initialize live trader if in live mode
    if (this.config.trading.mode === 'live') {
      this.live = createLiveTraderFromEnv(
        this.config.polymarket.clob_api,
        this.config.polymarket.chain_id
      );
    }

    console.log(this.banner());
    console.log(`Mode: ${this.config.trading.mode.toUpperCase()}`);
    console.log(`Strategies: ${this.config.trading.strategies_enabled.join(', ')}`);
    console.log(`Default: ${this.config.trading.default_strategy}`);
    console.log(`Max position: $${this.config.trading.max_position_size_usd}`);
    console.log(`Max daily loss: $${this.config.trading.max_daily_loss_usd}`);
    console.log('');
  }

  private banner(): string {
    return `
╔══════════════════════════════════════════╗
║   PolyBot - Multi-Strategy Trader        ║
║   Polymarket Trading Bot v1.0            ║
╚══════════════════════════════════════════╝
`;
  }

  /**
   * Run a single evaluation cycle across all strategies.
   */
  async scan(): Promise<{
    straddle: StrategyResult;
    arbitrage: StrategyResult;
    marketMaking: StrategyResult;
    bestStrategy: StrategyName;
    allSignals: TradeSignal[];
  }> {
    this.scanCount++;
    const timestamp = new Date().toISOString();
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`[Scan #${this.scanCount}] ${timestamp}`);
    console.log(`${'═'.repeat(60)}`);

    // Fetch multi-source price data for validation
    console.log('\n[PriceFeeds] Fetching BTC price from 4 exchanges...');
    const btcPrice = await this.feeds.getAggregatedBTCPrice();
    console.log(`[PriceFeeds] BTC: $${btcPrice.median.toFixed(2)} | Sources: ${btcPrice.sources.length}/4 | Confidence: ${btcPrice.confidence}% | Spread: ${btcPrice.spread.toFixed(4)}%`);
    for (const src of btcPrice.sources) {
      console.log(`  ${src.source}: $${src.price.toFixed(2)} | 24h: ${src.change24hPct?.toFixed(2) || 'N/A'}%`);
    }
    if (btcPrice.volatility5m !== undefined) {
      console.log(`[PriceFeeds] Volatility 5m: ${btcPrice.volatility5m.toFixed(6)}% | Compressed: ${this.feeds.isVolatilityCompressed('BTC')}`);
    }

    // Evaluate all strategies in parallel
    const [directionalResult, straddleResult, arbResult, mmResult] = await Promise.all([
      this.directional.evaluate(),
      this.config.trading.strategies_enabled.includes('straddle')
        ? this.straddle.evaluate()
        : { signals: [], opportunities: [], metadata: {} },
      this.config.trading.strategies_enabled.includes('arbitrage')
        ? this.arbitrage.evaluate()
        : { signals: [], opportunities: [], metadata: {} },
      this.config.trading.strategies_enabled.includes('market_making')
        ? this.marketMaking.evaluate()
        : { signals: [], opportunities: [], metadata: {} },
    ]);

    // Determine best strategy
    const bestStrategy = this.evaluateBestStrategy(straddleResult, arbResult, mmResult);

    // Directional signals always have priority (they have real predictions)
    let allSignals: TradeSignal[] = [...directionalResult.signals];

    // Also include signals from the selected strategy
    let strategySignals: TradeSignal[] = [];
    if (this.config.trading.default_strategy === 'auto') {
      switch (bestStrategy) {
        case 'straddle': strategySignals = straddleResult.signals; break;
        case 'arbitrage': strategySignals = arbResult.signals; break;
        case 'market_making': strategySignals = mmResult.signals; break;
      }
    } else {
      switch (this.config.trading.default_strategy) {
        case 'straddle': strategySignals = straddleResult.signals; break;
        case 'arbitrage': strategySignals = arbResult.signals; break;
        case 'market_making': strategySignals = mmResult.signals; break;
      }
    }
    // Merge: directional first, then strategy signals
    allSignals = [...allSignals, ...strategySignals];

    // Sort by confidence
    allSignals.sort((a, b) => b.confidence - a.confidence);

    // Print summary
    this.printScanSummary(straddleResult, arbResult, mmResult, bestStrategy, allSignals, directionalResult);

    return {
      straddle: straddleResult,
      arbitrage: arbResult,
      marketMaking: mmResult,
      bestStrategy,
      allSignals,
    };
  }

  /**
   * Execute top signals through risk manager and paper/live trader.
   */
  async execute(signals: TradeSignal[]): Promise<void> {
    if (signals.length === 0) {
      console.log('[Execute] No signals to execute.');
      return;
    }

    console.log(`\n[Execute] Processing ${signals.length} signals...`);

    for (const signal of signals) {
      // Risk check
      const riskCheck = this.risk.canTrade(signal);
      if (!riskCheck.allowed) {
        console.log(`[Execute] BLOCKED: ${riskCheck.reason}`);
        continue;
      }

      if (this.config.trading.mode === 'paper') {
        const result = this.paper.executeTrade(signal);
        this.risk.recordTrade(result);
      } else if (this.config.trading.mode === 'live' && this.live) {
        // Initialize live trader on first trade
        if (!(this.live as any).initialized) {
          const ok = await this.live.initialize();
          if (!ok) {
            console.error('[Execute] Failed to initialize live trader. Falling back to paper.');
            const result = this.paper.executeTrade(signal);
            this.risk.recordTrade(result);
            continue;
          }
        }
        const orderResult = await this.live.executeTrade(signal);
        if (orderResult.success) {
          console.log(`[Execute] LIVE ORDER: ${orderResult.orderId}`);
        } else {
          console.error(`[Execute] LIVE ORDER FAILED: ${orderResult.error}`);
        }
      } else {
        console.log(`[Execute] LIVE mode but no credentials. Set env vars.`);
        console.log('  -> Copy .env.example to .env and fill in your Polymarket API keys');
      }
    }

    // Print status after execution
    if (this.config.trading.mode === 'paper') {
      this.paper.printStatus();
    }
  }

  /**
   * Run continuous scanning and trading loop.
   */
  async loop(intervalMs: number = 300000): Promise<void> {
    this.running = true;

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[PolyBot] Shutting down...');
      this.running = false;
    });

    console.log(`[PolyBot] Starting continuous mode (interval: ${intervalMs / 1000}s)`);

    while (this.running) {
      try {
        const result = await this.scan();
        await this.execute(result.allSignals);
      } catch (error: any) {
        console.error(`[PolyBot] Error: ${error.message}`);
      }

      if (this.running) {
        console.log(`[PolyBot] Next scan in ${intervalMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    // Final report
    console.log('\n[PolyBot] Final Report:');
    this.paper.printStatus();
  }

  private evaluateBestStrategy(
    straddle: StrategyResult,
    arbitrage: StrategyResult,
    marketMaking: StrategyResult
  ): StrategyName {
    // Score each strategy based on opportunity quality
    const scores: Record<string, number> = {
      straddle: 0,
      arbitrage: 0,
      market_making: 0,
    };

    // Arbitrage: prioritize if high-spread opportunities exist (risk-free profit)
    for (const opp of arbitrage.opportunities) {
      scores.arbitrage += opp.confidence * (opp.risk === 'low' ? 2 : 1);
    }

    // Straddle: high profit potential but higher risk
    for (const opp of straddle.opportunities) {
      scores.straddle += opp.confidence * (opp.expectedProfitPct > 100 ? 1.5 : 1);
    }

    // Market making: steady income
    for (const opp of marketMaking.opportunities) {
      scores.market_making += opp.confidence * 0.8;
    }

    // Find best
    const best = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
    return best[0] as StrategyName;
  }

  private printScanSummary(
    straddle: StrategyResult,
    arbitrage: StrategyResult,
    marketMaking: StrategyResult,
    bestStrategy: StrategyName,
    signals: TradeSignal[],
    directional?: StrategyResult
  ): void {
    console.log('\n' + '─'.repeat(50));
    console.log('SCAN RESULTS:');
    if (directional) {
      console.log(`  Directional:   ${directional.opportunities.length} predictions, ${directional.signals.length} signals`);
    }
    console.log(`  Straddle:      ${straddle.opportunities.length} opportunities, ${straddle.signals.length} signals`);
    console.log(`  Arbitrage:     ${arbitrage.opportunities.length} opportunities, ${arbitrage.signals.length} signals`);
    console.log(`  Market Making: ${marketMaking.opportunities.length} opportunities, ${marketMaking.signals.length} signals`);
    console.log(`  Best strategy: ${bestStrategy.toUpperCase()}`);
    console.log(`  Total signals: ${signals.length}`);

    if (signals.length > 0) {
      console.log('\n  Top signals:');
      for (const sig of signals.slice(0, 5)) {
        console.log(`    ${sig.strategy} | ${sig.action} ${sig.side} | $${sig.price.toFixed(4)} x ${sig.size} | Confidence: ${sig.confidence}%`);
        console.log(`      ${sig.reason}`);
      }
    }

    // Risk status
    const riskStatus = this.risk.getStatus();
    console.log(`\n  Risk Status: PnL=$${riskStatus.dailyPnl.toFixed(2)} | Positions=${riskStatus.openPositions} | Drawdown=${riskStatus.drawdownPct.toFixed(1)}%`);
    console.log('─'.repeat(50));
  }
}

// ── CLI Entry Point ──────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Support --config flag for custom config path
  const configIdx = args.indexOf('--config');
  const configPath = configIdx >= 0
    ? path.resolve(args[configIdx + 1])
    : path.resolve(__dirname, '../../config/settings.json');

  if (!fs.existsSync(configPath)) {
    console.error(`Config not found: ${configPath}`);
    process.exit(1);
  }

  // Load .env if present
  try {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
  } catch {}

  const bot = new PolyBot(configPath);

  const isLoop = args.includes('--loop');
  const isScanOnly = args.includes('--scan');
  const intervalIdx = args.indexOf('--interval');
  const interval = intervalIdx >= 0 ? parseInt(args[intervalIdx + 1]) * 1000 : 300000;

  if (isLoop) {
    await bot.loop(interval);
  } else {
    const result = await bot.scan();
    if (!isScanOnly) {
      await bot.execute(result.allSignals);
    }
  }
}

main().catch(console.error);
