#!/usr/bin/env python3
import json, sys
from pathlib import Path
import pandas as pd

if len(sys.argv) < 3:
    raise SystemExit('usage: probe-public-market-source.py <games.parquet> <lines.parquet> [line_snapshots.parquet]')

games = pd.read_parquet(sys.argv[1])
lines = pd.read_parquet(sys.argv[2])
snaps = pd.read_parquet(sys.argv[3]) if len(sys.argv) > 3 and Path(sys.argv[3]).exists() else pd.DataFrame()


def years(df):
    if 'season' not in df.columns: return []
    s = pd.to_numeric(df['season'], errors='coerce').dropna().astype(int)
    return sorted(s.unique().tolist())

report = {
    'games_rows': int(len(games)),
    'games_seasons': years(games),
    'lines_rows': int(len(lines)),
    'lines_seasons': years(lines),
    'line_columns': list(lines.columns),
    'snapshots_rows': int(len(snaps)),
    'snapshot_columns': list(snaps.columns),
}

if not snaps.empty:
    for col in ('captured_at','available_at','provider_observed_at'):
        if col in snaps.columns:
            x = pd.to_datetime(snaps[col], utc=True, errors='coerce').dropna()
            report[col] = {
                'min': None if x.empty else x.min().isoformat(),
                'max': None if x.empty else x.max().isoformat(),
                'non_null': int(x.size),
            }
    if 'source' in snaps.columns:
        report['snapshot_sources'] = snaps['source'].astype(str).value_counts().head(20).to_dict()
    if 'sportsbook' in snaps.columns:
        report['snapshot_books'] = snaps['sportsbook'].astype(str).value_counts().head(20).to_dict()

# Discovery-only coverage. Never inspect 2025 outcomes here.
discovery = lines[pd.to_numeric(lines.get('season'), errors='coerce').isin([2021,2022,2023,2024])].copy() if 'season' in lines.columns else pd.DataFrame()
report['discovery_rows_2021_2024'] = int(len(discovery))
for c in ('market_spread','market_spread_open','market_total','market_total_open','home_moneyline','away_moneyline','market_spread_book_count','market_total_book_count'):
    if c in discovery.columns:
        report['discovery_non_null_'+c] = int(discovery[c].notna().sum())

print(json.dumps(report, indent=2, sort_keys=True, default=str))
