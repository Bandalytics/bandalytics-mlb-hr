#!/usr/bin/env python3
import json, sys
from datetime import datetime

SRC=sys.argv[1] if len(sys.argv)>1 else 'cfb-2026-cross6-prospective.json'
x=json.load(open(SRC))
if x.get('protocol')!='CFB_2026_CROSS6_PROSPECTIVE_V1':
    raise SystemExit('unexpected protocol')
if x.get('research_only') is not True or x.get('production_enabled') is not False:
    raise SystemExit('unsafe state')
if x.get('roi_status')!='NOT_COMPUTED_NO_VERIFIED_FROZEN_PRICE':
    raise SystemExit('unexpected ROI state')
if x.get('public_ticket_signals_tested') is not False:
    raise SystemExit('public-ticket contamination')

def dt(v): return datetime.fromisoformat(v.replace('Z','+00:00'))
frozen=x.get('qualifying_events',[])
prov=x.get('provisional_watch_events',[])
ids=[r['game_id'] for r in frozen]
if len(ids)!=len(set(ids)): raise SystemExit('duplicate frozen game_id')
if set(ids) & {r['game_id'] for r in prov}: raise SystemExit('game appears frozen and provisional')
asof=dt(x['as_of_snapshot_utc'])

for r in frozen+prov:
    ko=dt(r['kickoff_utc']); sig=dt(r['signal_snapshot_utc'])
    if not sig < ko: raise SystemExit(f"non-pregame signal {r['game_id']}")
    if r.get('key_group')!='CROSS_6': raise SystemExit(f"non-CROSS6 event {r['game_id']}")
    if int(r.get('book_count',0)) < 1: raise SystemExit(f"bad book count {r['game_id']}")
    if bool(r.get('books3plus')) != (int(r['book_count'])>=3): raise SystemExit(f"books3 flag mismatch {r['game_id']}")
    move=float(r['spread_move'])
    expected='HOME' if move<0 else 'AWAY'
    if move==0 or r.get('signal_side')!=expected: raise SystemExit(f"signal side mismatch {r['game_id']}")
for r in frozen:
    if dt(r['kickoff_utc']) > asof: raise SystemExit(f"future event frozen {r['game_id']}")
for r in prov:
    if dt(r['kickoff_utc']) <= asof: raise SystemExit(f"started event provisional {r['game_id']}")

def counts(rows):
    rs=[r.get('result') for r in rows if r.get('result') in ('W','L','P')]
    w=rs.count('W'); l=rs.count('L'); p=rs.count('P')
    return {'n':len(rs),'nonpush_n':w+l,'W':w,'L':l,'P':p}

for name,rows in [('CROSS6',frozen),('BOOKS3PLUS_CROSS6',[r for r in frozen if r['books3plus']])]:
    got=x['signals'][name]; exp=counts(rows)
    for k,v in exp.items():
        if int(got.get(k,-1))!=v: raise SystemExit(f"{name} {k} mismatch: {got.get(k)} != {v}")

print(json.dumps({'integrity':'PASS','frozen_events':len(frozen),'provisional_events':len(prov),'as_of_snapshot_utc':x['as_of_snapshot_utc']},sort_keys=True))
