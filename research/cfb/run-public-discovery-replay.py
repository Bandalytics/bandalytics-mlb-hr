#!/usr/bin/env python3
import json, math, sys
import pandas as pd

GAMES=sys.argv[1]
LINES=sys.argv[2]
OUT=sys.argv[3] if len(sys.argv)>3 else 'cfb-discovery-replay.json'

g=pd.read_parquet(GAMES)
l=pd.read_parquet(LINES)
# Discovery only. Holdout 2025 remains untouched.
l=l[l['season'].isin([2021,2022,2023,2024])].copy()
g=g[g['season'].isin([2021,2022,2023,2024])].copy()
# robust id normalization
for df in (g,l):
    if 'game_id' in df: df['game_id']=pd.to_numeric(df['game_id'], errors='coerce').astype('Int64')

cols=['game_id','season','market_spread','market_spread_open','market_total','market_total_open','home_moneyline','away_moneyline','market_spread_book_count','market_total_book_count','market_spread_dispersion','market_total_dispersion']
l=l[[c for c in cols if c in l.columns]].copy()
need_game=['game_id','season','home_score','away_score','home_team','away_team']
g=g[[c for c in need_game if c in g.columns]].copy()
df=l.merge(g.drop(columns=['season'],errors='ignore'),on='game_id',how='inner')
for c in ['market_spread','market_spread_open','market_total','market_total_open','home_score','away_score','market_spread_book_count','market_total_book_count','market_spread_dispersion','market_total_dispersion']:
    if c in df: df[c]=pd.to_numeric(df[c],errors='coerce')

def res(v):
    if pd.isna(v): return None
    return 'W' if v>0 else 'L' if v<0 else 'P'

def agg(vals):
    vals=[x for x in vals if x in ('W','L','P')]
    w=vals.count('W'); lo=vals.count('L'); p=vals.count('P')
    return {'n':len(vals),'W':w,'L':lo,'P':p,'hit_rate_no_push':(w/(w+lo) if w+lo else None)}

def by(frame,key,result_col):
    out={}
    for k,x in frame.groupby(key,dropna=False):
        out[str(k)]=agg(x[result_col].tolist())
    return out

# Outcome at recorded line.
df['home_ats']=df.apply(lambda r: res((r.home_score-r.away_score)+r.market_spread) if pd.notna(r.market_spread) else None,axis=1)
df['over']=df.apply(lambda r: res((r.home_score+r.away_score)-r.market_total) if pd.notna(r.market_total) else None,axis=1)
df['spread_move']=df['market_spread']-df['market_spread_open']
df['total_move']=df['market_total']-df['market_total_open']
# Following line movement: negative home spread move => home; positive => away.
def follow_side(r):
    if pd.isna(r.spread_move) or r.spread_move==0 or r.home_ats is None: return None
    if r.spread_move<0: return r.home_ats
    return {'W':'L','L':'W','P':'P'}[r.home_ats]
def fade_side(r):
    x=follow_side(r)
    return None if x is None else {'W':'L','L':'W','P':'P'}[x]
def follow_total(r):
    if pd.isna(r.total_move) or r.total_move==0 or r.over is None:return None
    if r.total_move>0:return r.over
    return {'W':'L','L':'W','P':'P'}[r.over]
def fade_total(r):
    x=follow_total(r)
    return None if x is None else {'W':'L','L':'W','P':'P'}[x]
df['follow_spread_move']=df.apply(follow_side,axis=1)
df['fade_spread_move']=df.apply(fade_side,axis=1)
df['follow_total_move']=df.apply(follow_total,axis=1)
df['fade_total_move']=df.apply(fade_total,axis=1)

def mag(x):
    if pd.isna(x):return 'MISSING'
    a=abs(x)
    if a<0.5:return '<0.5'
    if a<1:return '0.5-0.99'
    if a<2:return '1-1.99'
    if a<3:return '2-2.99'
    return '3+'
df['spread_move_band']=df['spread_move'].map(mag)
df['total_move_band']=df['total_move'].map(mag)
df['home_role']=df['market_spread'].map(lambda s:'MISSING' if pd.isna(s) else 'FAVORITE' if s<0 else 'DOG' if s>0 else 'PICKEM')

def crosses(open_line, close_line):
    if pd.isna(open_line) or pd.isna(close_line):return 'MISSING'
    ao,ac=abs(open_line),abs(close_line)
    hit=[]
    for k in [3,6,7,10,14]:
        if min(ao,ac)<k<=max(ao,ac) or min(ao,ac)<=k<max(ao,ac):hit.append(str(k))
    return 'NONE' if not hit else 'CROSS_'+','.join(hit)
df['key_cross']=df.apply(lambda r:crosses(r.market_spread_open,r.market_spread),axis=1)
df['spread_books']=df['market_spread_book_count'].fillna(0).map(lambda n:'3+' if n>=3 else '2' if n==2 else '1' if n==1 else '0')
df['total_books']=df['market_total_book_count'].fillna(0).map(lambda n:'3+' if n>=3 else '2' if n==2 else '1' if n==1 else '0')

report={
 'discovery_seasons':[2021,2022,2023,2024],
 'holdout_untouched':2025,
 'rows':int(len(df)),
 'spread_open_current_rows':int(df[['market_spread','market_spread_open']].dropna().shape[0]),
 'total_open_current_rows':int(df[['market_total','market_total_open']].dropna().shape[0]),
 'home_ats_recorded_line':agg(df.home_ats.tolist()),
 'over_recorded_total':agg(df.over.tolist()),
 'follow_spread_move':agg(df.follow_spread_move.tolist()),
 'fade_spread_move':agg(df.fade_spread_move.tolist()),
 'follow_total_move':agg(df.follow_total_move.tolist()),
 'fade_total_move':agg(df.fade_total_move.tolist()),
 'follow_spread_by_season':by(df,'season','follow_spread_move'),
 'follow_spread_by_move_band':by(df,'spread_move_band','follow_spread_move'),
 'follow_spread_by_home_role':by(df,'home_role','follow_spread_move'),
 'follow_spread_by_key_cross':by(df,'key_cross','follow_spread_move'),
 'follow_spread_by_book_count':by(df,'spread_books','follow_spread_move'),
 'follow_total_by_move_band':by(df,'total_move_band','follow_total_move'),
 'follow_total_by_book_count':by(df,'total_books','follow_total_move'),
 'notes':['Research-only open-to-recorded-line replay. Recorded line is not assumed to be a timestamped pre-kickoff close.','No public-ticket percentages used.','No ROI calculated.']
}
with open(OUT,'w') as f: json.dump(report,f,indent=2,sort_keys=True)
print(json.dumps(report,indent=2,sort_keys=True))
