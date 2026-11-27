import type { DailyQuestId, DailyQuestState, GameState } from '../types/game';
import { EXP_CURVE } from './economy';

export interface DailyQuestDef {
  id: DailyQuestId;
  title: string;
  description: string;
  target: number;
  stampLabel: string;
}

export interface DailyQuestReward {
  stones?: number;
  arcaneDust?: number;
  tomeShards?: number;
  eggShards?: number;
  exp?: number;
}

export const DAILY_QUESTS: DailyQuestDef[] = [
  {
    id: 'kills',
    title: '순찰 토벌 보고',
    description: '사냥터와 심연에서 마수 30체 토벌하기',
    target: 30,
    stampLabel: '토벌',
  },
  {
    id: 'skillUpgrade',
    title: '마법 수련 점검',
    description: '스킬 즉시 강화 또는 교실 수련 완료 2회',
    target: 2,
    stampLabel: '수련',
  },
  {
    id: 'boss',
    title: '강적 제압 실기',
    description: '막 보스 · 승급 시험 · 탑 · 심연 정예 1회 격파',
    target: 1,
    stampLabel: '실기',
  },
];

/** 로컬 자정(00:00) 기준 날짜 키 (YYYY-MM-DD) */
export function getLocalDateKey(nowMs = Date.now()): string {
  const d = new Date(nowMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 다음 로컬 자정까지 남은 밀리초 */
export function getMsUntilLocalMidnight(nowMs = Date.now()): number {
  const d = new Date(nowMs);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - nowMs);
}

export function formatMidnightCountdown(nowMs = Date.now()): string {
  const totalMin = Math.ceil(getMsUntilLocalMidnight(nowMs) / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}분 후 초기화`;
  return `${h}시간 ${m}분 후 초기화`;
}

export function createFreshDailyQuests(nowMs = Date.now()): DailyQuestState {
  return {
    dateKey: getLocalDateKey(nowMs),
    progress: {
      kills: 0,
      skillUpgrade: 0,
      boss: 0,
    },
    claimed: {
      kills: false,
      skillUpgrade: false,
      boss: false,
    },
    bonusClaimed: false,
  };
}

/** 기존 세이브 마이그레이션 + 로컬 자정 경과 시 자동 리셋 */
export function ensureDailyQuestsCurrent(
  dq: Partial<DailyQuestState> | undefined,
  nowMs = Date.now()
): DailyQuestState {
  const today = getLocalDateKey(nowMs);
  if (!dq || dq.dateKey !== today) {
    return createFreshDailyQuests(nowMs);
  }
  return {
    dateKey: today,
    progress: {
      kills: Math.max(0, Number(dq.progress?.kills ?? 0)),
      skillUpgrade: Math.max(0, Number(dq.progress?.skillUpgrade ?? 0)),
      boss: Math.max(0, Number(dq.progress?.boss ?? 0)),
    },
    claimed: {
      kills: Boolean(dq.claimed?.kills),
      skillUpgrade: Boolean(dq.claimed?.skillUpgrade),
      boss: Boolean(dq.claimed?.boss),
    },
    bonusClaimed: Boolean(dq.bonusClaimed),
  };
}

export function incrementDailyQuest(
  dq: Partial<DailyQuestState> | undefined,
  deltas: Partial<Record<DailyQuestId, number>>,
  nowMs = Date.now()
): DailyQuestState {
  const cur = ensureDailyQuestsCurrent(dq, nowMs);
  return {
    ...cur,
    progress: {
      kills: cur.progress.kills + Math.max(0, deltas.kills ?? 0),
      skillUpgrade: cur.progress.skillUpgrade + Math.max(0, deltas.skillUpgrade ?? 0),
      boss: cur.progress.boss + Math.max(0, deltas.boss ?? 0),
    },
  };
}

function levelExpNeed(level: number): number {
  const mid = Math.max(0, level - EXP_CURVE.midStart);
  return Math.round(
    EXP_CURVE.base * Math.pow(EXP_CURVE.growth, level - 1) +
      level * EXP_CURVE.linear +
      EXP_CURVE.midQuad * mid * mid
  );
}

export function getDailyQuestReward(
  id: DailyQuestId,
  state: Pick<GameState, 'highestAct' | 'level'>
): DailyQuestReward {
  const act = Math.max(1, state.highestAct);
  const actScale = Math.pow(1.9, act - 1);
  if (id === 'kills') {
    return {
      stones: Math.round(160 * actScale),
      arcaneDust: 15 + act * 5,
    };
  }
  if (id === 'skillUpgrade') {
    return {
      tomeShards: 2,
      stones: Math.round(120 * actScale),
    };
  }
  return {
    eggShards: 2,
    exp: Math.round(levelExpNeed(state.level) * 0.25),
  };
}

export function getDailyBonusReward(state: Pick<GameState, 'highestAct'>): DailyQuestReward {
  const act = Math.max(1, state.highestAct);
  return {
    stones: Math.round(240 * Math.pow(1.9, act - 1)),
    tomeShards: 2,
    eggShards: 2,
  };
}

export function formatRewardSummary(reward: DailyQuestReward): string {
  const parts: string[] = [];
  if (reward.stones) parts.push(`마석 +${reward.stones.toLocaleString()}`);
  if (reward.exp) parts.push(`EXP +${reward.exp.toLocaleString()}`);
  if (reward.tomeShards) parts.push(`금서 조각 +${reward.tomeShards}`);
  if (reward.eggShards) parts.push(`알 조각 +${reward.eggShards}`);
  if (reward.arcaneDust) parts.push(`마력 가루 +${reward.arcaneDust}`);
  return parts.join(' · ');
}

export function isDailyQuestClaimable(
  dq: DailyQuestState,
  def: DailyQuestDef
): boolean {
  return !dq.claimed[def.id] && dq.progress[def.id] >= def.target;
}

export function areAllDailyQuestsClaimed(dq: DailyQuestState): boolean {
  return DAILY_QUESTS.every((q) => dq.claimed[q.id]);
}

export function countClaimableDailyQuests(
  state: Pick<GameState, 'dailyQuests'>,
  nowMs = Date.now()
): number {
  const dq = ensureDailyQuestsCurrent(state.dailyQuests, nowMs);
  let count = 0;
  for (const def of DAILY_QUESTS) {
    if (isDailyQuestClaimable(dq, def)) count += 1;
  }
  if (areAllDailyQuestsClaimed(dq) && !dq.bonusClaimed) {
    count += 1;
  }
  return count;
}

export function getLuciaDailyLine(
  state: Pick<GameState, 'playerName' | 'clearedActs'>,
  claimable: number,
  allFinished: boolean
): string {
  const name = state.playerName || '견습생';
  if (allFinished) {
    return `오늘 과제는 전부 마쳤군요, ${name}. 밤안개가 깊어지기 전에 자정까지 잠시 숨을 돌리세요.`;
  }
  if (claimable > 0) {
    return `벌써 실기 보고서를 채워 왔어요, ${name}! 여기 양피지에 봉인 도장을 찍어 둘 테니 보상을 챙겨가세요.`;
  }
  if (state.clearedActs.includes(4)) {
    return `균열 너머의 기운이 점점 거칠어져요, ${name}. 매일의 기초 수련만큼은 빠뜨리지 말고 기록해 둡시다.`;
  }
  return `오늘의 과제 양피지예요, ${name}. 검은 안개가 짙은 날일수록 작은 수련이 결국 목숨을 지켜준답니다.`;
}
