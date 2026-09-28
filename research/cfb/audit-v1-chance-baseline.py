#!/usr/bin/env python3
"""Frozen V1 chance-baseline audit.

Uses only preregistered aggregate counts already frozen in the repository.
No rule selection, no 2026 outcomes, no prices, and no production promotion.
"""
import json, math
from pathlib import Path

ROOT=Path(__file__).resolve().parent
freeze=json.loads((ROOT/"CFB_DISCOVERY_FREEZE_V1.json").read_text())

# Untouched 2025 holdout results recorded before this audit existed.
HOLDOUT={
    "CROSS6": {"W":29,"L":16,"P":0},
    "BOOKS3PLUS_CROSS6": {"W":27,"L":15,"P":0},
}

def binom_tail_ge(w,n,p=.5):
    return sum(math.comb(n,k)*(p**k)*((1-p)**(n-k)) for k in range(w,n+1))

def wilson(w,n,z=1.96):
    if not n:return [None,None]
    ph=w/n; den=1+z*z/n
    c=(ph+z*z/(2*n))/den
    h=z*math.sqrt(ph*(1-ph)/n+z*z/(4*n*n))/den
    return [max(0,c-h),min(1,c+h)]

out={
 "protocol":"CFB_V1_CHANCE_BASELINE_AUDIT_V1",
 "research_only":True,
 "production_enabled":False,
 "rules_frozen":True,
 "uses_2026_outcomes":False,
 "roi_computed":False,
 "null_hypothesis":"independent 50% ATS win probability excluding pushes",
 "tests":{}
}
for s in freeze["frozen_positive_screens"]:
    sid=s["id"]
    if sid not in HOLDOUT: continue
    d=s["discovery"]; h=HOLDOUT[sid]
    dw,dl=d["W"],d["L"]; hw,hl=h["W"],h["L"]
    cn=dw+dl+hw+hl; cw=dw+hw
    out["tests"][sid]={
      "discovery":{"W":dw,"L":dl,"n":dw+dl,"hit_rate":dw/(dw+dl),
                   "one_sided_binomial_p_vs_50":binom_tail_ge(dw,dw+dl)},
      "holdout_2025":{"W":hw,"L":hl,"n":hw+hl,"hit_rate":hw/(hw+hl),
                      "one_sided_binomial_p_vs_50":binom_tail_ge(hw,hw+hl),
                      "wilson95":wilson(hw,hw+hl)},
      "combined_descriptive_not_independent_rule_selection":{"W":cw,"L":cn-cw,"n":cn,
                      "hit_rate":cw/cn,"one_sided_binomial_p_vs_50":binom_tail_ge(cw,cn),
                      "wilson95":wilson(cw,cn)}
    }
out["interpretation"]=[
 "Discovery p-values are descriptive because the rule was selected in discovery; they are not confirmatory evidence.",
 "The untouched 2025 holdout is the confirmatory historical check.",
 "Combined discovery+holdout is descriptive only because discovery participated in rule selection.",
 "No multiplicity-adjusted production claim is made; CROSS6 and BOOKS3PLUS_CROSS6 are nested and correlated.",
 "Older 2015-2019 closing-line-only control data cannot test exact CROSS6 because the frozen rule requires compatible opening and recorded spread fields.",
 "Prospective 2026 remains the decisive forward-validation lane."
]
print(json.dumps(out,indent=2,sort_keys=True))
