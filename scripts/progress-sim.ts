/**
 * 진행 곡선 시뮬레이터 — 신규 캐릭터가 자동 전진으로 1막부터 진행할 때
 * 각 막 보스/승급 시험에 몇 분, 몇 레벨에 도달하는지 측정한다. (스킬 강화·장비 강화 없음 = 보수적)
 * P0-6: 마석 수입 + 탐욕적 소비(가장 싼 강화부터: 덱 스킬 강화 / 장착 마도구 강화). SIM_ECON=0 이면 소비 안 함
 *   ECON 값은 SIM_SKILL_BASE, SIM_SKILL_GROWTH, SIM_ENH_BASE, SIM_ENH_GROWTH, SIM_STONE 으로 덮어쓰기
 * P0-5: 장비 드랍(일반몹 24%, 보스 100%) + 일반 자동분해 + 드랍마다 최적 일괄 장착. SIM_GEAR=0 이면 장비 없음
 * 실행: npm run sim:progress
 */
import { ACTS } from '../src/data/acts';
import { ECON } from '../src/data/economy';
import { generateEquipment, getEnhanceCost, planBestLoadout, RARITY_META, rollRarity } from '../src/data/equipment';
import { RANKS } from '../src/data/schools';
import { ACT_RAMP, BOSS_TUNING, MOB_TUNING, createCombatRuntime, stepCombatTurn } from '../src/engine/combat';
import { applyExpAndLevelUp, computePlayerStats, createNewGameState, getSkillUpgradeCost } from '../src/engine/stats';
import type { CombatMode, GameState, RankIndex, SchoolId } from '../src/types/game';

const TURN_SEC = 0.78; // 기본 2배속
const TRANSITION_SEC = 0.47;
const MAX_SEC = 60 * 60 * 3;
const GEAR = process.env.SIM_GEAR !== '0';
const SPEND = process.env.SIM_ECON !== '0';
const envNum = (k: string) => (process.env[k] ? Number(process.env[k]) : undefined);
ECON.skillBase = envNum('SIM_SKILL_BASE') ?? ECON.skillBase;
ECON.skillGrowth = envNum('SIM_SKILL_GROWTH') ?? ECON.skillGrowth;
ECON.enhBase = envNum('SIM_ENH_BASE') ?? ECON.enhBase;
ECON.enhGrowth = envNum('SIM_ENH_GROWTH') ?? ECON.enhGrowth;
ECON.stoneScale = envNum('SIM_STONE_SCALE') ?? ECON.stoneScale;
ECON.stoneExp = envNum('SIM_STONE_EXP') ?? ECON.stoneExp;
ECON.skillRankMult = envNum('SIM_SKILL_RANK') ?? ECON.skillRankMult;
ECON.enhTierGrowth = envNum('SIM_ENH_TIER') ?? ECON.enhTierGrowth;
const LAST_ACT = Number(process.env.SIM_ACTS ?? 4);
if (process.env.SIM_MOB_ATK) MOB_TUNING.atkMult = Number(process.env.SIM_MOB_ATK);
if (process.env.SIM_MOB_HP) MOB_TUNING.hpMult = Number(process.env.SIM_MOB_HP);
if (process.env.SIM_RAMP) ACT_RAMP.perAct = Number(process.env.SIM_RAMP);
if (process.env.SIM_RAMP_ATK) ACT_RAMP.atkShare = Number(process.env.SIM_RAMP_ATK);
if (process.env.SIM_BOSS_HP) BOSS_TUNING.hpMult = Number(process.env.SIM_BOSS_HP);
if (process.env.SIM_BOSS_ATK) BOSS_TUNING.atkMult = Number(process.env.SIM_BOSS_ATK);

type Row = { what: string; min: number; lv: number; tries: number; stones: number; skillLv: number; enh: number; spentPct: number };

function fight(state: GameState, mode: CombatMode, act: number, stage: number) {
  const stats = computePlayerStats(state);
  let c = createCombatRuntime(state, stats, mode, act, stage);
  for (let i = 0; i < 120; i++) {
    const out = stepCombatTurn(c, state, stats);
    c = out.combat;
    if (out.result === 'victory' || out.result === 'defeat')
      return { win: out.result === 'victory', turns: c.turn, hpLost: 1 - c.playerHp / c.playerMaxHp, enemy: c.enemy };
  }
  return { win: false, turns: 120, hpLost: 0, enemy: c.enemy };
}

function dropAndEquip(s: GameState, act: number, boss: boolean): GameState {
  const item = generateEquipment(act, undefined, boss ? rollRarity(act, 24) : undefined);
  const f = s.settings.autoDismantleBelow;
  if (f !== 'none' && RARITY_META[item.rarity].order < RARITY_META[f].order) return s;
  const inv = [item, ...s.inventory].slice(0, 36);
  const plan = planBestLoadout(s.equipped, inv, s.school);
  return { ...s, equipped: plan.equipped, inventory: plan.inventory };
}

/** 가장 싼 강화부터 살 수 있을 만큼 구매 (플레이어가 틈틈이 강화 버튼을 누르는 상황) */
function spendGreedy(s: GameState): { s: GameState; spent: number } {
  let spent = 0;
  const maxLv = computePlayerStats(s).maxSkillLevel;
  for (let guard = 0; guard < 200; guard++) {
    let best: { cost: number; apply: (x: GameState) => GameState } | null = null;
    for (const sid of s.deck) {
      const sk = s.skills[sid];
      if (!sk?.unlocked || sk.level >= maxLv) continue;
      const cost = getSkillUpgradeCost(sk.level, sid);
      if (!best || cost < best.cost)
        best = { cost, apply: (x) => ({ ...x, skills: { ...x.skills, [sid]: { ...sk, level: sk.level + 1, exp: 0 } } }) };
    }
    for (const slot of ['staff', 'robe', 'grimoire', 'relic'] as const) {
      const it = s.equipped[slot];
      if (!it || it.enhance >= 15) continue;
      const cost = getEnhanceCost(it);
      if (!best || cost < best.cost)
        best = { cost, apply: (x) => ({ ...x, equipped: { ...x.equipped, [slot]: { ...it, enhance: it.enhance + 1 } } }) };
    }
    if (!best || s.stones < best.cost) break;
    s = { ...best.apply(s), stones: s.stones - best.cost };
    spent += best.cost;
  }
  return { s, spent };
}

