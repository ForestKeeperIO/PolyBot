/**
 * Polymarket API Client Service
 * Handles all HTTP and WebSocket communication with Polymarket APIs.
 */

import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { Config, Market, OrderBook, OrderLevel, TokenInfo } from '../types';

export class PolymarketAPIClient {
  private gamma: AxiosInstance;
  private clob: AxiosInstance;
  private data: AxiosInstance;
  private ws: WebSocket | null = null;
  private wsCallbacks: Map<string, ((data: any) => void)[]> = new Map();
  private config: Config;
  private lastRequestTime = 0;
  private rateLimitMs = 100;

  constructor(config: Config) {
    this.config = config;

    const commonHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'PolyBot-Trader/1.0',
    };

    this.gamma = axios.create({
      baseURL: config.polymarket.gamma_api,
      timeout: 30000,
      headers: commonHeaders,
    });

    this.clob = axios.create({
      baseURL: config.polymarket.clob_api,
      timeout: 15000,
      headers: commonHeaders,
    });

    this.data = axios.create({
      baseURL: config.polymarket.data_api,
      timeout: 30000,
      headers: commonHeaders,
    });
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  // ── Market Data ────────────────────────────────────────

  async getMarkets(params: {
    limit?: number;
    offset?: number;
    active?: boolean;
  } = {}): Promise<Market[]> {
    await this.throttle();
    try {
      const { data } = await this.gamma.get('/markets', {
        params: { limit: 100, active: true, ...params }
      });

      return (data || []).map((m: any) => this.parseMarket(m)).filter(Boolean) as Market[];
    } catch (error: any) {
      console.error(`[API] getMarkets error: ${error.message}`);
      return [];
    }
  }

  async searchBTCShortTermMarkets(): Promise<Market[]> {
    const markets = await this.getMarkets({ limit: 200 });
    const keywords = ['btc', 'bitcoin'];
    const timeKeywords = ['minute', 'min', 'hour', 'hr', '5-minute', '15-minute'];

    return markets.filter(m => {
      const q = m.question.toLowerCase();
      return keywords.some(k => q.includes(k)) && timeKeywords.some(k => q.includes(k));
    });
  }

  // ── Order Book ─────────────────────────────────────────

  async getOrderBook(tokenId: string): Promise<OrderBook | null> {
    await this.throttle();
    try {
      const { data } = await this.clob.get('/book', {
        params: { token_id: tokenId }
      });

      if (!data) return null;

      return {
        bids: (data.bids || []).map((b: any) => ({
          price: parseFloat(b.price),
          size: parseFloat(b.size),
        })),
        asks: (data.asks || []).map((a: any) => ({
          price: parseFloat(a.price),
          size: parseFloat(a.size),
        })),
        timestamp: Date.now(),
      };
    } catch (error: any) {
      console.error(`[API] getOrderBook error: ${error.message}`);
      return null;
    }
  }

  async getMidpoint(tokenId: string): Promise<number | null> {
    await this.throttle();
    try {
      const { data } = await this.clob.get('/midpoint', {
        params: { token_id: tokenId }
      });
      return data?.mid ? parseFloat(data.mid) : null;
    } catch (error: any) {
      return null;
    }
  }

  async getPrice(tokenId: string, side: 'BUY' | 'SELL' = 'BUY'): Promise<number | null> {
    await this.throttle();
    try {
      const { data } = await this.clob.get('/price', {
        params: { token_id: tokenId, side }
      });
      return data?.price ? parseFloat(data.price) : null;
    } catch (error: any) {
      return null;
    }
  }

  async getSpread(tokenId: string): Promise<{ bid: number; ask: number; spread: number } | null> {
    await this.throttle();
    try {
      const { data } = await this.clob.get('/spread', {
        params: { token_id: tokenId }
      });
      if (!data) return null;
      const bid = parseFloat(data.bid || '0');
      const ask = parseFloat(data.ask || '0');
      return { bid, ask, spread: ask - bid };
    } catch (error: any) {
      return null;
    }
  }

  // ── Trade Data ─────────────────────────────────────────

  async getRecentTrades(params: {
    market?: string;
    maker?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    await this.throttle();
    try {
      const { data } = await this.data.get('/trades', {
        params: { limit: 100, ...params }
      });
      return data || [];
    } catch (error: any) {
      console.error(`[API] getRecentTrades error: ${error.message}`);
      return [];
    }
  }

  // ── WebSocket (Real-time Data) ─────────────────────────

  connectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
    }

    console.log('[WS] Connecting to Polymarket WebSocket...');
    this.ws = new WebSocket(this.config.polymarket.ws_url);

    this.ws.on('open', () => {
      console.log('[WS] Connected');
    });

    this.ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        const event = msg.event || 'unknown';
        const callbacks = this.wsCallbacks.get(event) || [];
        callbacks.forEach(cb => cb(msg));

        // Also fire 'all' listeners
        const allCallbacks = this.wsCallbacks.get('all') || [];
        allCallbacks.forEach(cb => cb(msg));
      } catch (err) {
        // Ignore parse errors
      }
    });

    this.ws.on('error', (error) => {
      console.error(`[WS] Error: ${error.message}`);
    });

    this.ws.on('close', () => {
      console.log('[WS] Disconnected. Reconnecting in 5s...');
      setTimeout(() => this.connectWebSocket(), 5000);
    });
  }

  subscribeToMarket(tokenId: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WS] Not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'market',
      assets_id: tokenId,
    }));
  }

  onWebSocketEvent(event: string, callback: (data: any) => void): void {
    if (!this.wsCallbacks.has(event)) {
      this.wsCallbacks.set(event, []);
    }
    this.wsCallbacks.get(event)!.push(callback);
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ── Helpers ────────────────────────────────────────────

  private parseMarket(raw: any): Market | null {
    try {
      let prices: number[] = [];
      if (raw.outcomePrices) {
        const parsed = typeof raw.outcomePrices === 'string'
          ? JSON.parse(raw.outcomePrices)
          : raw.outcomePrices;
        prices = parsed.map((p: any) => parseFloat(p));
      }

      let outcomes: string[] = [];
      if (raw.outcomes) {
        outcomes = typeof raw.outcomes === 'string'
          ? JSON.parse(raw.outcomes)
          : raw.outcomes;
      }

      let tokens: TokenInfo[] = [];
      if (raw.clobTokenIds) {
        const tokenIds = typeof raw.clobTokenIds === 'string'
          ? JSON.parse(raw.clobTokenIds)
          : raw.clobTokenIds;
        tokens = tokenIds.map((id: string, i: number) => ({
          token_id: id,
          outcome: outcomes[i] || `Outcome ${i}`,
          price: prices[i] || 0,
        }));
      }

      return {
        conditionId: raw.conditionId || '',
        question: raw.question || '',
        slug: raw.slug || '',
        outcomes,
        outcomePrices: prices,
        volume: parseFloat(raw.volume || '0'),
        liquidity: parseFloat(raw.liquidity || '0'),
        endDate: raw.endDate,
        category: raw.category || '',
        active: raw.active !== false,
        tokens,
      };
    } catch {
      return null;
    }
  }
}
