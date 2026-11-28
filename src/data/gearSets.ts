import type {
  EquipSlot,
  EquipmentItem,
  GearSetId,
  MagicCategory,
  Rarity,
  SchoolId,
} from '../types/game';

export interface GearSetBonusSpec {
  magicPct?: number;
  hpPct?: number;
  defPct?: number;
  critRate?: number;
  critDmg?: number;
  mpRegen?: number;
  darkDamagePct?: number;
  starlightGainPct?: number;
  openingShieldPct?: number;
  bossDamagePct?: number;
  reflectBonusPct?: number;
  categoryBonus?: { category: MagicCategory; pct: number };
}

export interface GearSetDef {
  id: GearSetId;
  name: string;
  shortName: string;
  accent: string;
  schoolHint: SchoolId | 'all';
  twoPieceLabel: string;
  fourPieceLabel: string;
  twoPiece: GearSetBonusSpec;
  fourPiece: GearSetBonusSpec;
}

export interface ComputedGearSetBonuses {
  magicPct: number;
  hpPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  mpRegen: number;
  darkDamagePct: number;
  starlightGainMult: number;
  openingShieldPct: number;
  bossDamagePct: number;
  reflectBonusPct: number;
  categoryBonuses: Partial<Record<MagicCategory, number>>;
  activeSets: { def: GearSetDef; count: number; tier: 0 | 2 | 4 }[];
}

export const SET_INSCRIBE_COST = { dust: 100, stones: 600 } as const;

export const GEAR_SET_ORDER: readonly GearSetId[] = [
  'ember_covenant',
  'glacier_mirror',
  'storm_spire',
  'basalt_oath',
  'astral_abyss',
];

export const GEAR_SETS: Record<GearSetId, GearSetDef> = {
  ember_covenant: {
    id: 'ember_covenant',
    name: '흑염 화로 세트',
    shortName: '흑염 화로',
    accent: '#d95b38',
    schoolHint: 'flame',
    twoPieceLabel: '마력 +10% · 흑염 위력 +12%',
    fourPieceLabel: '치명 피해 +25% · 보스 피해 +10%',
    twoPiece: {
      magicPct: 10,
      categoryBonus: { category: 'flame', pct: 12 },
    },
    fourPiece: {
      critDmg: 25,
      bossDamagePct: 10,
    },
  },
  glacier_mirror: {
    id: 'glacier_mirror',
    name: '백야 거울 세트',
    shortName: '백야 거울',
    accent: '#6bb4cf',
    schoolHint: 'frost',
    twoPieceLabel: '최대 체력 +12% · 빙결 위력 +12%',
    fourPieceLabel: '턴당 MP +5 · 방어 +18% · 개전 보호막 +10%',
    twoPiece: {
      hpPct: 12,
      categoryBonus: { category: 'frost', pct: 12 },
    },
    fourPiece: {
      mpRegen: 5,
      defPct: 18,
      openingShieldPct: 10,
    },
  },
  storm_spire: {
    id: 'storm_spire',
    name: '폭풍 첨탑 세트',
    shortName: '폭풍 첨탑',
    accent: '#d8b45c',
    schoolHint: 'thunder',
    twoPieceLabel: '치명타 확률 +7% · 뇌전 위력 +12%',
    fourPieceLabel: '별빛 충전 +25% · 치명 피해 +22%',
    twoPiece: {
      critRate: 7,
      categoryBonus: { category: 'thunder', pct: 12 },
    },
    fourPiece: {
      starlightGainPct: 25,
      critDmg: 22,
    },
  },
  basalt_oath: {
    id: 'basalt_oath',
    name: '석비 서약 세트',
    shortName: '석비 서약',
    accent: '#6ca67a',
    schoolHint: 'earth',
    twoPieceLabel: '최대 체력 +14% · 대지 위력 +12%',
    fourPieceLabel: '방어 +22% · 반사 피해 +8% · 보스 피해 +10%',
    twoPiece: {
      hpPct: 14,
      categoryBonus: { category: 'earth', pct: 12 },
    },
    fourPiece: {
      defPct: 22,
      reflectBonusPct: 8,
      bossDamagePct: 10,
    },
  },
  astral_abyss: {
    id: 'astral_abyss',
    name: '성좌 심연 세트',
    shortName: '성좌 심연',
    accent: '#b48fd9',
    schoolHint: 'all',
    twoPieceLabel: '마력 +10% · 흑마법 위력 +14%',
    fourPieceLabel: '마력 +12% · 치명 +6% · 별빛 충전 +20% · 보스 피해 +12%',
    twoPiece: {
      magicPct: 10,
      darkDamagePct: 14,
    },
    fourPiece: {
      magicPct: 12,
      critRate: 6,
      starlightGainPct: 20,
      bossDamagePct: 12,
    },
  },
};

