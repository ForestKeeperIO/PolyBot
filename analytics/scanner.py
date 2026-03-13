"""
Market Scanner
Continuously monitors Polymarket for trading opportunities across all strategies.
"""

import json
import time
import signal
import sys
from datetime import datetime
from typing import Dict, List, Optional
from polymarket_client import PolymarketClient, WalletAnalyzer


class MarketScanner:
    """Scans Polymarket for opportunities across multiple strategies."""

    def __init__(self, config_path: str = "../config/settings.json"):
        with open(config_path) as f:
            self.config = json.load(f)

        self.client = PolymarketClient(self.config)
        self.wallet_analyzer = WalletAnalyzer(self.client)
        self.running = False
        self.scan_results: Dict[str, List] = {
            "arbitrage": [],
            "straddle": [],
            "market_making": [],
            "top_wallets": []
        }
        self.scan_history: List[Dict] = []

    def scan_all(self) -> Dict:
        """Run a complete scan across all strategies."""
        timestamp = datetime.now().isoformat()
        print(f"\n{'='*60}")
        print(f"[{timestamp}] Running full market scan...")
        print(f"{'='*60}")

        results = {
            "timestamp": timestamp,
            "arbitrage": [],
            "straddle": [],
            "top_wallets": [],
            "summary": {}
        }

        # 1. Arbitrage scan
        print("\n[1/3] Scanning for arbitrage opportunities...")
        try:
            arb_config = self.config.get("arbitrage", {})
            min_spread = arb_config.get("min_spread_pct", 0.5)
            arb_opps = self.client.find_arbitrage_opportunities(min_spread_pct=min_spread)
            results["arbitrage"] = arb_opps
            self.scan_results["arbitrage"] = arb_opps
            print(f"  Found {len(arb_opps)} arbitrage opportunities")
            for opp in arb_opps[:3]:
                print(f"    -> {opp['market'][:50]}... | Spread: {opp['spread_pct']}%")
        except Exception as e:
            print(f"  [Error] Arbitrage scan failed: {e}")

        # 2. Straddle scan
        print("\n[2/3] Scanning for straddle opportunities...")
        try:
            straddle_config = self.config.get("straddle", {})
            straddle_opps = self.client.find_straddle_opportunities(
                max_entry=straddle_config.get("max_entry_price", 0.40),
                min_entry=straddle_config.get("min_entry_price", 0.15)
            )
            results["straddle"] = straddle_opps
            self.scan_results["straddle"] = straddle_opps
            print(f"  Found {len(straddle_opps)} straddle opportunities")
            for opp in straddle_opps[:3]:
                print(f"    -> {opp['market'][:50]}... | Entry: ${opp['total_entry_cost']} | Profit: {opp['max_profit_pct']}%")
        except Exception as e:
            print(f"  [Error] Straddle scan failed: {e}")

        # 3. Top wallets scan
        print("\n[3/3] Analyzing top wallets...")
        try:
            analytics_config = self.config.get("analytics", {})
            min_trades = analytics_config.get("min_trades_for_analysis", 20)
            top_wallets = self.wallet_analyzer.find_top_wallets(min_trades=min_trades)
            results["top_wallets"] = top_wallets[:10]
            self.scan_results["top_wallets"] = top_wallets[:10]
            print(f"  Found {len(top_wallets)} active wallets")
            for w in top_wallets[:3]:
                pattern = w.get("pattern", {})
                print(f"    -> {w['address'][:12]}... | Trades: {w['trade_count']} | Pattern: {pattern.get('type', 'unknown')}")
        except Exception as e:
            print(f"  [Error] Wallet scan failed: {e}")

        # Summary
        results["summary"] = {
            "total_arbitrage": len(results["arbitrage"]),
            "total_straddle": len(results["straddle"]),
            "total_wallets_tracked": len(results["top_wallets"]),
            "best_arbitrage_spread": results["arbitrage"][0]["spread_pct"] if results["arbitrage"] else 0,
            "best_straddle_profit": results["straddle"][0]["max_profit_pct"] if results["straddle"] else 0,
        }

        self.scan_history.append(results)
        self._print_summary(results["summary"])

        return results

    def _print_summary(self, summary: Dict):
        """Print scan summary."""
        print(f"\n{'─'*40}")
        print("SCAN SUMMARY:")
        print(f"  Arbitrage opportunities: {summary['total_arbitrage']}")
        print(f"  Straddle opportunities:  {summary['total_straddle']}")
        print(f"  Wallets tracked:         {summary['total_wallets_tracked']}")
        if summary['best_arbitrage_spread'] > 0:
            print(f"  Best arb spread:         {summary['best_arbitrage_spread']}%")
        if summary['best_straddle_profit'] > 0:
            print(f"  Best straddle profit:    {summary['best_straddle_profit']}%")
        print(f"{'─'*40}\n")

    def scan_loop(self, interval_seconds: int = 300):
        """Continuously scan at the specified interval."""
        self.running = True

        def signal_handler(sig, frame):
            print("\n[Scanner] Stopping...")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)

        print(f"[Scanner] Starting continuous scan (every {interval_seconds}s)")
        print("[Scanner] Press Ctrl+C to stop\n")

        while self.running:
            try:
                self.scan_all()

                if self.running:
                    print(f"[Scanner] Next scan in {interval_seconds} seconds...")
                    for _ in range(interval_seconds):
                        if not self.running:
                            break
                        time.sleep(1)
            except Exception as e:
                print(f"[Scanner Error] {e}")
                time.sleep(30)

        print("[Scanner] Stopped.")

    def export_results(self, filepath: str = "scan_results.json"):
        """Export latest scan results to JSON."""
        if self.scan_history:
            with open(filepath, "w") as f:
                json.dump(self.scan_history[-1], f, indent=2)
            print(f"[Scanner] Results exported to {filepath}")
        else:
            print("[Scanner] No results to export. Run a scan first.")

    def compare_strategies(self) -> Dict:
        """Compare current opportunity quality across strategies."""
        arb = self.scan_results.get("arbitrage", [])
        straddle = self.scan_results.get("straddle", [])

        comparison = {
            "recommendation": "",
            "arbitrage": {
                "count": len(arb),
                "avg_spread": sum(o["spread_pct"] for o in arb) / len(arb) if arb else 0,
                "total_available_liquidity": sum(o.get("liquidity", 0) for o in arb),
                "risk_level": "low",
                "estimated_daily_return_pct": 0,
            },
            "straddle": {
                "count": len(straddle),
                "avg_profit_potential": sum(o["max_profit_pct"] for o in straddle) / len(straddle) if straddle else 0,
                "total_available_liquidity": sum(o.get("liquidity", 0) for o in straddle),
                "risk_level": "high",
                "estimated_daily_return_pct": 0,
            }
        }

        # Estimate daily returns
        if arb:
            comparison["arbitrage"]["estimated_daily_return_pct"] = round(
                comparison["arbitrage"]["avg_spread"] * 5, 2  # ~5 arb trades/day feasible
            )
        if straddle:
            # Straddle: ~50% win rate, so expected value = avg_profit * 0.5 - loss * 0.5
            avg_profit = comparison["straddle"]["avg_profit_potential"]
            comparison["straddle"]["estimated_daily_return_pct"] = round(
                avg_profit * 0.5 * 3 - 50 * 0.5 * 3, 2  # ~3 trades/day, rough estimate
            )

        # Recommendation
        arb_ev = comparison["arbitrage"]["estimated_daily_return_pct"]
        straddle_ev = comparison["straddle"]["estimated_daily_return_pct"]

        if arb_ev > straddle_ev and arb_ev > 0:
            comparison["recommendation"] = "arbitrage"
        elif straddle_ev > 0:
            comparison["recommendation"] = "straddle"
        else:
            comparison["recommendation"] = "wait"

        return comparison


if __name__ == "__main__":
    import sys

    scanner = MarketScanner()

    if len(sys.argv) > 1 and sys.argv[1] == "--loop":
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 300
        scanner.scan_loop(interval_seconds=interval)
    else:
        # Single scan
        results = scanner.scan_all()

        # Compare strategies
        print("\n=== Strategy Comparison ===")
        comparison = scanner.compare_strategies()
        print(f"  Recommended strategy: {comparison['recommendation'].upper()}")
        print(f"  Arbitrage - Opportunities: {comparison['arbitrage']['count']}, "
              f"Avg spread: {comparison['arbitrage']['avg_spread']:.2f}%, "
              f"Est daily return: {comparison['arbitrage']['estimated_daily_return_pct']}%")
        print(f"  Straddle  - Opportunities: {comparison['straddle']['count']}, "
              f"Avg profit: {comparison['straddle']['avg_profit_potential']:.1f}%, "
              f"Est daily return: {comparison['straddle']['estimated_daily_return_pct']}%")

        # Export
        scanner.export_results()
