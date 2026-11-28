import type { RebirthVowId } from '../types/game';

export interface RebirthVowDef {
  id: RebirthVowId;
  name: string;
  subtitle: string;
  blessingDesc: string;
  curseDesc: string;
  remnantBonusPct: number;
  accentColor: string;
  magicMult: number;
  critDmgBonus: number;
  starlightGainMult: number;
  trainSpeedMult: number;
  rewardMultBonus: number;
  luckBonus: number;
  cooldownCut: number;
  maxMpMult: number;
  mpCostMult: number;
  enemyHpMult: number;
  enemyAtkMult: number;
  enemyDefMult: number;
  healMult: number;
}

export const REBIRTH_VOW_ORDER: readonly RebirthVowId[] = [
  'none',
  'crimson_moon',
  'abyss_tide',
  'silent_hourglass',
];

export const REBIRTH_VOWS: Record<RebirthVowId, RebirthVowDef> = {
  none: {
    id: 'none',
    name: '평온한 회귀',
    subtitle: '변형 규칙 없음',
    blessingDesc: '기본 성좌 질서 유지',
    curseDesc: '대가는 없습니다',
    remnantBonusPct: 0,
    accentColor: '#9cb0c9',
    magicMult: 1,
    critDmgBonus: 0,
    starlightGainMult: 1,
    trainSpeedMult: 1,
    rewardMultBonus: 0,
    luckBonus: 0,
    cooldownCut: 0,
    maxMpMult: 1,
    mpCostMult: 1,
    enemyHpMult: 1,
    enemyAtkMult: 1,
    enemyDefMult: 1,
    healMult: 1,
  },
  crimson_moon: {
    id: 'crimson_moon',
    name: '핏빛 달의 맹약',
    subtitle: '광전사 회차',
    blessingDesc: '마력 +35% · 치명 피해 +35% · 별빛 충전 +25%',
    curseDesc: '적 공격력 +30% · 치유 회복량 -25%',
    remnantBonusPct: 30,
    accentColor: '#d95b5b',
    magicMult: 1.35,
    critDmgBonus: 35,
    starlightGainMult: 1.25,
    trainSpeedMult: 1,
    rewardMultBonus: 0,
    luckBonus: 0,
    cooldownCut: 0,
    maxMpMult: 1,
    mpCostMult: 1,
    enemyHpMult: 1,
    enemyAtkMult: 1.3,
    enemyDefMult: 1,
    healMult: 0.75,
  },
  abyss_tide: {
    id: 'abyss_tide',
    name: '심연 해일의 시련',
    subtitle: '정예 토벌 회차',
    blessingDesc: '획득 EXP·마석 +45% · 장비 행운 +15',
    curseDesc: '적 최대 HP +55% · 적 방어력 +25%',
    remnantBonusPct: 40,
    accentColor: '#6ba8c9',
    magicMult: 1,
    critDmgBonus: 0,
    starlightGainMult: 1,
    trainSpeedMult: 1,
    rewardMultBonus: 0.45,
    luckBonus: 15,
    cooldownCut: 0,
    maxMpMult: 1,
    mpCostMult: 1,
    enemyHpMult: 1.55,
    enemyAtkMult: 1,
    enemyDefMult: 1.25,
    healMult: 1,
  },
  silent_hourglass: {
    id: 'silent_hourglass',
    name: '침묵하는 모래시계',
    subtitle: '비술 가속 회차',
    blessingDesc: '수련 속도 +60% · 기본 쿨 2턴+ 스킬 쿨 -1턴',
    curseDesc: '최대 마나 -20% · 스킬 MP 소모 +20%',
    remnantBonusPct: 35,
    accentColor: '#d8b45c',
    magicMult: 1,
    critDmgBonus: 0,
    starlightGainMult: 1,
    trainSpeedMult: 1.6,
    rewardMultBonus: 0,
    luckBonus: 0,
    cooldownCut: 1,
    maxMpMult: 0.8,
    mpCostMult: 1.2,
    enemyHpMult: 1,
    enemyAtkMult: 1,
    enemyDefMult: 1,
    healMult: 1,
  },
};

export function getRebirthVow(id?: RebirthVowId | null): RebirthVowDef {
  if (!id || !Object.prototype.hasOwnProperty.call(REBIRTH_VOWS, id)) {
    return REBIRTH_VOWS.none;
  }
  return REBIRTH_VOWS[id];
}

export function getNgPlusBaselineScaling(rebirthCount: number): {
  enemyHpMult: number;
  enemyAtkMult: number;
  rewardMult: number;
} {
  if (rebirthCount <= 0) {
    return { enemyHpMult: 1, enemyAtkMult: 1, rewardMult: 1 };
  }
  const c = Math.min(5, Math.max(0, rebirthCount));
  return {
    enemyHpMult: 1 + c * 0.14,
    enemyAtkMult: 1 + c * 0.08,
    rewardMult: 1 + c * 0.1,
  };
}
