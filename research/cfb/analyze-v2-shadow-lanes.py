#!/usr/bin/env python3
"""CFB V2 shadow lane analyzer.

Implements only the preregistered descriptive lanes in
research/cfb/V2_SHADOW_PROTOCOL_2026-09-30.md.

Research only. This script does not modify frozen V1, does not use public-ticket
fields, does not compute ROI, and does not promote any result to production.
"""
import json
import math
import sys

import pandas as pd

GAMES = sys.argv[1]
LINES = sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else "cfb-v2-shadow-lanes.json"

KEYS = [3, 6, 7, 10, 14]
MOVE_BINS = [
    ("LT1", 0.0, 1.0),
    ("1_TO_1_99", 1.0, 2.0),
    ("2_TO_2_99", 2.0, 3.0),
    ("3PLUS", 3.0, float("inf")),
]


def wilson(w, n, z=1.96):
    if not n:
        return [None, None]
    p = w / n
    den = 1 + z * z / n
    ctr = (p + z * z / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return [max(0.0, ctr - half), min(1.0, ctr + half)]


def stats(x):
    w = int((x.result == "W").sum())
    l = int((x.result == "L").sum())
    p = int((x.result == "P").sum())
    n = w + l
    return {
        "W": w,
        "L": l,
        "P": p,
        "nonpush_n": n,
        "hit_rate_no_push": (w / n) if n else None,
        "wilson95": wilson(w, n),
    }


def exact_single_key_cross(open_spread, recorded_spread, key):
    ao = abs(open_spread)
    ar = abs(recorded_spread)
    low, high = sorted((ao, ar))
    crosses_key = (low < key <= high) or (low <= key < high)
    if not crosses_key:
        return False
    # Exact single-key classification: exclude moves that also cross another preregistered key.
    crossed = []
    for k in KEYS:
        if (low < k <= high) or (low <= k < high):
            crossed.append(k)
    return crossed == [key]


def home_role(open_spread):
    if open_spread < 0:
        return "HOME_FAVORITE"
    if open_spread > 0:
        return "HOME_DOG"
    return "PICKEM"


def book_group(v):
    if pd.isna(v):
        return None
    n = int(v)
    if n >= 3:
        return "3PLUS"
    return str(n)


g = pd.read_parquet(GAMES).copy()
l = pd.read_parquet(LINES).copy()
for df in (g, l):
    df["game_id"] = pd.to_numeric(df["game_id"], errors="coerce").astype("Int64")

required = [
    "game_id",
    "season",
    "market_spread",
    "market_spread_open",
    "market_spread_book_count",
]
missing = [c for c in required if c not in l.columns]
if missing:
    raise SystemExit(f"missing required line fields: {missing}")
if not {"home_score", "away_score"}.issubset(g.columns):
    raise SystemExit("missing game result fields")

df = l[required].merge(
    g[["game_id", "home_score", "away_score"]], on="game_id", how="inner"
)
for c in [
    "season",
    "market_spread",
    "market_spread_open",
    "market_spread_book_count",
    "home_score",
    "away_score",
]:
    df[c] = pd.to_numeric(df[c], errors="coerce")

df = df.dropna(
    subset=["season", "market_spread", "market_spread_open", "home_score", "away_score"]
).copy()
df["move"] = df.market_spread - df.market_spread_open
df = df[df.move != 0].copy()
df["abs_move"] = df.move.abs()
df["home_cover_value"] = (df.home_score - df.away_score) + df.market_spread

def grade(r):
    if r.home_cover_value == 0:
        return "P"
    home = "W" if r.home_cover_value > 0 else "L"
    # Follow movement direction: negative move => HOME; positive move => AWAY.
    return home if r.move < 0 else ("L" if home == "W" else "W")

df["result"] = df.apply(grade, axis=1)
df["home_role"] = df.market_spread_open.apply(home_role)
df["book_group"] = df.market_spread_book_count.apply(book_group)

season_report = {}
for season, sdf in df.groupby("season"):
    season_key = str(int(season))
    report = {}
    for key in KEYS:
        mask = sdf.apply(
            lambda r: exact_single_key_cross(r.market_spread_open, r.market_spread, key),
            axis=1,
        )
        kdf = sdf[mask].copy()
        lane = {
            "ALL": stats(kdf),
            "movement_magnitude": {},
            "book_confirmation": {},
            "home_role": {},
        }
        for label, lo, hi in MOVE_BINS:
            lane["movement_magnitude"][label] = stats(
                kdf[(kdf.abs_move >= lo) & (kdf.abs_move < hi)]
            )
        for bg in ["1", "2", "3PLUS"]:
            lane["book_confirmation"][bg] = stats(kdf[kdf.book_group == bg])
        for role in ["HOME_FAVORITE", "HOME_DOG", "PICKEM"]:
            lane["home_role"][role] = stats(kdf[kdf.home_role == role])
        report[str(key)] = lane
    season_report[season_key] = report

out = {
    "protocol": "CFB_V2_SHADOW_LANES_V1",
    "research_only": True,
    "production_enabled": False,
    "v1_modified": False,
    "public_ticket_fields_used": False,
    "roi_computed": False,
    "keys": KEYS,
    "movement_bins": [x[0] for x in MOVE_BINS],
    "book_groups": ["1", "2", "3PLUS"],
    "roles": ["HOME_FAVORITE", "HOME_DOG", "PICKEM"],
    "decision_line_semantics": "open-to-recorded market spread; recorded line is not assumed timestamped close",
    "season_report": season_report,
    "interpretation": [
        "2021-2024 are descriptive/discovery because they participated in prior rule selection.",
        "2025 must be interpreted separately as historical holdout evidence.",
        "This output is shadow research only and cannot alter frozen V1.",
        "No stratum is a betting rule and no production promotion is permitted from this script.",
    ],
}

with open(OUT, "w") as f:
    json.dump(out, f, indent=2, sort_keys=True)
print(json.dumps(out, indent=2, sort_keys=True))
