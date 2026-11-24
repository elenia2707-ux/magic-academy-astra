import { getEnhanceMultiplier, generateEquipment } from '../data/equipment';
import { FAMILIARS } from '../data/familiars';
import { RANKS, SCHOOLS } from '../data/schools';
import { SKILL_MAP } from '../data/skills';
import type {
  ComputedStats,
  GameState,
  Gender,
  MagicCategory,
  PrestigeState,
  PrestigeUpgradeId,
  SchoolId,
} from '../types/game';

export const SAVE_VERSION = 1;

export function expForNextLevel(level: number): number {
  return Math.round(65 * Math.pow(1.22, level - 1) + level * 20);
}

export function getSkillPowerMultiplier(level: number): number {
  return 1 + (level - 1) * 0.14;
}

export function getSkillUpgradeCost(level: number): number {
  return Math.round(55 * Math.pow(1.36, level - 1));
}

export function createDefaultPrestige(): PrestigeState {
  return {
    rebirthCount: 0,
    starRemnants: 0,
    totalRemnantsEarned: 0,
    upgrades: {
      starPower: 0,
      starVitality: 0,
      trainAccel: 0,
      extraTrainSlot: 0,
      sixthDeckSlot: 0,
      skillCapBreak: 0,
      darkMastery: 0,
      startingWealth: 0,
    },
  };
}

export function createNewGameState(
  playerName: string,
  gender: Gender,
  school: SchoolId,
  existingPrestige?: PrestigeState
): GameState {
  const prestige = existingPrestige ?? createDefaultPrestige();
  const starterSkill = SCHOOLS[school].starterSkillId;
  const startWealthLv = prestige.upgrades.startingWealth ?? 0;
  const maxTrain = 1 + (prestige.upgrades.extraTrainSlot ?? 0);

  const starterStaff = generateEquipment(1, 'staff', 'common');
  starterStaff.name = '아스트라 지급 지팡이';
  const starterRobe = generateEquipment(1, 'robe', 'common');
  starterRobe.name = '견습생 검은 망토';

  return {
    version: SAVE_VERSION,
    created: true,
    playerName: playerName.trim() || '견습생',
    gender,
    school,
    level: 1,
    exp: 0,
    rank: 0,
    stones: 80 + startWealthLv * 250,
    tomeShards: 0,
    eggShards: 0,
    arcaneDust: 0,
    highestAct: 1,
    highestStageInAct: 0,
    clearedActs: [],
    viewedStoryActs: [],
    selectedAct: 1,
    selectedStage: 0,
    towerFloor: 1,
    highestTowerFloor: 0,
    skills: {
      [starterSkill]: { id: starterSkill, level: 1, exp: 0, unlocked: true },
    },
    deck: [starterSkill],
    trainingSlots: Array.from({ length: maxTrain }, (_, idx) => (idx === 0 ? 'ward_1' : null)),
    equipped: {
      staff: starterStaff,
      robe: starterRobe,
      grimoire: null,
      relic: null,
    },
    inventory: [],
    familiars: {
      raven: undefined,
      golem: undefined,
      wisp: undefined,
      wolf: undefined,
      owl: undefined,
      bat: undefined,
    },
    activeFamiliar: null,
    abyss: {
      lanterns: 5,
      maxLanterns: 8,
      lastLanternTick: Date.now(),
      depth: 0,
      activeNode: null,
      lastResult: null,
    },
    prestige,
    settings: {
      speed: 2,
      sfxEnabled: true,
      autoAdvance: true,
      autoDismantleBelow: 'none',
    },
    lastSavedAt: Date.now(),
    totalKills: 0,
  };
}

export function createEmptyUncreatedState(): GameState {
  const s = createNewGameState('', 'female', 'flame');
  s.created = false;
  return s;
}

