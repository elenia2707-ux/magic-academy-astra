import type { GameState, PrestigeUpgradeId } from '../types/game';

export interface PrestigeUpgradeDef {
  id: PrestigeUpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  effectText: (level: number) => string;
}

export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  {
    id: 'starPower',
    name: '성좌의 마력 각인',
    description: '모든 회차에서 영구적으로 마력이 증가합니다.',
    maxLevel: 20,
    baseCost: 3,
    costStep: 2,
    effectText: (lv) => `마력 +${lv * 18}%`,
  },
  {
    id: 'starVitality',
    name: '별빛의 수호 맥동',
    description: '모든 회차에서 최대 체력과 방어력이 영구 증가합니다.',
    maxLevel: 20,
    baseCost: 3,
    costStep: 2,
    effectText: (lv) => `체력/방어 +${lv * 18}%`,
  },
  {
    id: 'trainAccel',
    name: '시간 가속의 서고',
    description: '마법 교실과 금서 도서관의 수련 속도가 영구 가속됩니다.',
    maxLevel: 10,
    baseCost: 4,
    costStep: 3,
    effectText: (lv) => `수련 속도 +${lv * 25}%`,
  },
  {
    id: 'extraTrainSlot',
    name: '다중 사념 수련',
    description: '교실 자동 수련 슬롯을 영구적으로 1칸 확장합니다.',
    maxLevel: 1,
    baseCost: 12,
    costStep: 12,
    effectText: (lv) => (lv > 0 ? '수련 슬롯 +1 해금됨' : '수련 슬롯 +1'),
  },
  {
    id: 'sixthDeckSlot',
    name: '여섯 번째 성좌 슬롯',
    description: '스킬 로테이션 덱의 최대 칸 수를 6칸으로 확장합니다.',
    maxLevel: 1,
    baseCost: 18,
    costStep: 18,
    effectText: (lv) => (lv > 0 ? '6번째 스킬 슬롯 해금됨' : '최대 스킬 슬롯 +1'),
  },
  {
    id: 'skillCapBreak',
    name: '비전 한계 돌파',
    description: '모든 마법 스킬의 최대 레벨 상한을 높입니다.',
    maxLevel: 5,
    baseCost: 6,
    costStep: 5,
    effectText: (lv) => `스킬 최대 레벨 ${10 + lv * 5}`,
  },
  {
    id: 'darkMastery',
    name: '심연의 흑마법 공명',
    description: '금서 도서관의 흑마법 피해와 흡혈 효율을 증폭합니다.',
    maxLevel: 10,
    baseCost: 5,
    costStep: 4,
    effectText: (lv) => `흑마법 위력 +${lv * 15}%`,
  },
  {
    id: 'startingWealth',
    name: '선대 대마도사의 유산',
    description: '회귀 직후 시작 마석과 획득 경험치·마석 배율이 증가합니다.',
    maxLevel: 10,
    baseCost: 4,
    costStep: 3,
    effectText: (lv) => `획득 마석/경험치 +${lv * 15}%`,
  },
];

export function calculateRebirthReward(state: GameState): number {
  const cleared = state.clearedActs.length;
  if (cleared < 3 && state.rank < 2) return 0;
  const fromActs = cleared * 4 + (state.clearedActs.includes(6) ? 14 : 0);
  const fromRank = state.rank * 3;
  const fromLevel = Math.floor(state.level / 4);
  const fromTower = state.highestTowerFloor * 2;
  return Math.max(0, fromActs + fromRank + fromLevel + fromTower);
}

export function getPrestigeUpgradeCost(def: PrestigeUpgradeDef, currentLevel: number): number {
  return def.baseCost + currentLevel * def.costStep;
}
