import fs from 'node:fs/promises';
import path from 'node:path';
import { profileComplete } from '../v38-profile-validity.mjs';
import { selectLatestValidProfileSnapshot } from '../v38-profile-snapshot-selector.mjs';
import { evaluateV38CandidateRules } from '../v38-gate-rules.mjs';
import { selectLatestPregameContext, contextForGame, validContextSnapshot } from '../v38-context-selector.mjs';
import { loadModifierArtifactSets, attachProspectiveModifierBands } from '../v38-modifier-artifacts.mjs';
import { classifyLongshotQuality } from '../v38-longshot-quality.mjs';
import { researchPoolHierarchy, V38_RESEARCH_POOL_HIERARCHY } from '../v38-research-pool-hierarchy.mjs';
import { V38_POOL_ARCHITECTURE_V2, classifyPoolLayer, isStructuredPoolLayer, poolArchitectureProspectiveActive } from '../v38-pool-architecture-v2.mjs';
import { validParkFactorSnapshot, selectLatestPregameParkSnapshot, parkFactorForVenue, effectiveParkBatSide } from '../v38-park-factor-policy.mjs';
import { V38_POOL_SHORTLIST_V3, snapshotSlateGameCount, dynamicReviewPolicy } from '../v38-pool-shortlist-v3.mjs';

