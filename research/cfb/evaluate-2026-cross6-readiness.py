#!/usr/bin/env python3
import json, sys

SRC=sys.argv[1] if len(sys.argv)>1 else 'cfb-2026-cross6-prospective.json'
OUT=sys.argv[2] if len(sys.argv)>2 else 'cfb-2026-cross6-readiness.json'

x=json.load(open(SRC))
if x.get('protocol')!='CFB_2026_CROSS6_PROSPECTIVE_V1':
    raise SystemExit('unexpected prospective protocol')
if x.get('research_only') is not True or x.get('production_enabled') is not False:
    raise SystemExit('unsafe prospective state')

MILESTONES=(25,50,100)

def classify(s):
    n=int(s.get('nonpush_n') or 0)
    rate=s.get('hit_rate_no_push')
    low=s.get('wilson95_low')
    if n < 25:
        stage='TOO_EARLY'
    elif n < 50:
        stage='INITIAL_FORWARD_REVIEW'
    elif n < 100:
        stage='INTERMEDIATE_FORWARD_REVIEW'
    else:
        stage='FULL_FORWARD_REVIEW'
    return {
        'stage':stage,
        'nonpush_n':n,
        'W':int(s.get('W') or 0),
        'L':int(s.get('L') or 0),
        'P':int(s.get('P') or 0),
        'hit_rate_no_push':rate,
        'wilson95_low':low,
        'direction_above_random': bool(rate is not None and rate > 0.5),
        'wilson95_lower_above_random': bool(low is not None and low > 0.5),
        'next_milestone': next((m for m in MILESTONES if n < m), None)
    }

signals={k:classify(v) for k,v in x.get('signals',{}).items()}
# Automatic production is forbidden. Readiness only determines review depth.
full_review=all(v['stage']=='FULL_FORWARD_REVIEW' for v in signals.values()) if signals else False
strong_survival=all(v['wilson95_lower_above_random'] for v in signals.values()) if signals else False
out={
    'protocol':'CFB_2026_CROSS6_READINESS_V1',
    'source_protocol':x['protocol'],
    'as_of_snapshot_utc':x.get('as_of_snapshot_utc'),
    'research_only':True,
    'production_enabled':False,
    'automatic_enable_forbidden':True,
    'review_milestones_nonpush_n':[25,50,100],
    'signals':signals,
    'portfolio_review_state':'FULL_FORWARD_REVIEW_AVAILABLE' if full_review else 'NEED_MORE_FORWARD_DECISIONS',
    'strong_statistical_survival_at_current_sample':strong_survival,
    'decision_note':'Milestones control when deeper review is allowed; they are not betting thresholds. Production requires separate human review and verified price-aware evidence. No rule definitions may be retuned from 2026 outcomes.',
    'roi_status':x.get('roi_status'),
    'public_ticket_signals_tested':False
}
json.dump(out,open(OUT,'w'),indent=2,sort_keys=True)
print(json.dumps(out,indent=2,sort_keys=True))
