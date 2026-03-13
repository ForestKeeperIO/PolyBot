/**
 * Paper Trader
 * Simulates trade execution without real money.
 * Tracks virtual positions, P&L, and performance metrics.
 */

import { TradeSignal, TradeResult, Position, PerformanceMetrics, StrategyName } from '../types';

function generateId(): string {
  return `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class PaperTrader {
  private balance: number;
  private initialBalance: number;
  private positions: Map<string, Position> = new Map();
  private tradeHistory: TradeResult[] = [];
  private dailyPnl: Map<string, number> = new Map();

  constructor(initialBalance: number = 1000) {
    this.balance = initialBalance;
    this.initialBalance = initialBalance;
  }

  /**
   * Simulate executing a trade.
   */
  executeTrade(signal: TradeSignal): TradeResult {
    const tradeValue = signal.price * signal.size;

    // Check if we have enough balance
    if (signal.action === 'BUY' && tradeValue > this.balance) {
      return {
        success: false,
        signal,
        error: `Insufficient balance: $${this.balance.toFixed(2)} < $${tradeValue.toFixed(2)}`,
        timestamp: Date.now(),
        paper: true,
      };
    }

    // Simulate slippage (0.1-0.5%)
    const slippage = signal.action === 'BUY' ? 1.002 : 0.998;
    const executionPrice = signal.price * slippage;

    if (signal.action === 'BUY') {
      // Open position
      const positionId = generateId();
      const position: Position = {
        id: positionId,
        market: signal.market,
        side: signal.side as 'YES' | 'NO',
        entryPrice: executionPrice,
        size: signal.size,
        currentPrice: executionPrice,
        pnl: 0,
        pnlPct: 0,
        openedAt: Date.now(),
        strategy: signal.strategy,
      };

      this.positions.set(positionId, position);
      this.balance -= executionPrice * signal.size;

      console.log(
        `[Paper] BUY ${signal.side} | ${signal.market.question.substring(0, 40)}... | ` +
        `${signal.size} @ $${executionPrice.toFixed(4)} | Balance: $${this.balance.toFixed(2)}`
      );
    } else {
      // Close matching position
      const matchingPosition = this.findMatchingPosition(signal);
      if (matchingPosition) {
        const pnl = (executionPrice - matchingPosition.entryPrice) * matchingPosition.size;
        this.balance += executionPrice * matchingPosition.size;
        this.updateDailyPnl(pnl);
        this.positions.delete(matchingPosition.id);

        console.log(
          `[Paper] SELL ${signal.side} | PnL: $${pnl.toFixed(4)} | Balance: $${this.balance.toFixed(2)}`
        );
      }
    }

    const result: TradeResult = {
      success: true,
      signal,
      executionPrice,
      timestamp: Date.now(),
      paper: true,
    };

    this.tradeHistory.push(result);
    return result;
  }

  /**
   * Simulate market resolution (for paper testing).
   */
  resolvePosition(positionId: string, resolvedPrice: number): TradeResult | null {
    const position = this.positions.get(positionId);
    if (!position) return null;

    const pnl = (resolvedPrice - position.entryPrice) * position.size;
    this.balance += resolvedPrice * position.size;
    this.updateDailyPnl(pnl);
    this.positions.delete(positionId);

    console.log(
      `[Paper] RESOLVED | ${position.side} | Entry: $${position.entryPrice.toFixed(4)} | ` +
      `Resolved: $${resolvedPrice.toFixed(4)} | PnL: $${pnl.toFixed(4)}`
    );

    return {
      success: true,
      signal: {
        strategy: position.strategy,
        market: position.market,
        action: 'SELL',
        side: position.side,
        price: resolvedPrice,
        size: position.size,
        confidence: 100,
        reason: `Market resolved at $${resolvedPrice.toFixed(4)}`,
        timestamp: Date.now(),
      },
      executionPrice: resolvedPrice,
      timestamp: Date.now(),
      paper: true,
    };
  }

  /**
   * Get comprehensive performance metrics.
   */
  getMetrics(): PerformanceMetrics {
    const trades = this.tradeHistory;
    const buyTrades = trades.filter(t => t.signal.action === 'BUY' && t.success);

    // Calculate win rate based on closed positions
    const closedTrades = trades.filter(t => t.signal.action === 'SELL' && t.success);
    const wins = closedTrades.filter(t => {
      const entry = t.signal.price;
      const exit = t.executionPrice || 0;
      return exit > entry;
    });

    const winRate = closedTrades.length > 0 ? wins.length / closedTrades.length : 0;
    const totalPnl = this.balance - this.initialBalance;

    // Per-strategy breakdown
    const byStrategy: Record<StrategyName, { trades: number; winRate: number; totalPnl: number }> = {
      straddle: { trades: 0, winRate: 0, totalPnl: 0 },
      arbitrage: { trades: 0, winRate: 0, totalPnl: 0 },
      market_making: { trades: 0, winRate: 0, totalPnl: 0 },
      auto: { trades: 0, winRate: 0, totalPnl: 0 },
    };

    for (const trade of trades) {
      const strat = trade.signal.strategy;
      if (strat in byStrategy) {
        byStrategy[strat].trades++;
      }
    }

    // Daily P&L array
    const dailyPnlArray = Array.from(this.dailyPnl.entries()).map(([date, pnl]) => ({
      date,
      pnl,
    }));

    // Max drawdown
    let maxDrawdown = 0;
    let peak = this.initialBalance;
    let running = this.initialBalance;
    for (const trade of closedTrades) {
      const pnl = (trade.executionPrice || 0 - trade.signal.price) * trade.signal.size;
      running += pnl;
      if (running > peak) peak = running;
      const dd = (peak - running) / peak;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return {
      totalTrades: trades.length,
      winRate,
      totalPnl,
      avgPnlPerTrade: trades.length > 0 ? totalPnl / trades.length : 0,
      maxDrawdown: maxDrawdown * 100,
      sharpeRatio: 0, // Would need returns series for proper calculation
      byStrategy,
      dailyPnl: dailyPnlArray,
    };
  }

  getBalance(): number {
    return this.balance;
  }

  getOpenPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  printStatus(): void {
    const metrics = this.getMetrics();
    const positions = this.getOpenPositions();

    console.log('\n' + '═'.repeat(50));
    console.log('PAPER TRADING STATUS');
    console.log('═'.repeat(50));
    console.log(`Balance:       $${this.balance.toFixed(2)} (started: $${this.initialBalance.toFixed(2)})`);
    console.log(`Total PnL:     $${metrics.totalPnl.toFixed(2)} (${((metrics.totalPnl / this.initialBalance) * 100).toFixed(1)}%)`);
    console.log(`Total Trades:  ${metrics.totalTrades}`);
    console.log(`Win Rate:      ${(metrics.winRate * 100).toFixed(1)}%`);
    console.log(`Max Drawdown:  ${metrics.maxDrawdown.toFixed(1)}%`);
    console.log(`Open Positions: ${positions.length}`);

    if (positions.length > 0) {
      console.log('\nOpen Positions:');
      for (const pos of positions) {
        console.log(`  ${pos.strategy} | ${pos.side} | ${pos.market.question.substring(0, 35)}... | Entry: $${pos.entryPrice.toFixed(4)}`);
      }
    }
    console.log('═'.repeat(50) + '\n');
  }

  private findMatchingPosition(signal: TradeSignal): Position | undefined {
    return Array.from(this.positions.values()).find(
      p => p.market.conditionId === signal.market.conditionId && p.side === signal.side
    );
  }

  private updateDailyPnl(pnl: number): void {
    const today = new Date().toISOString().split('T')[0];
    const current = this.dailyPnl.get(today) || 0;
    this.dailyPnl.set(today, current + pnl);
  }
}