export function getSchoolPreferredSet(school: SchoolId): GearSetId {
  switch (school) {
    case 'flame':
      return 'ember_covenant';
    case 'frost':
      return 'glacier_mirror';
    case 'thunder':
      return 'storm_spire';
    case 'earth':
      return 'basalt_oath';
  }
}

function pickRandomSet(): GearSetId {
  return GEAR_SET_ORDER[Math.floor(Math.random() * GEAR_SET_ORDER.length)];
}

export function rollGearSetForRarity(
  rarity: Rarity,
  preferredSchool?: SchoolId
): GearSetId | undefined {
  let chance = 0;
  if (rarity === 'epic') chance = 0.45;
  else if (rarity === 'ancient') chance = 0.75;
  else if (rarity === 'mythic') chance = 1.0;

  if (chance <= 0 || Math.random() >= chance) {
    return undefined;
  }

  if (!preferredSchool) {
    return pickRandomSet();
  }

  const r = Math.random();
  if (r < 0.45) return getSchoolPreferredSet(preferredSchool);
  if (r < 0.70) return 'astral_abyss';
  return pickRandomSet();
}

export function rollReforgeGearSet(
  preferredSchool: SchoolId,
  currentSetId?: GearSetId
): GearSetId {
  const preferred = getSchoolPreferredSet(preferredSchool);
  const others = GEAR_SET_ORDER.filter(
    (id) => id !== preferred && id !== 'astral_abyss' && id !== currentSetId
  );

  const candidates: { id: GearSetId; weight: number }[] = [];
  if (preferred !== currentSetId) {
    candidates.push({ id: preferred, weight: 0.4 });
  }
  if ('astral_abyss' !== currentSetId) {
    candidates.push({ id: 'astral_abyss', weight: 0.25 });
  }
  if (others.length > 0) {
    const eachWeight = 0.35 / others.length;
    for (const id of others) {
      candidates.push({ id, weight: eachWeight });
    }
  }

  const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return pickRandomSet();
  }

  let roll = Math.random() * totalWeight;
  for (const entry of candidates) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return candidates[candidates.length - 1].id;
}

export function getGearSetBonuses(
  equipped: Record<EquipSlot, EquipmentItem | null>
): ComputedGearSetBonuses {
  const counts = new Map<GearSetId, number>();
  const slots: EquipSlot[] = ['staff', 'robe', 'grimoire', 'relic'];

  for (const slot of slots) {
    const item = equipped[slot];
    const setId = item?.setId;
    if (!setId || !Object.prototype.hasOwnProperty.call(GEAR_SETS, setId)) continue;
    counts.set(setId, (counts.get(setId) ?? 0) + 1);
  }

  let magicPct = 0;
  let hpPct = 0;
  let defPct = 0;
  let critRate = 0;
  let critDmg = 0;
  let mpRegen = 0;
  let darkDamagePct = 0;
  let starlightGainPct = 0;
  let openingShieldPct = 0;
  let bossDamagePct = 0;
  let reflectBonusPct = 0;
  const categoryBonuses: Partial<Record<MagicCategory, number>> = {};
  const activeSets: { def: GearSetDef; count: number; tier: 0 | 2 | 4 }[] = [];

  const applySpec = (spec: GearSetBonusSpec) => {
    if (spec.magicPct) magicPct += spec.magicPct;
    if (spec.hpPct) hpPct += spec.hpPct;
    if (spec.defPct) defPct += spec.defPct;
    if (spec.critRate) critRate += spec.critRate;
    if (spec.critDmg) critDmg += spec.critDmg;
    if (spec.mpRegen) mpRegen += spec.mpRegen;
    if (spec.darkDamagePct) darkDamagePct += spec.darkDamagePct;
    if (spec.starlightGainPct) starlightGainPct += spec.starlightGainPct;
    if (spec.openingShieldPct) openingShieldPct += spec.openingShieldPct;
    if (spec.bossDamagePct) bossDamagePct += spec.bossDamagePct;
    if (spec.reflectBonusPct) reflectBonusPct += spec.reflectBonusPct;
    if (spec.categoryBonus) {
      const { category, pct } = spec.categoryBonus;
      categoryBonuses[category] = (categoryBonuses[category] ?? 0) + pct;
    }
  };

  for (const id of GEAR_SET_ORDER) {
    const count = counts.get(id) ?? 0;
    if (count <= 0) continue;
    const def = GEAR_SETS[id];
    const tier: 0 | 2 | 4 = count >= 4 ? 4 : count >= 2 ? 2 : 0;
    activeSets.push({ def, count, tier });
    if (count >= 2) applySpec(def.twoPiece);
    if (count >= 4) applySpec(def.fourPiece);
  }

  activeSets.sort((a, b) => b.count - a.count);

  return {
    magicPct,
    hpPct,
    defPct,
    critRate,
    critDmg,
    mpRegen,
    darkDamagePct,
    starlightGainMult: 1 + starlightGainPct / 100,
    openingShieldPct,
    bossDamagePct,
    reflectBonusPct,
    categoryBonuses,
    activeSets,
  };
}
