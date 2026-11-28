import { ECON } from './economy';
import { rollGearSetForRarity } from './gearSets';
import type { EquipmentItem, EquipSlot, GearSetId, MagicCategory, Rarity } from '../types/game';

export const SLOT_LABELS: Record<EquipSlot, string> = {
  staff: '지팡이',
  robe: '로브',
  grimoire: '마도서',
  relic: '장신구',
};

export const RARITY_META: Record<
  Rarity,
  { name: string; color: string; mult: number; dustValue: number; order: number }
> = {
  common: { name: '일반', color: '#9c968d', mult: 1.0, dustValue: 8, order: 0 },
  rare: { name: '희귀', color: '#6ba8c9', mult: 1.38, dustValue: 22, order: 1 },
  epic: { name: '영웅', color: '#c48f48', mult: 1.85, dustValue: 55, order: 2 },
  ancient: { name: '고대', color: '#c96254', mult: 2.55, dustValue: 130, order: 3 },
  mythic: { name: '신화', color: '#e6ca7a', mult: 3.55, dustValue: 320, order: 4 },
};

const PREFIXES: Record<Rarity, string[]> = {
  common: ['낡은', '견습생의', '잿빛', '무명'],
  rare: ['서리 깃든', '마력 서린', '은빛', '심야의'],
  epic: ['고딕', '피의 서약', '폭풍의', '봉인된'],
  ancient: ['고대 성좌의', '망령 군주의', '심연의', '금단의'],
  mythic: ['아스트라의', '별빛 종언의', '대마도사의', '영겁의'],
};

const BASE_NAMES: Record<EquipSlot, string[]> = {
  staff: ['흑단 지팡이', '수정 지팡이', '별빛 홀', '해골 지팡이'],
  robe: ['마법사 망토', '칠흑 로브', '성좌 외투', '결계 수의'],
  grimoire: ['양피지 마도서', '금서 사본', '별자리 서적', '비술 그리모어'],
  relic: ['은빛 인장 반지', '검은 수정 펜던트', '모래시계 부적', '심연의 브로치'],
};

const BONUS_CATEGORIES: MagicCategory[] = ['flame', 'frost', 'thunder', 'earth', 'dark'];

export function rollRarity(tier: number, luckBonus = 0): Rarity {
  const r = Math.random() * 100 + luckBonus + tier * 3.5;
  if (r > 118 && tier >= 4) return 'mythic';
  if (r > 98 && tier >= 2) return 'ancient';
  if (r > 76) return 'epic';
  if (r > 42) return 'rare';
  return 'common';
}

export function generateEquipment(
  tier: number,
  forcedSlot?: EquipSlot,
  forcedRarity?: Rarity,
  forcedSetId?: GearSetId
): EquipmentItem {
  const slots: EquipSlot[] = ['staff', 'robe', 'grimoire', 'relic'];
  const slot = forcedSlot ?? slots[Math.floor(Math.random() * slots.length)];
  const rarity = forcedRarity ?? rollRarity(tier);
  const rMeta = RARITY_META[rarity];

  const tierScale = Math.pow(1.62, Math.max(0, tier - 1));
  const variance = 0.9 + Math.random() * 0.22;
  const power = tierScale * rMeta.mult * variance;

  const prefixPool = PREFIXES[rarity];
  const basePool = BASE_NAMES[slot];
  const name = `${prefixPool[Math.floor(Math.random() * prefixPool.length)]} ${
    basePool[Math.floor(Math.random() * basePool.length)]
  }`;

  const stats = {
    magic: 0,
    maxHp: 0,
    maxMp: 0,
    def: 0,
    critRate: 0,
    critDmg: 0,
    mpRegen: 0,
  } as EquipmentItem['stats'];

  if (slot === 'staff') {
    stats.magic = Math.max(4, Math.round(14 * power));
    if (rMeta.order >= 1) stats.critRate = Math.min(24, Math.round((2 + rMeta.order * 2.2) * variance));
    if (rMeta.order >= 2) stats.critDmg = Math.round((8 + rMeta.order * 7) * variance);
  } else if (slot === 'robe') {
    stats.maxHp = Math.max(25, Math.round(78 * power));
    stats.def = Math.max(2, Math.round(8 * power));
    if (rMeta.order >= 2) stats.magic = Math.round(5 * power);
  } else if (slot === 'grimoire') {
    stats.magic = Math.max(3, Math.round(9 * power));
    stats.maxMp = Math.max(12, Math.round(24 * power));
    stats.mpRegen = Math.max(1, Math.round((1.5 + rMeta.order * 1.4) * Math.sqrt(tier)));
  } else {
    stats.magic = Math.max(3, Math.round(7 * power));
    stats.maxHp = Math.max(18, Math.round(45 * power));
    stats.critRate = Math.min(20, Math.round((1.5 + rMeta.order * 2) * variance));
    if (rMeta.order >= 1) stats.def = Math.round(4 * power);
  }

  if (rMeta.order >= 2 && Math.random() < 0.68) {
    const cat = BONUS_CATEGORIES[Math.floor(Math.random() * BONUS_CATEGORIES.length)];
    stats.elementBonus = {
      category: cat,
      pct: Math.round(6 + rMeta.order * 5 + tier * 1.5),
    };
  }

  const setId = forcedSetId ?? rollGearSetForRarity(rarity);

  return {
    uid: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    slot,
    rarity,
    tier,
    enhance: 0,
    ...(setId ? { setId } : {}),
    stats,
  };
}

