import { ACTS, createAbyssEliteMonster, createTowerMonster } from '../data/acts';
import { FAMILIARS } from '../data/familiars';
import { RANK_EXAM_BOSSES } from '../data/schools';
import { SKILL_MAP } from '../data/skills';
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
 * 값은 scripts/balance-sim.ts 시뮬(신규 캐릭·장비 없음, 300판) 기준으로 맞춤:
 *  막 보스  Lv10 ≈10% · Lv13 ≈80% · Lv16 100%  (패배 → 5마리 재정비 → 자동 재도전)
 *  승급 시험 Lv13 ≈40% · Lv16 ≈95%
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

/** 원본 데이터는 그대로 두고 전투 런타임용 사본에만 배율 적용 */
function applyBossTuning(enemy: MonsterDef, mode: CombatMode): MonsterDef {
  if (!isThreatBoss(enemy, mode)) return enemy;
  const isRank = mode === 'rankBoss';
  return {
    ...enemy,
    hp: Math.round(enemy.hp * (isRank ? BOSS_TUNING.rankHpMult : BOSS_TUNING.hpMult)),
    atk: Math.round(enemy.atk * (isRank ? BOSS_TUNING.rankAtkMult : BOSS_TUNING.atkMult)),
  };
}

export function createCombatRuntime(
  state: GameState,
  stats: ComputedStats,
  mode: CombatMode,
  act = state.selectedAct,
  stageIndex = state.selectedStage,
  towerFloor = state.towerFloor
): CombatRuntime {
  const enemy = applyBossTuning(getMonsterForMode(state, mode, act, stageIndex, towerFloor), mode);
  const introMsg =
    mode === 'rankBoss'
      ? `승급 시험 개시! [${enemy.name}]이(가) 앞을 가로막습니다.`
      : mode === 'tower'
        ? `무한 심연 탑 ${towerFloor}층 — [${enemy.name}] 출현!`
        : mode === 'abyssElite'
          ? `심연 미궁 정예전 — [${enemy.name}]과(와) 조우했습니다!`
          : `[${enemy.name}]이(가) 검은 안개 속에서 나타났습니다.`;

  const initialLogs: CombatLogEntry[] = [nextLog(0, introMsg, 'system')];
  const bossQuote =
    state.prestige.rebirthCount >= 1 && enemy.ngPlusQuote
      ? enemy.ngPlusQuote
      : enemy.encounterQuote;
  if (bossQuote) {
    initialLogs.push(nextLog(0, `${enemy.name}: “${bossQuote}”`, 'dark'));
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
  sfx: 'cast' | 'crit' | 'heal' | 'dark' | 'victory' | 'defeat' | 'hit';
}

export function stepCombatTurn(
  prev: CombatRuntime,
  state: GameState,
  stats: ComputedStats
): TurnOutcome {
  const turn = prev.turn + 1;
  let playerHp = Math.min(stats.maxHp, prev.playerHp);
  let playerMp = Math.min(stats.maxMp, prev.playerMp + stats.mpRegen);
  let playerShield = prev.playerShield;
  let playerStatuses = [...prev.playerStatuses];
  let enemyHp = prev.enemyHp;
  let enemyStatuses = [...prev.enemyStatuses];
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
    const healAmt = Math.round(stats.maxHp * regen.value);
    playerHp = Math.min(stats.maxHp, playerHp + healAmt);
    newLogs.push(nextLog(turn, `여신의 재생으로 체력 +${healAmt.toLocaleString()} 회복.`, 'heal'));
  }

  for (const dotType of ['burn', 'poison'] as StatusType[]) {
    const dot = getStatus(playerStatuses, dotType);
    if (dot) {
      const dotDmg = Math.max(1, Math.round(prev.enemy.atk * dot.value));
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
        const def = SKILL_MAP[sid];
        if (!def?.isShield || !state.skills[sid]?.unlocked) continue;
        if ((cooldowns[sid] ?? 0) > 0 || playerMp < def.mpCost) continue;
        chosenSkillId = sid;
        newLogs.push(nextLog(turn, `강공격에 대비해 [${def.name}]을(를) 먼저 펼칩니다!`, 'status'));
        break;
      }
    }
    for (const sid of chosenSkillId ? [] : validDeck) {
      const def = SKILL_MAP[sid];
      const learned = state.skills[sid];
      if (!def || !learned?.unlocked) continue;
      if ((cooldowns[sid] ?? 0) > 0) continue;
      if (playerMp < def.mpCost) continue;
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
      const def = SKILL_MAP[chosenSkillId];
      const learned = state.skills[chosenSkillId];
      const lvMult = getSkillPowerMultiplier(learned.level);
      const catMult = 1 + (stats.categoryBonus[def.category] ?? 0) / 100;
      const darkMult = def.category === 'dark' ? stats.darkDamageMult : 1;

      playerMp -= def.mpCost;
      if (def.hpCostPct) {
        const sac = Math.max(1, Math.round(playerHp * (def.hpCostPct / 100)));
        playerHp = Math.max(1, playerHp - sac);
      }
      if (def.cooldown > 0) {
        cooldowns[def.id] = def.cooldown;
      }

      if (def.isHeal) {
        const healVal = Math.round(stats.magic * (def.powerPct / 100) * lvMult * catMult);
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
        sfx = 'heal';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'player',
          category: def.category,
          amountText: `+${healVal.toLocaleString()}`,
          isHeal: true,
          label: def.name,
        };
        newLogs.push(
          nextLog(
            turn,
            `[${def.name}] 시전! 체력 +${healVal.toLocaleString()} 회복${def.isCleanse ? ' (상태이상 정화)' : ''}.`,
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
        sfx = 'heal';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'player',
          category: def.category,
          amountText: '강화!',
          isHeal: true,
          label: def.name,
        };
        newLogs.push(nextLog(turn, `[${def.name}] 발동! 마력이 강하게 요동칩니다.`, 'player'));
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
          label: def.name,
        };
        newLogs.push(
          nextLog(turn, `[${def.name}] 전개! ${shieldVal.toLocaleString()} 보호막 형성.`, 'player')
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
            critMult *
            (0.94 + Math.random() * 0.12);
          const mitigated = Math.max(
            Math.round(raw * 0.25),
            Math.round(raw - prev.enemy.def * 0.48)
          );
          totalDmg += mitigated;
        }

        enemyHp = Math.max(0, enemyHp - totalDmg);

        // 흡혈
        let drainText = '';
        if (def.lifestealPct) {
          const drain = Math.round(totalDmg * (def.lifestealPct / 100));
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

        sfx = def.category === 'dark' ? 'dark' : anyCrit ? 'crit' : 'cast';
        lastVfx = {
          id: vfxIdCounter++,
          target: 'enemy',
          category: def.category,
          amountText: `${totalDmg.toLocaleString()}${anyCrit ? '!' : ''}`,
          isCrit: anyCrit,
          label: def.name,
        };
        const statusTail = statusNotes.length > 0 ? ` [${statusNotes.join('·')}]` : '';
        newLogs.push(
          nextLog(
            turn,
            `[${def.name}] → ${prev.enemy.name}에게 ${totalDmg.toLocaleString()} 피해!${
              anyCrit ? ' (치명타)' : ''
            }${drainText}${statusTail}`,
            def.category === 'dark' ? 'dark' : anyCrit ? 'crit' : 'player'
          )
        );
      }
    } else {
      // 기본 마탄 (마나 회복)
      const isCrit = Math.random() * 100 < stats.critRate;
      const raw = stats.magic * 0.85 * atkMult * enemyVuln * (isCrit ? stats.critDmg / 100 : 1);
      const dmg = Math.max(Math.round(raw * 0.25), Math.round(raw - prev.enemy.def * 0.45));
      enemyHp = Math.max(0, enemyHp - dmg);
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
      newLogs.push(
        nextLog(
          turn,
          `[마력탄]으로 ${dmg.toLocaleString()} 피해 (마나 +${mpGain}).`,
          'player'
        )
      );
    }
  }

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
          const dmg = Math.max(1, Math.round(stats.magic * 0.72 * famScale));
          enemyHp = Math.max(0, enemyHp - dmg);
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
          const hpH = Math.round(stats.maxHp * (0.08 + ownedFam.evolution * 0.03));
          const mpH = Math.round(18 * famScale);
          playerHp = Math.min(stats.maxHp, playerHp + hpH);
          playerMp = Math.min(stats.maxMp, playerMp + mpH);
          newLogs.push(
            nextLog(turn, `사역마 [${famName}]이(가) 체력 +${hpH.toLocaleString()}, 마나 +${mpH} 회복!`, 'familiar')
          );
        } else if (famDef.id === 'wolf') {
          const crit = Math.random() < 0.45;
          const dmg = Math.max(1, Math.round(stats.magic * 0.98 * famScale * (crit ? 1.65 : 1)));
          enemyHp = Math.max(0, enemyHp - dmg);
          newLogs.push(
            nextLog(
              turn,
              `사역마 [${famName}]의 그림자 습격! ${dmg.toLocaleString()} 피해${crit ? ' (치명타)' : ''}.`,
              'familiar'
            )
          );
        } else if (famDef.id === 'owl') {
          const dmg = Math.max(1, Math.round(stats.magic * 0.78 * famScale));
          enemyHp = Math.max(0, enemyHp - dmg);
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
          const dmg = Math.max(1, Math.round(stats.magic * 0.84 * famScale));
          const heal = Math.round(dmg * 0.45);
          enemyHp = Math.max(0, enemyHp - dmg);
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
        enemyHp = Math.max(0, enemyHp - dotDmg);
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
        playerHp,
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield,
        playerStatuses: decrementStatuses(playerStatuses),
        cooldowns,
        enemyHp: 0,
        enemyStatuses: [],
        enemyTelegraph: false,
        familiarCounter,
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
    const rawAtk = prev.enemy.atk * mult * (0.92 + Math.random() * 0.16);
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

    // 피해 반사 체크
    const reflect = getStatus(playerStatuses, 'reflect');
    if (reflect && afterDef > 0) {
      const refDmg = Math.max(1, Math.round(afterDef * reflect.value));
      enemyHp = Math.max(0, enemyHp - refDmg);
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

    // 다음 턴 강공격 예고
    if (prev.enemy.heavyInterval && (turn + 1) % prev.enemy.heavyInterval === 0) {
      nextTelegraph = true;
      newLogs.push(
        nextLog(
          turn,
          isThreatBoss(prev.enemy, prev.mode)
            ? `⚠ 경고: ${prev.enemy.name}이(가) [${prev.enemy.heavyName}]을(를) 준비합니다! 체력의 절반 가까이 날아갈 일격 — 보호막·빙결로 대비하세요!`
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

  // 반사로 적이 쓰러진 경우
  if (enemyHp <= 0) {
    newLogs.push(nextLog(turn, `${prev.enemy.name}이(가) 반사 피해로 무너졌습니다!`, 'system'));
    return {
      result: 'victory',
      sfx: 'victory',
      combat: {
        ...prev,
        turn,
        playerHp: Math.max(1, playerHp),
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield,
        playerStatuses,
        cooldowns,
        enemyHp: 0,
        enemyStatuses: [],
        enemyTelegraph: false,
        familiarCounter,
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
        playerHp: 0,
        playerMaxHp: stats.maxHp,
        playerMp,
        playerMaxMp: stats.maxMp,
        playerShield: 0,
        playerStatuses: [],
        cooldowns,
        enemyHp,
        enemyStatuses,
        enemyTelegraph: false,
        familiarCounter,
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
      playerHp,
      playerMaxHp: stats.maxHp,
      playerMp,
      playerMaxMp: stats.maxMp,
      playerShield,
      playerStatuses,
      cooldowns,
      enemyHp,
      enemyStatuses,
      enemyTelegraph: nextTelegraph,
      familiarCounter,
      logs: [...prev.logs, ...newLogs].slice(-26),
      lastVfx,
    },
  };
}
