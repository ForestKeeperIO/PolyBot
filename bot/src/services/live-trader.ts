/**
 * Live Trader - Polymarket CLOB API Integration
 *
 * Handles real trade execution via the @polymarket/clob-client SDK.
 * Requires:
 *   - POLY_PRIVATE_KEY: Your wallet private key
 *   - POLY_API_KEY: Polymarket API key
 *   - POLY_API_SECRET: Polymarket API secret
 *   - POLY_API_PASSPHRASE: Polymarket API passphrase
 *
 * Setup guide:
 *   1. npm install @polymarket/clob-client ethers@5
 *   2. Create .env with credentials
 *   3. Set TRADING_MODE=live
 */

import { TradeSignal } from '../types';

// Dynamic import to handle optional dependency
let ClobClient: any = null;

interface LiveTraderConfig {
  clobApi: string;
  chainId: number;
  privateKey: string;
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
  funderAddress?: string;
  signatureType?: number;  // 0=EOA, 1=proxy(browser), 2=proxy(mobile)
}

interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
  filledSize?: number;
  filledPrice?: number;
}

export class LiveTrader {
  private config: LiveTraderConfig;
  private client: any = null;
  private initialized = false;
  private totalTraded = 0;
  private dailyPnl = 0;
  private tradesExecuted = 0;

  constructor(config: LiveTraderConfig) {
    this.config = config;
  }

  async initialize(): Promise<boolean> {
    try {
      // Dynamic import — only fails if package isn't installed
      const module = await import('@polymarket/clob-client');
      ClobClient = module.ClobClient;

      this.client = new ClobClient(
        this.config.clobApi,
        this.config.chainId,
        this.config.privateKey,
        {
          key: this.config.apiKey,
          secret: this.config.apiSecret,
          passphrase: this.config.apiPassphrase,
        },
        this.config.signatureType ?? 0,
        this.config.funderAddress
      );

      // Test connection
      console.log('[LiveTrader] Testing connection...');
      const ok = await this.client.getOk();
      if (ok) {
        console.log('[LiveTrader] Connected to Polymarket CLOB');
        this.initialized = true;
        return true;
      }

      console.error('[LiveTrader] Connection test failed');
      return false;
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error('[LiveTrader] @polymarket/clob-client not installed.');
        console.error('  Run: npm install @polymarket/clob-client ethers@5');
      } else {
        console.error(`[LiveTrader] Init error: ${error.message}`);
      }
      return false;
    }
  }

  async executeTrade(signal: TradeSignal): Promise<OrderResult> {
    if (!this.initialized || !this.client) {
      return { success: false, error: 'LiveTrader not initialized' };
    }

    // Determine which token to buy
    const tokenId = signal.side === 'YES'
      ? signal.market.tokens?.[0]?.token_id
      : signal.market.tokens?.[1]?.token_id;

    if (!tokenId) {
      return { success: false, error: 'No token ID found for the signal' };
    }

    // Get market params (tickSize, negRisk)
    const tickSize = '0.01';  // Standard tick size for Polymarket
    const negRisk = true;     // 5-min markets are neg risk (multi-outcome)

    try {
      console.log(
        `[LiveTrader] Placing order: ${signal.action} ${signal.side} ` +
        `${signal.size} shares @ $${signal.price.toFixed(4)} ` +
        `| ${signal.market.question}`
      );

      // Create a GTC (Good-Til-Canceled) limit order
      const order = await this.client.createAndPostOrder({
        tokenID: tokenId,
        price: signal.price,
        size: signal.size,
        side: signal.action === 'BUY' ? 'BUY' : 'SELL',
        orderType: 'GTC',
        tickSize,
        negRisk,
      });

      this.tradesExecuted++;
      this.totalTraded += signal.price * signal.size;

      console.log(`[LiveTrader] Order placed: ${order.orderID || order.id || 'success'}`);

      return {
        success: true,
        orderId: order.orderID || order.id,
      };
    } catch (error: any) {
      console.error(`[LiveTrader] Order failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async getOpenOrders(): Promise<any[]> {
    if (!this.initialized || !this.client) return [];
    try {
      return await this.client.getOpenOrders();
    } catch { return []; }
  }

  async cancelAllOrders(): Promise<boolean> {
    if (!this.initialized || !this.client) return false;
    try {
      await this.client.cancelAll();
      console.log('[LiveTrader] All orders cancelled');
      return true;
    } catch (error: any) {
      console.error(`[LiveTrader] Cancel error: ${error.message}`);
      return false;
    }
  }

  printStatus(): void {
    console.log('\n[LiveTrader] Status:');
    console.log(`  Trades executed: ${this.tradesExecuted}`);
    console.log(`  Total traded: $${this.totalTraded.toFixed(2)}`);
    console.log(`  Initialized: ${this.initialized}`);
  }
}

/**
 * Create a LiveTrader from environment variables.
 */
export function createLiveTraderFromEnv(clobApi: string, chainId: number): LiveTrader | null {
  const privateKey = process.env.POLY_PRIVATE_KEY;
  const apiKey = process.env.POLY_API_KEY;
  const apiSecret = process.env.POLY_API_SECRET;
  const apiPassphrase = process.env.POLY_API_PASSPHRASE;
  const funderAddress = process.env.POLY_FUNDER_ADDRESS;
  const sigType = parseInt(process.env.POLY_SIGNATURE_TYPE || '0');

  if (!privateKey || !apiKey || !apiSecret || !apiPassphrase) {
    console.error('[LiveTrader] Missing env vars. Required:');
    console.error('  POLY_PRIVATE_KEY, POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE');
    console.error('  Optional: POLY_FUNDER_ADDRESS, POLY_SIGNATURE_TYPE');
    return null;
  }

  return new LiveTrader({
    clobApi,
    chainId,
    privateKey,
    apiKey,
    apiSecret,
    apiPassphrase,
    funderAddress,
    signatureType: sigType,
  });
}
