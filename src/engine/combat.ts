import {
  getBossGimmick,
  getSealBossDamageBonusPct,
  GRIMOIRE_SEALS,
  isGimmickCountered,
} from '../data/bossGimmicks';
import { effectiveStoneReward } from '../data/economy';
import { ACTS, createAbyssEliteMonster, createTowerMonster } from '../data/acts';
import { FAMILIARS } from '../data/familiars';
import { getActiveInfirmaryEffect } from '../data/infirmary';
import { getNgPlusBaselineScaling, getRebirthVow, type RebirthVowDef } from '../data/rebirthVows';
import { RANK_EXAM_BOSSES } from '../data/schools';
import { applyRuneToSkill } from '../data/runes';
import { SKILL_MAP } from '../data/skills';
import {
  STARLIGHT_GAIN_CRIT,
  STARLIGHT_GAIN_HIT,
  STARLIGHT_GAIN_TURN,
  STARLIGHT_MAX,
  STARLIGHT_PERFECT_MULT,
  STARLIGHT_PERFECT_REFUND,
  STARLIGHT_SKILLS,
} from '../data/starlight';
import type {
  CombatLogEntry,
  CombatMode,
  CombatRuntime,
  ComputedStats,
  GameState,
  MonsterDef,
  StatusEffect,
  StatusType,
} from '../types/game';
import { getSkillPowerMultiplier } from './stats';

let logIdCounter = 1;
let vfxIdCounter = 1;

function nextLog(turn: number, text: string, tone: CombatLogEntry['tone']): CombatLogEntry {
  return { id: logIdCounter++, turn, text, tone };
}

function getEffectiveMpCost(baseMpCost: number, vow: RebirthVowDef): number {
  if (vow.mpCostMult === 1) return baseMpCost;
  return Math.max(0, Math.round(baseMpCost * vow.mpCostMult));
}

function getEffectiveCooldown(baseCooldown: number, vow: RebirthVowDef): number {
  if (baseCooldown >= 2 && vow.cooldownCut > 0) {
    return Math.max(1, baseCooldown - vow.cooldownCut);
  }
  return baseCooldown;
}

function applyDamageToEnemy(
  dmg: number,
  enemyHp: number,
  enemyShield: number
): { enemyHp: number; enemyShield: number; shieldAbsorbed: number; hpDmg: number } {
  const safeDmg = Math.max(0, dmg);
  const shieldAbsorbed = Math.min(enemyShield, safeDmg);
  const nextShield = enemyShield - shieldAbsorbed;
  const hpDmg = safeDmg - shieldAbsorbed;
  const nextHp = Math.max(0, enemyHp - hpDmg);
  return { enemyHp: nextHp, enemyShield: nextShield, shieldAbsorbed, hpDmg };
}

export function getMonsterForMode(
  state: GameState,
  mode: CombatMode,
  act = state.selectedAct,
  stageIndex = state.selectedStage,
  towerFloor = state.towerFloor
): MonsterDef {
  if (mode === 'rankBoss') {
    const nextRank = Math.min(5, state.rank + 1);
    return RANK_EXAM_BOSSES[nextRank] ?? RANK_EXAM_BOSSES[5];
  }
  if (mode === 'tower') {
    return createTowerMonster(towerFloor);
  }
  if (mode === 'abyssElite') {
    return createAbyssEliteMonster(state.level, state.rank);
  }
  const actDef = ACTS[Math.max(0, Math.min(ACTS.length - 1, act - 1))];
  return actDef.stages[Math.max(0, Math.min(actDef.stages.length - 1, stageIndex))];
}

/**
 * P0-2 보스 위협감 튜닝 — 막 보스 · 승급 시험 보스.
 * 값은 scripts/balance-sim.ts 시뮬(신규 캐릭·장비 없음, 300판) 기준으로 맞춤.
 *  P0-4(시작 스킬 3종) 이후: 보호막으로 강공격을 받아내면 Lv8~10에서 돌파, 못 막으면 사망.
 *  progress-sim 기준 4막 보스 도달 ≈ 25~35분(대지 ≈ 70분).
 */
export const BOSS_TUNING = {
  hpMult: 2.0,
  atkMult: 1.5,
  rankHpMult: 1.8,
  rankAtkMult: 1.4,
  /** 강공격 최저 피해 = 플레이어 최대 HP × [min, max] */
  heavyPctAct: [0.35, 0.43] as readonly [number, number],
  heavyPctRank: [0.42, 0.5] as readonly [number, number],
};

function isThreatBoss(enemy: MonsterDef, mode: CombatMode): boolean {
  if (mode === 'rankBoss') return true;
  return mode === 'stage' && Boolean(enemy.isBoss);
}

/**
 * P0-3 일반몹 위협감 튜닝 — 막 사냥터(x-1 ~ x-4) 일반 몬스터.
 * scripts/progress-sim.ts 기준 목표: 적정 레벨 전투 4~6턴 · 전투당 HP 손실 15~35%
 * 결과(공격 ×2.3): 평균 4.8~7.6턴 · HP 손실 11~43% (대지 최저 · 빙결 최고) · 패배 시 한 구역 후퇴
 */
export const MOB_TUNING = {
  hpMult: 1.0,
  atkMult: 2.3,
};

/**
 * P0-6 막별 난이도 램프 — 승급 요구 레벨(Lv30/44/60) 때문에 3막 이후엔 플레이어가 데이터 설계보다
 * 고레벨로 입장해 전투가 1~2턴 컷이 되던 문제 보정. 막 사냥터(일반몹+막 보스)의 HP·공격·EXP에 곱한다.
 * EXP도 같이 올려서 "전투는 길어지지만 레벨업 속도(분당 EXP)는 유지".
 */
export const ACT_RAMP = {
  /** 3막부터 막마다 곱해지는 배율 (3막=r, 4막=r², 5막=r³, 6막=r⁴) */
  perAct: 1.5,
  atkShare: 0.6,
};

export function getActRamp(act: number): { hp: number; atk: number; exp: number } {
  const steps = Math.max(0, act - 2);
  const hp = Math.pow(ACT_RAMP.perAct, steps);
  return { hp, atk: 1 + (hp - 1) * ACT_RAMP.atkShare, exp: hp };
}

/** 원본 데이터는 그대로 두고 전투 런타임용 사본에만 배율 적용 */
function applyBossTuning(
  enemy: MonsterDef,
  mode: CombatMode,
  act: number,
  vow: RebirthVowDef,
  ngScale: { enemyHpMult: number; enemyAtkMult: number; rewardMult: number }
): MonsterDef {
  const ramp = mode === 'stage' ? getActRamp(act) : { hp: 1, atk: 1, exp: 1 };
  let base = enemy;
  if (mode === 'stage' && !enemy.isBoss) {
    base = {
      ...enemy,
      hp: Math.round(enemy.hp * MOB_TUNING.hpMult * ramp.hp),
      atk: Math.round(enemy.atk * MOB_TUNING.atkMult * ramp.atk),
      expReward: Math.round(enemy.expReward * ramp.exp),
    };
  } else if (isThreatBoss(enemy, mode)) {
    const isRank = mode === 'rankBoss';
    base = {
      ...enemy,
      hp: Math.round(enemy.hp * (isRank ? BOSS_TUNING.rankHpMult : BOSS_TUNING.hpMult) * ramp.hp),
      atk: Math.round(enemy.atk * (isRank ? BOSS_TUNING.rankAtkMult : BOSS_TUNING.atkMult) * ramp.atk),
      expReward: Math.round(enemy.expReward * ramp.exp),
    };
  }

  return {
    ...base,
    hp: Math.max(1, Math.round(base.hp * ngScale.enemyHpMult * vow.enemyHpMult)),
    atk: Math.max(1, Math.round(base.atk * ngScale.enemyAtkMult * vow.enemyAtkMult)),
    def: Math.max(0, Math.round(base.def * vow.enemyDefMult)),
  };
}