async function files(root) {
  const out = [];
  async function walk(p) {
    let es;
    try { es = await fs.readdir(p, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const q = path.join(p, e.name);
      if (e.isDirectory()) await walk(q);
      else if (e.isFile() && e.name.endsWith('.json')) out.push(q);
    }
  }
  await walk(root);
  return out;
}
async function loadJsons(root) {
  const out = [];
  for (const f of await files(root)) {
    try { out.push(JSON.parse(await fs.readFile(f, 'utf8'))); } catch {}
  }
  return out;
}
const pct = (n, d) => d ? +(100 * n / d).toFixed(2) : 0;
function marketOdds(m) {
  const x = Number(m?.best_odds ?? m?.current_odds ?? m?.american_odds);
  return Number.isFinite(x) ? x : null;
}
function genericQuality(c) {
  if (c?.rules?.['5of6'] === true || c?.gate_count >= 5) return 'PROTECTED_5OF6_PLUS';
  if (c?.rules?.['4of6_iso'] === true || (c?.gate_count >= 4 && c?.passes?.iso === true)) return 'QUALITY_4OF6_PLUS_ISO';
  if (c?.gate_count >= 4) return 'BASE_PROFILE_4OF6';
  return 'INELIGIBLE';
}
const rank = { CORE_PROTECTED_PLUS:1, CORE_PROTECTED:2, CORE_QUALITY_PLUS:3, CORE_QUALITY:4, STRONG_PROFILE:5, QUALITY_WITH_BBE_SUPPORT:6, QUALITY_PROFILE:7, WATCH_BASE_ELIGIBLE:8, EXCLUDE_OR_OTHER_MARKET_RULE:99 };

const profileDir = process.argv[2] || 'incoming/profile';
const contextDir = process.argv[3] || 'incoming/contexts';
const modifierDir = process.argv[4] || 'incoming/modifiers';
const outPath = process.argv[5] || 'snapshots/v38-daily-research-board.json';
const parkDir = process.argv[6] || 'incoming/park';

const profileCandidates = await loadJsons(profileDir);
const snap = selectLatestValidProfileSnapshot(profileCandidates);
if (!snap) throw Error('no valid cryptographically verified pregame profile snapshot');
const date = snap.date;
const prospectiveArchitectureActive = poolArchitectureProspectiveActive(date);
const originalSlateGames = snapshotSlateGameCount(snap);
if (originalSlateGames < (snap.pregame_games || []).length) throw Error('invalid V3 slate game provenance');
const reviewPolicy = dynamicReviewPolicy(originalSlateGames);
const contexts = (await loadJsons(contextDir)).filter(z => z.date === date && validContextSnapshot(z));
const parkSnapshots = (await loadJsons(parkDir)).filter(z => z.date === date && validParkFactorSnapshot(z));
const mods = await loadModifierArtifactSets(modifierDir, date);
const games = new Map((snap.pregame_games || []).map(g => [+g.gamePk, g]));
const teamGame = new Map();
for (const g of games.values()) {
  teamGame.set(+g.away_team_id, +g.gamePk);
  teamGame.set(+g.home_team_id, +g.gamePk);
}

let rows = [];
for (const p of snap.items || []) {
  if (!profileComplete(p)) continue;
  const gamePk = teamGame.get(+p.team_id);
  if (!gamePk) continue;
  const g = games.get(gamePk);
  const ctx = selectLatestPregameContext(contexts, gamePk, g.start_time);
  const gc = ctx ? contextForGame(ctx, gamePk) : null;
  const market = gc?.market_rows?.find(x => +x.player_id === +p.player_id) || null;
  const lineup = gc?.lineup_rows?.find(x => +x.player_id === +p.player_id) || null;
  const c = evaluateV38CandidateRules(p);
  const matchup = gc?.game ? `${gc.game.away} @ ${gc.game.home}` : `${g.away} @ ${g.home}`;
  const parkSnapshot = selectLatestPregameParkSnapshot(parkSnapshots, g.start_time);
  const effectiveBatSide = effectiveParkBatSide(lineup?.bat_side, lineup?.opp_pitcher_hand);
  const park = parkSnapshot && gc?.game?.venue && effectiveBatSide ? parkFactorForVenue(parkSnapshot, gc.game.venue, effectiveBatSide) : null;
  let r = {
    player_id:+p.player_id, player:p.player || null, team_id:+p.team_id, gamePk, matchup, start_time:g.start_time,
    profile_gate_count:c.gate_count, profile_passes:c.passes,
    lineup:Number(lineup?.lineup) || null, bat_side:lineup?.bat_side || null, effective_bat_side:effectiveBatSide,
    opp_pitcher_hand:lineup?.opp_pitcher_hand || null, american_odds:marketOdds(market), best_book:market?.best_book || null,
    open_odds:Number.isFinite(Number(market?.open_odds)) ? Number(market.open_odds) : null, market_signal:market?.signal || null,
    market_move_pct:market?.move_pct ?? null, context_captured_at:ctx?.captured_at || null, context_snapshot_sha256:ctx?.sha256 || null,
    venue:gc?.game?.venue || null, park_factor:park, park_factor_captured_at:park?.captured_at || null, park_factor_role:park?.role || null
  };
  r = attachProspectiveModifierBands(r, mods, { date, gamePk, startTime:g.start_time, matchup });
  const generic = genericQuality(c);
  const longshot = r.american_odds != null && r.american_odds >= 700 ? classifyLongshotQuality(p, r.american_odds) : null;
  const qualityTier = longshot ? longshot.quality_tier : generic;
  const hierarchy = researchPoolHierarchy({quality_tier:qualityTier,pitchfit_band:r.pitchfit_band,bbe_band:r.bbe_band,lineup:r.lineup,american_odds:r.american_odds});
  const poolLayer = classifyPoolLayer({date,priority_band:hierarchy.priority_band,quality_tier:qualityTier,american_odds:r.american_odds,longshot_policy:longshot});
  const longshotBlocked = !!longshot && ['INELIGIBLE','NOT_LONGSHOT_WINDOW'].includes(longshot.quality_tier);
  r.quality_tier = qualityTier;
  r.priority_band = hierarchy.priority_band;
  r.hierarchy = hierarchy;
  r.pool_layer = poolLayer;
  r.structured_pool_candidate = isStructuredPoolLayer(poolLayer);
  r.eligible_research_pool = !longshotBlocked && hierarchy.priority_band !== 'EXCLUDE_OR_OTHER_MARKET_RULE';
  r.longshot_policy = longshot;
  r.longshot_700_rule = longshot ? { applies:longshot.applicable === true, eligible:longshot.qualifies === true, passed:longshot.pass_count, stronger_5of6:longshot.stronger_5of6 === true, policy_id:longshot.policy_id } : { applies:false };
  rows.push(r);
}

rows.sort((a,b) => (rank[a.priority_band] ?? 99) - (rank[b.priority_band] ?? 99) || ((b.profile_gate_count || 0) - (a.profile_gate_count || 0)) || ((a.american_odds ?? 99999) - (b.american_odds ?? 99999)));
const qualified = rows.filter(r => r.eligible_research_pool);
const core = qualified.filter(r => r.pool_layer === 'CORE');
const protectedPool = qualified.filter(r => r.pool_layer === 'PROTECTED_POOL');
const qualityPool = qualified.filter(r => r.pool_layer === 'QUALITY_VALUE_POOL');
const escapeWatch = qualified.filter(r => r.pool_layer === 'ESCAPE_WATCH');
const structured = qualified.filter(r => r.structured_pool_candidate);

const body = {
  protocol:'V38_DAILY_RESEARCH_BOARD_V2', date, generated_at:new Date().toISOString(),
  source_profile_snapshot_sha256:snap.sha256, source_profile_captured_at:snap.captured_at,
  point_in_time:true, research_only:true, scoring_enabled:false, scoring_eligible:false, model_scoring_changed:false,
  pool_target_role:'PREFERRED_RANGE_NOT_REQUIRED',
  pool_target:[V38_POOL_SHORTLIST_V3.preferred_review_range.min, V38_POOL_SHORTLIST_V3.preferred_review_range.max],
  pool_target_forced:false,
  pool_architecture:{
    protocol:V38_POOL_ARCHITECTURE_V2.protocol,
    hierarchy_protocol:V38_RESEARCH_POOL_HIERARCHY.protocol,
    shortlist_protocol:V38_POOL_SHORTLIST_V3.protocol,
    first_prospective_date:V38_POOL_SHORTLIST_V3.first_prospective_date,
    prospective_active:prospectiveArchitectureActive,
    pre_prospective_noncore_fail_closed:!prospectiveArchitectureActive,
    original_slate_game_count:originalSlateGames,
    slate_size_source:'VERIFIED_PROFILE_PREGAME_PLUS_EXCLUDED_STARTED_UNIQUE_GAMEPK',
    dynamic_review_ceiling:reviewPolicy.ceiling,
    dynamic_ceiling_policy:V38_POOL_SHORTLIST_V3.dynamic_ceiling,
    preferred_review_range:V38_POOL_SHORTLIST_V3.preferred_review_range,
    no_minimum:true,
    production_rule_changed:false,
    final_pool_promoted:false
  },
  vig_required:false,
  automation_role:'FIRST_PARTY_DAILY_RESEARCH_ORCHESTRATION',
  coverage:{
    profile_rows:rows.length,
    rows_with_context:rows.filter(r=>r.context_captured_at).length,
    rows_with_market:rows.filter(r=>r.american_odds!=null).length,
    rows_with_pitchfit:rows.filter(r=>r.pitchfit).length,
    rows_with_full_bbe:rows.filter(r=>+r.bbe?.tracked_bbe>=15).length,
    rows_with_park_factor:rows.filter(r=>r.park_factor).length,
    context_pct:pct(rows.filter(r=>r.context_captured_at).length,rows.length),
    market_pct:pct(rows.filter(r=>r.american_odds!=null).length,rows.length),
    pitchfit_pct:pct(rows.filter(r=>r.pitchfit).length,rows.length),
    bbe_full_pct:pct(rows.filter(r=>+r.bbe?.tracked_bbe>=15).length,rows.length),
    park_factor_pct:pct(rows.filter(r=>r.park_factor).length,rows.length),
    park_snapshots_loaded:parkSnapshots.length
  },
  counts:{
    all_profile_complete:rows.length,
    qualified_research_pool:qualified.length,
    structured_pool_candidates:structured.length,
    core_research_pool:core.length,
    protected_pool_rows:protectedPool.length,
    quality_value_pool_rows:qualityPool.length,
    escape_watch_rows:escapeWatch.length,
    longshot_700_rows:rows.filter(r=>r.longshot_700_rule.applies).length,
    longshot_700_eligible:rows.filter(r=>r.longshot_700_rule.applies&&r.longshot_700_rule.eligible).length
  },
  core_pool:core,
  protected_pool:protectedPool,
  quality_value_pool:qualityPool,
  escape_watch:escapeWatch,
  structured_pool:structured,
  qualified_pool:qualified,
  rows,
  notes:[
    'This board replaces manual cross-site orchestration for the supported data layers; Vig may remain an optional cross-check only.',
    'No scoring or production final-pool promotion occurs here.',
    'Core uses the same shared hierarchy as the live board. Protected, Quality/Value, and Escape Watch fail closed before the preregistered 2026-09-04 first prospective date.',
    '20-25 is a preferred review range only and is never forced; V3 uses a slate-sized ceiling of 20, 25, or 30 from unique pregame plus excluded-started games in the verified profile snapshot.',
    'Candidate rows still exclude games already started; started games only preserve immutable slate-size provenance.',
    'Profile and context provenance are fail-closed: both source snapshot hashes are independently verified before use.',
    'Park factor is support-only, requires exact effective L/R batting side versus the opposing pitcher, and is selected from the latest valid point-in-time snapshot strictly before each game start.',
    'Historical weather parity and final production scoring remain separate blocked gates.'
  ]
};
await fs.mkdir(path.dirname(outPath), { recursive:true });
await fs.writeFile(outPath, JSON.stringify(body, null, 2) + '\n');
console.log(`V38_DAILY_RESEARCH_BOARD_PATH=${outPath}`);
console.log(`V38_DAILY_RESEARCH_BOARD=${JSON.stringify({date,prospective_architecture_active:prospectiveArchitectureActive,review_policy:reviewPolicy,coverage:body.coverage,counts:body.counts})}`);
