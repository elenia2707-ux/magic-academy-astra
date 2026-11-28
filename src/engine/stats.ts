import { createDefaultAffinity, ensureAffinity, getAffinityBonuses } from '../data/affinity';
import { createDefaultArchive, ensureArchive, getArchiveBonuses } from '../data/archive';
import { createFreshDailyQuests, ensureDailyQuestsCurrent } from '../data/dailyQuests';
import { getEnhanceMultiplier, generateEquipment } from '../data/equipment';
import { getEscortBonuses } from '../data/escortStories';
import { FAMILIARS } from '../data/familiars';
import { getActiveFamiliarSynergy } from '../data/familiarSynergy';
import { getGearSetBonuses } from '../data/gearSets';
import { getActiveInfirmaryEffect } from '../data/infirmary';
import { getNgPlusBaselineScaling, getRebirthVow } from '../data/rebirthVows';
import { createDefaultSanctum, ensureSanctum, getSanctumBonuses } from '../data/sanctum';
import {
  createDefaultSchoolJournal,
  ensureSchoolJournal,
  getSchoolQuestBonuses,
} from '../data/schoolQuests';
import { RANKS, SCHOOLS } from '../data/schools';
import { SKILL_MAP } from '../data/skills';
import {
  createDefaultTruthRoute,
  ensureTruthRoute,
  getTruthRouteBonuses,
} from '../data/truthRoute';
import type {
  ArcaneSanctumState,
  ArchiveState,
  ComputedStats,
  DailyQuestState,
  GameState,
  Gender,
  MagicCategory,
  PrestigeState,
  PrestigeUpgradeId,
  ProfessorAffinityState,
  ProfessorId,
  SchoolId,
  SchoolJournalState,
  TruthRouteState,
} from '../types/game';

import { ECON, EXP_CURVE } from '../data/economy';

export const SAVE_VERSION = 1;

export function expForNextLevel(level: number): number {
  const mid = Math.max(0, level - EXP_CURVE.midStart);
  return Math.round(
    EXP_CURVE.base * Math.pow(EXP_CURVE.growth, level - 1) +
      level * EXP_CURVE.linear +
      EXP_CURVE.midQuad * mid * mid
  );
}

export function getSkillPowerMultiplier(level: number): number {
  return 1 + (level - 1) * 0.14;
}

export function getSkillUpgradeCost(level: number, skillId?: string): number {
  // P0-6: 상위 계급 스킬일수록 강화비 상승
  const rankTier = skillId ? (SKILL_MAP[skillId]?.requiredRank ?? 0) : 0;
  return Math.round(
    ECON.skillBase * Math.pow(ECON.skillGrowth, level - 1) * Math.pow(ECON.skillRankMult, rankTier)
  );
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
    activeVow: 'none',
  };
}

/**
 * P0-4 시작 스킬 3종 — 덱 순서 = 로테이션 우선순위.
 * [학파 2번 강공(쿨2)] → [실디의 방패(보호막이 없을 때만)] → [학파 1번 기본기(쿨0)]
 * (대지: [가시 방벽] → [마력 증폭] → [암석 파편])
 */
export function getStarterKit(school: SchoolId): string[] {
  // 대지 학파는 2번 스킬(가시 방벽)이 이미 보호막이라, 수호 슬롯을 마력 증폭으로 대체해 화력을 보완
  if (school === 'earth') return ['earth_2', 'ward_2', 'earth_1'];
  return [`${school}_2`, 'ward_1', SCHOOLS[school].starterSkillId];
}

export function getMaxDeckSlots(state: Pick<GameState, 'rank' | 'prestige'>): number {
  return RANKS[state.rank].deckSlots + (state.prestige.upgrades.sixthDeckSlot ?? 0);
}

/** 덱 빈칸에만 후보 스킬을 순서대로 채운다 (플레이어가 짠 기존 덱 순서는 건드리지 않음) */
export function fillDeckWith(deck: string[], maxSlots: number, candidates: string[]): string[] {
  const next = deck.filter(Boolean).slice(0, maxSlots);
  for (const id of candidates) {
    if (next.length >= maxSlots) break;
    if (!next.includes(id)) next.push(id);
  }
  return next;
}