export function computePlayerStats(state: GameState): ComputedStats {
  const schoolInfo = SCHOOLS[state.school];
  const rankInfo = RANKS[state.rank];
  const up = state.prestige.upgrades;

  // 레벨 기반 기본치 (1~6막 보스전 & 무한 탑까지 균형 잡힌 성장 곡선)
  const lvScale = Math.pow(1.045, Math.max(0, state.level - 1));
  let baseMagic = (20 + state.level * 4.5) * lvScale;
  let baseHp = (120 + state.level * 22) * lvScale;
  let baseMp = 72 + state.level * 5 + state.rank * 26;
  let baseDef = (5 + state.level * 1.5) * lvScale;
  let critRate = 8 + schoolInfo.statWeights.critBonus;
  let critDmg = 150 + (state.school === 'thunder' ? 20 : 0);
  let mpRegen = 12 + state.rank * 4 + schoolInfo.statWeights.mpRegenBonus;

  const categoryBonus: Record<MagicCategory, number> = {
    flame: 0,
    frost: 0,
    thunder: 0,
    earth: 0,
    ward: 0,
    holy: 0,
    dark: 0,
  };
  categoryBonus[state.school] += 15;

  // 장비 합산
  let eqMagic = 0;
  let eqHp = 0;
  let eqMp = 0;
  let eqDef = 0;
  for (const item of Object.values(state.equipped)) {
    if (!item) continue;
    const m = getEnhanceMultiplier(item.enhance);
    eqMagic += item.stats.magic * m;
    eqHp += item.stats.maxHp * m;
    eqMp += item.stats.maxMp * m;
    eqDef += item.stats.def * m;
    critRate += item.stats.critRate;
    critDmg += item.stats.critDmg;
    mpRegen += item.stats.mpRegen;
    if (item.stats.elementBonus) {
      categoryBonus[item.stats.elementBonus.category] += item.stats.elementBonus.pct;
    }
  }

  // 활성 사역마 패시브
  let famMagicPct = 0;
  let famHpPct = 0;
  let famDefPct = 0;
  if (state.activeFamiliar) {
    const owned = state.familiars[state.activeFamiliar];
    const def = FAMILIARS[state.activeFamiliar];
    if (owned && def) {
      const evoBonus = 1 + owned.evolution * 0.55 + (owned.level - 1) * 0.04;
      if (def.passiveMagicPct) famMagicPct += def.passiveMagicPct * evoBonus;
      if (def.passiveHpPct) famHpPct += def.passiveHpPct * evoBonus;
      if (def.passiveDefPct) famDefPct += def.passiveDefPct * evoBonus;
      if (def.passiveCritRate) critRate += def.passiveCritRate * (1 + owned.evolution * 0.35);
      if (def.passiveMpRegen) mpRegen += Math.round(def.passiveMpRegen * (1 + owned.evolution * 0.4));
    }
  }

  // 학파 + 계급 + 별의 성좌(환생) 영구 배율
  const starPowerMult = 1 + (up.starPower ?? 0) * 0.18;
  const starVitMult = 1 + (up.starVitality ?? 0) * 0.18;

  const magic = Math.round(
    (baseMagic + eqMagic) *
      schoolInfo.statWeights.magicMult *
      rankInfo.statMult *
      (1 + famMagicPct / 100) *
      starPowerMult
  );
  const maxHp = Math.round(
    (baseHp + eqHp) *
      schoolInfo.statWeights.hpMult *
      rankInfo.statMult *
      (1 + famHpPct / 100) *
      starVitMult
  );
  const maxMp = Math.round((baseMp + eqMp) * (state.school === 'frost' ? 1.18 : 1));
  const def = Math.round(
    (baseDef + eqDef) *
      schoolInfo.statWeights.defMult *
      rankInfo.statMult *
      (1 + famDefPct / 100) *
      starVitMult
  );

  const maxDeckSlots = rankInfo.deckSlots + (up.sixthDeckSlot ?? 0);
  const maxTrainSlots = rankInfo.trainSlots + (up.extraTrainSlot ?? 0);
  const maxSkillLevel = 10 + (up.skillCapBreak ?? 0) * 5;
  const trainSpeedMult = 1 + (up.trainAccel ?? 0) * 0.25;
  const darkDamageMult = 1 + (up.darkMastery ?? 0) * 0.15;

  return {
    maxHp,
    maxMp,
    magic,
    def,
    critRate: Math.min(85, Math.round(critRate)),
    critDmg: Math.round(critDmg),
    mpRegen: Math.round(mpRegen),
    trainSpeedMult,
    maxDeckSlots,
    maxTrainSlots,
    maxSkillLevel,
    darkDamageMult,
    categoryBonus,
  };
}

export function getRewardMultiplier(state: GameState): number {
  const wealthLv = state.prestige.upgrades.startingWealth ?? 0;
  return 1 + wealthLv * 0.15;
}

export function applyExpAndLevelUp(
  level: number,
  exp: number,
  gain: number
): { level: number; exp: number; leveledUp: number } {
  let lv = level;
  let cur = exp + gain;
  let leveledUp = 0;
  while (cur >= expForNextLevel(lv) && lv < 999) {
    cur -= expForNextLevel(lv);
    lv += 1;
    leveledUp += 1;
  }
  return { level: lv, exp: cur, leveledUp };
}

export function advanceTraining(
  state: GameState,
  deltaSec: number,
  stats: ComputedStats
): {
  skills: GameState['skills'];
  trainingSlots: (string | null)[];
  completedNames: string[];
} {
  const skills = { ...state.skills };
  const trainingSlots = [...state.trainingSlots];
  while (trainingSlots.length < stats.maxTrainSlots) trainingSlots.push(null);

  const completedNames: string[] = [];
  const gain = deltaSec * stats.trainSpeedMult;

  for (let i = 0; i < trainingSlots.length; i++) {
    const skillId = trainingSlots[i];
    if (!skillId) continue;
    const def = SKILL_MAP[skillId];
    if (!def) {
      trainingSlots[i] = null;
      continue;
    }
    const existing = skills[skillId] ?? { id: skillId, level: 0, exp: 0, unlocked: false };

    if (!existing.unlocked) {
      const nextExp = existing.exp + gain;
      if (nextExp >= def.trainCostSec) {
        skills[skillId] = { id: skillId, level: 1, exp: 0, unlocked: true };
        completedNames.push(`${def.name} 습득!`);
      } else {
        skills[skillId] = { ...existing, exp: nextExp };
      }
    } else if (existing.level < stats.maxSkillLevel) {
      const req = def.trainCostSec * (0.9 + existing.level * 0.45);
      let nextExp = existing.exp + gain;
      let nextLv = existing.level;
      while (nextExp >= req && nextLv < stats.maxSkillLevel) {
        nextExp -= req;
        nextLv += 1;
        completedNames.push(`${def.name} Lv.${nextLv}`);
      }
      skills[skillId] = { ...existing, level: nextLv, exp: nextLv >= stats.maxSkillLevel ? 0 : nextExp };
      if (nextLv >= stats.maxSkillLevel) {
        trainingSlots[i] = null;
      }
    } else {
      trainingSlots[i] = null;
    }
  }

  return { skills, trainingSlots, completedNames };
}

export function getPrestigeUpgradeLevel(
  state: GameState,
  id: PrestigeUpgradeId
): number {
  return state.prestige.upgrades[id] ?? 0;
}