export function getEnhanceMultiplier(enhance: number): number {
  return 1 + enhance * 0.14;
}

export function getEnhanceCost(item: EquipmentItem): number {
  const base = ECON.enhBase * Math.pow(ECON.enhTierGrowth, item.tier - 1) * RARITY_META[item.rarity].mult;
  return Math.round(base * Math.pow(ECON.enhGrowth, item.enhance));
}

export function getItemPowerScore(item: EquipmentItem): number {
  const m = getEnhanceMultiplier(item.enhance);
  return Math.round(
    (item.stats.magic * 4.5 +
      item.stats.maxHp * 0.45 +
      item.stats.def * 3.2 +
      item.stats.maxMp * 0.5 +
      item.stats.critRate * 12 +
      item.stats.critDmg * 2 +
      item.stats.mpRegen * 8) *
      m
  );
}

/**
 * P0-5: 학파 기준 장비 평가 점수.
 * 기본 전투력 점수 + 내 학파와 같은 속성 보너스 옵션이면 가산 (다른 속성 보너스는 0).
 */
export function getItemScoreFor(item: EquipmentItem, category?: MagicCategory): number {
  let score = getItemPowerScore(item);
  const eb = item.stats.elementBonus;
  if (category && eb && eb.category === category) score += Math.round(eb.pct * 6);
  if (item.setId) score += 25;
  return score;
}

export interface LoadoutPlan {
  equipped: Record<EquipSlot, EquipmentItem | null>;
  inventory: EquipmentItem[];
  swaps: { slot: EquipSlot; from: EquipmentItem | null; to: EquipmentItem; gain: number }[];
  totalGain: number;
}

/** P0-5: 보관함에서 부위별 최고 점수 장비를 골라 일괄 장착하는 계획을 만든다 (순수 함수). */
export function planBestLoadout(
  equipped: Record<EquipSlot, EquipmentItem | null>,
  inventory: EquipmentItem[],
  category?: MagicCategory
): LoadoutPlan {
  const nextEquipped = { ...equipped };
  let nextInv = [...inventory];
  const swaps: LoadoutPlan['swaps'] = [];
  const slots: EquipSlot[] = ['staff', 'robe', 'grimoire', 'relic'];
  for (const slot of slots) {
    const cur = nextEquipped[slot];
    const curScore = cur ? getItemScoreFor(cur, category) : -1;
    let best: EquipmentItem | null = null;
    let bestScore = curScore;
    for (const it of nextInv) {
      if (it.slot !== slot) continue;
      const sc = getItemScoreFor(it, category);
      if (sc > bestScore) {
        best = it;
        bestScore = sc;
      }
    }
    if (!best) continue;
    const chosen = best;
    nextInv = nextInv.filter((i) => i.uid !== chosen.uid);
    if (cur) nextInv.unshift(cur);
    nextEquipped[slot] = chosen;
    swaps.push({ slot, from: cur, to: chosen, gain: bestScore - Math.max(0, curScore) });
  }
  return {
    equipped: nextEquipped,
    inventory: nextInv,
    swaps,
    totalGain: swaps.reduce((a, s) => a + s.gain, 0),
  };
}
