#!/usr/bin/env python3
import hashlib, json, math, sys
import pandas as pd

GAMES=sys.argv[1]
LINES=sys.argv[2]
SNAPS=sys.argv[3]
OUT=sys.argv[4] if len(sys.argv)>4 else 'cfb-2026-cross6-prospective.json'
SEASON=2026

def sha256_file(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()

# Frozen forward candidates from the untouched 2025 holdout decision.
ALLOWED_IDS=('CROSS6','BOOKS3PLUS_CROSS6')

def stat(results):
    w=sum(x=='W' for x in results); l=sum(x=='L' for x in results); p=sum(x=='P' for x in results); d=w+l
    rate=w/d if d else None
    if d:
        z=1.96; den=1+z*z/d
        center=(rate+z*z/(2*d))/den
        half=z*math.sqrt(rate*(1-rate)/d+z*z/(4*d*d))/den
        low=max(0,center-half); high=min(1,center+half)
    else: low=high=None
    return {'n':w+l+p,'nonpush_n':d,'W':w,'L':l,'P':p,'hit_rate_no_push':rate,'wilson95_low':low,'wilson95_high':high}

def key_group(open_line,current_line):
    ao,ac=abs(float(open_line)),abs(float(current_line))
    hits=[]
    for k in [3,6,7,10,14]:
        if min(ao,ac)<k<=max(ao,ac) or min(ao,ac)<=k<max(ao,ac): hits.append(k)
    if not hits:return 'NONE'
    if len(hits)>1:return 'MULTI'
    return f'CROSS_{hits[0]}'

def follow_result(home_score,away_score,current_spread,move):
    hv=(float(home_score)-float(away_score))+float(current_spread)
    if hv==0:return 'P'
    home='W' if hv>0 else 'L'
    return home if move<0 else ('L' if home=='W' else 'W')

g=pd.read_parquet(GAMES)
l=pd.read_parquet(LINES)
s=pd.read_parquet(SNAPS)

need_g=['game_id','season','start_date','home_team','away_team','home_score','away_score']
need_l=['game_id','season','market_spread_open']
need_s=['game_id','sportsbook','market','side','captured_at','line']
missing=[c for c in need_g if c not in g.columns]+[c for c in need_l if c not in l.columns]+[c for c in need_s if c not in s.columns]
if missing: raise SystemExit(f'missing columns: {missing}')

for df in (g,l,s): df['game_id']=pd.to_numeric(df['game_id'],errors='coerce').astype('Int64')
g=g[g['season']==SEASON].copy(); l=l[l['season']==SEASON].copy()
g['start_date']=pd.to_datetime(g['start_date'],errors='coerce',utc=True)
s['captured_at']=pd.to_datetime(s['captured_at'],errors='coerce',utc=True)
s=s[(s['market'].astype(str).str.lower()=='spread') & (s['side'].astype(str).str.lower()=='home')].copy()
if 'is_live' in s.columns: s=s[~s['is_live'].fillna(False).astype(bool)].copy()
s['line']=pd.to_numeric(s['line'],errors='coerce')
s=s.dropna(subset=['game_id','sportsbook','captured_at','line'])
if s.empty: raise SystemExit('no eligible forward snapshots')
as_of=s['captured_at'].max()

base=g[need_g].merge(l[need_l],on='game_id',how='left',validate='one_to_one')
base['market_spread_open']=pd.to_numeric(base['market_spread_open'],errors='coerce')
frozen_rows=[]
provisional_rows=[]
for r in base.itertuples(index=False):
    if pd.isna(r.start_date) or pd.isna(r.market_spread_open): continue
    q=s[(s.game_id==r.game_id) & (s.captured_at<r.start_date)].copy()
    if q.empty: continue
    # For started games the final eligible pre-kickoff quote is frozen. Future games are provisional only.
    q=q.sort_values('captured_at').groupby('sportsbook',as_index=False).tail(1)
    current=float(q['line'].median()); books=int(q['sportsbook'].nunique())
    move=current-float(r.market_spread_open)
    if move==0: continue
    kg=key_group(r.market_spread_open,current)
    if kg!='CROSS_6': continue
    signal_time=q['captured_at'].max()
    settled=not (pd.isna(r.home_score) or pd.isna(r.away_score))
    result=follow_result(r.home_score,r.away_score,current,move) if settled else None
    row={
        'game_id':int(r.game_id),'home_team':r.home_team,'away_team':r.away_team,
        'kickoff_utc':r.start_date.isoformat(),'signal_snapshot_utc':signal_time.isoformat(),
        'open_home_spread':float(r.market_spread_open),'snapshot_home_spread':current,
        'spread_move':move,'book_count':books,'key_group':kg,
        'signal_side':'HOME' if move<0 else 'AWAY','result':result,
        'books3plus':books>=3
    }
    if r.start_date<=as_of:
        frozen_rows.append(row)
    else:
        provisional_rows.append(row)

cross=[r['result'] for r in frozen_rows if r['result'] in ('W','L','P')]
books3=[r['result'] for r in frozen_rows if r['books3plus'] and r['result'] in ('W','L','P')]
out={
    'protocol':'CFB_2026_CROSS6_PROSPECTIVE_V1','season':SEASON,'research_only':True,'production_enabled':False,
    'as_of_snapshot_utc':as_of.isoformat(),
    'source_provenance':{
        'games_sha256':sha256_file(GAMES),
        'lines_sha256':sha256_file(LINES),
        'line_snapshots_sha256':sha256_file(SNAPS)
    },
    'roi_status':'NOT_COMPUTED_NO_VERIFIED_FROZEN_PRICE','public_ticket_signals_tested':False,
    'snapshot_contract':'For each sportsbook, final immutable non-live home-spread quote captured strictly before kickoff; cross-book current line is median of those quotes. Opening line is frozen market_spread_open from processed lines consensus. A qualifying event enters the frozen ledger only after kickoff is at or before the latest captured snapshot timestamp; future games remain provisional and cannot affect settled counts.',
    'signals':{
        'CROSS6':stat(cross),
        'BOOKS3PLUS_CROSS6':stat(books3)
    },
    'qualifying_events':frozen_rows,
    'provisional_watch_events':provisional_rows,
    'notes':[
        'Definitions are unchanged from the 2025 surviving frozen screens.',
        'Every frozen qualifying event is retained; no losses may be dropped and no thresholds may be retuned from 2026 outcomes.',
        'Future-game matches are provisional only because additional pre-kickoff quotes can change whether they qualify.',
        'This is timestamped shadow validation, not an execution or production-betting rule.',
        'No ROI is reported without verified frozen prices actually available at the signal timestamp.'
    ]
}
json.dump(out,open(OUT,'w'),indent=2,sort_keys=True)
print(json.dumps(out,indent=2,sort_keys=True))
