import type {
  ArcaneImprintId,
  ArcaneSanctumState,
  ArcaneTransmuteId,
  GameState,
} from '../types/game';

export interface ArcaneImprintDef {
  id: ArcaneImprintId;
  name: string;
  subtitle: string;
  accent: string;
  baseCost: number;
  costGrowth: number;
  effectPerLevelLabel: string;
  formatCurrentBonus: (lv: number) => string;
}

export interface ArcaneTransmuteDef {
  id: ArcaneTransmuteId;
  name: string;
  cost: number;
  rewardLabel: string;
  hint: string;
}

export const ARCANE_IMPRINTS: ArcaneImprintDef[] = [
  {
    id: 'overdrive',
    name: '성좌 과충전',
    subtitle: '마력 증폭 각인 · 상한 없음',
    accent: '#e3c481',
    baseCost: 8000,
    costGrowth: 1.32,
    effectPerLevelLabel: '마력 +4%',
    formatCurrentBonus: (lv) => `마력 +${lv * 4}%`,
  },
  {
    id: 'aegis',
    name: '흑요석 결계',
    subtitle: '체력·방어 각인 · 상한 없음',
    accent: '#8fc5e8',
    baseCost: 8000,
    costGrowth: 1.32,
    effectPerLevelLabel: 'HP·방어 +4%',
    formatCurrentBonus: (lv) => `HP·방어 +${lv * 4}%`,
  },
  {
    id: 'insight',
    name: '심연의 예리함',
    subtitle: '치명타 극대화 각인 · 상한 없음',
    accent: '#e396a6',
    baseCost: 10000,
    costGrowth: 1.35,
    effectPerLevelLabel: '치피 +8% · 치확 +0.5%',
    formatCurrentBonus: (lv) => `치피 +${lv * 8}% · 치확 +${(lv * 0.5).toFixed(1)}%`,
  },
];

export const ARCANE_TRANSMUTES: ArcaneTransmuteDef[] = [
  {
    id: 'lantern',
    name: '심연 등불',
    cost: 15000,
    rewardLabel: '등불 +1',
    hint: '주사위판 탐험 1회',
  },
  {
    id: 'tome',
    name: '금서 조각',
    cost: 22000,
    rewardLabel: '금서 조각 +2',
    hint: '흑마법 해독 재료',
  },
  {
    id: 'egg',
    name: '사역마 알 조각',
    cost: 22000,
    rewardLabel: '알 조각 +2',
    hint: '부화·진화 재료',
  },
];

export function createDefaultSanctum(): ArcaneSanctumState {
  return {
    imprints: {
      overdrive: 0,
      aegis: 0,
      insight: 0,
    },
    totalStonesSpent: 0,
  };
}

export function ensureSanctum(raw?: Partial<ArcaneSanctumState> | null): ArcaneSanctumState {
  const base = createDefaultSanctum();
  if (!raw || typeof raw !== 'object') return base;
  return {
    imprints: {
      overdrive: Math.max(0, Math.floor(raw.imprints?.overdrive ?? 0)),
      aegis: Math.max(0, Math.floor(raw.imprints?.aegis ?? 0)),
      insight: Math.max(0, Math.floor(raw.imprints?.insight ?? 0)),
    },
    totalStonesSpent: Math.max(0, Math.floor(raw.totalStonesSpent ?? 0)),
  };
}

/** P1-7: 6막 [부활한 마왕 발바르] 클리어 또는 시간 회귀 1회 이상 시 해금 */
export function isSanctumUnlocked(
  state: Pick<GameState, 'clearedActs' | 'prestige'>
): boolean {
  return state.clearedActs.includes(6) || state.prestige.rebirthCount > 0;
}

export function getImprintDef(id: ArcaneImprintId): ArcaneImprintDef {
  return ARCANE_IMPRINTS.find((d) => d.id === id) ?? ARCANE_IMPRINTS[0];
}

export function getImprintCost(id: ArcaneImprintId, currentLevel: number): number {
  const def = getImprintDef(id);
  return Math.round(def.baseCost * Math.pow(def.costGrowth, Math.max(0, currentLevel)));
}

export function getSanctumBonuses(state: Pick<GameState, 'sanctum'>): {
  magicMult: number;
  hpMult: number;
  defMult: number;
  critRateBonus: number;
  critDmgBonus: number;
} {
  const s = ensureSanctum(state.sanctum);
  const ov = s.imprints.overdrive;
  const ae = s.imprints.aegis;
  const ins = s.imprints.insight;
  return {
    magicMult: 1 + ov * 0.04,
    hpMult: 1 + ae * 0.04,
    defMult: 1 + ae * 0.04,
    critRateBonus: ins * 0.5,
    critDmgBonus: ins * 8,
  };
}
