#!/usr/bin/env python3
import csv,io,json,os,re,sys,zipfile
from collections import defaultdict

def clean_name(s):
 import unicodedata
 s=unicodedata.normalize('NFD',s or ''); s=''.join(c for c in s if not unicodedata.combining(c)).lower()
 s=re.sub(r"[.'’\-]",' ',s); return re.sub(r'\s+',' ',s).strip()
def team(t): return {'OAK':'ATH','ARI':'AZ'}.get((t or '').upper().strip(),(t or '').upper().strip())
def read(z,n):
 with z.open(n) as f:return list(csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig',newline='')))
def files(z):return [n for n in z.namelist() if n.lower().endswith('.csv') and not n.startswith('__MACOSX/')]
def find(ns,s):
 a=[n for n in ns if s in os.path.basename(n).lower()]; return a[0] if a else None
def key(r):return clean_name(r.get('Player') or r.get('player')),team(r.get('Team') or r.get('team'))
def val(r,k):
 x=r.get(k,'')
 try:return float(str(x).replace('%','').strip())
 except:return None

def run(path):
 with zipfile.ZipFile(path) as z:
  ns=files(z); mv=read(z,find(ns,'hr-movement-')); date=re.search(r'20\d\d-\d\d-\d\d',find(ns,'hr-movement-')).group(0)
  universe={key(r) for r in mv}; metrics={}
  for slug,field in [('avg-ev','EV'),('hard-hit-%','HH'),('barrel-%','Barrel'),('iso','ISO'),('pull-%','Pull'),('fly-ball-%','FB')]:
   fn=find(ns,'metric-sort-')
   candidates=[n for n in ns if 'metric-sort-' in os.path.basename(n).lower() and slug in os.path.basename(n).lower()]
   if not candidates: continue
   rows=read(z,candidates[0]); d={}
   for r in rows:
    v=val(r, 'EV' if field=='EV' else ('Barrel%' if field=='Barrel' else ('ISO%' if field=='ISO' else 'Score')))
    # Historical metric-sort exports only preserve EV/Barrel/ISO columns; Pull/FB/HH values themselves are not exported.
    d[key(r)]=v
   metrics[field]={'rows':len(rows),'entities':len(d),'universe_coverage':len(set(d)&universe)}
  return {'date':date,'market_entities':len(universe),'exported_metric_files':metrics,
          'pullair_exported':False,'blast_exported':False,
          'finding':'Historical ZIP boards do not export PullAir% or Blast% values. Metric-sort Pull/FB/HH files preserve ranking membership but not their sorted metric value; they cannot prove exact PullAir/Blast semantics.'}

out={'slates':[run(p) for p in sys.argv[1:]]}
out['aggregate']={'pullair_value_exports':0,'blast_value_exports':0,'parity_status':'BLOCKED_NO_LEGACY_FIELD_VALUES'}
print(json.dumps(out,indent=2,ensure_ascii=False))
