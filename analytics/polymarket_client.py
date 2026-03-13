"""
Polymarket API Client
Handles all communication with Polymarket's public APIs (Gamma, CLOB, Data)
"""

import requests
import time
import json
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta


@dataclass
class Market:
    condition_id: str
    question: str
    slug: str
    outcomes: List[str]
    outcome_prices: List[float]
    volume: float
    liquidity: float
    end_date: Optional[str] = None
    category: str = ""
    active: bool = True
    tokens: List[Dict] = field(default_factory=list)


@dataclass
class Trade:
    id: str
    market_slug: str
    maker: str
    taker: str
    side: str  # BUY or SELL
    outcome: str
    price: float
    size: float
    timestamp: int
    tx_hash: str = ""


class PolymarketClient:
    """Client for Polymarket's public APIs."""

    def __init__(self, config: Dict):
        self.gamma_url = config["polymarket"]["gamma_api"]
        self.clob_url = config["polymarket"]["clob_api"]
        self.data_url = config["polymarket"]["data_api"]
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "PolyBot-Analytics/1.0"
        })
        self._rate_limit_delay = 0.1  # 100ms between requests
        self._last_request = 0

    def _throttle(self):
        """Simple rate limiting."""
        elapsed = time.time() - self._last_request
        if elapsed < self._rate_limit_delay:
            time.sleep(self._rate_limit_delay - elapsed)
        self._last_request = time.time()

    def _get(self, url: str, params: Optional[Dict] = None) -> Any:
        """Make a throttled GET request."""
        self._throttle()
        try:
            resp = self.session.get(url, params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as e:
            print(f"[API Error] {url}: {e}")
            return None

    # ── Gamma API (Markets & Events) ──────────────────────────────────

    def get_markets(self, limit: int = 100, offset: int = 0,
                    active: bool = True, closed: bool = False) -> List[Market]:
        """Fetch markets from Gamma API."""
        params = {
            "limit": limit,
            "offset": offset,
            "active": active,
            "closed": closed,
        }
        data = self._get(f"{self.gamma_url}/markets", params)
        if not data:
            return []

        markets = []
        for m in data:
            try:
                prices = []
                if m.get("outcomePrices"):
                    prices = json.loads(m["outcomePrices"]) if isinstance(m["outcomePrices"], str) else m["outcomePrices"]
                    prices = [float(p) for p in prices]

                market = Market(
                    condition_id=m.get("conditionId", ""),
                    question=m.get("question", ""),
                    slug=m.get("slug", ""),
                    outcomes=json.loads(m.get("outcomes", "[]")) if isinstance(m.get("outcomes"), str) else m.get("outcomes", []),
                    outcome_prices=prices,
                    volume=float(m.get("volume", 0)),
                    liquidity=float(m.get("liquidity", 0)),
                    end_date=m.get("endDate"),
                    category=m.get("category", ""),
                    active=m.get("active", True),
                    tokens=m.get("clobTokenIds", []) if isinstance(m.get("clobTokenIds"), list) else
                           json.loads(m.get("clobTokenIds", "[]")) if m.get("clobTokenIds") else []
                )
                markets.append(market)
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                print(f"[Parse Error] Skipping market: {e}")
                continue

        return markets

    def get_market_by_slug(self, slug: str) -> Optional[Market]:
        """Fetch a specific market by slug."""
        data = self._get(f"{self.gamma_url}/markets", {"slug": slug})
        if data and len(data) > 0:
            markets = self.get_markets.__wrapped__ if hasattr(self.get_markets, '__wrapped__') else None
            # Re-parse single result
            m = data[0]
            try:
                prices = []
                if m.get("outcomePrices"):
                    prices = json.loads(m["outcomePrices"]) if isinstance(m["outcomePrices"], str) else m["outcomePrices"]
                    prices = [float(p) for p in prices]
                return Market(
                    condition_id=m.get("conditionId", ""),
                    question=m.get("question", ""),
                    slug=m.get("slug", ""),
                    outcomes=json.loads(m.get("outcomes", "[]")) if isinstance(m.get("outcomes"), str) else m.get("outcomes", []),
                    outcome_prices=prices,
                    volume=float(m.get("volume", 0)),
                    liquidity=float(m.get("liquidity", 0)),
                    end_date=m.get("endDate"),
                    category=m.get("category", ""),
                    active=m.get("active", True),
                    tokens=m.get("clobTokenIds", []) if isinstance(m.get("clobTokenIds"), list) else
                           json.loads(m.get("clobTokenIds", "[]")) if m.get("clobTokenIds") else []
                )
            except Exception:
                return None
        return None

    def search_markets(self, query: str, limit: int = 50) -> List[Market]:
        """Search markets by keyword."""
        params = {"limit": limit, "active": True}
        data = self._get(f"{self.gamma_url}/markets", params)
        if not data:
            return []

        query_lower = query.lower()
        filtered = [m for m in data if query_lower in m.get("question", "").lower()]

        markets = []
        for m in filtered:
            try:
                prices = json.loads(m.get("outcomePrices", "[]")) if isinstance(m.get("outcomePrices"), str) else m.get("outcomePrices", [])
                prices = [float(p) for p in prices]
                markets.append(Market(
                    condition_id=m.get("conditionId", ""),
                    question=m.get("question", ""),
                    slug=m.get("slug", ""),
                    outcomes=json.loads(m.get("outcomes", "[]")) if isinstance(m.get("outcomes"), str) else m.get("outcomes", []),
                    outcome_prices=prices,
                    volume=float(m.get("volume", 0)),
                    liquidity=float(m.get("liquidity", 0)),
                    end_date=m.get("endDate"),
                    category=m.get("category", ""),
                    active=m.get("active", True),
                    tokens=[]
                ))
            except Exception:
                continue
        return markets

    def get_btc_short_term_markets(self) -> List[Market]:
        """Find BTC short-term prediction markets (5min, 15min, 1hr)."""
        all_markets = []
        for keyword in ["BTC", "Bitcoin"]:
            markets = self.search_markets(keyword, limit=100)
            all_markets.extend(markets)

        # Filter for short-term markets
        short_term_keywords = ["minute", "min", "hour", "hr", "5-minute", "15-minute"]
        result = []
        seen = set()
        for m in all_markets:
            if m.condition_id in seen:
                continue
            if any(kw in m.question.lower() for kw in short_term_keywords):
                result.append(m)
                seen.add(m.condition_id)

        return result

    # ── CLOB API (Order Book & Prices) ────────────────────────────────

    def get_orderbook(self, token_id: str) -> Optional[Dict]:
        """Get order book for a specific token."""
        data = self._get(f"{self.clob_url}/book", {"token_id": token_id})
        return data

    def get_midpoint(self, token_id: str) -> Optional[float]:
        """Get midpoint price for a token."""
        data = self._get(f"{self.clob_url}/midpoint", {"token_id": token_id})
        if data and "mid" in data:
            return float(data["mid"])
        return None

    def get_price(self, token_id: str, side: str = "buy") -> Optional[float]:
        """Get best price for a token."""
        data = self._get(f"{self.clob_url}/price", {
            "token_id": token_id,
            "side": side.upper()
        })
        if data and "price" in data:
            return float(data["price"])
        return None

    def get_spread(self, token_id: str) -> Optional[Dict]:
        """Get bid-ask spread for a token."""
        data = self._get(f"{self.clob_url}/spread", {"token_id": token_id})
        return data

    def get_last_trade_price(self, token_id: str) -> Optional[float]:
        """Get last trade price."""
        data = self._get(f"{self.clob_url}/last-trade-price", {"token_id": token_id})
        if data and "price" in data:
            return float(data["price"])
        return None

    # ── Data API (Trades & Positions) ─────────────────────────────────

    def get_trades(self, market_slug: Optional[str] = None,
                   maker: Optional[str] = None,
                   limit: int = 100) -> List[Dict]:
        """Fetch recent trades, optionally filtered by market or maker address."""
        params = {"limit": limit}
        if market_slug:
            params["market"] = market_slug
        if maker:
            params["maker"] = maker

        data = self._get(f"{self.data_url}/trades", params)
        return data if data else []

    def get_user_positions(self, address: str) -> List[Dict]:
        """Get open positions for a wallet address."""
        data = self._get(f"{self.data_url}/positions", {"user": address})
        return data if data else []

    def get_user_history(self, address: str, limit: int = 500) -> List[Dict]:
        """Get trade history for a wallet address."""
        data = self._get(f"{self.data_url}/trades", {
            "maker": address,
            "limit": limit
        })
        return data if data else []

    # ── Arbitrage Detection ───────────────────────────────────────────

    def find_arbitrage_opportunities(self, min_spread_pct: float = 0.5) -> List[Dict]:
        """
        Find markets where YES + NO prices don't sum to $1.00.
        If sum < 1.0, buying both sides guarantees profit.
        """
        markets = self.get_markets(limit=100, active=True)
        opportunities = []

        for market in markets:
            if len(market.outcome_prices) != 2:
                continue

            yes_price = market.outcome_prices[0]
            no_price = market.outcome_prices[1]
            total = yes_price + no_price

            if total < 1.0:
                spread = (1.0 - total) / total * 100
                if spread >= min_spread_pct:
                    opportunities.append({
                        "market": market.question,
                        "slug": market.slug,
                        "yes_price": yes_price,
                        "no_price": no_price,
                        "total": total,
                        "spread_pct": round(spread, 2),
                        "profit_per_dollar": round(1.0 - total, 4),
                        "volume": market.volume,
                        "liquidity": market.liquidity
                    })

        opportunities.sort(key=lambda x: x["spread_pct"], reverse=True)
        return opportunities

    # ── 5-Minute Market Discovery ──────────────────────────────────────

    def get_five_min_markets(self, assets: List[str] = None) -> List[Dict]:
        """
        Find all active 5-minute "Up or Down" crypto markets.
        These use slug pattern: {asset}-updown-5m-{timestamp}
        Outcomes: ["Up", "Down"]
        """
        if assets is None:
            assets = ["btc", "eth", "sol", "xrp"]

        data = self._get(f"{self.gamma_url}/events", {
            "limit": 100,
            "active": True,
            "closed": False,
            "order": "startDate",
            "ascending": False,
        })

        if not data:
            return []

        results = []
        now = datetime.utcnow()

        for event in data:
            slug = event.get("slug", "")
            if "-updown-5m-" not in slug:
                continue

            asset = slug.split("-updown")[0]
            if asset not in assets:
                continue

            for m in event.get("markets", []):
                if not m.get("acceptingOrders") or not m.get("active"):
                    continue

                outcomes = json.loads(m["outcomes"]) if isinstance(m.get("outcomes"), str) else m.get("outcomes", [])
                prices = json.loads(m["outcomePrices"]) if isinstance(m.get("outcomePrices"), str) else m.get("outcomePrices", [])
                tokens = json.loads(m["clobTokenIds"]) if isinstance(m.get("clobTokenIds"), str) else m.get("clobTokenIds", [])

                if len(outcomes) != 2 or len(prices) != 2:
                    continue

                up_idx = outcomes.index("Up") if "Up" in outcomes else -1
                down_idx = outcomes.index("Down") if "Down" in outcomes else -1
                if up_idx == -1 or down_idx == -1:
                    continue

                up_price = float(prices[up_idx])
                down_price = float(prices[down_idx])
                total_cost = up_price + down_price
                profit = 1.0 - total_cost
                profit_pct = (profit / total_cost * 100) if total_cost > 0 else 0

                end_date = m.get("endDate", "")
                if end_date:
                    try:
                        end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
                        minutes_left = (end_dt - now).total_seconds() / 60
                    except Exception:
                        minutes_left = 5.0
                else:
                    minutes_left = 5.0

                results.append({
                    "asset": asset.upper(),
                    "title": event.get("title", ""),
                    "slug": slug,
                    "condition_id": m.get("conditionId", ""),
                    "up_price": up_price,
                    "down_price": down_price,
                    "total_cost": round(total_cost, 4),
                    "profit": round(profit, 4),
                    "profit_pct": round(profit_pct, 2),
                    "liquidity": float(m.get("liquidity", 0)),
                    "minutes_left": round(minutes_left, 1),
                    "up_token_id": tokens[up_idx] if len(tokens) > up_idx else "",
                    "down_token_id": tokens[down_idx] if len(tokens) > down_idx else "",
                    "end_date": end_date,
                })

        results.sort(key=lambda x: x["profit_pct"], reverse=True)
        return results

    # ── Straddle Opportunity Detection ────────────────────────────────

    def find_straddle_opportunities(self, max_entry: float = 0.40,
                                     min_entry: float = 0.15) -> List[Dict]:
        """
        Find markets suitable for straddle entries.
        Primarily targets 5-minute Up/Down markets.
        """
        # Use 5-minute markets as primary source
        five_min = self.get_five_min_markets()
        opportunities = []

        for m in five_min:
            total = m["total_cost"]
            if total >= 1.0:
                continue  # No profit
            if total > 0.99:
                continue  # Less than 1% profit

            opportunities.append({
                "market": m["title"],
                "slug": m["slug"],
                "asset": m["asset"],
                "yes_price": m["up_price"],
                "no_price": m["down_price"],
                "total_entry_cost": m["total_cost"],
                "max_profit": m["profit"],
                "max_profit_pct": m["profit_pct"],
                "liquidity": m["liquidity"],
                "minutes_left": m["minutes_left"],
            })

        opportunities.sort(key=lambda x: x["max_profit_pct"], reverse=True)
        return opportunities


class WalletAnalyzer:
    """Analyzes wallet trading patterns on Polymarket."""

    def __init__(self, client: PolymarketClient):
        self.client = client

    def analyze_wallet(self, address: str) -> Dict:
        """Full analysis of a wallet's trading behavior."""
        trades = self.client.get_user_history(address, limit=500)
        positions = self.client.get_user_positions(address)

        if not trades:
            return {"address": address, "error": "No trades found"}

        analysis = {
            "address": address,
            "total_trades": len(trades),
            "positions_open": len(positions) if positions else 0,
            "trade_analysis": self._analyze_trades(trades),
            "pattern": self._detect_pattern(trades),
            "risk_profile": self._assess_risk(trades),
        }

        return analysis

    def _analyze_trades(self, trades: List[Dict]) -> Dict:
        """Analyze trade patterns."""
        if not trades:
            return {}

        buy_count = sum(1 for t in trades if t.get("side") == "BUY")
        sell_count = sum(1 for t in trades if t.get("side") == "SELL")

        prices = [float(t.get("price", 0)) for t in trades if t.get("price")]
        sizes = [float(t.get("size", 0)) for t in trades if t.get("size")]

        # Time analysis
        timestamps = [t.get("timestamp", 0) for t in trades if t.get("timestamp")]
        if len(timestamps) >= 2:
            timestamps.sort()
            intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
            avg_interval = sum(intervals) / len(intervals) if intervals else 0
        else:
            avg_interval = 0

        return {
            "buy_count": buy_count,
            "sell_count": sell_count,
            "avg_price": round(sum(prices) / len(prices), 4) if prices else 0,
            "avg_size": round(sum(sizes) / len(sizes), 4) if sizes else 0,
            "total_volume": round(sum(p * s for p, s in zip(prices, sizes)), 2),
            "avg_interval_seconds": round(avg_interval, 1),
            "unique_markets": len(set(t.get("market", "") for t in trades)),
        }

    def _detect_pattern(self, trades: List[Dict]) -> Dict:
        """Detect if wallet shows bot-like or human-like trading patterns."""
        if len(trades) < 10:
            return {"type": "insufficient_data", "confidence": 0}

        timestamps = sorted([t.get("timestamp", 0) for t in trades if t.get("timestamp")])

        if len(timestamps) < 2:
            return {"type": "unknown", "confidence": 0}

        intervals = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)]
        avg_interval = sum(intervals) / len(intervals)

        # Coefficient of variation - bots have very consistent timing
        if avg_interval > 0:
            std_dev = (sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)) ** 0.5
            cv = std_dev / avg_interval
        else:
            cv = 0

        # Bot indicators
        bot_score = 0
        reasons = []

        # Very consistent timing (low CV)
        if cv < 0.3:
            bot_score += 30
            reasons.append("Very consistent trade timing")

        # High frequency
        if avg_interval < 60:  # Less than 1 minute between trades
            bot_score += 25
            reasons.append("High-frequency trading")

        # Trading during unusual hours
        # (simplified - would need proper datetime conversion)
        if len(trades) > 100:
            bot_score += 15
            reasons.append("Very high trade count")

        # Consistent position sizes
        sizes = [float(t.get("size", 0)) for t in trades if t.get("size")]
        if sizes:
            avg_size = sum(sizes) / len(sizes)
            if avg_size > 0:
                size_cv = (sum((s - avg_size) ** 2 for s in sizes) / len(sizes)) ** 0.5 / avg_size
                if size_cv < 0.2:
                    bot_score += 20
                    reasons.append("Very consistent position sizes")

        pattern_type = "likely_bot" if bot_score >= 50 else "likely_human" if bot_score < 25 else "uncertain"

        return {
            "type": pattern_type,
            "bot_score": bot_score,
            "confidence": min(bot_score, 100),
            "reasons": reasons,
            "avg_interval_seconds": round(avg_interval, 1),
            "timing_consistency_cv": round(cv, 3)
        }

    def _assess_risk(self, trades: List[Dict]) -> Dict:
        """Assess the risk profile of the trading strategy."""
        sizes = [float(t.get("size", 0)) for t in trades if t.get("size")]
        prices = [float(t.get("price", 0)) for t in trades if t.get("price")]

        if not sizes or not prices:
            return {"profile": "unknown"}

        avg_size = sum(sizes) / len(sizes)
        max_size = max(sizes)

        # Check if trader buys at extreme prices (near 0 or 1)
        extreme_trades = sum(1 for p in prices if p < 0.15 or p > 0.85)
        extreme_pct = extreme_trades / len(prices) * 100

        if extreme_pct > 50:
            profile = "aggressive"
        elif avg_size > 1000:
            profile = "whale"
        elif max_size / avg_size > 5:
            profile = "variable"
        else:
            profile = "conservative"

        return {
            "profile": profile,
            "avg_position_size": round(avg_size, 2),
            "max_position_size": round(max_size, 2),
            "extreme_price_trades_pct": round(extreme_pct, 1)
        }

    def find_top_wallets(self, market_slug: Optional[str] = None,
                          min_trades: int = 20) -> List[Dict]:
        """
        Find top-performing wallets by analyzing recent trades.
        Note: This is limited by API data availability.
        """
        trades = self.client.get_trades(market_slug=market_slug, limit=500)
        if not trades:
            return []

        # Group trades by wallet
        wallets: Dict[str, List] = {}
        for t in trades:
            maker = t.get("maker", "")
            if maker:
                wallets.setdefault(maker, []).append(t)

        # Analyze each wallet
        results = []
        for address, wallet_trades in wallets.items():
            if len(wallet_trades) < min_trades:
                continue

            analysis = {
                "address": address,
                "trade_count": len(wallet_trades),
                "total_volume": sum(
                    float(t.get("price", 0)) * float(t.get("size", 0))
                    for t in wallet_trades
                ),
                "unique_markets": len(set(t.get("market", "") for t in wallet_trades)),
                "pattern": self._detect_pattern(wallet_trades)
            }
            results.append(analysis)

        results.sort(key=lambda x: x["trade_count"], reverse=True)
        return results


if __name__ == "__main__":
    import json

    with open("../config/settings.json") as f:
        config = json.load(f)

    client = PolymarketClient(config)
    analyzer = WalletAnalyzer(client)

    print("=== Polymarket Analytics ===\n")

    # Find arbitrage opportunities
    print("Scanning for arbitrage opportunities...")
    arb_opps = client.find_arbitrage_opportunities(min_spread_pct=0.3)
    print(f"Found {len(arb_opps)} arbitrage opportunities")
    for opp in arb_opps[:5]:
        print(f"  {opp['market'][:60]}... | Spread: {opp['spread_pct']}% | Profit/dollar: ${opp['profit_per_dollar']}")

    print()

    # Find straddle opportunities
    print("Scanning for straddle opportunities on BTC markets...")
    straddle_opps = client.find_straddle_opportunities()
    print(f"Found {len(straddle_opps)} straddle opportunities")
    for opp in straddle_opps[:5]:
        print(f"  {opp['market'][:60]}... | Entry: ${opp['total_entry_cost']} | Max profit: {opp['max_profit_pct']}%")
