/**
 * 진행 곡선 시뮬레이터 — 신규 캐릭터가 자동 전진으로 1막부터 진행할 때
 * 각 막 보스/승급 시험에 몇 분, 몇 레벨에 도달하는지 측정한다. (스킬 강화·장비 강화 없음 = 보수적)
 * P0-5: 장비 드랍(일반몹 24%, 보스 100%) + 일반 자동분해 + 드랍마다 최적 일괄 장착. SIM_GEAR=0 이면 장비 없음
 * 실행: npm run sim:progress
 */
import { ACTS } from '../src/data/acts';
import { generateEquipment, planBestLoadout, RARITY_META, rollRarity } from '../src/data/equipment';
import { RANKS } from '../src/data/schools';
import { MOB_TUNING, createCombatRuntime, stepCombatTurn } from '../src/engine/combat';
import { applyExpAndLevelUp, computePlayerStats, createNewGameState } from '../src/engine/stats';
import type { CombatMode, GameState, RankIndex, SchoolId } from '../src/types/game';

const TURN_SEC = 0.78; // 기본 2배속
const TRANSITION_SEC = 0.47;
const MAX_SEC = 60 * 60 * 3;
const GEAR = process.env.SIM_GEAR !== '0';
const LAST_ACT = Number(process.env.SIM_ACTS ?? 4);
if (process.env.SIM_MOB_ATK) MOB_TUNING.atkMult = Number(process.env.SIM_MOB_ATK);
if (process.env.SIM_MOB_HP) MOB_TUNING.hpMult = Number(process.env.SIM_MOB_HP);

type Row = { what: string; min: number; lv: number; tries: number };

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

function runSchool(school: SchoolId) {
  let s: GameState = createNewGameState('sim', 'female', school);
  let t = 0;
  let act = 1, stage = 0, retry = 0, tries = 0, examTries = 0;
  const rows: Row[] = [];
  const mobTurns: number[] = [];
  const mobHp: number[] = [];
  let mobDeaths = 0;
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
        rows.push({ what: `${nr.name} 승급`, min: t / 60, lv: s.level, tries: examTries });
        examTries = 0;
      } else retry = 10;
      continue;
    }
    const blocked = ACTS[act - 1].requiredRank > s.rank;
    const st = blocked ? 3 : stage; // 계급 부족 시 이전 구간 파밍
    const farmAct = blocked ? act - 1 : act;
    const r = fight(s, 'stage', farmAct, st);
    t += r.turns * TURN_SEC + TRANSITION_SEC;
    if (st < 4) { mobTurns.push(r.turns); mobHp.push(r.win ? r.hpLost : 1); if (!r.win) mobDeaths++; }
    if (r.win) {
      const lv = applyExpAndLevelUp(s.level, s.exp, r.enemy.expReward);
      s = { ...s, level: lv.level, exp: lv.exp };
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
      rows.push({ what: `${act}막 보스`, min: t / 60, lv: s.level, tries });
      s = { ...s, clearedActs: [...s.clearedActs, act] };
      tries = 0; act++; stage = 0;
    } else { stage = 3; retry = 5; }
  }
  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  return { rows, mobTurns: avg(mobTurns), mobHp: avg(mobHp), mobDeaths, totalMin: t / 60 };
}

const schools: SchoolId[] = ['thunder', 'flame', 'frost', 'earth'];
for (const sc of schools) {
  const r = runSchool(sc);
  console.log(`\n[${sc}] 일반몹 평균 ${r.mobTurns.toFixed(1)}턴 · 전투당 HP손실 ${Math.round(r.mobHp * 100)}% · 일반몹 패배 ${r.mobDeaths}회`);
  for (const row of r.rows)
    console.log(`  ${row.what.padEnd(10)} ${row.min.toFixed(1).padStart(6)}분  Lv${row.lv}  (${row.tries}회차)`);
}
