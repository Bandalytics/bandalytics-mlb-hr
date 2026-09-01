#!/usr/bin/env python3
import csv,io,json,os,re,sys,zipfile
from collections import Counter,defaultdict

def read(z,n):
    with z.open(n) as f:return list(csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig',newline='')))

def csvs(z):return [n for n in z.namelist() if n.lower().endswith('.csv') and not n.startswith('__MACOSX/')]
def find(ns,needle):
    x=[n for n in ns if needle in os.path.basename(n).lower()]
    return x[0] if x else None

def cohort_key(r,player=False):
    return (r.get('Team') or r.get('team') or '',r.get('vs Pitcher') or r.get('opp_pitcher') or '')

def run(path):
    with zipfile.ZipFile(path) as z:
        ns=csvs(z); mvn=find(ns,'hr-movement-'); mv=read(z,mvn)
        date=re.search(r'20\d\d-\d\d-\d\d',mvn).group(0)
        universe=Counter((r.get('team',''),r.get('opp_pitcher','')) for r in mv)
        out={'date':date}
        for lens in ['tired-pen','vs-weak-pitcher','barrel-match','double-edge','hidden-edge','mispriced']:
            fn=find(ns,lens)
            if not fn: continue
            rows=read(z,fn); got=Counter(cohort_key(r) for r in rows)
            cohorts=[]; complete=0
            for k,n in sorted(got.items()):
                u=universe[k]; full=(n==u and u>0)
                complete+=int(full)
                cohorts.append({'team':k[0],'opp_pitcher':k[1],'lens_rows':n,'universe_rows':u,'complete_cohort':full})
            out[lens]={'rows':len(rows),'cohorts':len(got),'complete_cohorts':complete,'all_cohorts_complete':complete==len(got),'detail':cohorts}
        return out

def main(paths):
    reps=[run(p) for p in paths]
    agg={}
    for lens in ['tired-pen','vs-weak-pitcher','barrel-match','double-edge','hidden-edge','mispriced']:
        xs=[r[lens] for r in reps if lens in r]
        if not xs:continue
        agg[lens]={'slates':len(xs),'rows':sum(x['rows'] for x in xs),'cohorts':sum(x['cohorts'] for x in xs),'complete_cohorts':sum(x['complete_cohorts'] for x in xs),'all_complete_every_slate':all(x['all_cohorts_complete'] for x in xs)}
    print(json.dumps({'slates':reps,'aggregate':agg},indent=2,ensure_ascii=False))
if __name__=='__main__':main(sys.argv[1:])