export function createCombatRuntime(
  state: GameState,
  stats: ComputedStats,
  mode: CombatMode,
  act = state.selectedAct,
  stageIndex = state.selectedStage,
  towerFloor = state.towerFloor,
  initialStarlight = 0
): CombatRuntime {
  const vow = getRebirthVow(state.prestige.activeVow);
  const ngScale = getNgPlusBaselineScaling(state.prestige.rebirthCount);
  const tuned = applyBossTuning(
    getMonsterForMode(state, mode, act, stageIndex, towerFloor),
    mode,
    act,
    vow,
    ngScale
  );
  // P0-6: 마석 보상 곡선 압축 (전투 화면 표시·실제 지급 모두 이 값 사용)
  const enemy = { ...tuned, stoneReward: effectiveStoneReward(tuned.stoneReward) };
  const introMsg =
    mode === 'rankBoss'
      ? `승급 시험 개시! [${enemy.name}]이(가) 앞을 가로막습니다.`
      : mode === 'tower'
        ? `무한 심연 탑 ${towerFloor}층 — [${enemy.name}] 출현!`
        : mode === 'abyssElite'
          ? `심연 미궁 정예전 — [${enemy.name}]과(와) 조우했습니다!`
          : `[${enemy.name}]이(가) 검은 안개 속에서 나타났습니다.`;

  const initialLogs: CombatLogEntry[] = [nextLog(0, introMsg, 'system')];
  const infEffect = getActiveInfirmaryEffect(state);
  if (infEffect && state.infirmary) {
    initialLogs.push(
      nextLog(
        0,
        `양호실 처방 [${infEffect.name}] 적용 중 (${infEffect.badgeText}, 남은 ${state.infirmary.battlesLeft}전투)`,
        infEffect.tone === 'buff' ? 'heal' : 'status'
      )
    );
  }
  const bossQuote =
    state.prestige.rebirthCount >= 1 && enemy.ngPlusQuote
      ? enemy.ngPlusQuote
      : enemy.encounterQuote;
  if (bossQuote) {
    initialLogs.push(nextLog(0, `${enemy.name}: “${bossQuote}”`, 'dark'));
  }

  const gimmickDef = getBossGimmick(enemy.gimmick);
  if (gimmickDef) {
    const countered = isGimmickCountered(enemy.gimmick, state.grimoireSeal);
    const activeSealDef = state.grimoireSeal ? GRIMOIRE_SEALS[state.grimoireSeal] : null;
    const counterSealDef = GRIMOIRE_SEALS[gimmickDef.counterSealId];
    if (countered && activeSealDef) {
      initialLogs.push(
        nextLog(
          0,
          `📖 보스 기믹 [${gimmickDef.name}] 감지! 장착 서표 [${activeSealDef.name}]이(가) 공명하여 파훼 준비 완료!`,
          'starlight'
        )
      );
    } else {
      initialLogs.push(
        nextLog(
          0,
          `⚠ 보스 기믹 [${gimmickDef.name}]: ${gimmickDef.shortDesc} (권장 서표: ${counterSealDef.name})`,
          'status'
        )
      );
    }
  }

  return {
    mode,
    act,
    stageIndex,
    towerFloor,
    turn: 0,
    playerHp: stats.maxHp,
    playerMaxHp: stats.maxHp,
    playerMp: stats.maxMp,
    playerMaxMp: stats.maxMp,
    playerShield: 0,
    playerStatuses: [],
    cooldowns: {},
    enemy,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.hp,
    enemyStatuses: [],
    enemyTelegraph: false,
    familiarCounter: 0,
    starlightGauge: Math.max(0, Math.min(STARLIGHT_MAX, Math.round(initialStarlight))),
    starlightFlash: null,
    enemyShield: 0,
    bossGimmickTriggered: false,
    gimmickSuppressedTurns: 0,
    logs: initialLogs,
    lastVfx: null,
    victoryBanner: null,
  };
}

function addOrRefreshStatus(list: StatusEffect[], effect: StatusEffect): StatusEffect[] {
  const idx = list.findIndex((s) => s.type === effect.type);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = {
      type: effect.type,
      turns: Math.max(next[idx].turns, effect.turns),
      value: Math.max(next[idx].value, effect.value),
    };
    return next;
  }
  return [...list, effect];
}

function getStatus(list: StatusEffect[], type: StatusType): StatusEffect | undefined {
  return list.find((s) => s.type === type);
}

function decrementStatuses(list: StatusEffect[]): StatusEffect[] {
  return list
    .map((s) => ({ ...s, turns: s.turns - 1 }))
    .filter((s) => s.turns > 0);
}

export interface TurnOutcome {
  combat: CombatRuntime;
  result: 'ongoing' | 'victory' | 'defeat';
  sfx: 'cast' | 'crit' | 'heal' | 'dark' | 'victory' | 'defeat' | 'hit' | 'starlight' | 'starlightPerfect';
}