function snapshot(s: GameState, earned: number, spent: number) {
  const lv = s.deck.map((d) => s.skills[d]?.level ?? 0);
  const eq = Object.values(s.equipped).filter(Boolean).map((e) => e!.enhance);
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  return { stones: s.stones, skillLv: avg(lv), enh: avg(eq), spentPct: earned > 0 ? spent / earned : 0 };
}

function runSchool(school: SchoolId) {
  let s: GameState = createNewGameState('sim', 'female', school);
  let t = 0;
  let act = 1, stage = 0, retry = 0, tries = 0, examTries = 0;
  const rows: Row[] = [];
  const mobTurns: number[] = [];
  const mobHp: number[] = [];
  let mobDeaths = 0;
  let earned = 0, spent = 0;
  const perAct: Record<number, { turns: number[]; hp: number[]; deaths: number }> = {};
  while (t < MAX_SEC && act <= LAST_ACT) {
    // 승급 시험: 조건 충족 시 즉시 도전 (실패 시 10마리 후 재도전)
    const next = (s.rank + 1) as RankIndex;
    const nr = RANKS[next];
    if (nr && s.level >= nr.reqLevel && s.clearedActs.length >= nr.reqClearedAct && retry <= 0 && ACTS[act - 1].requiredRank > s.rank) {
      const r = fight(s, 'rankBoss', act, 0);
      t += r.turns * TURN_SEC + TRANSITION_SEC;
      examTries++;
      if (r.win) {
        s = { ...s, rank: next };
        rows.push({ what: `${nr.name} 승급`, min: t / 60, lv: s.level, tries: examTries, ...snapshot(s, earned, spent) });
        examTries = 0;
      } else retry = 10;
      continue;
    }
    const blocked = ACTS[act - 1].requiredRank > s.rank;
    const st = blocked ? 3 : stage; // 계급 부족 시 이전 구간 파밍
    const farmAct = blocked ? act - 1 : act;
    const r = fight(s, 'stage', farmAct, st);
    t += r.turns * TURN_SEC + TRANSITION_SEC;
    if (st < 4 && !blocked) {
      const pa = (perAct[farmAct] ??= { turns: [], hp: [], deaths: 0 });
      pa.turns.push(r.turns); pa.hp.push(r.win ? r.hpLost : 1); if (!r.win) pa.deaths++;
    }
    if (st < 4) { mobTurns.push(r.turns); mobHp.push(r.win ? r.hpLost : 1); if (!r.win) mobDeaths++; }
    if (r.win) {
      const lv = applyExpAndLevelUp(s.level, s.exp, r.enemy.expReward);
      const gain = Math.round(r.enemy.stoneReward);
      earned += gain;
      s = { ...s, level: lv.level, exp: lv.exp, stones: s.stones + gain };
      if (SPEND) { const sp = spendGreedy(s); s = sp.s; spent += sp.spent; }
      if (GEAR && (st === 4 || Math.random() < 0.24)) s = dropAndEquip(s, farmAct, st === 4);
    }
    if (blocked) { retry--; continue; }
    // 일반몹 패배 시 한 단계 후퇴 (App 로직과 동일)
    if (st < 4 && !r.win) { stage = Math.max(0, st - 1); continue; }
    if (st < 3) { stage++; continue; }
    if (st === 3) { if (retry > 0) retry--; else stage = 4; continue; }
    // boss
    tries++;
    if (r.win) {
      rows.push({ what: `${act}막 보스`, min: t / 60, lv: s.level, tries, ...snapshot(s, earned, spent) });
      s = { ...s, clearedActs: [...s.clearedActs, act] };
      tries = 0; act++; stage = 0;
    } else { stage = 3; retry = 5; }
  }
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const actLine = Object.entries(perAct)
    .map(([a, v]) => `${a}막 ${avg(v.turns).toFixed(1)}턴/${Math.round(avg(v.hp) * 100)}%${v.deaths ? `/✝${v.deaths}` : ''}`)
    .join('  ');
  return { actLine, rows, mobTurns: avg(mobTurns), mobHp: avg(mobHp), mobDeaths, totalMin: t / 60 };
}

const schools: SchoolId[] = ['thunder', 'flame', 'frost', 'earth'];
for (const sc of schools) {
  const r = runSchool(sc);
  console.log(`\n[${sc}] 일반몹 평균 ${r.mobTurns.toFixed(1)}턴 · 전투당 HP손실 ${Math.round(r.mobHp * 100)}% · 일반몹 패배 ${r.mobDeaths}회`);
  console.log(`  [진행 중 일반몹] ${r.actLine}`);
  for (const row of r.rows)
    console.log(`  ${row.what.padEnd(10)} ${row.min.toFixed(1).padStart(6)}분  Lv${row.lv}  (${row.tries}회차)  보유◆${row.stones.toLocaleString()}  스킬Lv${row.skillLv.toFixed(1)}  강화+${row.enh.toFixed(1)}  소비율${Math.round(row.spentPct * 100)}%`);
}
