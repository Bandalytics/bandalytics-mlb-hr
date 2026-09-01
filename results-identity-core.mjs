export function aggregateHrEvents(events=[]){
  const by_id={},by_key={},homers={};
  for(const e of events){
    if(e?.batter_id!=null)by_id[e.batter_id]=(by_id[e.batter_id]||0)+1;
    const k=`${e?.player||''}::${e?.team||''}`;by_key[k]=(by_key[k]||0)+1;
    if(e?.player)homers[e.player]=(homers[e.player]||0)+1;
  }
  return{by_id,by_key,homers,hr_events:events.length,unique_batters:Object.keys(by_id).length};
}