export function stepCombatTurn(
  prev: CombatRuntime,
  state: GameState,
  stats: ComputedStats
): TurnOutcome {
  const turn = prev.turn + 1;
  const vow = getRebirthVow(state.prestige.activeVow);
  const gimmickDef = getBossGimmick(prev.enemy.gimmick);
  const countered = isGimmickCountered(prev.enemy.gimmick, state.grimoireSeal);
  const sealBossDmgMult = prev.enemy.isBoss
    ? 1 + getSealBossDamageBonusPct(Boolean(state.equipped.grimoire), countered) / 100
    : 1;
  const wardSealBonusMp =
    countered && prev.enemy.gimmick === 'silence_ink' && state.grimoireSeal === 'seal_ward'
      ? 6
      : 0;
  const dawnSealStarlightMult =
    countered && prev.enemy.gimmick === 'eclipse_doom' && state.grimoireSeal === 'seal_dawn'
      ? 1.35
      : 1;

  let playerHp = Math.min(stats.maxHp, prev.playerHp);
  let playerMp = Math.min(stats.maxMp, prev.playerMp + stats.mpRegen + wardSealBonusMp);
  let playerShield = prev.playerShield;
  let playerStatuses = [...prev.playerStatuses];
  let enemyHp = prev.enemyHp;
  let enemyShield = prev.enemyShield ?? 0;
  let bossGimmickTriggered = prev.bossGimmickTriggered ?? false;
  let gimmickSuppressedTurns = prev.gimmickSuppressedTurns ?? 0;
  let enemyAtkNow = prev.enemy.atk;
  let enemyStatuses = [...prev.enemyStatuses];
  let starlightGauge = prev.starlightGauge ?? 0;
  let landedCrit = false;
  const cooldowns: Record<string, number> = {};
  for (const [k, v] of Object.entries(prev.cooldowns)) {
    if (v > 1) cooldowns[k] = v - 1;
  }

  const newLogs: CombatLogEntry[] = [];
  let lastVfx = prev.lastVfx;
  let sfx: TurnOutcome['sfx'] = 'cast';

  // 1) 플레이어 턴 시작 상태이상(재생 / 화상·독)
  const regen = getStatus(playerStatuses, 'regen');
  if (regen && playerHp < stats.maxHp) {
    const healAmt = Math.max(1, Math.round(stats.maxHp * regen.value * vow.healMult));
    playerHp = Math.min(stats.maxHp, playerHp + healAmt);
    newLogs.push(nextLog(turn, `여신의 재생으로 체력 +${healAmt.toLocaleString()} 회복.`, 'heal'));
  }

  for (const dotType of ['burn', 'poison'] as StatusType[]) {
    const dot = getStatus(playerStatuses, dotType);
    if (dot) {
      const dotDmg = Math.max(1, Math.round(enemyAtkNow * dot.value));
      playerHp = Math.max(1, playerHp - dotDmg);
      newLogs.push(
        nextLog(
          turn,
          `${dotType === 'burn' ? '화상' : '중독'} 피해로 -${dotDmg.toLocaleString()} 체력 감소.`,
          'status'
        )
      );
    }
  }

  const playerFrozen = Boolean(getStatus(playerStatuses, 'freeze'));

  // 2) 플레이어 행동 — 심플 로테이션 (1→N번 순서대로 쿨타임/마나 확인)
  if (playerFrozen) {
    newLogs.push(nextLog(turn, `빙결 상태에 걸려 이번 턴 행동하지 못했습니다!`, 'status'));
  } else {
    const validDeck = state.deck.slice(0, stats.maxDeckSlots);
    let chosenSkillId: string | null = null;
    // P0-2: 강공격 예고 턴엔 덱에 있는 보호막 스킬을 우선 사용 (예고 → 대응 플레이)
    if (prev.enemyTelegraph) {
      for (const sid of validDeck) {
        const baseDef = SKILL_MAP[sid];
        const learned = state.skills[sid];
        if (!baseDef || !learned?.unlocked) continue;
        const { effective: def, runeDef } = applyRuneToSkill(baseDef, learned.rune);
        if (!def.isShield) continue;
        const mpCost = getEffectiveMpCost(def.mpCost, vow);
        if ((cooldowns[sid] ?? 0) > 0 || playerMp < mpCost) continue;
        chosenSkillId = sid;
        const tag = runeDef ? `${def.name}·${runeDef.name}` : def.name;
        newLogs.push(nextLog(turn, `강공격에 대비해 [${tag}]을(를) 먼저 펼칩니다!`, 'status'));
        break;
      }
    }
    for (const sid of chosenSkillId ? [] : validDeck) {
      const baseDef = SKILL_MAP[sid];
      const learned = state.skills[sid];
      if (!baseDef || !learned?.unlocked) continue;
      const { effective: def } = applyRuneToSkill(baseDef, learned.rune);
      if ((cooldowns[sid] ?? 0) > 0) continue;
      const mpCost = getEffectiveMpCost(def.mpCost, vow);
      if (playerMp < mpCost) continue;
      // P0-4: 순수 방어 스킬(보호막 버프)은 보호막이 이미 남아 있으면 아껴둔다 (강공격 예고 대비)
      if (def.isShield && def.isBuff && playerShield > 0) continue;
      // 회복 스킬은 체력이 92% 이상이고 정화 필요 없으면 자연스럽게 스킵해 낭비 방지
      if (def.isHeal && !def.isBuff && playerHp >= stats.maxHp * 0.92) {
        const hasDebuff = playerStatuses.some(
          (s) => s.type === 'burn' || s.type === 'poison' || s.type === 'curse' || s.type === 'shock'
        );
        if (!def.isCleanse || !hasDebuff) continue;
      }
      chosenSkillId = sid;
      break;
    }

    const atkBuff = getStatus(playerStatuses, 'atkUp');
    const atkMult = atkBuff ? 1 + atkBuff.value : 1;
    const enemyVuln =
      1 +
      (getStatus(enemyStatuses, 'shock')?.value ?? 0) +
      (getStatus(enemyStatuses, 'curse')?.value ?? 0);

    if (chosenSkillId) {
      const baseDef = SKILL_MAP[chosenSkillId];
      const learned = state.skills[chosenSkillId];
      const { effective: def, runeDef } = applyRuneToSkill(baseDef, learned.rune);
      const skillTag = runeDef ? `${def.name}·${runeDef.name}` : def.name;
      const lvMult = getSkillPowerMultiplier(learned.level);
      const catMult = 1 + (stats.categoryBonus[def.category] ?? 0) / 100;
      const darkMult = def.category === 'dark' ? stats.darkDamageMult : 1;
      const mpCost = getEffectiveMpCost(def.mpCost, vow);
      const effCooldown = getEffectiveCooldown(def.cooldown, vow);

      playerMp -= mpCost;
      if (def.hpCostPct) {
        const sac = Math.max(1, Math.round(playerHp * (def.hpCostPct / 100)));
        playerHp = Math.max(1, playerHp - sac);
      }
      if (effCooldown > 0) {
        cooldowns[def.id] = effCooldown;
      }

      if (def.isHeal) {
        const healVal = Math.max(
          1,
          Math.round(stats.magic * (def.powerPct / 100) * lvMult * catMult * vow.healMult)
        );
        playerHp = Math.min(stats.maxHp, playerHp + healVal);
        if (def.isCleanse) {
          playerStatuses = playerStatuses.filter(
            (s) => s.type === 'shield' || s.type === 'atkUp' || s.type === 'reflect' || s.type === 'regen'
          );
        }
        if (def.applyStatus && def.applyStatus.target === 'self') {
          playerStatuses = addOrRefreshStatus(playerStatuses, {
            type: def.applyStatus.type,
            turns: def.applyStatus.turns,
            value: def.applyStatus.value,
          });
        }
        if (def.secondaryStatus && def.secondaryStatus.target === 'self') {
          playerStatuses = addOrRefreshStatus(playerStatuses, {
            type: def.secondaryStatus.type,
            turns: def.secondaryStatus.turns,
            value: def.secondaryStatus.value,
          });
        }
        sfx = 'heal';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'player',
          category: def.category,
          amountText: `+${healVal.toLocaleString()}`,
          isHeal: true,
          label: skillTag,
        };
        newLogs.push(
          nextLog(
            turn,
            `[${skillTag}] 시전! 체력 +${healVal.toLocaleString()} 회복${def.isCleanse ? ' (상태이상 정화)' : ''}.`,
            'heal'
          )
        );
      } else if (def.isBuff && def.powerPct === 0) {
        if (def.applyStatus && def.applyStatus.target === 'self') {
          playerStatuses = addOrRefreshStatus(playerStatuses, {
            type: def.applyStatus.type,
            turns: def.applyStatus.turns,
            value: def.applyStatus.value,
          });
        }
        if (def.secondaryStatus && def.secondaryStatus.target === 'self') {
          playerStatuses = addOrRefreshStatus(playerStatuses, {
            type: def.secondaryStatus.type,
            turns: def.secondaryStatus.turns,
            value: def.secondaryStatus.value,
          });
        }
        sfx = 'heal';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'player',
          category: def.category,
          amountText: '강화!',
          isHeal: true,
          label: skillTag,
        };
        newLogs.push(nextLog(turn, `[${skillTag}] 발동! 마력이 강하게 요동칩니다.`, 'player'));
      } else if (def.isShield && def.isBuff) {
        const shieldVal = Math.round(stats.magic * (def.powerPct / 100) * lvMult);
        playerShield = Math.max(playerShield, shieldVal);
        if (def.applyStatus && def.applyStatus.target === 'self') {
          playerStatuses = addOrRefreshStatus(playerStatuses, {
            type: def.applyStatus.type,
            turns: def.applyStatus.turns,
            value: def.applyStatus.value,
          });
        }
        if (def.secondaryStatus && def.secondaryStatus.target === 'self') {
          playerStatuses = addOrRefreshStatus(playerStatuses, {
            type: def.secondaryStatus.type,
            turns: def.secondaryStatus.turns,
            value: def.secondaryStatus.value,
          });
        }
        sfx = 'heal';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'player',
          category: def.category,
          amountText: `보호막 ${shieldVal.toLocaleString()}`,
          isHeal: true,
          label: skillTag,
        };
        newLogs.push(
          nextLog(turn, `[${skillTag}] 전개! ${shieldVal.toLocaleString()} 보호막 형성.`, 'player')
        );
      } else {
        // 공격 마법 (단일/다단)
        const hits = def.hits ?? 1;
        const hasBurn = Boolean(getStatus(enemyStatuses, 'burn'));
        const burnMult = hasBurn && def.burnBonusPct ? 1 + def.burnBonusPct / 100 : 1;
        let totalDmg = 0;
        let anyCrit = false;

        for (let h = 0; h < hits; h++) {
          const isCrit = Math.random() * 100 < stats.critRate + (def.bonusCrit ?? 0);
          if (isCrit) anyCrit = true;
          const critMult = isCrit ? stats.critDmg / 100 : 1;
          const raw =
            stats.magic *
            (def.powerPct / 100) *
            lvMult *
            catMult *
            darkMult *
            atkMult *
            burnMult *
            enemyVuln *
            sealBossDmgMult *
            critMult *
            (0.94 + Math.random() * 0.12);
          const mitigated = Math.max(
            Math.round(raw * 0.25),
            Math.round(raw - prev.enemy.def * 0.48)
          );
          totalDmg += mitigated;
        }

        const hitRes = applyDamageToEnemy(totalDmg, enemyHp, enemyShield);
        enemyHp = hitRes.enemyHp;
        enemyShield = hitRes.enemyShield;

        // 흡혈
        let drainText = '';
        if (def.lifestealPct) {
          const drain = Math.round(totalDmg * (def.lifestealPct / 100) * vow.healMult);
          playerHp = Math.min(stats.maxHp, playerHp + drain);
          drainText = ` (흡혈 +${drain.toLocaleString()})`;
        }

        // 공격 + 보호막 복합 스킬
        if (def.isShield && def.applyStatus?.type === 'shield') {
          const shieldVal = Math.round(stats.magic * def.applyStatus.value);
          playerShield = Math.max(playerShield, shieldVal);
        }

        // 상태이상 적용
        const statusNotes: string[] = [];
        const applyList = [def.applyStatus, def.secondaryStatus].filter(Boolean);
        for (const st of applyList) {
          if (!st) continue;
          const chance = 'chance' in st && typeof st.chance === 'number' ? st.chance : 1;
          if (Math.random() <= chance) {
            if (st.target === 'enemy') {
              enemyStatuses = addOrRefreshStatus(enemyStatuses, {
                type: st.type,
                turns: st.turns,
                value: st.value,
              });
              const nameMap: Record<StatusType, string> = {
                burn: '화상',
                freeze: '빙결',
                shock: '감전',
                poison: '독',
                curse: '저주',
                shield: '보호막',
                atkUp: '증폭',
                reflect: '반사',
                regen: '재생',
              };
              statusNotes.push(nameMap[st.type]);
            } else if (st.type !== 'shield') {
              playerStatuses = addOrRefreshStatus(playerStatuses, {
                type: st.type,
                turns: st.turns,
                value: st.value,
              });
            }
          }
        }

        if (anyCrit) landedCrit = true;
        sfx = def.category === 'dark' ? 'dark' : anyCrit ? 'crit' : 'cast';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'enemy',
          category: def.category,
          amountText: `${totalDmg.toLocaleString()}${anyCrit ? '!' : ''}`,
          isCrit: anyCrit,
          label: skillTag,
        };
        const statusTail = statusNotes.length > 0 ? ` [${statusNotes.join('·')}]` : '';
        const shieldTail =
          hitRes.shieldAbsorbed > 0 ? ` (결계 -${hitRes.shieldAbsorbed.toLocaleString()})` : '';
        newLogs.push(
          nextLog(
            turn,
            `[${skillTag}] → ${prev.enemy.name}에게 ${totalDmg.toLocaleString()} 피해!${
              anyCrit ? ' (치명타)' : ''
            }${shieldTail}${drainText}${statusTail}`,
            def.category === 'dark' ? 'dark' : anyCrit ? 'crit' : 'player'
          )
        );
      }
    } else {
      // 기본 마탄 (마나 회복)
      const isCrit = Math.random() * 100 < stats.critRate;
      if (isCrit) landedCrit = true;
      const raw =
        stats.magic *
        0.85 *
        atkMult *
        enemyVuln *
        sealBossDmgMult *
        (isCrit ? stats.critDmg / 100 : 1);
      const dmg = Math.max(Math.round(raw * 0.25), Math.round(raw - prev.enemy.def * 0.45));
      const hitRes = applyDamageToEnemy(dmg, enemyHp, enemyShield);
      enemyHp = hitRes.enemyHp;
      enemyShield = hitRes.enemyShield;
      const mpGain = Math.round(10 + stats.mpRegen * 0.5);
      playerMp = Math.min(stats.maxMp, playerMp + mpGain);
      sfx = isCrit ? 'crit' : 'cast';
      lastVfx = {
        id: vfxIdCounter++,
        target: 'enemy',
        category: 'basic',
        amountText: `${dmg.toLocaleString()}`,
        isCrit,
        label: '마력탄',
      };
      const shieldTail =
        hitRes.shieldAbsorbed > 0 ? ` (결계 -${hitRes.shieldAbsorbed.toLocaleString()})` : '';
      newLogs.push(
        nextLog(
          turn,
          `[마력탄]으로 ${dmg.toLocaleString()} 피해${shieldTail} (마나 +${mpGain}).`,
          'player'
        )
      );
    }
  }

  // P3-1: 별빛 공명 게이지 충전 (매 턴 +16, 빙결 시 +8, 치명타 시 +8) × 서약/서표 배율
  const turnStarGain =
    (playerFrozen ? Math.floor(STARLIGHT_GAIN_TURN / 2) : STARLIGHT_GAIN_TURN) +
    (landedCrit ? STARLIGHT_GAIN_CRIT : 0);
  starlightGauge = Math.min(
    STARLIGHT_MAX,
    starlightGauge + Math.round(turnStarGain * vow.starlightGainMult * dawnSealStarlightMult)
  );

  // 3) 사역마 보조 행동
  let familiarCounter = prev.familiarCounter;
  if (enemyHp > 0 && state.activeFamiliar) {
    const ownedFam = state.familiars[state.activeFamiliar];
    const famDef = FAMILIARS[state.activeFamiliar];
    if (ownedFam && famDef) {
      familiarCounter += 1;
      if (familiarCounter >= famDef.intervalTurns) {
        familiarCounter = 0;
        const famName = famDef.evolvedNames[ownedFam.evolution];
        const famScale = 1 + (ownedFam.level - 1) * 0.08 + ownedFam.evolution * 0.45;
        if (famDef.id === 'raven') {
          const dmg = Math.max(1, Math.round(stats.magic * 0.72 * famScale * sealBossDmgMult));
          const hitRes = applyDamageToEnemy(dmg, enemyHp, enemyShield);
          enemyHp = hitRes.enemyHp;
          enemyShield = hitRes.enemyShield;
          enemyStatuses = addOrRefreshStatus(enemyStatuses, {
            type: 'curse',
            turns: 2,
            value: 0.16 + ownedFam.evolution * 0.05,
          });
          newLogs.push(
            nextLog(turn, `사역마 [${famName}]이(가) 급소를 쪼아 ${dmg.toLocaleString()} 피해 & 저주!`, 'familiar')
          );
        } else if (famDef.id === 'golem') {
          const sh = Math.round(stats.magic * 1.15 * famScale);
          playerShield = Math.max(playerShield, sh);
          newLogs.push(
            nextLog(turn, `사역마 [${famName}]이(가) ${sh.toLocaleString()} 뼈 보호막 전개!`, 'familiar')
          );
        } else if (famDef.id === 'wisp') {
          const hpH = Math.max(1, Math.round(stats.maxHp * (0.08 + ownedFam.evolution * 0.03) * vow.healMult));
          const mpH = Math.round(18 * famScale);
          playerHp = Math.min(stats.maxHp, playerHp + hpH);
          playerMp = Math.min(stats.maxMp, playerMp + mpH);
          newLogs.push(
            nextLog(turn, `사역마 [${famName}]이(가) 체력 +${hpH.toLocaleString()}, 마나 +${mpH} 회복!`, 'familiar')
          );
        } else if (famDef.id === 'wolf') {
          const crit = Math.random() < 0.45;
          const dmg = Math.max(
            1,
            Math.round(stats.magic * 0.98 * famScale * (crit ? 1.65 : 1) * sealBossDmgMult)
          );
          const hitRes = applyDamageToEnemy(dmg, enemyHp, enemyShield);
          enemyHp = hitRes.enemyHp;
          enemyShield = hitRes.enemyShield;
          newLogs.push(
            nextLog(
              turn,
              `사역마 [${famName}]의 그림자 습격! ${dmg.toLocaleString()} 피해${crit ? ' (치명타)' : ''}.`,
              'familiar'
            )
          );
        } else if (famDef.id === 'owl') {
          const dmg = Math.max(1, Math.round(stats.magic * 0.78 * famScale * sealBossDmgMult));
          const hitRes = applyDamageToEnemy(dmg, enemyHp, enemyShield);
          enemyHp = hitRes.enemyHp;
          enemyShield = hitRes.enemyShield;
          const froze = Math.random() < 0.35 + ownedFam.evolution * 0.1;
          if (froze) {
            enemyStatuses = addOrRefreshStatus(enemyStatuses, { type: 'freeze', turns: 1, value: 0 });
          }
          newLogs.push(
            nextLog(
              turn,
              `사역마 [${famName}]의 서리 날개짓! ${dmg.toLocaleString()} 피해${froze ? ' [빙결]' : ''}.`,
              'familiar'
            )
          );
        } else if (famDef.id === 'bat') {
          const dmg = Math.max(1, Math.round(stats.magic * 0.84 * famScale * sealBossDmgMult));
          const heal = Math.round(dmg * 0.45 * vow.healMult);
          const hitRes = applyDamageToEnemy(dmg, enemyHp, enemyShield);
          enemyHp = hitRes.enemyHp;
          enemyShield = hitRes.enemyShield;
          playerHp = Math.min(stats.maxHp, playerHp + heal);
          enemyStatuses = addOrRefreshStatus(enemyStatuses, {
            type: 'burn',
            turns: 2,
            value: 0.3,
          });
          newLogs.push(
            nextLog(
              turn,
              `사역마 [${famName}]의 흑염 흡혈! ${dmg.toLocaleString()} 피해 & 체력 +${heal.toLocaleString()}.`,
              'familiar'
            )
          );
        }
      }
    }
  }

  // 4) 적 도트 피해 정산 (화상/독)
  if (enemyHp > 0) {
    for (const dotType of ['burn', 'poison'] as StatusType[]) {
      const dot = getStatus(enemyStatuses, dotType);
      if (dot) {
        const dotDmg = Math.max(1, Math.round(stats.magic * dot.value));
        const hitRes = applyDamageToEnemy(dotDmg, enemyHp, enemyShield);
        enemyHp = hitRes.enemyHp;
        enemyShield = hitRes.enemyShield;
        newLogs.push(
          nextLog(
            turn,
            `${prev.enemy.name}이(가) ${dotType === 'burn' ? '화상' : '맹독'}으로 ${dotDmg.toLocaleString()} 지속 피해!`,
            'status'
          )
        );
      }
    }
  }

  // 적 처치 판정
  if (enemyHp <= 0) {
    newLogs.push(nextLog(turn, `${prev.enemy.name}을(를) 쓰러뜨렸습니다!`, 'system'));
    return {
      result: 'victory',
      sfx: 'victory',
      combat: {
        ...prev,
        turn,
        enemy: enemyAtkNow !== prev.enemy.atk ? { ...prev.enemy, atk: enemyAtkNow } : prev.enemy,
        playerHp,
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield,
        playerStatuses: decrementStatuses(playerStatuses),
        cooldowns,
        enemyHp: 0,
        enemyShield: 0,
        bossGimmickTriggered,
        gimmickSuppressedTurns,
        enemyStatuses: [],
        enemyTelegraph: false,
        familiarCounter,
        starlightGauge,
        logs: [...prev.logs, ...newLogs].slice(-26),
        lastVfx,
        victoryBanner: `${prev.enemy.name} 토벌 완료!`,
      },
    };
  }

  // 5) 적 행동 턴
  const enemyFrozen = Boolean(getStatus(enemyStatuses, 'freeze'));
  let nextTelegraph = false;

  if (enemyFrozen) {
    newLogs.push(nextLog(turn, `${prev.enemy.name}이(가) 빙결되어 움직이지 못합니다!`, 'status'));
  } else {
    const isHeavy = prev.enemyTelegraph && prev.enemy.heavyMult;
    const mult = isHeavy ? prev.enemy.heavyMult! : 1;
    const rawAtk = enemyAtkNow * mult * (0.92 + Math.random() * 0.16);
    let afterDef = Math.max(Math.round(rawAtk * 0.22), Math.round(rawAtk - stats.def * 0.55));
    // P0-2: 보스 강공격은 방어력과 무관하게 최대 HP의 일정 비율 이상을 깎는다 (보호막·빙결로 대응)
    if (isHeavy && isThreatBoss(prev.enemy, prev.mode)) {
      const [lo, hi] = prev.mode === 'rankBoss' ? BOSS_TUNING.heavyPctRank : BOSS_TUNING.heavyPctAct;
      const floor = Math.round(prev.playerMaxHp * (lo + Math.random() * (hi - lo)));
      afterDef = Math.max(afterDef, floor);
    }
    let dmgToHp = afterDef;

    if (playerShield > 0) {
      const absorbed = Math.min(playerShield, dmgToHp);
      playerShield -= absorbed;
      dmgToHp -= absorbed;
    }

    playerHp = Math.max(0, playerHp - dmgToHp);
    // 적의 공격을 받아내면 공명 게이지 추가 충전
    starlightGauge = Math.min(
      STARLIGHT_MAX,
      starlightGauge + Math.round(STARLIGHT_GAIN_HIT * vow.starlightGainMult * dawnSealStarlightMult)
    );

    // 피해 반사 체크
    const reflect = getStatus(playerStatuses, 'reflect');
    if (reflect && afterDef > 0) {
      const refDmg = Math.max(1, Math.round(afterDef * reflect.value));
      const refRes = applyDamageToEnemy(refDmg, enemyHp, enemyShield);
      enemyHp = refRes.enemyHp;
      enemyShield = refRes.enemyShield;
      newLogs.push(
        nextLog(turn, `결계 반사! ${prev.enemy.name}에게 ${refDmg.toLocaleString()} 피해 반사!`, 'player')
      );
    }

    const atkLabel = isHeavy ? `[${prev.enemy.heavyName ?? '강공격'}]` : '공격';
    newLogs.push(
      nextLog(
        turn,
        `${prev.enemy.name}의 ${atkLabel}! ${
          dmgToHp > 0 ? `-${dmgToHp.toLocaleString()} 피해` : '보호막이 모두 막아냄!'
        }`,
        'enemy'
      )
    );

    // 적 상태이상 부여
    if (prev.enemy.statusOnHit && Math.random() < prev.enemy.statusOnHit.chance) {
      playerStatuses = addOrRefreshStatus(playerStatuses, {
        type: prev.enemy.statusOnHit.type,
        turns: prev.enemy.statusOnHit.turns,
        value: prev.enemy.statusOnHit.value,
      });
    }

    // P3-3: 보스 고유 기믹 발동 (별빛 완벽 개입 억제 중이면 발동 차단)
    if (enemyHp > 0 && playerHp > 0 && gimmickDef) {
      if (gimmickSuppressedTurns > 0) {
        gimmickSuppressedTurns = Math.max(0, gimmickSuppressedTurns - 1);
        newLogs.push(
          nextLog(
            turn,
            `✦ 별빛 봉쇄로 [${gimmickDef.name}] 발동이 억제되었습니다! (남은 ${gimmickSuppressedTurns}턴)`,
            'starlight'
          )
        );
      } else {
        const activeSealDef = state.grimoireSeal ? GRIMOIRE_SEALS[state.grimoireSeal] : null;
        const sealTag = activeSealDef ? `📖 [${activeSealDef.name}] 발동!` : '';

        if (gimmickDef.id === 'crystal_shell' && turn % 4 === 0) {
          if (countered) {
            newLogs.push(
              nextLog(
                turn,
                `${sealTag} 붉은 수정 외피가 형성되려던 순간 산산이 분쇄되었습니다!`,
                'starlight'
              )
            );
          } else {
            const shellAmt = Math.max(1, Math.round(prev.enemyMaxHp * 0.04));
            enemyShield += shellAmt;
            newLogs.push(
              nextLog(
                turn,
                `◆ [${gimmickDef.name}] 발동! ${prev.enemy.name}이(가) 수정 갑각(+${shellAmt.toLocaleString()} 보호막)을 전개합니다.`,
                'status'
              )
            );
          }
        } else if (gimmickDef.id === 'silence_ink' && turn % 3 === 0) {
          if (countered) {
            newLogs.push(
              nextLog(
                turn,
                `${sealTag} 침묵의 금서 잉크를 정화해 마나 흡수와 공격력 강화를 차단했습니다!`,
                'starlight'
              )
            );
          } else {
            const mpDrain = Math.round(stats.maxMp * 0.18);
            playerMp = Math.max(0, playerMp - mpDrain);
            enemyAtkNow = Math.round(enemyAtkNow * 1.06);
            newLogs.push(
              nextLog(
                turn,
                `◆ [${gimmickDef.name}] 발동! 마나 -${mpDrain} 흡수 & 보스 공격력 +6% 강화!`,
                'enemy'
              )
            );
          }
        } else if (gimmickDef.id === 'blood_thorns' && turn % 2 === 0) {
          if (countered) {
            newLogs.push(
              nextLog(
                turn,
                `${sealTag} 혈월의 가시 재생을 소작하여 봉쇄했습니다!`,
                'starlight'
              )
            );
          } else {
            const bossHeal = Math.max(1, Math.round(prev.enemyMaxHp * 0.035));
            enemyHp = Math.min(prev.enemyMaxHp, enemyHp + bossHeal);
            const thornDmg = Math.max(1, Math.round(stats.maxHp * 0.05));
            let thornToHp = thornDmg;
            if (playerShield > 0) {
              const abs = Math.min(playerShield, thornToHp);
              playerShield -= abs;
              thornToHp -= abs;
            }
            playerHp = Math.max(0, playerHp - thornToHp);
            newLogs.push(
              nextLog(
                turn,
                `◆ [${gimmickDef.name}] 발동! 보스 체력 +${bossHeal.toLocaleString()} 재생 & 가시 피해 -${thornToHp.toLocaleString()}!`,
                'enemy'
              )
            );
          }
        } else if (gimmickDef.id === 'unyielding_oath' && !bossGimmickTriggered && enemyHp <= prev.enemyMaxHp * 0.5) {
          bossGimmickTriggered = true;
          if (countered) {
            const weakShield = Math.max(1, Math.round(prev.enemyMaxHp * 0.05));
            enemyShield += weakShield;
            newLogs.push(
              nextLog(
                turn,
                `${sealTag} 불사의 흑갑 서약을 관통하여 결계를 ${weakShield.toLocaleString()}(5%)로 약화시켰습니다!`,
                'starlight'
              )
            );
          } else {
            const shieldAmt = Math.max(1, Math.round(prev.enemyMaxHp * 0.18));
            enemyShield += shieldAmt;
            newLogs.push(
              nextLog(
                turn,
                `◆ [${gimmickDef.name}] 발동! 체력 50% 이하 격앙 — 흑갑 결계(+${shieldAmt.toLocaleString()} 보호막) 전개!`,
                'status'
              )
            );
          }
        } else if (gimmickDef.id === 'abyss_siphon' && turn % 3 === 0) {
          if (countered) {
            const reducedDrain = Math.floor(playerShield * 0.15);
            playerShield = Math.max(0, playerShield - reducedDrain);
            newLogs.push(
              nextLog(
                turn,
                `${sealTag} 성좌 고정으로 스킬 쿨타임 지연을 차단하고 보호막 침식을 15%로 경감했습니다!`,
                'starlight'
              )
            );
          } else {
            const shieldDrain = Math.floor(playerShield * 0.45);
            playerShield = Math.max(0, playerShield - shieldDrain);
            const activeDeck = state.deck.slice(0, stats.maxDeckSlots);
            for (const sid of activeDeck) {
              const sDef = SKILL_MAP[sid];
              if (!sDef || !state.skills[sid]?.unlocked) continue;
              if (sDef.cooldown > 0 || (cooldowns[sid] ?? 0) > 0) {
                cooldowns[sid] = (cooldowns[sid] ?? 0) + 1;
              }
            }
            newLogs.push(
              nextLog(
                turn,
                `◆ [${gimmickDef.name}] 발동! 보호막 ${shieldDrain.toLocaleString()} 흡수 & 모든 스킬 쿨타임 +1턴 지연!`,
                'enemy'
              )
            );
          }
        } else if (gimmickDef.id === 'eclipse_doom') {
          if (!bossGimmickTriggered && enemyHp <= prev.enemyMaxHp * 0.45) {
            bossGimmickTriggered = true;
            if (countered) {
              const weakShield = Math.max(1, Math.round(prev.enemyMaxHp * 0.05));
              enemyShield += weakShield;
              newLogs.push(
                nextLog(
                  turn,
                  `${sealTag} 여명의 빛이 흑식 결계를 가르며 보호막을 ${weakShield.toLocaleString()}(5%)로 약화시켰습니다!`,
                  'starlight'
                )
              );
            } else {
              const shieldAmt = Math.max(1, Math.round(prev.enemyMaxHp * 0.16));
              enemyShield += shieldAmt;
              newLogs.push(
                nextLog(
                  turn,
                  `◆ [${gimmickDef.name}] 발동! 체력 45% 이하 — 흑식 결계(+${shieldAmt.toLocaleString()} 보호막) 전개!`,
                  'dark'
                )
              );
            }
          }
          if (turn % 3 === 0 && playerHp > 0) {
            if (countered) {
              const weakWave = Math.max(1, Math.round(stats.maxHp * 0.02));
              playerHp = Math.max(0, playerHp - weakWave);
              newLogs.push(
                nextLog(
                  turn,
                  `${sealTag} 흑식의 암흑 파동을 반감시켜 관통 피해가 -${weakWave.toLocaleString()}(2%)로 감소했습니다!`,
                  'starlight'
                )
              );
            } else {
              const waveDmg = Math.max(1, Math.round(stats.maxHp * 0.07));
              playerHp = Math.max(0, playerHp - waveDmg);
              newLogs.push(
                nextLog(
                  turn,
                  `◆ [${gimmickDef.name}] 암흑 파동! 보호막을 뚫고 -${waveDmg.toLocaleString()} 관통 피해!`,
                  'dark'
                )
              );
            }
          }
        }
      }
    }

    // 다음 턴 강공격 예고
    if (prev.enemy.heavyInterval && (turn + 1) % prev.enemy.heavyInterval === 0) {
      nextTelegraph = true;
      newLogs.push(
        nextLog(
          turn,
          isThreatBoss(prev.enemy, prev.mode)
            ? `⚠ 경고: ${prev.enemy.name}이(가) [${prev.enemy.heavyName}]을(를) 준비합니다! 체력의 절반 가까이 날아갈 일격 — 보호막·빙결·별빛 개입으로 대비하세요!`
            : `경고: ${prev.enemy.name}이(가) [${prev.enemy.heavyName}]을(를) 준비합니다!`,
          'status'
        )
      );
    }
  }

  playerStatuses = decrementStatuses(playerStatuses);
  enemyStatuses = decrementStatuses(enemyStatuses);
  if (!getStatus(playerStatuses, 'shield') && playerShield > 0 && turn % 4 === 0) {
    playerShield = Math.floor(playerShield * 0.7);
  }

  const nextEnemy =
    enemyAtkNow !== prev.enemy.atk ? { ...prev.enemy, atk: enemyAtkNow } : prev.enemy;

  // 반사로 적이 쓰러진 경우
  if (enemyHp <= 0) {
    newLogs.push(nextLog(turn, `${prev.enemy.name}이(가) 반사 피해로 무너졌습니다!`, 'system'));
    return {
      result: 'victory',
      sfx: 'victory',
      combat: {
        ...prev,
        turn,
        enemy: nextEnemy,
        playerHp: Math.max(1, playerHp),
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield,
        playerStatuses,
        cooldowns,
        enemyHp: 0,
        enemyShield: 0,
        bossGimmickTriggered,
        gimmickSuppressedTurns,
        enemyStatuses: [],
        enemyTelegraph: false,
        familiarCounter,
        starlightGauge,
        logs: [...prev.logs, ...newLogs].slice(-26),
        lastVfx,
        victoryBanner: `${prev.enemy.name} 토벌 완료!`,
      },
    };
  }

  if (playerHp <= 0) {
    newLogs.push(
      nextLog(turn, `체력이 바닥나 아스트라 양호실로 긴급 귀환했습니다.`, 'enemy')
    );
    return {
      result: 'defeat',
      sfx: 'defeat',
      combat: {
        ...prev,
        turn,
        enemy: nextEnemy,
        playerHp: 0,
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield: 0,
        playerStatuses: [],
        cooldowns,
        enemyHp,
        enemyShield,
        bossGimmickTriggered,
        gimmickSuppressedTurns,
        enemyStatuses,
        enemyTelegraph: false,
        familiarCounter,
        starlightGauge: 0,
        logs: [...prev.logs, ...newLogs].slice(-26),
        lastVfx: {
          id: vfxIdCounter++,
          target: 'player',
          category: 'enemy',
          amountText: '패배',
          label: '귀환',
        },
      },
    };
  }

  return {
    result: 'ongoing',
    sfx,
    combat: {
      ...prev,
      turn,
      enemy: nextEnemy,
      playerHp,
      playerMaxHp: stats.maxHp,
      playerMp,
      playerMaxMp: stats.maxMp,
      playerShield,
      playerStatuses,
      cooldowns,
      enemyHp,
      enemyShield,
      bossGimmickTriggered,
      gimmickSuppressedTurns,
      enemyStatuses,
      enemyTelegraph: nextTelegraph,
      familiarCounter,
      starlightGauge,
      logs: [...prev.logs, ...newLogs].slice(-26),
      lastVfx,
    },
  };
}

