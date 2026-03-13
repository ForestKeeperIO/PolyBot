"""
Multi-Source Price Feed Aggregator (Python)

Pulls real-time price data from Binance, Bybit, CoinGecko, and Kraken
to validate Polymarket positions and detect volatility patterns.
"""

import requests
import time
import statistics
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import deque


@dataclass
class PriceData:
    source: str
    symbol: str
    price: float
    timestamp: float
    volume_24h: float = 0
    high_24h: float = 0
    low_24h: float = 0
    change_24h_pct: float = 0


@dataclass
class AggregatedPrice:
    symbol: str
    median: float
    mean: float
    sources: List[PriceData]
    spread_pct: float
    confidence: int
    timestamp: float
    volatility_1m: Optional[float] = None
    volatility_5m: Optional[float] = None


class PriceFeedAggregator:
    """Aggregates price data from multiple exchange APIs."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "PolyBot/1.0"})
        self.price_history: Dict[str, deque] = {}
        self.max_history = 3000

    # ── Individual Feeds ──────────────────────────────────

    def get_binance(self, symbol: str = "BTCUSDT") -> Optional[PriceData]:
        try:
            r = self.session.get(
                "https://api.binance.com/api/v3/ticker/24hr",
                params={"symbol": symbol}, timeout=5
            )
            d = r.json()
            return PriceData(
                source="binance",
                symbol=symbol.replace("USDT", ""),
                price=float(d["lastPrice"]),
                timestamp=time.time(),
                volume_24h=float(d["quoteVolume"]),
                high_24h=float(d["highPrice"]),
                low_24h=float(d["lowPrice"]),
                change_24h_pct=float(d["priceChangePercent"]),
            )
        except Exception as e:
            print(f"[Feed:Binance] Error: {e}")
            return None

    def get_bybit(self, symbol: str = "BTCUSDT") -> Optional[PriceData]:
        try:
            r = self.session.get(
                "https://api.bybit.com/v5/market/tickers",
                params={"category": "spot", "symbol": symbol}, timeout=5
            )
            d = r.json()
            ticker = d.get("result", {}).get("list", [{}])[0]
            return PriceData(
                source="bybit",
                symbol=symbol.replace("USDT", ""),
                price=float(ticker["lastPrice"]),
                timestamp=time.time(),
                volume_24h=float(ticker.get("turnover24h", 0)),
                high_24h=float(ticker.get("highPrice24h", 0)),
                low_24h=float(ticker.get("lowPrice24h", 0)),
                change_24h_pct=float(ticker.get("price24hPcnt", 0)) * 100,
            )
        except Exception as e:
            print(f"[Feed:Bybit] Error: {e}")
            return None

    def get_coingecko(self, coin_id: str = "bitcoin") -> Optional[PriceData]:
        try:
            r = self.session.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={
                    "ids": coin_id,
                    "vs_currencies": "usd",
                    "include_24hr_vol": "true",
                    "include_24hr_change": "true",
                }, timeout=5
            )
            d = r.json().get(coin_id, {})
            sym_map = {"bitcoin": "BTC", "ethereum": "ETH", "solana": "SOL"}
            return PriceData(
                source="coingecko",
                symbol=sym_map.get(coin_id, coin_id.upper()),
                price=d["usd"],
                timestamp=time.time(),
                volume_24h=d.get("usd_24h_vol", 0),
                change_24h_pct=d.get("usd_24h_change", 0),
            )
        except Exception as e:
            print(f"[Feed:CoinGecko] Error: {e}")
            return None

    def get_kraken(self, pair: str = "XBTUSD") -> Optional[PriceData]:
        try:
            r = self.session.get(
                "https://api.kraken.com/0/public/Ticker",
                params={"pair": pair}, timeout=5
            )
            d = r.json()
            result = d.get("result", {})
            key = list(result.keys())[0]
            ticker = result[key]
            price = float(ticker["c"][0])
            return PriceData(
                source="kraken",
                symbol="BTC" if "XBT" in pair else pair.replace("USD", ""),
                price=price,
                timestamp=time.time(),
                volume_24h=float(ticker["v"][1]) * price,
                high_24h=float(ticker["h"][1]),
                low_24h=float(ticker["l"][1]),
            )
        except Exception as e:
            print(f"[Feed:Kraken] Error: {e}")
            return None

    # ── Aggregation ───────────────────────────────────────

    def get_aggregated_price(self, symbol: str = "BTC") -> AggregatedPrice:
        """Get price from all sources, calculate median and confidence."""
        config = {
            "BTC": {"binance": "BTCUSDT", "bybit": "BTCUSDT", "coingecko": "bitcoin", "kraken": "XBTUSD"},
            "ETH": {"binance": "ETHUSDT", "bybit": "ETHUSDT", "coingecko": "ethereum", "kraken": "ETHUSD"},
            "SOL": {"binance": "SOLUSDT", "bybit": "SOLUSDT", "coingecko": "solana", "kraken": "SOLUSD"},
        }

        c = config.get(symbol, config["BTC"])
        sources = []

        for feed_fn, param in [
            (self.get_binance, c["binance"]),
            (self.get_bybit, c["bybit"]),
            (self.get_coingecko, c["coingecko"]),
            (self.get_kraken, c["kraken"]),
        ]:
            result = feed_fn(param)
            if result:
                sources.append(result)
                self._add_to_history(result)

        if not sources:
            return AggregatedPrice(symbol=symbol, median=0, mean=0, sources=[],
                                   spread_pct=100, confidence=0, timestamp=time.time())

        prices = sorted([s.price for s in sources])
        mean = statistics.mean(prices)
        median = statistics.median(prices)
        spread = ((max(prices) - min(prices)) / mean * 100) if mean > 0 else 0

        # Confidence scoring
        source_bonus = (len(sources) / 4) * 25
        spread_penalty = min(spread * 20, 75)
        confidence = int(min(100, max(0, source_bonus + 75 - spread_penalty)))

        vol_1m = self.calculate_volatility(symbol, 60)
        vol_5m = self.calculate_volatility(symbol, 300)

        return AggregatedPrice(
            symbol=symbol, median=median, mean=mean, sources=sources,
            spread_pct=round(spread, 4), confidence=confidence,
            timestamp=time.time(), volatility_1m=vol_1m, volatility_5m=vol_5m,
        )

    # ── Volatility ────────────────────────────────────────

    def calculate_volatility(self, symbol: str, lookback_seconds: int) -> Optional[float]:
        key = f"{symbol}_agg"
        history = self.price_history.get(key)
        if not history or len(history) < 10:
            return None

        cutoff = time.time() - lookback_seconds
        recent = [h.price for h in history if h.timestamp >= cutoff]
        if len(recent) < 5:
            return None

        mean = statistics.mean(recent)
        if mean == 0:
            return None
        std = statistics.stdev(recent)
        return round((std / mean) * 100, 6)

    def is_volatility_compressed(self, symbol: str = "BTC", threshold: float = 0.08) -> bool:
        vol = self.calculate_volatility(symbol, 300)
        return vol is not None and vol < threshold

    # ── Helpers ───────────────────────────────────────────

    def _add_to_history(self, price_data: PriceData):
        # Per-source
        src_key = f"{price_data.symbol}_{price_data.source}"
        if src_key not in self.price_history:
            self.price_history[src_key] = deque(maxlen=self.max_history)
        self.price_history[src_key].append(price_data)

        # Aggregated
        agg_key = f"{price_data.symbol}_agg"
        if agg_key not in self.price_history:
            self.price_history[agg_key] = deque(maxlen=self.max_history)
        self.price_history[agg_key].append(price_data)

    def print_status(self, symbol: str = "BTC"):
        agg = self.get_aggregated_price(symbol)
        print(f"\n{'═' * 55}")
        print(f"  {symbol} PRICE FEED STATUS")
        print(f"{'═' * 55}")
        print(f"  Median:     ${agg.median:,.2f}")
        print(f"  Mean:       ${agg.mean:,.2f}")
        print(f"  Spread:     {agg.spread_pct:.4f}%")
        print(f"  Confidence: {agg.confidence}%")
        print(f"  Sources:    {len(agg.sources)}/4")
        for src in agg.sources:
            delta = ((src.price - agg.median) / agg.median * 100) if agg.median else 0
            print(f"    {src.source:12s} ${src.price:>12,.2f}  ({delta:+.4f}%)"
                  f"  Vol24h: ${src.volume_24h:,.0f}")
        if agg.volatility_1m is not None:
            print(f"  Vol 1min:   {agg.volatility_1m:.6f}%")
        if agg.volatility_5m is not None:
            print(f"  Vol 5min:   {agg.volatility_5m:.6f}%")
        compressed = self.is_volatility_compressed(symbol)
        print(f"  Compressed: {compressed}")
        print(f"{'═' * 55}\n")


if __name__ == "__main__":
    feed = PriceFeedAggregator()

    print("Fetching BTC prices from 4 exchanges...\n")
    feed.print_status("BTC")

    print("Fetching ETH prices from 4 exchanges...\n")
    feed.print_status("ETH")
