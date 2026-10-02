#!/usr/bin/env python3
"""Predeclared CFB V2 favorite-flip shadow analyzer.

Implements V2_FAVORITE_FLIP_SHADOW_PROTOCOL_2026-10-02.md only.
Research/shadow only; frozen V1 is untouched. No public-ticket fields or ROI.
"""
import json, math, sys
import pandas as pd

GAMES=sys.argv[1]; LINES=sys.argv[2]
OUT=sys.argv[3] if len(sys.argv)>3 else "cfb-v2-favorite-flip-shadow.json"

def wilson(w,n,z=1.96):
    if not n:return [None,None]
    p=w/n; den=1+z*z/n; ctr=(p+z*z/(2*n))/den
    half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
    return [max(0,ctr-half),min(1,ctr+half)]

def p_two_sided(w,n):
    if not n:return None
    # Exact two-sided binomial test at p=.5: sum outcomes no more likely than observed.
    probs=[math.comb(n,k)*(0.5**n) for k in range(n+1)]
    po=probs[w]
    return min(1.0,sum(p for p in probs if p <= po+1e-15))

def stats(x):
    w=int((x.result=="W").sum()); l=int((x.result=="L").sum()); p=int((x.result=="P").sum()); n=w+l
    return {"W":w,"L":l,"P":p,"nonpush_n":n,
            "hit_rate_no_push":w/n if n else None,
            "wilson95":wilson(w,n),"exact_two_sided_binomial_p_vs_50":p_two_sided(w,n)}

g=pd.read_parquet(GAMES).copy(); l=pd.read_parquet(LINES).copy()
for df in (g,l): df["game_id"]=pd.to_numeric(df["game_id"],errors="coerce").astype("Int64")
req=["game_id","season","market_spread","market_spread_open","market_spread_book_count"]
missing=[c for c in req if c not in l.columns]
if missing: raise SystemExit(f"missing required line fields: {missing}")
if not {"home_score","away_score"}.issubset(g.columns): raise SystemExit("missing game result fields")

df=l[req].merge(g[["game_id","home_score","away_score"]],on="game_id",how="inner")
for c in ["season","market_spread","market_spread_open","market_spread_book_count","home_score","away_score"]:
    df[c]=pd.to_numeric(df[c],errors="coerce")
df=df.dropna(subset=["season","market_spread","market_spread_open","home_score","away_score"]).copy()
# Exact zero at either endpoint is PICK_TRANSITION and excluded.
df=df[((df.market_spread_open>0)&(df.market_spread<0))|((df.market_spread_open<0)&(df.market_spread>0))].copy()
df["signal"]="HOME_FLIP"
df.loc[(df.market_spread_open<0)&(df.market_spread>0),"signal"]="AWAY_FLIP"
df["signal_side"]="HOME"
df.loc[df.signal=="AWAY_FLIP","signal_side"]="AWAY"
df["signal_spread"]=df.market_spread
df.loc[df.signal_side=="AWAY","signal_spread"]=-df.market_spread
df["signal_margin"]=df.home_score-df.away_score
df.loc[df.signal_side=="AWAY","signal_margin"]=-df.signal_margin
df["cover_value"]=df.signal_margin+df.signal_spread
df["result"]=df.cover_value.apply(lambda v:"P" if v==0 else ("W" if v>0 else "L"))

def open_band(v):
    a=abs(v)
    return "0_TO_2_5" if a<=2.5 else ("2_5_TO_3_5" if a<=3.5 else ("3_5_TO_6_5" if a<=6.5 else "GT_6_5"))
def later_band(v):
    a=abs(v)
    return "0_TO_2_5" if a<=2.5 else ("2_5_TO_3_5" if a<=3.5 else "GT_3_5")
df["open_abs_band"]=df.market_spread_open.apply(open_band)
df["later_fav_band"]=df.market_spread.apply(later_band)
df["book_band"]=df.market_spread_book_count.apply(lambda v:"UNKNOWN" if pd.isna(v) else ("3PLUS" if v>=3 else "LT3"))

def report(x):
    return {"ALL":stats(x),
      "signal":{"HOME_FLIP":stats(x[x.signal=="HOME_FLIP"]),"AWAY_FLIP":stats(x[x.signal=="AWAY_FLIP"])},
      "open_abs_band":{b:stats(x[x.open_abs_band==b]) for b in ["0_TO_2_5","2_5_TO_3_5","3_5_TO_6_5","GT_6_5"]},
      "later_fav_band":{b:stats(x[x.later_fav_band==b]) for b in ["0_TO_2_5","2_5_TO_3_5","GT_3_5"]},
      "book_band":{b:stats(x[x.book_band==b]) for b in ["LT3","3PLUS","UNKNOWN"]}}

discovery=df[df.season.between(2021,2024)]
out={"protocol":"CFB_V2_FAVORITE_FLIP_SHADOW_V1","research_only":True,"production_enabled":False,
     "v1_modified":False,"public_ticket_fields_used":False,"roi_computed":False,
     "discovery_seasons":[2021,2022,2023,2024],"holdout_2025_inspected":False,
     "discovery_pooled":report(discovery),
     "season_report":{str(int(s)):report(x) for s,x in discovery.groupby("season")},
     "interpretation":[
       "Favorite flip is crossing zero, distinct from CROSS6 and generic movement.",
       "2021-2024 are discovery/descriptive only; no stratum may be promoted from this output.",
       "2025 is intentionally not evaluated by this script before a separate versioned promotion freeze.",
       "No 2026 outcome is used; no V1 rule is changed; no ROI is computed without frozen executable prices."
     ]}
with open(OUT,"w") as f: json.dump(out,f,indent=2,sort_keys=True)
print(json.dumps(out,indent=2,sort_keys=True))
