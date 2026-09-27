#!/usr/bin/env python3
import json, math, sys
import pandas as pd

GAMES=sys.argv[1]
LINES=sys.argv[2]
SPEC=sys.argv[3] if len(sys.argv)>3 else 'research/cfb/CFB_DISCOVERY_FREEZE_V1.json'
OUT=sys.argv[4] if len(sys.argv)>4 else 'cfb-2025-holdout.json'

spec=json.load(open(SPEC))
if spec.get('protocol')!='CFB_DISCOVERY_FREEZE_V1' or spec.get('holdout_season')!=2025:
    raise SystemExit('invalid frozen spec')
if spec.get('production_enabled') is not False or spec.get('roi_allowed') is not False:
    raise SystemExit('unsafe frozen spec')

g=pd.read_parquet(GAMES)
l=pd.read_parquet(LINES)
g=g[g['season']==2025].copy()
l=l[l['season']==2025].copy()
for df in (g,l):
    df['game_id']=pd.to_numeric(df['game_id'],errors='coerce').astype('Int64')

need_l=['game_id','season','market_spread','market_spread_open','market_spread_book_count']
need_g=['game_id','home_score','away_score']
missing=[c for c in need_l if c not in l.columns]+[c for c in need_g if c not in g.columns]
if missing: raise SystemExit(f'missing columns: {missing}')

df=l[need_l].merge(g[need_g],on='game_id',how='inner')
for c in ['market_spread','market_spread_open','market_spread_book_count','home_score','away_score']:
    df[c]=pd.to_numeric(df[c],errors='coerce')
df=df.dropna(subset=['market_spread','market_spread_open','home_score','away_score']).copy()
df['spread_move']=df['market_spread']-df['market_spread_open']
df=df[df['spread_move']!=0].copy()
df['home_cover_value']=(df.home_score-df.away_score)+df.market_spread

def follow_result(r):
    hv=r.home_cover_value
    if hv==0:return 'P'
    home='W' if hv>0 else 'L'
    if r.spread_move<0:return home
    return 'L' if home=='W' else 'W'

def move_band(x):
    a=abs(x)
    if a<0.5:return '<0.5'
    if a<1:return '0.5-0.99'
    if a<2:return '1-1.99'
    if a<3:return '2-2.99'
    return '3+'

def key_group(r):
    ao,ac=abs(r.market_spread_open),abs(r.market_spread)
    hits=[]
    for k in [3,6,7,10,14]:
        if min(ao,ac)<k<=max(ao,ac) or min(ao,ac)<=k<max(ao,ac): hits.append(k)
    if not hits:return 'NONE'
    if len(hits)>1:return 'MULTI'
    return f'CROSS_{hits[0]}'

def stat(frame):
    w=int((frame.result=='W').sum()); lo=int((frame.result=='L').sum()); p=int((frame.result=='P').sum()); d=w+lo
    rate=w/d if d else None
    if d:
        z=1.96; den=1+z*z/d
        center=(rate+z*z/(2*d))/den
        half=z*math.sqrt(rate*(1-rate)/d+z*z/(4*d*d))/den
        low=max(0,center-half); high=min(1,center+half)
    else: low=high=None
    return {'n':w+lo+p,'nonpush_n':d,'W':w,'L':lo,'P':p,'hit_rate_no_push':rate,'wilson95_low':low,'wilson95_high':high}

df['result']=df.apply(follow_result,axis=1)
df['home_role']=df.market_spread.map(lambda s:'FAVORITE' if s<0 else 'DOG' if s>0 else 'PICKEM')
df['move_band']=df.spread_move.map(move_band)
df['books']=df.market_spread_book_count.fillna(0).map(lambda n:'3+' if n>=3 else '2' if n==2 else '1' if n==1 else '0')
df['key_group']=df.apply(key_group,axis=1)

results=[]
for screen in spec['frozen_positive_screens']:
    m=pd.Series(True,index=df.index)
    for k,v in screen['dimensions'].items(): m &= df[k].astype(str).eq(str(v))
    s=stat(df[m])
    results.append({'id':screen['id'],'dimensions':screen['dimensions'],'discovery':screen['discovery'],'holdout':s})

out={
    'protocol':'CFB_2025_HOLDOUT_V1',
    'frozen_spec_protocol':spec['protocol'],
    'holdout_season':2025,
    'production_enabled':False,
    'roi_status':'NOT_COMPUTED_NO_VERIFIED_FROZEN_PRICE',
    'public_ticket_signals_tested':False,
    'evaluated_moving_line_games':int(len(df)),
    'screens':results,
    'notes':['Exact frozen discovery definitions only.','No post-holdout screen selection or threshold tuning.','Raw W/L/P and Wilson intervals only; no ROI claim.','Recorded line is not assumed to be a timestamped pre-kickoff close.']
}
json.dump(out,open(OUT,'w'),indent=2,sort_keys=True)
print(json.dumps(out,indent=2,sort_keys=True))
