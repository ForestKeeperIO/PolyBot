/**
 * Polymarket CLI Integration
 *
 * Uses the polymarket-cli (Rust binary) for market discovery and order management.
 * Install: curl -sSL https://raw.githubusercontent.com/Polymarket/polymarket-cli/main/install.sh | sh
 *
 * The CLI provides:
 *  - Market search and discovery (no wallet needed)
 *  - Order book data
 *  - Price queries
 *  - Order placement (with wallet configured)
 *  - Position management
 */

import { execSync } from 'child_process';

const CLI_PATH = process.env.POLYMARKET_CLI_PATH || 'polymarket';

interface CliMarket {
  id: string;
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  closed: boolean;
  endDate: string;
  liquidity: string;
  conditionId: string;
  description: string;
}

interface FiveMinMarket {
  asset: string;
  slug: string;
  question: string;
  endDate: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  conditionId: string;
  tokenIds: string[];
  windowTs: number;
}

interface OrderBookLevel {
  price: string;
  size: string;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bidDepth: number;
  askDepth: number;
  imbalance: number;
}

/**
 * Execute a polymarket CLI command and return parsed JSON output.
 */
function cliExec(args: string, timeoutMs = 10000): any {
  try {
    const result = execSync(`${CLI_PATH} ${args} -o json`, {
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(result.trim());
  } catch (error: any) {
    if (error.stderr) {
      console.error(`[PolymarketCLI] Error: ${error.stderr}`);
    }
    throw new Error(`CLI command failed: polymarket ${args}`);
  }
}

/**
 * Discover current 5-minute up/down markets for target assets.
 * Computes the current 5-min window timestamp and fetches by slug.
 */
export function discoverFiveMinMarkets(assets: string[] = ['btc', 'eth', 'sol', 'xrp']): FiveMinMarket[] {
  const now = Math.floor(Date.now() / 1000);
  const currentEnd = Math.ceil(now / 300) * 300;
  const markets: FiveMinMarket[] = [];

  for (const asset of assets) {
    const slug = `${asset}-updown-5m-${currentEnd}`;
    try {
      const data: CliMarket = cliExec(`markets get "${slug}"`);
      if (data && data.id && !data.closed) {
        const prices = JSON.parse(data.outcomePrices || '[]');
        markets.push({
          asset: asset.toUpperCase(),
          slug: data.slug,
          question: data.question,
          endDate: data.endDate,
          yesPrice: parseFloat(prices[0] || '0.5'),
          noPrice: parseFloat(prices[1] || '0.5'),
          volume: parseFloat(data.volume || '0'),
          liquidity: parseFloat(data.liquidity || '0'),
          conditionId: data.conditionId,
          tokenIds: [], // populated separately from CLOB
          windowTs: currentEnd,
        });
      }
    } catch (e) {
      // Market may not exist yet for this window
    }
  }

  return markets;
}

/**
 * Get order book for a token via CLI.
 */
export function getOrderBook(tokenId: string): OrderBook | null {
  try {
    const data = cliExec(`clob book ${tokenId}`);
    const bids: OrderBookLevel[] = data.bids || [];
    const asks: OrderBookLevel[] = data.asks || [];
    const bidDepth = bids.reduce((s: number, b: OrderBookLevel) => s + parseFloat(b.size), 0);
    const askDepth = asks.reduce((s: number, a: OrderBookLevel) => s + parseFloat(a.size), 0);
    const total = bidDepth + askDepth;
    return {
      bids,
      asks,
      bidDepth,
      askDepth,
      imbalance: total > 0 ? (bidDepth - askDepth) / total : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get current price for a token via CLI.
 */
export function getPrice(tokenId: string, side: 'buy' | 'sell' = 'buy'): number | null {
  try {
    const data = cliExec(`clob price ${tokenId} --side ${side}`);
    return parseFloat(data.price || '0');
  } catch {
    return null;
  }
}

/**
 * Place a limit order via CLI (requires wallet configuration).
 */
export function placeOrder(
  tokenId: string,
  side: 'buy' | 'sell',
  price: number,
  size: number
): { success: boolean; orderId?: string; error?: string } {
  try {
    const data = cliExec(
      `clob create-order --token ${tokenId} --side ${side} --price ${price} --size ${size}`
    );
    return { success: true, orderId: data.orderID || data.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Cancel all open orders via CLI.
 */
export function cancelAllOrders(): boolean {
  try {
    cliExec('clob cancel-all');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get wallet balances via CLI.
 */
export function getBalances(): { usdc: number; positions: any[] } | null {
  try {
    const data = cliExec('wallet balance');
    return data;
  } catch {
    return null;
  }
}

/**
 * Search markets by text query.
 */
export function searchMarkets(query: string, limit = 10): CliMarket[] {
  try {
    const data = cliExec(`markets search "${query}" --limit ${limit}`);
    return Array.isArray(data) ? data : [data];
  } catch {
    return [];
  }
}

/**
 * Configure CLI wallet (one-time setup).
 * The CLI stores wallet config in ~/.polymarket/
 */
export function configureWallet(privateKey: string): boolean {
  try {
    execSync(`echo "${privateKey}" | ${CLI_PATH} wallet import`, {
      timeout: 5000,
      encoding: 'utf-8',
    });
    return true;
  } catch {
    return false;
  }
}
