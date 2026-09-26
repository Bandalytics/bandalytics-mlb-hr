#!/usr/bin/env python3
import json, math, sys
import pandas as pd

GAMES=sys.argv[1]
LINES=sys.argv[2]
OUT=sys.argv[3] if len(sys.argv)>3 else 'cfb-discovery-interactions.json'

DISCOVERY=[2021,2022,2023,2024]
HOLDOUT=2025

g=pd.read_parquet(GAMES)
l=pd.read_parquet(LINES)
g=g[g['season'].isin(DISCOVERY)].copy()
l=l[l['season'].isin(DISCOVERY)].copy()
for df in (g,l):
    df['game_id']=pd.to_numeric(df['game_id'],errors='coerce').astype('Int64')

keep_l=['game_id','season','market_spread','market_spread_open','market_spread_book_count']
keep_g=['game_id','home_score','away_score']
df=l[[c for c in keep_l if c in l.columns]].merge(g[[c for c in keep_g if c in g.columns]],on='game_id',how='inner')
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

df['result']=df.apply(follow_result,axis=1)
df['home_role']=df.market_spread.map(lambda s:'FAVORITE' if s<0 else 'DOG' if s>0 else 'PICKEM')

def mag(x):
    a=abs(x)
    if a<0.5:return '<0.5'
    if a<1:return '0.5-0.99'
    if a<2:return '1-1.99'
    if a<3:return '2-2.99'
    return '3+'
df['move_band']=df.spread_move.map(mag)
df['books']=df.market_spread_book_count.fillna(0).map(lambda n:'3+' if n>=3 else '2' if n==2 else '1' if n==1 else '0')

def key_group(r):
    ao,ac=abs(r.market_spread_open),abs(r.market_spread)
    hits=[]
    for k in [3,6,7,10,14]:
        if min(ao,ac)<k<=max(ao,ac) or min(ao,ac)<=k<max(ao,ac):hits.append(k)
    if not hits:return 'NONE'
    if len(hits)>1:return 'MULTI'
    return f'CROSS_{hits[0]}'
df['key_group']=df.apply(key_group,axis=1)

def stat(frame):
    w=int((frame.result=='W').sum()); lo=int((frame.result=='L').sum()); p=int((frame.result=='P').sum()); n=w+lo+p; d=w+lo
    rate=w/d if d else None
    if d:
        z=1.96
        den=1+z*z/d
        center=(rate+z*z/(2*d))/den
        half=z*math.sqrt(rate*(1-rate)/d+z*z/(4*d*d))/den
        low=max(0,center-half); high=min(1,center+half)
    else: low=high=None
    return {'n':n,'nonpush_n':d,'W':w,'L':lo,'P':p,'hit_rate_no_push':rate,'wilson95_low':low,'wilson95_high':high}

# Predeclared research dimensions. No adaptive feature creation after results.
dims=['home_role','move_band','key_group','books']
rows=[]
for mask in range(1,1<<len(dims)):
    use=[dims[i] for i in range(len(dims)) if mask&(1<<i)]
    for keys,grp in df.groupby(use,dropna=False):
        if not isinstance(keys,tuple): keys=(keys,)
        overall=stat(grp)
        seasons={str(int(s)):stat(x) for s,x in grp.groupby('season')}
        eligible_seasons=[v for v in seasons.values() if v['nonpush_n']>=30]
        above=sum(1 for v in eligible_seasons if v['hit_rate_no_push'] is not None and v['hit_rate_no_push']>0.5)
        below=sum(1 for v in eligible_seasons if v['hit_rate_no_push'] is not None and v['hit_rate_no_push']<0.5)
        stability='MIXED'
        if len(eligible_seasons)>=3 and above>=3: stability='POSITIVE_3PLUS_SEASONS'
        elif len(eligible_seasons)>=3 and below>=3: stability='NEGATIVE_3PLUS_SEASONS'
        row={'dimensions':dict(zip(use,map(str,keys))),'overall':overall,'by_season':seasons,'eligible_seasons_n30':len(eligible_seasons),'positive_seasons':above,'negative_seasons':below,'stability':stability}
        # Screening flag only; not a betting rule. Requires meaningful sample and lower-bound > random.
        row['screen_positive']=bool(overall['nonpush_n']>=150 and overall['wilson95_low'] is not None and overall['wilson95_low']>0.5 and stability=='POSITIVE_3PLUS_SEASONS')
        row['screen_negative']=bool(overall['nonpush_n']>=150 and overall['wilson95_high'] is not None and overall['wilson95_high']<0.5 and stability=='NEGATIVE_3PLUS_SEASONS')
        rows.append(row)

rows.sort(key=lambda r:((r['overall']['wilson95_low'] or 0),r['overall']['nonpush_n']),reverse=True)
report={
 'discovery_seasons':DISCOVERY,
 'holdout_untouched':HOLDOUT,
 'evaluated_games':int(len(df)),
 'dimensions':dims,
 'screening_contract':{
   'research_only':True,
   'minimum_nonpush_n':150,
   'minimum_season_n':30,
   'minimum_consistent_seasons':3,
   'positive_requires_wilson95_low_gt_0_50':True,
   'negative_requires_wilson95_high_lt_0_50':True,
   'note':'Screen flags prioritize stable discovery interactions; they are not production betting rules and must survive untouched 2025 holdout.'
 },
 'positive_screens':[r for r in rows if r['screen_positive']],
 'negative_screens':[r for r in rows if r['screen_negative']],
 'top_25_by_wilson_lower_bound':[r for r in rows if r['overall']['nonpush_n']>=75][:25],
 'all_interactions_n75':[r for r in rows if r['overall']['nonpush_n']>=75],
 'notes':['Open-to-recorded-line discovery only.','No public-ticket percentages.','No ROI.','2025 is not read.']
}
with open(OUT,'w') as f:json.dump(report,f,indent=2,sort_keys=True)
print(json.dumps({k:report[k] for k in ['discovery_seasons','holdout_untouched','evaluated_games','screening_contract','positive_screens','negative_screens','top_25_by_wilson_lower_bound']},indent=2,sort_keys=True))
