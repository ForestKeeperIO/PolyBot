// ── Core Types ────────────────────────────────────────────

export interface Config {
  polymarket: {
    clob_api: string;
    gamma_api: string;
    data_api: string;
    ws_url: string;
    chain_id: number;
  };
  trading: {
    mode: 'paper' | 'live';
    max_position_size_usd: number;
    max_daily_loss_usd: number;
    max_open_positions: number;
    default_strategy: StrategyName;
    strategies_enabled: StrategyName[];
    strategy_evaluation_interval_minutes: number;
  };
  straddle: StraddleConfig;
  arbitrage: ArbitrageConfig;
  market_making: MarketMakingConfig;
  risk: RiskConfig;
}

export type StrategyName = 'straddle' | 'arbitrage' | 'market_making' | 'auto';

export interface StraddleConfig {
  target_markets: string[];
  market_durations: string[];
  max_entry_price: number;
  min_entry_price: number;
  volatility_threshold: number;
  volatility_lookback_seconds: number;
  exit_profit_target: number;
  exit_stop_loss: number;
}

export interface ArbitrageConfig {
  min_spread_pct: number;
  max_execution_delay_ms: number;
  min_profit_usd: number;
}

export interface MarketMakingConfig {
  spread_bps: number;
  order_size_usd: number;
  max_inventory_imbalance: number;
  refresh_interval_ms: number;
}

export interface RiskConfig {
  max_drawdown_pct: number;
  position_size_pct: number;
  kelly_fraction: number;
  cooldown_after_loss_minutes: number;
}

// ── Market Data Types ────────────────────────────────────

export interface Market {
  conditionId: string;
  question: string;
  slug: string;
  outcomes: string[];
  outcomePrices: number[];
  volume: number;
  liquidity: number;
  endDate?: string;
  category: string;
  active: boolean;
  tokens: TokenInfo[];
}

export interface TokenInfo {
  token_id: string;
  outcome: string;
  price: number;
}

export interface OrderBook {
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}

export interface OrderLevel {
  price: number;
  size: number;
}

// ── Trading Types ────────────────────────────────────────

export interface TradeSignal {
  strategy: StrategyName;
  market: Market;
  action: 'BUY' | 'SELL';
  side: 'YES' | 'NO';
  price: number;
  size: number;
  confidence: number;
  reason: string;
  timestamp: number;
}

export interface Position {
  id: string;
  market: Market;
  side: 'YES' | 'NO';
  entryPrice: number;
  size: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  openedAt: number;
  strategy: StrategyName;
}

export interface TradeResult {
  success: boolean;
  signal: TradeSignal;
  executionPrice?: number;
  txHash?: string;
  error?: string;
  timestamp: number;
  paper: boolean;
}

// ── Strategy Types ───────────────────────────────────────

export interface StrategyResult {
  signals: TradeSignal[];
  opportunities: Opportunity[];
  metadata: Record<string, any>;
}

export interface Opportunity {
  type: StrategyName;
  market: Market;
  expectedProfitPct: number;
  risk: 'low' | 'medium' | 'high';
  confidence: number;
  details: Record<string, any>;
}

// ── Performance Types ────────────────────────────────────

export interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgPnlPerTrade: number;
  maxDrawdown: number;
  sharpeRatio: number;
  byStrategy: Record<StrategyName, {
    trades: number;
    winRate: number;
    totalPnl: number;
  }>;
  dailyPnl: { date: string; pnl: number }[];
}
