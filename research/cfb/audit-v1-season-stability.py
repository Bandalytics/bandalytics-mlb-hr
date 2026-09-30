#!/usr/bin/env python3
"""Frozen V1 season-by-season compatibility and stability audit.

Evaluates only the exact preregistered CROSS6 / BOOKS3PLUS_CROSS6 definitions.
No rule search, no public-ticket fields, no prices/ROI, and no production promotion.
Older seasons are included only when the frozen rule's required source fields exist.
"""
import json, math, sys
import pandas as pd

GAMES=sys.argv[1]; LINES=sys.argv[2]
OUT=sys.argv[3] if len(sys.argv)>3 else "cfb-v1-season-stability.json"

g=pd.read_parquet(GAMES).copy(); l=pd.read_parquet(LINES).copy()
for df in (g,l):
    df["game_id"]=pd.to_numeric(df["game_id"],errors="coerce").astype("Int64")
required=["game_id","season","market_spread","market_spread_open","market_spread_book_count"]
missing=[c for c in required if c not in l.columns]
if missing: raise SystemExit(f"missing required line fields: {missing}")
if not {"home_score","away_score"}.issubset(g.columns): raise SystemExit("missing game result fields")

df=l[required].merge(g[["game_id","home_score","away_score"]],on="game_id",how="inner")
for c in ["season","market_spread","market_spread_open","market_spread_book_count","home_score","away_score"]:
    df[c]=pd.to_numeric(df[c],errors="coerce")

def wilson(w,n,z=1.96):
    if not n:return [None,None]
    p=w/n; den=1+z*z/n; ctr=(p+z*z/(2*n))/den
    half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den
    return [max(0,ctr-half),min(1,ctr+half)]

def stat(x):
    w=int((x.result=="W").sum()); lo=int((x.result=="L").sum()); p=int((x.result=="P").sum()); n=w+lo
    return {"W":w,"L":lo,"P":p,"nonpush_n":n,"hit_rate_no_push":w/n if n else None,"wilson95":wilson(w,n)}

season_report={}
for season, raw in df.groupby("season",dropna=True):
    s=str(int(season)); total=len(raw)
    compat=raw.dropna(subset=["market_spread","market_spread_open","home_score","away_score"]).copy()
    season_report[s]={"source_rows":int(total),"compatible_rows":int(len(compat)),"compatible_fraction":len(compat)/total if total else 0}
    if compat.empty:
        season_report[s]["status"]="INCOMPATIBLE_NO_COMPLETE_OPEN_RECORDED_SPREAD"
        continue
    compat["move"]=compat.market_spread-compat.market_spread_open
    compat=compat[compat["move"]!=0].copy()
    compat["home_cover_value"]=(compat.home_score-compat.away_score)+compat.market_spread
    def result(r):
        if r.home_cover_value==0:return "P"
        home="W" if r.home_cover_value>0 else "L"
        return home if r["move"]<0 else ("L" if home=="W" else "W")
    compat["result"]=compat.apply(result,axis=1)
    # Match the frozen key_group semantics exactly: CROSS_6 means 6 is the
    # only registered key crossed. A move that also crosses 3/7/10/14 is
    # MULTI in the preregistered holdout evaluator and must not be counted.
    ao=compat.market_spread_open.abs(); ac=compat.market_spread.abs()
    lo=pd.concat([ao,ac],axis=1).min(axis=1)
    hi=pd.concat([ao,ac],axis=1).max(axis=1)
    crossed=[]
    for k in [3,6,7,10,14]:
        crossed.append(((lo<k)&(hi>=k))|((lo<=k)&(hi>k)))
    cross_count=sum(x.astype(int) for x in crossed)
    cross6=crossed[1] & (cross_count==1)
    c=compat[cross6].copy()
    season_report[s].update({"status":"COMPATIBLE","CROSS6":stat(c),"BOOKS3PLUS_CROSS6":stat(c[c.market_spread_book_count>=3])})

out={
 "protocol":"CFB_V1_SEASON_STABILITY_AUDIT_V1",
 "research_only":True,"production_enabled":False,"rules_frozen":True,
 "signals":["CROSS6","BOOKS3PLUS_CROSS6"],
 "decision_line_semantics":"open-to-recorded market spread; recorded line is not assumed timestamped close",
 "public_ticket_fields_used":False,"roi_computed":False,
 "season_report":season_report,
 "interpretation":[
  "This audit does not search for or retune rules.",
  "A season is evidence only to the extent required frozen-rule fields are actually present.",
  "Discovery seasons 2021-2024 are descriptive because they participated in rule selection.",
  "2025 remains the untouched historical holdout; 2026 prospective evidence remains decisive.",
  "Older seasons with absent opening-spread fields are explicitly incompatible rather than imputed."
 ]
}
with open(OUT,"w") as f: json.dump(out,f,indent=2,sort_keys=True)
print(json.dumps(out,indent=2,sort_keys=True))
