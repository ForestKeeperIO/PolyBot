/**
 * Risk Manager
 * Enforces trading limits, position sizing, and loss prevention.
 */

import { Config, TradeSignal, TradeResult, Position, RiskConfig } from '../types';

export class RiskManager {
  private config: RiskConfig;
  private tradingConfig: Config['trading'];
  private dailyPnl = 0;
  private dailyPnlReset: number = Date.now();
  private openPositions: Position[] = [];
  private recentResults: TradeResult[] = [];
  private cooldownUntil = 0;
  private peakBalance = 0;
  private currentBalance = 0;

  constructor(config: Config) {
    this.config = config.risk;
    this.tradingConfig = config.trading;
    this.currentBalance = config.trading.max_position_size_usd * 20; // Assume starting balance
    this.peakBalance = this.currentBalance;
  }

  /**
   * Check if a trade signal passes all risk checks.
   */
  canTrade(signal: TradeSignal): { allowed: boolean; reason: string } {
    // Reset daily PnL at midnight
    this.checkDailyReset();

    // Check 1: Cooldown after loss
    if (Date.now() < this.cooldownUntil) {
      const remaining = Math.ceil((this.cooldownUntil - Date.now()) / 60000);
      return { allowed: false, reason: `Cooldown active (${remaining}m remaining)` };
    }

    // Check 2: Daily loss limit
    if (this.dailyPnl <= -this.tradingConfig.max_daily_loss_usd) {
      return { allowed: false, reason: `Daily loss limit reached ($${this.dailyPnl.toFixed(2)})` };
    }

    // Check 3: Max open positions
    if (this.openPositions.length >= this.tradingConfig.max_open_positions) {
      return { allowed: false, reason: `Max positions reached (${this.openPositions.length})` };
    }

    // Check 4: Position size limit
    const tradeValue = signal.price * signal.size;
    if (tradeValue > this.tradingConfig.max_position_size_usd) {
      return {
        allowed: false,
        reason: `Trade value $${tradeValue.toFixed(2)} exceeds max $${this.tradingConfig.max_position_size_usd}`
      };
    }

    // Check 5: Max drawdown
    const drawdown = ((this.peakBalance - this.currentBalance) / this.peakBalance) * 100;
    if (drawdown >= this.config.max_drawdown_pct) {
      return { allowed: false, reason: `Max drawdown reached (${drawdown.toFixed(1)}%)` };
    }

    // Check 6: Confidence threshold
    if (signal.confidence < 40) {
      return { allowed: false, reason: `Low confidence (${signal.confidence}%)` };
    }

    return { allowed: true, reason: 'All checks passed' };
  }

  /**
   * Calculate optimal position size using fractional Kelly criterion.
   */
  calculatePositionSize(winRate: number, avgWinPct: number, avgLossPct: number): number {
    if (winRate <= 0 || avgWinPct <= 0) return 0;

    // Kelly formula: f = (p * b - q) / b
    // where p = win probability, q = loss probability, b = win/loss ratio
    const p = winRate;
    const q = 1 - winRate;
    const b = avgWinPct / Math.abs(avgLossPct);

    const kellyFraction = (p * b - q) / b;

    // Apply fraction (typically 25% of Kelly for safety)
    const adjustedKelly = Math.max(0, kellyFraction * this.config.kelly_fraction);

    // Cap at position size percentage
    const maxPct = this.config.position_size_pct / 100;
    return Math.min(adjustedKelly, maxPct) * this.currentBalance;
  }

  /**
   * Record a trade result and update risk metrics.
   */
  recordTrade(result: TradeResult): void {
    this.recentResults.push(result);

    // Keep only last 100 results
    if (this.recentResults.length > 100) {
      this.recentResults = this.recentResults.slice(-100);
    }

    // Update PnL (simplified - in real system would track exact position P&L)
    if (result.success && result.executionPrice) {
      const pnl = (result.executionPrice - result.signal.price) * result.signal.size;
      this.dailyPnl += pnl;
      this.currentBalance += pnl;

      if (this.currentBalance > this.peakBalance) {
        this.peakBalance = this.currentBalance;
      }

      // Trigger cooldown on loss
      if (pnl < 0) {
        this.cooldownUntil = Date.now() + (this.config.cooldown_after_loss_minutes * 60000);
        console.log(`[Risk] Loss detected ($${pnl.toFixed(2)}). Cooldown for ${this.config.cooldown_after_loss_minutes}m`);
      }
    }
  }

  addPosition(position: Position): void {
    this.openPositions.push(position);
  }

  removePosition(positionId: string): void {
    this.openPositions = this.openPositions.filter(p => p.id !== positionId);
  }

  getStatus(): {
    dailyPnl: number;
    openPositions: number;
    drawdownPct: number;
    inCooldown: boolean;
    currentBalance: number;
  } {
    const drawdown = ((this.peakBalance - this.currentBalance) / this.peakBalance) * 100;
    return {
      dailyPnl: this.dailyPnl,
      openPositions: this.openPositions.length,
      drawdownPct: drawdown,
      inCooldown: Date.now() < this.cooldownUntil,
      currentBalance: this.currentBalance,
    };
  }

  private checkDailyReset(): void {
    const now = new Date();
    const resetTime = new Date(this.dailyPnlReset);
    if (now.getDate() !== resetTime.getDate()) {
      console.log(`[Risk] Daily PnL reset. Previous day: $${this.dailyPnl.toFixed(2)}`);
      this.dailyPnl = 0;
      this.dailyPnlReset = Date.now();
    }
  }
}
