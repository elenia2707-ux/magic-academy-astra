/**
 * 밸런스 시뮬레이터 — 브라우저 없이 실제 전투 엔진(stepCombatTurn)으로 N회 전투를 돌려 통계를 낸다.
 * 실행: npm run sim  (esbuild 번들 → node)
 */
import { BOSS_TUNING, createCombatRuntime, stepCombatTurn } from '../src/engine/combat';
import { computePlayerStats, createNewGameState } from '../src/engine/stats';
import type { CombatMode, GameState, SchoolId } from '../src/types/game';

const RUNS = 300;

function makeState(level: number, school: SchoolId, act: number): GameState {
  const s = createNewGameState('시뮬', 'female', school);
  return { ...s, level, selectedAct: act, highestAct: act, selectedStage: 4, highestStageInAct: 4 };
}

function fight(state: GameState, mode: CombatMode, act: number, stage: number) {
  const stats = computePlayerStats(state);
  let c = createCombatRuntime(state, stats, mode, act, stage);
  let heavyMaxPct = 0;
  for (let i = 0; i < 80; i++) {
    const before = c.playerHp;
    const wasTele = c.enemyTelegraph;
    const out = stepCombatTurn(c, state, stats);
    if (wasTele) heavyMaxPct = Math.max(heavyMaxPct, (before - out.combat.playerHp) / c.playerMaxHp);
    c = out.combat;
    if (out.result === 'victory') return { win: true, turns: c.turn, heavyMaxPct, hpLeft: c.playerHp / c.playerMaxHp };
    if (out.result === 'defeat') return { win: false, turns: c.turn, heavyMaxPct, hpLeft: 0 };
  }
  return { win: false, turns: 80, heavyMaxPct, hpLeft: c.playerHp / c.playerMaxHp };
}

function report(label: string, level: number, school: SchoolId, mode: CombatMode, act: number, stage: number) {
  const st = makeState(level, school, act);
  let wins = 0, turns = 0, heavy = 0, hpLeft = 0;
  for (let i = 0; i < RUNS; i++) {
    const r = fight(st, mode, act, stage);
    if (r.win) wins++;
    turns += r.turns; heavy += r.heavyMaxPct; hpLeft += r.hpLeft;
  }
  console.log(
    `${label.padEnd(22)} Lv${String(level).padStart(2)} ${school.padEnd(8)} 승률 ${String(Math.round((wins / RUNS) * 100)).padStart(3)}%  평균 ${(turns / RUNS).toFixed(1).padStart(4)}턴  강공격 ${Math.round((heavy / RUNS) * 100)}%HP  잔여HP ${Math.round((hpLeft / RUNS) * 100)}%`
  );
}

const schools: SchoolId[] = ['thunder', 'flame', 'frost', 'earth'] as SchoolId[];
const scenarios: Array<[string, CombatMode, number, number, number]> = [
  ['1막 일반몹 1-4', 'stage', 1, 3, 8],
  ['1막 보스 락엘르', 'stage', 1, 4, 8],
  ['1막 보스 락엘르', 'stage', 1, 4, 10],
  ['1막 보스 락엘르', 'stage', 1, 4, 13],
  ['1막 보스 락엘르', 'stage', 1, 4, 21],
];

for (const tuned of [false, true]) {
  const saved = { ...BOSS_TUNING };
  if (!tuned) Object.assign(BOSS_TUNING, { hpMult: 1, atkMult: 1, rankHpMult: 1, rankAtkMult: 1, heavyPctAct: [0, 0], heavyPctRank: [0, 0] });
  console.log(`\n===== ${tuned ? 'P0-2 적용 후' : '기존(v11)'} =====`);
  for (const [label, mode, act, stage, lv] of scenarios)
    for (const sc of schools) report(label, lv, sc, mode, act, stage);
  for (const lv of [8, 13, 16]) report('1계급 시험 칼리온', lv, 'thunder' as SchoolId, 'rankBoss', 1, 0);
  Object.assign(BOSS_TUNING, saved);
}
