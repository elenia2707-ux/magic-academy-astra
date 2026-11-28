import { getEnhanceMultiplier, getItemScoreFor, RARITY_META } from './equipment';
import { SKILL_MAP } from './skills';
import type {
  BattleTelemetry,
  DeckPreset,
  EquipmentItem,
  EquipSlot,
  GameState,
  SchoolId,
  SkillDef,
} from '../types/game';

export const DEFAULT_PRESET_NAMES = ['사냥', '보스', '심연'] as const;

export type InventorySortMode = 'score' | 'rarity' | 'slot';

export interface GearStatDelta {
  label: string;
  deltaText: string;
  positive: boolean;
}

const SLOT_SORT_ORDER: Record<EquipSlot, number> = {
  staff: 0,
  robe: 1,
  grimoire: 2,
  relic: 3,
};

function sanitizePresetDeck(rawDeck: unknown, skills: GameState['skills']): string[] {
  if (!Array.isArray(rawDeck)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of rawDeck) {
    if (typeof id !== 'string' || !id) continue;
    if (seen.has(id)) continue;
    if (!SKILL_MAP[id] || !skills[id]?.unlocked) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function ensureDeckPresets(
  state: Pick<GameState, 'deck' | 'deckPresets' | 'activeDeckPreset' | 'skills'>
): { presets: DeckPreset[]; activeIndex: number } {
  const rawIdx =
    typeof state.activeDeckPreset === 'number' && Number.isFinite(state.activeDeckPreset)
      ? Math.trunc(state.activeDeckPreset)
      : 0;
  const activeIndex = Math.max(0, Math.min(2, rawIdx));

  const presets: DeckPreset[] = DEFAULT_PRESET_NAMES.map((defaultName, idx) => {
    const raw = Array.isArray(state.deckPresets) ? state.deckPresets[idx] : undefined;
    const name =
      raw && typeof raw.name === 'string' && raw.name.trim().length > 0
        ? raw.name.trim()
        : defaultName;
    const deck = sanitizePresetDeck(raw?.deck, state.skills);
    return { name, deck };
  });

  if (presets[activeIndex].deck.length === 0) {
    const seeded = sanitizePresetDeck(state.deck, state.skills);
    if (seeded.length > 0) {
      presets[activeIndex] = { ...presets[activeIndex], deck: seeded };
    }
  }

  return { presets, activeIndex };
}

function getEffectiveSkillPower(def: SkillDef): number {
  return def.powerPct * (def.hits ?? 1);
}

function getShieldValueMetric(def: SkillDef): number {
  const shieldStatus =
    def.applyStatus?.type === 'shield'
      ? def.applyStatus.value
      : def.secondaryStatus?.type === 'shield'
        ? def.secondaryStatus.value
        : 0;
  return shieldStatus * 100 + def.powerPct;
}

function hasAtkUpEffect(def: SkillDef): boolean {
  return def.applyStatus?.type === 'atkUp' || def.secondaryStatus?.type === 'atkUp';
}

function hasEnemyDebuffEffect(def: SkillDef): boolean {
  return def.applyStatus?.target === 'enemy' || def.secondaryStatus?.target === 'enemy';
}

function getFarmOffensiveScore(def: SkillDef, school: SchoolId): number {
  const power = getEffectiveSkillPower(def);
  const cd = Math.max(1, def.cooldown);
  const dps = power / cd;
  const schoolBonus = def.category === school ? 35 : def.category === 'dark' ? 20 : 0;
  const critBonus = (def.bonusCrit ?? 0) * 1.2;
  const selfSacrificePenalty = def.isBuff && def.hpCostPct ? -45 : 0;
  return dps + def.requiredRank * 8 + schoolBonus + critBonus + selfSacrificePenalty;
}

export function buildRecommendedDeck(
  state: Pick<GameState, 'skills' | 'school'>,
  mode: 'farm' | 'boss',
  maxSlots: number
): string[] {
  const cap = Math.max(0, Math.floor(maxSlots));
  if (cap === 0) return [];

  const unlocked: SkillDef[] = [];
  for (const [id, entry] of Object.entries(state.skills)) {
    if (!entry?.unlocked) continue;
    const def = SKILL_MAP[id];
    if (def) unlocked.push(def);
  }
  if (unlocked.length === 0) return [];

  const fillers = unlocked
    .filter((d) => d.cooldown === 0 && !d.isHeal && !d.isShield && d.powerPct > 0)
    .sort((a, b) => {
      const aOwn = a.category === state.school ? 1 : 0;
      const bOwn = b.category === state.school ? 1 : 0;
      return bOwn - aOwn || getEffectiveSkillPower(b) - getEffectiveSkillPower(a);
    });
  const bestFiller = fillers[0] ?? null;

  if (mode === 'farm') {
    const primaryNukes = unlocked
      .filter(
        (d) =>
          d.cooldown > 0 &&
          !d.isHeal &&
          !d.isShield &&
          d.powerPct > 0 &&
          (d.category === state.school || d.category === 'dark')
      )
      .sort((a, b) => getFarmOffensiveScore(b, state.school) - getFarmOffensiveScore(a, state.school));

    const secondaryOffensive = unlocked
      .filter(
        (d) =>
          d.cooldown > 0 &&
          !d.isHeal &&
          !primaryNukes.includes(d) &&
          ((!d.isBuff && d.powerPct > 0) || (!d.isShield && d.isBuff))
      )
      .sort((a, b) => {
        const aDmg = a.powerPct > 0 ? 1 : 0;
        const bDmg = b.powerPct > 0 ? 1 : 0;
        return (
          bDmg - aDmg ||
          getFarmOffensiveScore(b, state.school) - getFarmOffensiveScore(a, state.school)
        );
      });

    const chosen: string[] = [];
    const nukeBudget = bestFiller ? Math.max(0, cap - 1) : cap;
    for (const d of [...primaryNukes, ...secondaryOffensive]) {
      if (chosen.length >= nukeBudget) break;
      if (!chosen.includes(d.id)) chosen.push(d.id);
    }
    if (bestFiller && chosen.length < cap && !chosen.includes(bestFiller.id)) {
      chosen.push(bestFiller.id);
    }
    return chosen.slice(0, cap);
  }

  // mode === 'boss'
  const schoolNukes = unlocked
    .filter((d) => d.category === state.school && !d.isHeal && d.powerPct > 0 && d.cooldown > 0)
    .sort(
      (a, b) =>
        b.requiredRank - a.requiredRank ||
        getEffectiveSkillPower(b) - getEffectiveSkillPower(a)
    );

  const fallbackOffensive = unlocked
    .filter((d) => !d.isHeal && d.powerPct > 0 && d.cooldown > 0)
    .sort(
      (a, b) =>
        b.requiredRank - a.requiredRank ||
        getEffectiveSkillPower(b) - getEffectiveSkillPower(a)
    );

  const shields = unlocked
    .filter((d) => d.isShield)
    .sort(
      (a, b) =>
        b.requiredRank - a.requiredRank || getShieldValueMetric(b) - getShieldValueMetric(a)
    );

  const heals = unlocked
    .filter((d) => d.isHeal)
    .sort(
      (a, b) =>
        b.requiredRank - a.requiredRank ||
        b.powerPct + (b.isCleanse ? 50 : 0) - (a.powerPct + (a.isCleanse ? 50 : 0))
    );

  const topNuke = schoolNukes[0] ?? fallbackOffensive[0] ?? null;
  const bestShield = shields[0] ?? null;
  const bestHeal = heals[0] ?? null;

  const pickedIds: string[] = [];
  const tryPick = (def: SkillDef | null) => {
    if (!def || pickedIds.length >= cap || pickedIds.includes(def.id)) return;
    pickedIds.push(def.id);
  };

  tryPick(topNuke);
  tryPick(bestShield);
  tryPick(bestHeal);

  const remaining = cap - pickedIds.length;
  if (remaining > 0) {
    const reserveFiller = remaining >= 2 && bestFiller && !pickedIds.includes(bestFiller.id);
    const extraBudget = cap - (reserveFiller ? 1 : 0);

    const extraCandidates = unlocked
      .filter((d) => d.cooldown > 0 && !d.isHeal && !pickedIds.includes(d.id))
      .sort((a, b) => {
        const hasAtkBuff = pickedIds.some((id) => {
          const p = SKILL_MAP[id];
          return p ? hasAtkUpEffect(p) : false;
        });
        const score = (d: SkillDef): number => {
          let s = d.requiredRank * 70 + getEffectiveSkillPower(d) * 0.5;
          if (d.category === state.school && !d.isShield) s += 300;
          else if (d.category === 'dark') s += 280;
          if (d.isBuff && hasAtkUpEffect(d)) s += hasAtkBuff ? 60 : 320;
          if (hasEnemyDebuffEffect(d)) s += 55;
          if (d.isShield) s += 160;
          return s;
        };
        return score(b) - score(a);
      });

    for (const d of extraCandidates) {
      if (pickedIds.length >= extraBudget) break;
      tryPick(d);
    }

    if (bestFiller && pickedIds.length < cap && !pickedIds.includes(bestFiller.id)) {
      tryPick(bestFiller);
    }
  }

  const priorityOf = (def: SkillDef): number => {
    if (def.cooldown === 0) return 4;
    if (topNuke && def.id === topNuke.id) return 0;
    if (!def.isHeal && !(def.isShield && def.isBuff)) return 1;
    if (def.isShield) return 2;
    return 3;
  };

  return pickedIds
    .sort((idA, idB) => {
      const defA = SKILL_MAP[idA];
      const defB = SKILL_MAP[idB];
      const pDiff = priorityOf(defA) - priorityOf(defB);
      if (pDiff !== 0) return pDiff;
      return (
        defB.requiredRank - defA.requiredRank ||
        getEffectiveSkillPower(defB) - getEffectiveSkillPower(defA)
      );
    })
    .slice(0, cap);
}

export function computeGearStatDeltas(
  candidate: EquipmentItem,
  equipped: EquipmentItem | null
): GearStatDelta[] {
  const candMult = getEnhanceMultiplier(candidate.enhance);
  const eqMult = equipped ? getEnhanceMultiplier(equipped.enhance) : 1;

  const scaledDiff = (
    key: 'magic' | 'maxHp' | 'def' | 'maxMp'
  ): number => {
    const c = Math.round(candidate.stats[key] * candMult);
    const e = equipped ? Math.round(equipped.stats[key] * eqMult) : 0;
    return c - e;
  };

  const directDiff = (key: 'critRate' | 'critDmg' | 'mpRegen'): number => {
    const c = candidate.stats[key];
    const e = equipped ? equipped.stats[key] : 0;
    const raw = c - e;
    return Number.isInteger(raw) ? raw : Number(raw.toFixed(1));
  };

  const entries: { label: string; diff: number; unit: string }[] = [
    { label: '마력', diff: scaledDiff('magic'), unit: '' },
    { label: 'HP', diff: scaledDiff('maxHp'), unit: '' },
    { label: '방어', diff: scaledDiff('def'), unit: '' },
    { label: '치명', diff: directDiff('critRate'), unit: '%' },
    { label: '치피', diff: directDiff('critDmg'), unit: '%' },
    { label: 'MP', diff: scaledDiff('maxMp'), unit: '' },
    { label: '마나회복', diff: directDiff('mpRegen'), unit: '' },
  ];

  const deltas: GearStatDelta[] = [];
  for (const { label, diff, unit } of entries) {
    if (diff === 0) continue;
    const positive = diff > 0;
    deltas.push({
      label,
      deltaText: `${positive ? '+' : ''}${diff}${unit}`,
      positive,
    });
    if (deltas.length >= 5) break;
  }
  return deltas;
}

export function sortInventoryItems(
  items: EquipmentItem[],
  mode: InventorySortMode,
  school: SchoolId
): EquipmentItem[] {
  return [...items].sort((a, b) => {
    if (mode === 'rarity') {
      return (
        RARITY_META[b.rarity].order - RARITY_META[a.rarity].order ||
        b.tier - a.tier ||
        getItemScoreFor(b, school) - getItemScoreFor(a, school)
      );
    }
    if (mode === 'slot') {
      return (
        SLOT_SORT_ORDER[a.slot] - SLOT_SORT_ORDER[b.slot] ||
        getItemScoreFor(b, school) - getItemScoreFor(a, school)
      );
    }
    return (
      getItemScoreFor(b, school) - getItemScoreFor(a, school) ||
      RARITY_META[b.rarity].order - RARITY_META[a.rarity].order ||
      b.tier - a.tier
    );
  });
}

export function createFreshTelemetry(nowMs = Date.now()): BattleTelemetry {
  return {
    startedAt: nowMs,
    wins: 0,
    totalTurns: 0,
    stonesEarned: 0,
    expEarned: 0,
    peakHit: 0,
  };
}

export function recordTelemetryWin(
  prev: BattleTelemetry,
  turns: number,
  stones: number,
  exp: number,
  peakHit = 0
): BattleTelemetry {
  const safeTurns = Number.isFinite(turns) ? Math.max(0, turns) : 0;
  const safeStones = Number.isFinite(stones) ? Math.max(0, stones) : 0;
  const safeExp = Number.isFinite(exp) ? Math.max(0, exp) : 0;
  const safeHit = Number.isFinite(peakHit) ? Math.max(0, Math.round(peakHit)) : 0;

  return {
    startedAt: prev.startedAt,
    wins: prev.wins + 1,
    totalTurns: prev.totalTurns + safeTurns,
    stonesEarned: prev.stonesEarned + safeStones,
    expEarned: prev.expEarned + safeExp,
    peakHit: Math.max(prev.peakHit, safeHit),
  };
}

export function recordTelemetryHit(
  prev: BattleTelemetry,
  hitAmount: number
): BattleTelemetry {
  const safeHit = Number.isFinite(hitAmount) ? Math.max(0, Math.round(hitAmount)) : 0;
  if (safeHit <= prev.peakHit) return prev;
  return {
    ...prev,
    peakHit: safeHit,
  };
}

export function formatTelemetryRates(
  t: BattleTelemetry,
  nowMs = Date.now()
): {
  stonesPerMin: number;
  expPerMin: number;
  avgTurns: string;
  peakHit: number;
  wins: number;
} {
  const elapsedMs = Math.max(15_000, nowMs - t.startedAt);
  const elapsedMin = elapsedMs / 60_000;
  return {
    stonesPerMin: Math.round(t.stonesEarned / elapsedMin),
    expPerMin: Math.round(t.expEarned / elapsedMin),
    avgTurns: t.wins > 0 ? (t.totalTurns / t.wins).toFixed(1) : '0.0',
    peakHit: t.peakHit,
    wins: t.wins,
  };
}
