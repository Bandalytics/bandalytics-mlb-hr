import {aggregateHrEvents} from './results-identity-core.mjs';
const events=[
 {batter_id:571970,player:'Max Muncy',team:'LAD'},
 {batter_id:691777,player:'Max Muncy',team:'ATH'},
 {batter_id:571970,player:'Max Muncy',team:'LAD'},
 {batter_id:123,player:'Other Hitter',team:'NYY'}
];
const z=aggregateHrEvents(events);
if(z.hr_events!==4)throw Error('HR event count');
if(z.unique_batters!==3)throw Error('unique batter count');
if(z.by_id[571970]!==2||z.by_id[691777]!==1)throw Error('MLBAM identity aggregation');
if(z.by_key['Max Muncy::LAD']!==2||z.by_key['Max Muncy::ATH']!==1)throw Error('team identity aggregation');
if(z.homers['Max Muncy']!==3)throw Error('legacy display aggregate');
console.log('RESULTS IDENTITY PASS');