/** 덱에 없는 해금 스킬을 우선순위(자기 학파 상위 → 결계 → 성광 → 그 외)로 정렬 */
export function rankDeckCandidates(state: Pick<GameState, 'skills' | 'school'>): string[] {
  const order = (cat: string) =>
    cat === state.school ? 0 : cat === 'ward' ? 1 : cat === 'holy' ? 2 : 3;
  return Object.values(state.skills)
    .filter((s) => s.unlocked && SKILL_MAP[s.id])
    .map((s) => SKILL_MAP[s.id])
    .sort((a, b) => order(a.category) - order(b.category) || b.requiredRank - a.requiredRank)
    .map((d) => d.id);
}

/** 기존 세이브 보정: 시작 스킬 3종 지급 + 덱 빈칸 자동 채움 */
export function ensureStarterKit(state: GameState): GameState {
  if (!state.created) return state;
  const skills = { ...state.skills };
  for (const id of getStarterKit(state.school)) {
    const cur = skills[id];
    if (!cur?.unlocked) skills[id] = { id, level: Math.max(1, cur?.level ?? 1), exp: 0, unlocked: true };
  }
  const withSkills = { ...state, skills };
  // 덱이 기본기 1장뿐이던 세이브는 시작 덱 순서로 재구성 (쿨0 기본기가 1순위면 다른 스킬이 영영 안 나감)
  const tinyDeck = (state.deck ?? []).filter(Boolean).length <= 1;
  const deck = fillDeckWith(tinyDeck ? [] : state.deck ?? [], getMaxDeckSlots(state), [
    ...getStarterKit(state.school),
    ...(state.deck ?? []),
    ...rankDeckCandidates(withSkills),
  ]);
  // 수련 중이던 시작 스킬은 방금 지급됐으니, 그 슬롯은 빛의 손길(미습득 시) 수련으로 돌린다
  const kit = getStarterKit(state.school);
  let holyQueued = state.trainingSlots.includes('holy_1') || Boolean(skills.holy_1?.unlocked);
  const trainingSlots = state.trainingSlots.map((sid) => {
    if (!sid || !kit.includes(sid) || state.skills[sid]?.unlocked) return sid;
    if (holyQueued) return null;
    holyQueued = true;
    return 'holy_1';
  });
  return { ...withSkills, deck, trainingSlots };
}

export function createNewGameState(
  playerName: string,
  gender: Gender,
  school: SchoolId,
  existingPrestige?: PrestigeState,
  existingDailyQuests?: DailyQuestState,
  existingSanctum?: ArcaneSanctumState,
  existingAffinity?: ProfessorAffinityState,
  existingArchive?: ArchiveState,
  existingEscort?: ProfessorId | null,
  existingViewedSideStories?: string[],
  existingTowerMilestones?: number[],
  existingStoryChoices?: Record<string, string>,
  existingTruthRoute?: TruthRouteState,
  existingSchoolJournal?: SchoolJournalState
): GameState {
  const prestige = existingPrestige ?? createDefaultPrestige();
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
    skills: Object.fromEntries(
      getStarterKit(school).map((id) => [id, { id, level: 1, exp: 0, unlocked: true }])
    ),
    deck: getStarterKit(school),
    trainingSlots: Array.from({ length: maxTrain }, (_, idx) => (idx === 0 ? 'holy_1' : null)),
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
      boardPos: 0,
      laps: 0,
      lastRoll: null,
      activeNode: null,
      lastResult: null,
    },
    prestige,
    settings: {
      speed: 2,
      sfxEnabled: true,
      bgmEnabled: true,
      bgmVolume: 0.55,
      autoAdvance: true,
      // P0-5: 일반 등급은 기본으로 자동 분해 (보관함 36칸이 일반템으로 막히는 문제)
      autoDismantleBelow: 'rare',
      gearDefaultsV2: true,
    },
    dailyQuests: existingDailyQuests
      ? ensureDailyQuestsCurrent(existingDailyQuests)
      : createFreshDailyQuests(),
    // 제련소 각인·교수 인연·기록실·동행·외전·무한 탑 마일스톤·진실 루트·학파 일지는 영구 유지
    sanctum: existingSanctum ? ensureSanctum(existingSanctum) : createDefaultSanctum(),
    affinity: existingAffinity ? ensureAffinity(existingAffinity) : createDefaultAffinity(),
    archive: existingArchive ? ensureArchive(existingArchive) : createDefaultArchive(),
    grimoireSeal: null,
    activeEscort: existingEscort ?? null,
    viewedSideStories: existingViewedSideStories ? [...existingViewedSideStories] : [],
    claimedTowerMilestones: existingTowerMilestones ? [...existingTowerMilestones] : [],
    storyChoices: existingStoryChoices ? { ...existingStoryChoices } : {},
    truthRoute: existingTruthRoute
      ? ensureTruthRoute(existingTruthRoute)
      : createDefaultTruthRoute(),
    schoolJournal: existingSchoolJournal
      ? ensureSchoolJournal(existingSchoolJournal)
      : createDefaultSchoolJournal(),
    lastSavedAt: Date.now(),
    totalKills: 0,
  };
}

