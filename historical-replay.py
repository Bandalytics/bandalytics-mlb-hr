#!/usr/bin/env python3
import argparse,csv,io,json,math,os,re,zipfile
from collections import defaultdict

def implied(o):
    o=float(o)
    return 100/(o+100) if o>0 else (-o)/((-o)+100)

def delta(a,b):
    return round((implied(b)-implied(a))*100,2)

def clean_team(t):
    t=(t or '').upper().strip()
    return {'OAK':'ATH','ARI':'AZ'}.get(t,t)

def clean_name(s):
    import unicodedata
    s=unicodedata.normalize('NFD',s or '')
    s=''.join(c for c in s if not unicodedata.combining(c)).lower()
    s=re.sub(r"[.'’\-]",' ',s)
    return re.sub(r'\s+',' ',s).strip()

def read_csv_from_zip(zf,name):
    with zf.open(name) as f:
        return list(csv.DictReader(io.TextIOWrapper(f,encoding='utf-8-sig',newline='')))

def files(zf):
    return [n for n in zf.namelist() if not n.startswith('__MACOSX/') and n.lower().endswith('.csv')]

def find_one(names,needle):
    hits=[n for n in names if needle in os.path.basename(n)]
    return hits[0] if hits else None

def keys(rows,player='Player',team='Team'):
    return {(clean_name(r.get(player,'')),clean_team(r.get(team,''))) for r in rows if r.get(player)}

def replay(path):
    with zipfile.ZipFile(path) as z:
        ns=files(z)
        movement_name=find_one(ns,'hr-movement-')
        if not movement_name: raise RuntimeError(f'no movement in {path}')
        m=read_csv_from_zip(z,movement_name)
        date=re.search(r'(20\d\d-\d\d-\d\d)',movement_name).group(1)
        identities=[(clean_name(r['player']),clean_team(r['team'])) for r in m]
        display={clean_name(r['player']) for r in m}
        movement_calc=[]
        for r in m:
            if r.get('open') and r.get('now') and r.get('delta_implied_pct'):
                movement_calc.append((delta(r['open'],r['now']),round(float(r['delta_implied_pct']),2)))
        move_ok=sum(a==b for a,b in movement_calc)
        sharp_file=find_one(ns,'sharp-money-')
        sharp=keys(read_csv_from_zip(z,sharp_file)) if sharp_file else set()
        pred={(clean_name(r['player']),clean_team(r['team'])) for r in m if r.get('open') and r.get('now') and delta(r['open'],r['now'])>=2.00}
        lens_counts={}
        for n in ns:
            b=os.path.basename(n)
            if not b.startswith('hrboard-'): continue
            lens=re.sub(r'-20\d\d-\d\d-\d\d\.csv$','',b[len('hrboard-'):])
            lens_counts[lens]=len(read_csv_from_zip(z,n))
        max_muncys=[r for r in m if clean_name(r['player'])=='max muncy']
        return {
            'date':date,'movement_rows':len(m),'entity_count':len(set(identities)),'display_name_count':len(display),
            'movement_formula':{'checked':len(movement_calc),'exact':move_ok,'mismatch':len(movement_calc)-move_ok},
            'sharp_money':{'expected':len(sharp),'generated':len(pred),'tp':len(sharp&pred),'fp':len(pred-sharp),'fn':len(sharp-pred)},
            'max_muncys':[{'team':clean_team(r['team']),'open':r.get('open'),'now':r.get('now'),'best_odds':r.get('best_odds'),'opp_pitcher':r.get('opp_pitcher')} for r in max_muncys],
            'lens_counts':dict(sorted(lens_counts.items()))
        }

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('zips',nargs='+'); ap.add_argument('--out'); args=ap.parse_args()
    reps=[replay(p) for p in args.zips]
    total_checked=sum(x['movement_formula']['checked'] for x in reps); total_exact=sum(x['movement_formula']['exact'] for x in reps)
    sharp={'expected':sum(x['sharp_money']['expected'] for x in reps),'generated':sum(x['sharp_money']['generated'] for x in reps),'tp':sum(x['sharp_money']['tp'] for x in reps),'fp':sum(x['sharp_money']['fp'] for x in reps),'fn':sum(x['sharp_money']['fn'] for x in reps)}
    out={'slates':reps,'aggregate':{'movement_checked':total_checked,'movement_exact':total_exact,'sharp_money':sharp}}
    s=json.dumps(out,indent=2,ensure_ascii=False)
    print(s)
    if args.out: open(args.out,'w',encoding='utf-8').write(s+'\n')
if __name__=='__main__': main()
