#!/usr/bin/env python3
import json, os, re, sys
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

# Source bytes are part of the prospective evidence. Require immutable fingerprints
# so a later rerun cannot silently swap source files while retaining the same protocol.
prov=x.get('source_provenance') or {}
for key in ('games_sha256','lines_sha256','line_snapshots_sha256'):
    value=str(prov.get(key) or '')
    if not re.fullmatch(r'[0-9a-f]{64}', value):
        raise SystemExit(f'missing/invalid source provenance: {key}')

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

# If a committed frozen checkpoint exists, enforce append-only decision-time fields.
checkpoint='research/cfb/CFB_2026_CROSS6_FROZEN_LEDGER_V1.json'
if os.path.exists(checkpoint):
    old_doc=json.load(open(checkpoint))
    old={r['game_id']:r for r in old_doc.get('qualifying_events',[])}
    new={r['game_id']:r for r in frozen}
    missing=sorted(set(old)-set(new))
    if missing:
        raise SystemExit(f'previously frozen events disappeared: {missing}')
    decision_fields=(
        'home_team','away_team','kickoff_utc','signal_snapshot_utc',
        'open_home_spread','snapshot_home_spread','spread_move','book_count',
        'key_group','signal_side','books3plus',
    )
    for game_id,old_row in old.items():
        new_row=new[game_id]
        for field in decision_fields:
            if old_row.get(field) != new_row.get(field):
                raise SystemExit(f'frozen event {game_id} changed {field}')
        old_result=old_row.get('result')
        new_result=new_row.get('result')
        if old_result in ('W','L','P') and new_result != old_result:
            raise SystemExit(f'settled result changed for {game_id}: {old_result!r} -> {new_result!r}')
        if old_result is None and new_result not in (None,'W','L','P'):
            raise SystemExit(f'invalid settlement transition for {game_id}: {new_result!r}')