export function createEmptyUncreatedState(): GameState {
  const s = createNewGameState('', 'female', 'flame');
  s.created = false;
  s.playerName = '';
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

      // P4-1: 사역마 학파 공명 패시브
      const syn = getActiveFamiliarSynergy(state.activeFamiliar, state.school);
      if (syn) {
        if (syn.passive.magicPct) famMagicPct += syn.passive.magicPct;
        if (syn.passive.defPct) famDefPct += syn.passive.defPct;
        if (syn.passive.critDmgBonus) critDmg += syn.passive.critDmgBonus;
        if (syn.passive.mpRegen) mpRegen += syn.passive.mpRegen;
        if (syn.passive.elementBonus) {
          categoryBonus[syn.passive.elementBonus.category] += syn.passive.elementBonus.pct;
        }
      }
    }
  }

  // 학파 + 계급 + 별의 성좌(환생) + P1-3 양호실 처방 + P1-7 심연 비전 각인 + P3-5 교수 인연 배율 + P3-4 성좌 서약 + P4-2 기록실 + P4-3 교수 동행 + P4-4 마도구 세트
  const starPowerMult = 1 + (up.starPower ?? 0) * 0.18;
  const starVitMult = 1 + (up.starVitality ?? 0) * 0.18;
  const infEffect = getActiveInfirmaryEffect(state);
  const sanctumBonus = getSanctumBonuses(state);
  const affinityBonus = getAffinityBonuses(state);
  const archiveBonus = getArchiveBonuses(state);
  const escortBonus = getEscortBonuses(state);
  const setBonus = getGearSetBonuses(state.equipped);
  const truthBonus = getTruthRouteBonuses(state);
  const schoolQuestBonus = getSchoolQuestBonuses(state);
  const vow = getRebirthVow(state.prestige.activeVow);
  if (escortBonus.categoryBonus) {
    categoryBonus[escortBonus.categoryBonus.category] += escortBonus.categoryBonus.pct;
  }
  for (const [cat, pct] of Object.entries(setBonus.categoryBonuses) as [
    MagicCategory,
    number | undefined,
  ][]) {
    if (pct) categoryBonus[cat] += pct;
  }
  for (const [cat, pct] of Object.entries(schoolQuestBonus.categoryBonuses) as [
    MagicCategory,
    number | undefined,
  ][]) {
    if (pct) categoryBonus[cat] += pct;
  }
  critRate +=
    sanctumBonus.critRateBonus +
    affinityBonus.critRate +
    archiveBonus.critRate +
    escortBonus.critRate +
    setBonus.critRate +
    truthBonus.critRate +
    schoolQuestBonus.critRate;
  critDmg +=
    sanctumBonus.critDmgBonus +
    vow.critDmgBonus +
    archiveBonus.critDmg +
    escortBonus.critDmg +
    setBonus.critDmg +
    truthBonus.critDmg +
    schoolQuestBonus.critDmg;
  mpRegen +=
    affinityBonus.mpRegen +
    archiveBonus.mpRegen +
    escortBonus.mpRegen +
    setBonus.mpRegen;

  const magic = Math.round(
    (baseMagic + eqMagic) *
      schoolInfo.statWeights.magicMult *
      rankInfo.statMult *
      (1 + famMagicPct / 100) *
      starPowerMult *
      sanctumBonus.magicMult *
      (1 + affinityBonus.magicPct / 100) *
      (1 + archiveBonus.magicPct / 100) *
      (1 + escortBonus.magicPct / 100) *
      (1 + setBonus.magicPct / 100) *
      (1 + truthBonus.magicPct / 100) *
      (1 + schoolQuestBonus.magicPct / 100) *
      (infEffect?.magicMult ?? 1) *
      vow.magicMult
  );
  const maxHp = Math.round(
    (baseHp + eqHp) *
      schoolInfo.statWeights.hpMult *
      rankInfo.statMult *
      (1 + famHpPct / 100) *
      starVitMult *
      sanctumBonus.hpMult *
      (1 + affinityBonus.hpPct / 100) *
      (1 + archiveBonus.hpPct / 100) *
      (1 + escortBonus.hpPct / 100) *
      (1 + setBonus.hpPct / 100) *
      (1 + truthBonus.hpPct / 100) *
      (1 + schoolQuestBonus.hpPct / 100) *
      (infEffect?.hpMult ?? 1)
  );
  const maxMp = Math.round((baseMp + eqMp) * (state.school === 'frost' ? 1.18 : 1) * vow.maxMpMult);
  const def = Math.round(
    (baseDef + eqDef) *
      schoolInfo.statWeights.defMult *
      rankInfo.statMult *
      (1 + famDefPct / 100) *
      starVitMult *
      sanctumBonus.defMult *
      (1 + affinityBonus.defPct / 100) *
      (1 + archiveBonus.defPct / 100) *
      (1 + escortBonus.defPct / 100) *
      (1 + setBonus.defPct / 100) *
      (1 + truthBonus.defPct / 100) *
      (1 + schoolQuestBonus.defPct / 100) *
      (infEffect?.defMult ?? 1)
  );

  const maxDeckSlots = rankInfo.deckSlots + (up.sixthDeckSlot ?? 0);
  const maxTrainSlots = rankInfo.trainSlots + (up.extraTrainSlot ?? 0);
  const maxSkillLevel = 10 + (up.skillCapBreak ?? 0) * 5;
  const trainSpeedMult =
    (1 + (up.trainAccel ?? 0) * 0.25) *
    (1 + affinityBonus.trainSpeedPct / 100) *
    vow.trainSpeedMult;
  const darkDamageMult =
    1 +
    (up.darkMastery ?? 0) * 0.15 +
    escortBonus.darkDamagePct / 100 +
    setBonus.darkDamagePct / 100;

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
  const aff = getAffinityBonuses(state);
  const affRewardAvg = (aff.expPct + aff.stonePct) / 200;
  const archiveBonus = getArchiveBonuses(state);
  const truthBonus = getTruthRouteBonuses(state);
  const escortBonus = getEscortBonuses(state);
  const escortRewardAvg = (escortBonus.expPct + escortBonus.stonePct) / 200;
  const vow = getRebirthVow(state.prestige.activeVow);
  const ngScale = getNgPlusBaselineScaling(state.prestige.rebirthCount);
  return (
    1 +
    wealthLv * 0.15 +
    affRewardAvg +
    archiveBonus.rewardPct / 100 +
    truthBonus.rewardPct / 100 +
    escortRewardAvg +
    vow.rewardMultBonus +
    (ngScale.rewardMult - 1)
  );
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
