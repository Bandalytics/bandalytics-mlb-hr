import fs from 'node:fs/promises';

const files=process.argv.slice(2);
if(files.length<1)throw Error('usage: node scripts/summarize-v38-execution-handoffs.mjs <handoff.json> [...]');
const slates=[];
for(const file of files){
  const z=JSON.parse(await fs.readFile(file,'utf8'));
  const p=z?.recovered_plan_summary;
  if(!p)throw Error(`missing recovered_plan_summary: ${file}`);
  slates.push({
    date:z.date||null,
    final_pool_n:p.final_pool_n??0,
    ticketed_n:p.ticketed_n??0,
    zero_path_n:p.zero_path_n??0,
    pool_coverage_pct:p.pool_coverage_pct??null,
    total_ticket_paths:p.total_ticket_paths??0,
    top3_leg_concentration_pct:p.top3_leg_concentration_pct??null,
    nonstarter_n:p.nonstarter_n??0,
    nonstarter_ticket_paths:p.nonstarter_ticket_paths??0,
    exact_ticket_count:p.exact_ticket_count??0,
    known_ticket_outcomes_n:p.known_ticket_outcomes_n??0,
    winning_tickets_n:p.winning_tickets_n??0,
    ticket_conversion_pct:p.ticket_conversion_pct??null,
    exact_max_portfolio_dependency_player:p.exact_max_portfolio_dependency_player??null,
    exact_max_portfolio_dependency_pct:p.exact_max_portfolio_dependency_pct??null,
    resolved_policy_rows:p.resolved_policy_rows??0,
    resolved_final_pool_policy_mismatch_n:p.resolved_final_pool_policy_mismatch_n??0,
    opportunity_mismatch_count:z.combined_opportunity_mismatch_count??0,
    replay_qualified_n:z?.summary?.qualified?.n??0,
    replay_qualified_hr:z?.summary?.qualified?.hr??0,
    replay_final_pool_n:z?.summary?.final_pool?.n??0,
    replay_final_pool_hr:z?.summary?.final_pool?.hr??0,
    replay_ticketed_eligible_n:z?.summary?.ticketed_eligible?.n??0,
    replay_ticketed_eligible_hr:z?.summary?.ticketed_eligible?.hr??0
  });
}
const sum=k=>slates.reduce((s,x)=>s+(Number(x[k])||0),0);
const finalPool=sum('final_pool_n'),ticketed=sum('ticketed_n'),knownTickets=sum('known_ticket_outcomes_n');
const out={
  protocol:'BANDALYTICS_EXECUTION_HANDOFF_MULTISLATE_V1',
  research_only:true,
  production_rule_changed:false,
  dates:slates.map(x=>x.date),
  slate_count:slates.length,
  aggregate:{
    final_pool_n:finalPool,
    ticketed_n:ticketed,
    zero_path_n:sum('zero_path_n'),
    pooled_pool_coverage_pct:finalPool?+(100*ticketed/finalPool).toFixed(2):null,
    total_ticket_paths:sum('total_ticket_paths'),
    nonstarter_n:sum('nonstarter_n'),
    nonstarter_ticket_paths:sum('nonstarter_ticket_paths'),
    exact_ticket_count:sum('exact_ticket_count'),
    known_ticket_outcomes_n:knownTickets,
    winning_tickets_n:sum('winning_tickets_n'),
    pooled_ticket_conversion_pct:knownTickets?+(100*sum('winning_tickets_n')/knownTickets).toFixed(2):null,
    opportunity_mismatch_count:sum('opportunity_mismatch_count'),
    resolved_policy_rows:sum('resolved_policy_rows'),
    resolved_final_pool_policy_mismatch_n:sum('resolved_final_pool_policy_mismatch_n'),
    replay_qualified_n:sum('replay_qualified_n'),
    replay_qualified_hr:sum('replay_qualified_hr'),
    replay_final_pool_n:sum('replay_final_pool_n'),
    replay_final_pool_hr:sum('replay_final_pool_hr'),
    replay_ticketed_eligible_n:sum('replay_ticketed_eligible_n'),
    replay_ticketed_eligible_hr:sum('replay_ticketed_eligible_hr')
  },
  slates
};
const outfile='snapshots/v38-execution-handoff-multislate-summary.json';
await fs.mkdir('snapshots',{recursive:true});
await fs.writeFile(outfile,JSON.stringify(out,null,2)+'\n','utf8');
console.log('V38_EXECUTION_HANDOFF_MULTISLATE='+JSON.stringify({outfile,aggregate:out.aggregate,slates:out.slates}));
