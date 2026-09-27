#!/usr/bin/env python3
import json, sys
from datetime import datetime

SRC=sys.argv[1] if len(sys.argv)>1 else 'cfb-2026-cross6-prospective.json'
x=json.load(open(SRC))
assert x.get('protocol')=='CFB_2026_CROSS6_PROSPECTIVE_V1'
assert x.get('research_only') is True and x.get('production_enabled') is False
assert x.get('roi_status')=='NOT_COMPUTED_NO_VERIFIED_FROZEN_PRICE'
assert x.get('public_ticket_signals_tested') is False

events=x.get('qualifying_events',[])
provisional=x.get('provisional_watch_events',[])
ids=[e['game_id'] for e in events]
assert len(ids)==len(set(ids)), 'duplicate frozen game_id'
assert not (set(ids)&{e['game_id'] for e in provisional}), 'game appears frozen and provisional'

def dt(s): return datetime.fromisoformat(s.replace('Z','+00:00'))
for e in events:
    assert dt(e['signal_snapshot_utc']) < dt(e['kickoff_utc']), 'snapshot not strictly pre-kickoff'
    assert e['key_group']=='CROSS_6'
    assert e['result'] in (None,'W','L','P')
    assert e['signal_side'] in ('HOME','AWAY')
    assert bool(e['books3plus']) == (int(e['book_count'])>=3)
for e in provisional:
    assert dt(e['signal_snapshot_utc']) < dt(e['kickoff_utc']), 'provisional snapshot not pre-kickoff'
    assert e['key_group']=='CROSS_6'

def stat(rows):
    r=[e['result'] for e in rows if e.get('result') in ('W','L','P')]
    return {'W':r.count('W'),'L':r.count('L'),'P':r.count('P'),'nonpush_n':r.count('W')+r.count('L'),'n':len(r)}
checks={
 'CROSS6':stat(events),
 'BOOKS3PLUS_CROSS6':stat([e for e in events if e.get('books3plus')])
}
for k,c in checks.items():
    s=x['signals'][k]
    for f,v in c.items(): assert int(s[f])==v, f'{k} {f} mismatch'
print(json.dumps({'protocol':'CFB_2026_CROSS6_INTEGRITY_V1','status':'PASS','frozen_events':len(events),'provisional_events':len(provisional),'checks':checks},indent=2))