export interface StarlightOutcome extends TurnOutcome {
  wasPerfect: boolean;
}

/**
 * P3-1: 별빛 개입 — 게이지 100% 도달 시 수동 발동하는 학파별 비오의.
 * 적의 강공격 예고(enemyTelegraph) 타이밍에 맞춰 발동하면 '완벽 개입'으로
 * 강공격을 파훼(차단)하고 피해·효과 1.45배 + 게이지 25% 환급!
 */
export function triggerStarlightIntervention(
  prev: CombatRuntime,
  state: GameState,
  stats: ComputedStats
): StarlightOutcome {
  const def = STARLIGHT_SKILLS[state.school];
  const turn = prev.turn;
  const wasPerfect = prev.enemyTelegraph;
  const perfectMult = wasPerfect ? STARLIGHT_PERFECT_MULT : 1;
  const vow = getRebirthVow(state.prestige.activeVow);
  const countered = isGimmickCountered(prev.enemy.gimmick, state.grimoireSeal);
  const sealBossDmgMult = prev.enemy.isBoss
    ? 1 + getSealBossDamageBonusPct(Boolean(state.equipped.grimoire), countered) / 100
    : 1;

  let playerHp = Math.min(stats.maxHp, prev.playerHp);
  let playerMp = Math.min(stats.maxMp, prev.playerMp);
  let playerShield = prev.playerShield;
  let playerStatuses = [...prev.playerStatuses];
  let enemyHp = prev.enemyHp;
  let enemyShield = prev.enemyShield ?? 0;
  let gimmickSuppressedTurns = prev.gimmickSuppressedTurns ?? 0;
  let enemyStatuses = [...prev.enemyStatuses];
  const cooldowns: Record<string, number> = { ...prev.cooldowns };

  const atkBuff = getStatus(playerStatuses, 'atkUp');
  const atkMult = atkBuff ? 1 + atkBuff.value : 1;
  const enemyVuln =
    1 +
    (getStatus(enemyStatuses, 'shock')?.value ?? 0) +
    (getStatus(enemyStatuses, 'curse')?.value ?? 0);
  const catMult = 1 + (stats.categoryBonus[state.school] ?? 0) / 100;
  const hasBurn = Boolean(getStatus(enemyStatuses, 'burn'));

  let totalDmg = 0;
  let anyCrit = false;
  for (let h = 0; h < def.hits; h++) {
    const guaranteedCrit = state.school === 'flame' && hasBurn;
    const isCrit = guaranteedCrit || Math.random() * 100 < stats.critRate + def.bonusCrit;
    if (isCrit) anyCrit = true;
    const critMult = isCrit ? stats.critDmg / 100 : 1;
    const raw =
      stats.magic *
      (def.powerPct / 100) *
      catMult *
      atkMult *
      enemyVuln *
      sealBossDmgMult *
      perfectMult *
      critMult *
      (0.96 + Math.random() * 0.08);
    const mitigated = Math.max(
      Math.round(raw * 0.35),
      Math.round(raw - prev.enemy.def * 0.35)
    );
    totalDmg += mitigated;
  }

  const shatteredShield = wasPerfect && prev.enemy.gimmick ? enemyShield : 0;
  if (wasPerfect && prev.enemy.gimmick) {
    enemyShield = 0;
    gimmickSuppressedTurns = 2;
  }

  const hitRes = applyDamageToEnemy(totalDmg, enemyHp, enemyShield);
  enemyHp = hitRes.enemyHp;
  enemyShield = hitRes.enemyShield;

  const extraNotes: string[] = [];
  if (state.school === 'flame') {
    enemyStatuses = addOrRefreshStatus(enemyStatuses, {
      type: 'burn',
      turns: wasPerfect ? 4 : 3,
      value: wasPerfect ? 0.6 : 0.45,
    });
    playerStatuses = addOrRefreshStatus(playerStatuses, {
      type: 'atkUp',
      turns: 2,
      value: 0.25,
    });
    extraNotes.push(wasPerfect ? '강화 화상·마력↑' : '화상·마력↑');
  } else if (state.school === 'frost') {
    enemyStatuses = addOrRefreshStatus(enemyStatuses, {
      type: 'freeze',
      turns: wasPerfect ? 2 : 1,
      value: 0,
    });
    const hpHeal = Math.max(1, Math.round(stats.maxHp * (wasPerfect ? 0.25 : 0.18) * vow.healMult));
    const mpHeal = Math.round(stats.maxMp * (wasPerfect ? 0.5 : 0.35));
    playerHp = Math.min(stats.maxHp, playerHp + hpHeal);
    playerMp = Math.min(stats.maxMp, playerMp + mpHeal);
    extraNotes.push(
      `빙결 ${wasPerfect ? 2 : 1}턴 · HP +${hpHeal.toLocaleString()} · MP +${mpHeal}`
    );
  } else if (state.school === 'thunder') {
    enemyStatuses = addOrRefreshStatus(enemyStatuses, {
      type: 'shock',
      turns: 3,
      value: 0.3,
    });
    const cdCut = wasPerfect ? 2 : 1;
    for (const k of Object.keys(cooldowns)) {
      if (cooldowns[k] > cdCut) cooldowns[k] -= cdCut;
      else delete cooldowns[k];
    }
    extraNotes.push(`감전 · 쿨타임 -${cdCut}턴`);
  } else {
    const shieldVal = Math.round(stats.magic * (wasPerfect ? 2.6 : 1.8));
    playerShield = Math.max(playerShield, shieldVal);
    playerStatuses = addOrRefreshStatus(playerStatuses, {
      type: 'reflect',
      turns: 2,
      value: 0.45,
    });
    enemyStatuses = addOrRefreshStatus(enemyStatuses, {
      type: 'curse',
      turns: 3,
      value: 0.25,
    });
    if (wasPerfect) {
      const hpHeal = Math.max(1, Math.round(stats.maxHp * 0.2 * vow.healMult));
      playerHp = Math.min(stats.maxHp, playerHp + hpHeal);
      extraNotes.push(`보호막 ${shieldVal.toLocaleString()} · 반사 · 저주 · HP +${hpHeal.toLocaleString()}`);
    } else {
      extraNotes.push(`보호막 ${shieldVal.toLocaleString()} · 반사 · 저주`);
    }
  }

  const nextGauge = wasPerfect ? STARLIGHT_PERFECT_REFUND : 0;
  const newLogs: CombatLogEntry[] = [];
  if (wasPerfect) {
    const gimmickTail = prev.enemy.gimmick
      ? ` & 기믹 2턴 봉쇄${shatteredShield > 0 ? ` · 보스 보호막 ${shatteredShield.toLocaleString()} 파쇄` : ''}`
      : '';
    newLogs.push(
      nextLog(
        turn,
        `✦ 완벽 개입! [${prev.enemy.heavyName ?? '강공격'}] 예고를 산산조각 파훼!${gimmickTail} (공명 +${STARLIGHT_PERFECT_REFUND}% 환급)`,
        'starlight'
      )
    );
  }
  const shieldTail =
    hitRes.shieldAbsorbed > 0 ? ` (결계 -${hitRes.shieldAbsorbed.toLocaleString()})` : '';
  newLogs.push(
    nextLog(
      turn,
      `✦ 별빛 개입 [${def.name}] → ${prev.enemy.name}에게 ${totalDmg.toLocaleString()} 피해!${
        anyCrit ? ' (치명타)' : ''
      }${shieldTail} [${extraNotes.join(' · ')}]`,
      'starlight'
    )
  );

  const flashLabel = wasPerfect ? `✦ 완벽 개입 · ${def.name}` : `✦ ${def.name}`;
  const vfx: CombatRuntime['lastVfx'] = {
    id: vfxIdCounter++,
    target: 'enemy',
    category: state.school,
    amountText: `${totalDmg.toLocaleString()}${anyCrit || wasPerfect ? '!' : ''}`,
    isCrit: true,
    label: wasPerfect ? `✦ 파훼 · ${def.name}` : `✦ ${def.name}`,
  };
  const starlightFlash = { id: vfxIdCounter++, perfect: wasPerfect, label: flashLabel };

  if (enemyHp <= 0) {
    newLogs.push(nextLog(turn, `${prev.enemy.name}을(를) 별빛의 일격으로 토벌했습니다!`, 'system'));
    return {
      result: 'victory',
      sfx: wasPerfect ? 'starlightPerfect' : 'starlight',
      wasPerfect,
      combat: {
        ...prev,
        playerHp,
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield,
        playerStatuses,
        cooldowns,
        enemyHp: 0,
        enemyShield: 0,
        gimmickSuppressedTurns,
        enemyStatuses: [],
        enemyTelegraph: false,
        starlightGauge: nextGauge,
        starlightFlash,
        logs: [...prev.logs, ...newLogs].slice(-26),
        lastVfx: vfx,
        victoryBanner: `${prev.enemy.name} 토벌 완료!`,
      },
    };
  }

  return {
    result: 'ongoing',
    sfx: wasPerfect ? 'starlightPerfect' : 'starlight',
    wasPerfect,
    combat: {
      ...prev,
      playerHp,
      playerMaxHp: stats.maxHp,
      playerMp,
      playerMaxMp: stats.maxMp,
      playerShield,
      playerStatuses,
      cooldowns,
      enemyHp,
      enemyShield,
      gimmickSuppressedTurns,
      enemyStatuses,
      enemyTelegraph: false,
      starlightGauge: nextGauge,
      starlightFlash,
      logs: [...prev.logs, ...newLogs].slice(-26),
      lastVfx: vfx,
    },
  };
}
