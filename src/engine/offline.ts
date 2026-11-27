import { ACTS } from '../data/acts';
import { generateEquipment, RARITY_META } from '../data/equipment';
import type { GameState, OfflineSummary } from '../types/game';
import {
  advanceTraining,
  applyExpAndLevelUp,
  computePlayerStats,
  getRewardMultiplier,
} from './stats';

const MAX_OFFLINE_SEC = 12 * 3600; // 최대 12시간 정산
const LANTERN_INTERVAL_MS = 20 * 60 * 1000; // 20분마다 등불 +1

export function processOfflineProgress(
  state: GameState,
  nowMs = Date.now()
): { nextState: GameState; summary: OfflineSummary | null } {
  const rawElapsedSec = Math.floor((nowMs - state.lastSavedAt) / 1000);
  if (rawElapsedSec < 30) {
    return { nextState: { ...state, lastSavedAt: nowMs }, summary: null };
  }

  const elapsedSec = Math.min(MAX_OFFLINE_SEC, rawElapsedSec);
  const stats = computePlayerStats(state);
  const actDef = ACTS[Math.max(0, Math.min(ACTS.length - 1, state.selectedAct - 1))];
  // 오프라인 파밍은 선택 스테이지 기준 (보스 스테이지면 바로 앞 일반 스테이지로 안전 추정)
  const farmIdx = Math.min(3, state.selectedStage);
  const monster = actDef.stages[farmIdx] ?? actDef.stages[0];

  const estTurnsPerKill = Math.max(2, Math.min(12, Math.ceil(monster.hp / Math.max(10, stats.magic * 1.4))));
  const secPerKill = estTurnsPerKill * 2.1;
  const kills = Math.max(1, Math.floor(elapsedSec / secPerKill));
  const rewardMult = getRewardMultiplier(state);

  const expGained = Math.round(monster.expReward * kills * 0.85 * rewardMult);
  const stonesGained = Math.round(monster.stoneReward * kills * 0.85 * rewardMult);

  const { level, exp } = applyExpAndLevelUp(state.level, state.exp, expGained);
  const trained = advanceTraining(state, elapsedSec, stats);

  // 오프라인 장비 드랍 (최대 6개)
  const dropCount = Math.min(6, Math.floor(kills / 10));
  let inventory = [...state.inventory];
  let arcaneDust = state.arcaneDust;
  let itemsFound = 0;

  for (let i = 0; i < dropCount; i++) {
    const item = generateEquipment(state.selectedAct);
    const threshold = state.settings.autoDismantleBelow;
    if (
      threshold !== 'none' &&
      RARITY_META[item.rarity].order < RARITY_META[threshold].order
    ) {
      arcaneDust += RARITY_META[item.rarity].dustValue;
    } else if (inventory.length < 36) {
      inventory.push(item);
      itemsFound += 1;
    } else {
      arcaneDust += RARITY_META[item.rarity].dustValue;
    }
  }

  // 등불 회복
  const lanternElapsed = nowMs - state.abyss.lastLanternTick;
  const lanternsAdded = Math.floor(lanternElapsed / LANTERN_INTERVAL_MS);
  const lanternsRecovered = Math.max(
    0,
    Math.min(state.abyss.maxLanterns - state.abyss.lanterns, lanternsAdded)
  );

  const nextState: GameState = {
    ...state,
    // 보스전 도중 종료했다면 복귀 시 안전 사냥터로 동기화 (보스 버튼 숨김 버그 방지)
    selectedStage: farmIdx,
    level,
    exp,
    stones: state.stones + stonesGained,
    arcaneDust,
    skills: trained.skills,
    trainingSlots: trained.trainingSlots,
    inventory,
    totalKills: state.totalKills + kills,
    abyss: {
      ...state.abyss,
      lanterns: Math.min(state.abyss.maxLanterns, state.abyss.lanterns + lanternsRecovered),
      lastLanternTick:
        lanternsAdded > 0
          ? state.abyss.lastLanternTick + lanternsAdded * LANTERN_INTERVAL_MS
          : state.abyss.lastLanternTick,
    },
    lastSavedAt: nowMs,
  };

  return {
    nextState,
    summary: {
      elapsedSec,
      expGained,
      stonesGained,
      kills,
      trainedSkills: trained.completedNames,
      itemsFound,
      lanternsRecovered,
    },
  };
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}
