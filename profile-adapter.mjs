// Research-only direct profile primitives. Do not feed v37 until full parity is proven.
export function summarizeStatcast(rows=[]){
 let bbe=0, evSum=0, hh=0, barrels=0, ab=0, hits=0, tb=0;
 const abEvents=new Set(['single','double','triple','home_run','field_out','force_out','grounded_into_double_play','field_error','fielders_choice','fielders_choice_out','strikeout','strikeout_double_play','double_play','triple_play']);
 for(const r of rows){
   const ev=number(r.launch_speed??r.ev), bb=String(r.bb_type??''), lsa=number(r.launch_speed_angle), event=String(r.events??'');
   if(ev!=null&&bb){bbe++;evSum+=ev;if(ev>=95)hh++;if(lsa===6)barrels++;}
   if(event&&abEvents.has(event)){
     ab++;
     if(event==='single'){hits++;tb+=1}else if(event==='double'){hits++;tb+=2}else if(event==='triple'){hits++;tb+=3}else if(event==='home_run'){hits++;tb+=4}
   }
 }
 return {
   ev:bbe?evSum/bbe:null,
   hard_hit:bbe?100*hh/bbe:null,
   barrel:bbe?100*barrels/bbe:null,
   iso:ab?(tb-hits)/ab:null,
   bbe_sample:bbe,
   ab_sample:ab,
   pullair:null,
   blast:null,
   unsupported_fields:['pullair','blast'],
   profile_status:(bbe&&ab)?'RESEARCH_PARTIAL':'PENDING'
 };
}
function number(v){if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
export function normalizeProfileEntity({player,team,player_id,rows=[]}={}){
 const s=summarizeStatcast(rows);
 return {player,team,player_id:player_id==null?null:+player_id,...s,profile_source:'BASEBALL_SAVANT_DIRECT_RESEARCH',profile_ready:false,scoring_eligible:false,profile_reason:s.profile_status==='RESEARCH_PARTIAL'?'EV/HH/Barrel/ISO generated; PullAir/Blast parity not proven':'Insufficient direct profile sample'};
}
