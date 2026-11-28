import { RARITY_META } from './equipment';
import type { GameState, Rarity } from '../types/game';

export interface TowerDepthTier {
  id: string;
  tierNumber: 1 | 2 | 3 | 4;
  name: string;
  minFloor: number;
  maxFloor: number | null;
  rangeLabel: string;
  accent: string;
  loreNote: string;
  ruleSummary: string;
  enemyHpMult: number;
  enemyAtkMult: number;
  playerCritDmgBonus: number;
  playerStarlightMult: number;
  rewardMult: number;
}

export interface TowerMilestoneDef {
  floor: number;
  title: string;
  starRemnants?: number;
  arcaneDust?: number;
  tomeShards?: number;
  eggShards?: number;
  guaranteedGearRarity?: Rarity;
}

export const TOWER_DEPTHS: readonly TowerDepthTier[] = [
  {
    id: 'silent_corridor',
    tierNumber: 1,
    name: '제1심층 · 침묵의 회랑',
    minFloor: 1,
    maxFloor: 10,
    rangeLabel: '1~10F',
    accent: '#8a95a8',
    loreNote: '폐쇄된 지하 서고의 잔향과 미납 도서의 망령들이 배회하는 탑의 들머리입니다.',
    ruleSummary: '기본 심연 규칙 · 보상 ×1.0',
    enemyHpMult: 1,
    enemyAtkMult: 1,
    playerCritDmgBonus: 0,
    playerStarlightMult: 1,
    rewardMult: 1,
  },
  {
    id: 'ashen_foundry',
    tierNumber: 2,
    name: '제2심층 · 잿빛 용광로',
    minFloor: 11,
    maxFloor: 20,
    rangeLabel: '11~20F',
    accent: '#d95b38',
    loreNote: '폐기된 도가니의 잔열이 적의 공세와 마도사의 치명 마력을 동시에 끓어오르게 합니다.',
    ruleSummary: '적 HP ×1.06 · 적 공격 ×1.12 · 치명 피해 +15% · 보상 ×1.25',
    enemyHpMult: 1.06,
    enemyAtkMult: 1.12,
    playerCritDmgBonus: 15,
    playerStarlightMult: 1,
    rewardMult: 1.25,
  },
  {
    id: 'mirror_constellation',
    tierNumber: 3,
    name: '제3심층 · 거울의 성좌',
    minFloor: 21,
    maxFloor: 30,
    rangeLabel: '21~30F',
    accent: '#6bb4cf',
    loreNote: '부서진 백야 거울이 별빛을 난반사시켜 성좌 공명과 심연의 밀도를 함께 끌어올립니다.',
    ruleSummary: '적 HP ×1.18 · 적 공격 ×1.15 · 치명 피해 +10% · 별빛 충전 ×1.25 · 보상 ×1.5',
    enemyHpMult: 1.18,
    enemyAtkMult: 1.15,
    playerCritDmgBonus: 10,
    playerStarlightMult: 1.25,
    rewardMult: 1.5,
  },
  {
    id: 'infinite_black_throne',
    tierNumber: 4,
    name: '제4심층 · 무한의 검은 왕좌',
    minFloor: 31,
    maxFloor: null,
    rangeLabel: '31F+',
    accent: '#b48fd9',
    loreNote: '초월 군주들이 윤회하며 왕좌를 지키는 끝없는 심연입니다. 극한의 보상이 기다립니다.',
    ruleSummary: '적 HP ×1.25 · 적 공격 ×1.20 · 치명 피해 +20% · 별빛 충전 ×1.30 · 보상 ×1.85',
    enemyHpMult: 1.25,
    enemyAtkMult: 1.2,
    playerCritDmgBonus: 20,
    playerStarlightMult: 1.3,
    rewardMult: 1.85,
  },
];

export const TOWER_MILESTONES: readonly TowerMilestoneDef[] = [
  {
    floor: 5,
    title: '회랑의 돌파자',
    arcaneDust: 60,
    tomeShards: 2,
  },
  {
    floor: 10,
    title: '용광로의 증인',
    starRemnants: 4,
    guaranteedGearRarity: 'epic',
  },
  {
    floor: 15,
    title: '거울의 대적자',
    arcaneDust: 120,
    eggShards: 3,
  },
  {
    floor: 20,
    title: '검은 서약 파쇄자',
    starRemnants: 8,
    guaranteedGearRarity: 'ancient',
  },
  {
    floor: 25,
    title: '금서 포식자 격파',
    arcaneDust: 200,
    tomeShards: 5,
  },
  {
    floor: 30,
    title: '꺼진 성좌의 정복자',
    starRemnants: 15,
    guaranteedGearRarity: 'mythic',
  },
  {
    floor: 40,
    title: '초월 심층 탐험가',
    starRemnants: 22,
    arcaneDust: 350,
  },
  {
    floor: 50,
    title: '무한 왕좌의 주인',
    starRemnants: 35,
    guaranteedGearRarity: 'mythic',
  },
];

export function getTowerDepthForFloor(floor: number): TowerDepthTier {
  const safeFloor = Number.isFinite(floor) ? Math.max(1, Math.floor(floor)) : 1;
  for (const tier of TOWER_DEPTHS) {
    if (safeFloor >= tier.minFloor && (tier.maxFloor === null || safeFloor <= tier.maxFloor)) {
      return tier;
    }
  }
  return TOWER_DEPTHS[0];
}

export function getTowerJumpTarget(highestTowerFloor: number): number {
  const safeHighest = Number.isFinite(highestTowerFloor)
    ? Math.max(0, Math.floor(highestTowerFloor))
    : 0;
  return safeHighest >= 6 ? Math.max(1, safeHighest - 4) : 1;
}

export function getClaimableTowerMilestones(
  state: Pick<GameState, 'highestTowerFloor' | 'claimedTowerMilestones'>
): TowerMilestoneDef[] {
  const claimed = new Set(state.claimedTowerMilestones ?? []);
  return TOWER_MILESTONES.filter(
    (m) => state.highestTowerFloor >= m.floor && !claimed.has(m.floor)
  );
}

export function formatTowerMilestoneReward(m: TowerMilestoneDef): string {
  const parts: string[] = [];
  if (m.starRemnants) parts.push(`별의 잔재 +${m.starRemnants.toLocaleString()}`);
  if (m.arcaneDust) parts.push(`마력 가루 +${m.arcaneDust.toLocaleString()}`);
  if (m.tomeShards) parts.push(`금서 조각 +${m.tomeShards.toLocaleString()}`);
  if (m.eggShards) parts.push(`알 조각 +${m.eggShards.toLocaleString()}`);
  if (m.guaranteedGearRarity) {
    parts.push(`${RARITY_META[m.guaranteedGearRarity].name} 마도구 1종`);
  }
  return parts.join(' · ');
}
