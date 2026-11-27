import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Compass, PawPrint, Shield, Swords } from 'lucide-react';
import { AbyssTab } from './components/AbyssTab';
import { BattleTab } from './components/BattleTab';
import { CharacterCreation } from './components/CharacterCreation';
import { DeckGearTab } from './components/DeckGearTab';
import { FamiliarTab } from './components/FamiliarTab';
import { PlayerPortrait } from './components/GothicArt';
import { HeroPortraitModal, OfflineModal, StoryModal, type StoryModalPayload } from './components/Modals';
import { SchoolTab } from './components/SchoolTab';
import { generateAbyssNode } from './data/abyssEvents';
import {
  generateEquipment,
  getEnhanceCost,
  planBestLoadout,
  RARITY_META,
  rollRarity,
} from './data/equipment';
import {
  FAMILIARS,
  getFamiliarEvoCost,
  getFamiliarUpgradeCost,
} from './data/familiars';
import {
  calculateRebirthReward,
  getPrestigeUpgradeCost,
  PRESTIGE_UPGRADES,
} from './data/prestige';
import { RANKS, SCHOOLS } from './data/schools';
import { SKILL_MAP } from './data/skills';
import { createCombatRuntime, stepCombatTurn } from './engine/combat';
import { processOfflineProgress } from './engine/offline';
import {
  clearGameStorage,
  importSaveCode,
  loadGameFromStorage,
  saveGameToStorage,
} from './engine/save';
import { playSfx } from './engine/sound';
import {
  advanceTraining,
  applyExpAndLevelUp,
  computePlayerStats,
  createEmptyUncreatedState,
  createNewGameState,
  expForNextLevel,
  fillDeckWith,
  getMaxDeckSlots,
  getRewardMultiplier,
  getSkillUpgradeCost,
  rankDeckCandidates,
} from './engine/stats';
import type {
  AbyssChoice,
  CombatMode,
  CombatRuntime,
  EquipmentItem,
  EquipSlot,
  FamiliarId,
  GameState,
  Gender,
  MagicCategory,
  OfflineSummary,
  PrestigeUpgradeId,
  RankIndex,
  Rarity,
  SchoolId,
} from './types/game';

type TabId = 'battle' | 'school' | 'deck' | 'familiar' | 'abyss';

const LANTERN_INTERVAL_MS = 20 * 60 * 1000;
/** 막 보스 패배 후 자동 재도전까지 필요한 4번째 사냥터 처치 수 */
const BOSS_RETRY_KILLS = 5;

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const loaded = loadGameFromStorage();
    return loaded ?? createEmptyUncreatedState();
  });

  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const [storyModal, setStoryModal] = useState<StoryModalPayload | null>(null);
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [rebirthPending, setRebirthPending] = useState(false);
  const [tab, setTab] = useState<TabId>('battle');
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => computePlayerStats(state), [state]);

  const [combat, setCombat] = useState<CombatRuntime>(() =>
    createCombatRuntime(state, stats, 'stage')
  );

  const stateRef = useRef(state);
  const statsRef = useRef(stats);
  const combatRef = useRef(combat);
  const combatTransitionRef = useRef(false);
  const nextCombatTimerRef = useRef<number | null>(null);
  const bossRetryRef = useRef(0);
  const [bossRetryIn, setBossRetryIn] = useState(0);
  stateRef.current = state;
  statsRef.current = stats;
  combatRef.current = combat;

  const clearPendingCombatTimer = useCallback(() => {
    if (nextCombatTimerRef.current !== null) {
      window.clearTimeout(nextCombatTimerRef.current);
      nextCombatTimerRef.current = null;
    }
    combatTransitionRef.current = false;
  }, []);

  const maybeTriggerStageStory = useCallback(
    (act: number, stageIndex: number, currentState: GameState) => {
      const viewed = currentState.viewedStoryKeys ?? [];
      let key: string | null = null;
      let phase: 'intro' | 'mid' | 'boss' | null = null;
      if (stageIndex === 0 && act > 1) {
        key = `${act}_intro`;
        phase = 'intro';
      } else if (stageIndex === 2) {
        key = `${act}_mid`;
        phase = 'mid';
      } else if (stageIndex === 4) {
        key = `${act}_boss`;
        phase = 'boss';
      }
      if (!key || !phase || viewed.includes(key)) return;
      const recordedKey = key;
      setState((prev) => {
        const prevKeys = prev.viewedStoryKeys ?? [];
        if (prevKeys.includes(recordedKey)) return prev;
        return { ...prev, viewedStoryKeys: [...prevKeys, recordedKey] };
      });
      setStoryModal({ kind: 'act', act, phase });
    },
    []
  );

  const startCombatNow = useCallback(
    (
      nextState: GameState,
      nextStats: ReturnType<typeof computePlayerStats>,
      mode: CombatMode,
      act?: number,
      stageIndex?: number,
      towerFloor?: number
    ) => {
      clearPendingCombatTimer();
      setCombat(createCombatRuntime(nextState, nextStats, mode, act, stageIndex, towerFloor));
    },
    [clearPendingCombatTimer]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    return () => clearPendingCombatTimer();
  }, [clearPendingCombatTimer]);

  // 최초 로드 시 오프라인 방치 정산
  useEffect(() => {
    if (!stateRef.current.created) return;
    const { nextState, summary } = processOfflineProgress(stateRef.current);
    if (summary) {
      setState(nextState);
      setOfflineSummary(summary);
      const nextStats = computePlayerStats(nextState);
      setCombat(createCombatRuntime(nextState, nextStats, 'stage'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 자동 저장 및 iOS 앱 백그라운드 전환 대비
  useEffect(() => {
    if (!state.created) return;
    const id = setInterval(() => saveGameToStorage(stateRef.current), 8000);
    const onHide = () => {
      if (stateRef.current.created) saveGameToStorage(stateRef.current);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && stateRef.current.created) {
        const { nextState, summary } = processOfflineProgress(stateRef.current);
        if (summary) {
          setState(nextState);
          setOfflineSummary(summary);
        }
      }
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state.created]);

  // 1초 단위 교실 수련 + 등불 회복 틱
  useEffect(() => {
    if (!state.created || rebirthPending) return;
    const id = setInterval(() => {
      const cur = stateRef.current;
      const curStats = statsRef.current;
      const hasTraining = cur.trainingSlots.some((s) => s !== null);
      const now = Date.now();
      const lanternDue =
        cur.abyss.lanterns < cur.abyss.maxLanterns &&
        now - cur.abyss.lastLanternTick >= LANTERN_INTERVAL_MS;

      if (!hasTraining && !lanternDue) return;

      const trainedPreview = hasTraining ? advanceTraining(cur, 1, curStats) : null;
      if (trainedPreview && trainedPreview.completedNames.length > 0) {
        showToast(`수련 완료: ${trainedPreview.completedNames[0]}`);
        playSfx('heal', cur.settings.sfxEnabled);
      }

      setState((prev) => {
        const trained = hasTraining ? advanceTraining(prev, 1, curStats) : null;
        const nextAbyss = lanternDue
          ? {
              ...prev.abyss,
              lanterns: Math.min(prev.abyss.maxLanterns, prev.abyss.lanterns + 1),
              lastLanternTick: now,
            }
          : prev.abyss;
        const newlyUnlocked = trained
          ? Object.keys(trained.skills).filter(
              (id) => trained.skills[id].unlocked && !prev.skills[id]?.unlocked
            )
          : [];
        return {
          ...prev,
          skills: trained ? trained.skills : prev.skills,
          // P0-4: 새로 습득한 스킬은 덱 빈칸에 자동 장착
          deck:
            newlyUnlocked.length > 0
              ? fillDeckWith(prev.deck, getMaxDeckSlots(prev), newlyUnlocked)
              : prev.deck,
          trainingSlots: trained ? trained.trainingSlots : prev.trainingSlots,
          abyss: nextAbyss,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.created, rebirthPending, showToast]);

  const addDroppedItem = (
    prev: GameState,
    item: EquipmentItem
  ): { inventory: EquipmentItem[]; arcaneDust: number; kept: boolean } => {
    const filter = prev.settings.autoDismantleBelow;
    if (filter !== 'none' && RARITY_META[item.rarity].order < RARITY_META[filter].order) {
      return {
        inventory: prev.inventory,
        arcaneDust: prev.arcaneDust + RARITY_META[item.rarity].dustValue,
        kept: false,
      };
    }
    if (prev.inventory.length >= 36) {
      return {
        inventory: prev.inventory,
        arcaneDust: prev.arcaneDust + RARITY_META[item.rarity].dustValue,
        kept: false,
      };
    }
    return {
      inventory: [item, ...prev.inventory],
      arcaneDust: prev.arcaneDust,
      kept: true,
    };
  };

  // 자동 턴제 전투 틱 (스토리 모달 열람 중 일시정지, 전환 중 중복 틱 및 이중 보상 방지)
  useEffect(() => {
    if (!state.created || rebirthPending || storyModal) return;
    const ms = state.settings.speed === 3 ? 460 : state.settings.speed === 2 ? 780 : 1320;
    const id = setInterval(() => {
      if (combatTransitionRef.current) return;
      const curState = stateRef.current;
      const curStats = statsRef.current;
      const curCombat = combatRef.current;
      if (curCombat.enemyHp <= 0 || curCombat.playerHp <= 0) return;

      const outcome = stepCombatTurn(curCombat, curState, curStats);
      setCombat(outcome.combat);
      playSfx(outcome.sfx, curState.settings.sfxEnabled);

      if (outcome.result === 'victory') {
        combatTransitionRef.current = true;
        const rewardMult = getRewardMultiplier(curState);
        const enemy = curCombat.enemy;
        const expGain = Math.round(enemy.expReward * rewardMult);
        const stoneGain = Math.round(enemy.stoneReward * rewardMult);

        // 전환 대상 및 사이드이펙트를 state updater 밖에서 결정적으로 계산
        let nextMode: CombatMode = curCombat.mode;
        let nextAct = curCombat.act;
        let nextStage = curCombat.stageIndex;
        let nextTower = curCombat.towerFloor;
        let toastToShow: string | null = null;
        let clearStoryAct: number | null = null;
        let promotedRankForModal: number | null = null;
        let autoBossNow = false;

        if (curCombat.mode === 'rankBoss') {
          const promoted = Math.min(5, curState.rank + 1) as RankIndex;
          promotedRankForModal = promoted;
          toastToShow = `승급 성공! [${RANKS[promoted].name}]이(가) 되었습니다!`;
          nextMode = 'stage';
          nextAct = curState.selectedAct;
          nextStage = curState.selectedStage;
        } else if (curCombat.mode === 'tower') {
          nextTower = curCombat.towerFloor + 1;
          toastToShow = `무한 심연 탑 ${curCombat.towerFloor}층 돌파!`;
        } else if (curCombat.mode === 'abyssElite') {
          toastToShow = '심연 정예 토벌 완료!';
          nextMode = 'stage';
          nextAct = curState.selectedAct;
          nextStage = curState.selectedStage;
        } else {
          const isActBoss = curCombat.stageIndex === 4;
          if (isActBoss) {
            if (!curState.clearedActs.includes(curCombat.act)) {
              clearStoryAct = curCombat.act;
            }
            if (curState.settings.autoAdvance && curCombat.act < 6) {
              nextAct = curCombat.act + 1;
              nextStage = 0;
            }
          } else if (curState.settings.autoAdvance && curCombat.stageIndex < 3) {
            nextStage = curCombat.stageIndex + 1;
          } else if (curState.settings.autoAdvance && curCombat.stageIndex === 3) {
            // P0-1: 4번째 사냥터 클리어 시 막 보스 자동 도전 (패배 후엔 쿨다운 소진 뒤 재도전)
            if (bossRetryRef.current > 0) {
              bossRetryRef.current -= 1;
              setBossRetryIn(bossRetryRef.current);
            } else {
              autoBossNow = true;
              nextStage = 4;
              toastToShow = `⚔ 제 ${curCombat.act}막 보스에게 자동 도전합니다!`;
            }
          }
        }

        const droppedItem: EquipmentItem | null =
          curCombat.mode === 'tower'
            ? generateEquipment(6, undefined, rollRarity(6, 20))
            : curCombat.mode === 'abyssElite'
              ? generateEquipment(curState.highestAct, undefined, rollRarity(curState.highestAct, 25))
              : curCombat.mode === 'stage' &&
                  Math.random() < (curCombat.stageIndex === 4 ? 1.0 : 0.24)
                ? generateEquipment(
                    curCombat.act,
                    undefined,
                    curCombat.stageIndex === 4 ? rollRarity(curCombat.act, 24) : undefined
                  )
                : null;
        const extraTomeRoll =
          curCombat.mode === 'stage' && curCombat.stageIndex >= 2 && curCombat.stageIndex < 4 && Math.random() < 0.12
            ? 1
            : 0;
        const extraEggRoll =
          curCombat.mode === 'stage' && curCombat.stageIndex >= 1 && curCombat.stageIndex < 4 && Math.random() < 0.14
            ? 1
            : 0;

        setState((prev) => {
          const lvRes = applyExpAndLevelUp(prev.level, prev.exp, expGain);
          let rank = prev.rank;
          let highestAct = prev.highestAct;
          let highestStageInAct = prev.highestStageInAct;
          const clearedActs = [...prev.clearedActs];
          let tomeShards = prev.tomeShards;
          let eggShards = prev.eggShards;
          let inventory = prev.inventory;
          let arcaneDust = prev.arcaneDust;
          let selectedAct = prev.selectedAct;
          let selectedStage = prev.selectedStage;
          let towerFloor = prev.towerFloor;
          let highestTowerFloor = prev.highestTowerFloor;
          const trainingSlots = [...prev.trainingSlots];
          let abyss = prev.abyss;
          let deck = prev.deck;

          if (droppedItem) {
            const res = addDroppedItem(prev, droppedItem);
            inventory = res.inventory;
            arcaneDust = res.arcaneDust;
          }

          if (curCombat.mode === 'rankBoss') {
            const promoted = Math.min(5, prev.rank + 1) as RankIndex;
            rank = promoted;
            const newTrainMax =
              RANKS[promoted].trainSlots + (prev.prestige.upgrades.extraTrainSlot ?? 0);
            while (trainingSlots.length < newTrainMax) trainingSlots.push(null);
            // P0-4: 승급으로 늘어난 덱 칸을 해금 스킬로 자동 채움
            deck = fillDeckWith(prev.deck, getMaxDeckSlots({ ...prev, rank: promoted }), rankDeckCandidates(prev));
            tomeShards += 2;
          } else if (curCombat.mode === 'tower') {
            highestTowerFloor = Math.max(highestTowerFloor, curCombat.towerFloor);
            towerFloor = curCombat.towerFloor + 1;
            tomeShards += curCombat.towerFloor % 5 === 0 ? 3 : 1;
          } else if (curCombat.mode === 'abyssElite') {
            tomeShards += 2;
            eggShards += 2;
            abyss = {
              ...prev.abyss,
              lastResult: `정예 등불 사냥꾼 토벌! 금서 조각 +2, 알 조각 +2${
                droppedItem ? `, [${droppedItem.name}] 획득!` : '!'
              }`,
            };
          } else {
            const isActBoss = curCombat.stageIndex === 4;
            if (isActBoss) {
              tomeShards += 2;
              eggShards += 1;
              if (!clearedActs.includes(curCombat.act)) {
                clearedActs.push(curCombat.act);
                if (curCombat.act < 6 && highestAct <= curCombat.act) {
                  highestAct = curCombat.act + 1;
                  highestStageInAct = 0;
                }
              }
              if (prev.settings.autoAdvance && curCombat.act < 6) {
                selectedAct = curCombat.act + 1;
                selectedStage = 0;
              }
            } else {
              tomeShards += extraTomeRoll;
              eggShards += extraEggRoll;
              if (curCombat.act === highestAct && curCombat.stageIndex >= highestStageInAct) {
                highestStageInAct = Math.min(4, curCombat.stageIndex + 1);
              }
              if (prev.settings.autoAdvance && curCombat.stageIndex < 3) {
                selectedStage = curCombat.stageIndex + 1;
              } else if (autoBossNow) {
                selectedStage = 4;
              }
            }
          }

          return {
            ...prev,
            level: lvRes.level,
            exp: lvRes.exp,
            rank,
            stones: prev.stones + stoneGain,
            tomeShards,
            eggShards,
            arcaneDust,
            highestAct,
            highestStageInAct,
            clearedActs,
            selectedAct,
            selectedStage,
            towerFloor,
            highestTowerFloor,
            inventory,
            trainingSlots,
            deck,
            abyss,
            totalKills: prev.totalKills + 1,
          };
        });

        if (toastToShow) showToast(toastToShow);
        if (clearStoryAct !== null) {
          setStoryModal({ kind: 'act', act: clearStoryAct, phase: 'clear' });
        } else if (promotedRankForModal !== null) {
          setStoryModal({ kind: 'rankExam', rank: promotedRankForModal, stage: 'clear' });
        }

        nextCombatTimerRef.current = window.setTimeout(() => {
          nextCombatTimerRef.current = null;
          combatTransitionRef.current = false;
          const freshState = stateRef.current;
          const freshStats = statsRef.current;
          setCombat(
            createCombatRuntime(freshState, freshStats, nextMode, nextAct, nextStage, nextTower)
          );
          if (
            nextMode === 'stage' &&
            clearStoryAct === null &&
            promotedRankForModal === null &&
            (nextAct !== curCombat.act || nextStage !== curCombat.stageIndex)
          ) {
            maybeTriggerStageStory(nextAct, nextStage, freshState);
          }
        }, Math.min(480, Math.round(ms * 0.6)));
      } else if (outcome.result === 'defeat') {
        combatTransitionRef.current = true;
        const wasSpecial = curCombat.mode !== 'stage';
        const isActBossLoss = curCombat.mode === 'stage' && curCombat.stageIndex === 4;
        // P0-3: 일반몹에게 패배하면 (자동 전진 ON일 때) 한 단계 물러나 재정비 → 무한 패배 루프 방지
        const isMobStepBack =
          curCombat.mode === 'stage' &&
          curCombat.stageIndex > 0 &&
          curCombat.stageIndex < 4 &&
          curState.settings.autoAdvance;
        const fallbackStage = isActBossLoss
          ? 3
          : isMobStepBack
            ? curCombat.stageIndex - 1
            : curState.selectedStage;

        if (isActBossLoss) {
          bossRetryRef.current = BOSS_RETRY_KILLS;
          setBossRetryIn(BOSS_RETRY_KILLS);
          showToast(`보스에게 패배… ${BOSS_RETRY_KILLS}번 더 수련한 뒤 자동 재도전합니다.`);
        } else if (wasSpecial) {
          showToast('강적에게 패배하여 안전한 사냥터로 귀환합니다.');
        } else if (isMobStepBack) {
          showToast('쓰러졌습니다… 한 구역 물러나 재정비합니다.');
        }

        if (isActBossLoss || isMobStepBack) {
          setState((prev) => ({ ...prev, selectedStage: fallbackStage }));
        }

        nextCombatTimerRef.current = window.setTimeout(() => {
          nextCombatTimerRef.current = null;
          combatTransitionRef.current = false;
          const freshState = stateRef.current;
          const freshStats = statsRef.current;
          setCombat(
            createCombatRuntime(
              freshState,
              freshStats,
              'stage',
              freshState.selectedAct,
              fallbackStage
            )
          );
        }, Math.min(620, Math.round(ms * 0.75)));
      }
    }, ms);

    return () => clearInterval(id);
  }, [state.created, state.settings.speed, rebirthPending, storyModal, showToast, maybeTriggerStageStory]);

  // ================= 핸들러 =================
  const handleCharacterCreate = (name: string, gender: Gender, school: SchoolId) => {
    const nextPrestige = rebirthPending
      ? {
          ...state.prestige,
          rebirthCount: state.prestige.rebirthCount + 1,
          starRemnants: state.prestige.starRemnants + calculateRebirthReward(state),
          totalRemnantsEarned:
            state.prestige.totalRemnantsEarned + calculateRebirthReward(state),
        }
      : undefined;

    const fresh = createNewGameState(name, gender, school, nextPrestige);
    setState(fresh);
    setRebirthPending(false);
    const freshStats = computePlayerStats(fresh);
    startCombatNow(fresh, freshStats, 'stage', 1, 0);
    setTab('battle');
    setStoryModal({ kind: 'act', act: 1, phase: 'intro' });
    saveGameToStorage(fresh);
    playSfx('victory', true);
  };

  const handleChangeStage = (act: number, stageIndex: number) => {
    playSfx('click', state.settings.sfxEnabled);
    setState((prev) => ({ ...prev, selectedAct: act, selectedStage: stageIndex }));
    startCombatNow(state, stats, 'stage', act, stageIndex);
    maybeTriggerStageStory(act, stageIndex, state);
  };

  const handleChallengeActBoss = () => {
    playSfx('click', state.settings.sfxEnabled);
    bossRetryRef.current = 0;
    setBossRetryIn(0);
    setState((prev) => ({ ...prev, selectedStage: 4 }));
    startCombatNow(state, stats, 'stage', state.selectedAct, 4);
    maybeTriggerStageStory(state.selectedAct, 4, state);
  };

  const handleReturnNormalStage = () => {
    playSfx('click', state.settings.sfxEnabled);
    const safeStage = Math.min(3, state.selectedStage);
    setState((prev) => ({ ...prev, selectedStage: safeStage }));
    startCombatNow(state, stats, 'stage', state.selectedAct, safeStage);
  };

  const handleChallengeRankExam = () => {
    playSfx('click', state.settings.sfxEnabled);
    setTab('battle');
    startCombatNow(state, stats, 'rankBoss');
    const targetRank = Math.min(5, state.rank + 1);
    setStoryModal({ kind: 'rankExam', rank: targetRank, stage: 'start' });
    showToast('승급 시험 보스전 개시!');
  };

  const handleChallengeTower = () => {
    playSfx('click', state.settings.sfxEnabled);
    setTab('battle');
    startCombatNow(state, stats, 'tower', state.selectedAct, 0, state.towerFloor);
  };

  const handleAssignTraining = (slotIdx: number, skillId: string | null) => {
    playSfx('click', state.settings.sfxEnabled);
    setState((prev) => {
      const slots = [...prev.trainingSlots];
      while (slots.length < stats.maxTrainSlots) slots.push(null);
      // 중복 제거
      for (let i = 0; i < slots.length; i++) {
        if (skillId && slots[i] === skillId) slots[i] = null;
      }
      slots[slotIdx] = skillId;
      const skills = { ...prev.skills };
      if (skillId && !skills[skillId]) {
        skills[skillId] = { id: skillId, level: 0, exp: 0, unlocked: false };
      }
      return { ...prev, trainingSlots: slots, skills };
    });
  };

  const handleUnlockDarkSkill = (skillId: string) => {
    const def = SKILL_MAP[skillId];
    if (!def || !def.tomeCost) return;
    if (state.tomeShards < def.tomeCost) return;
    playSfx('dark', state.settings.sfxEnabled);
    const firstDarkUnlock = !(state.viewedStoryKeys ?? []).includes('dark_unlock');
    setState((prev) => {
      const prevKeys = prev.viewedStoryKeys ?? [];
      return {
        ...prev,
        tomeShards: prev.tomeShards - def.tomeCost!,
        viewedStoryKeys:
          firstDarkUnlock && !prevKeys.includes('dark_unlock')
            ? [...prevKeys, 'dark_unlock']
            : prevKeys,
        skills: {
          ...prev.skills,
          [skillId]: { id: skillId, level: 0, exp: 0, unlocked: false },
        },
      };
    });
    if (firstDarkUnlock) {
      setStoryModal({ kind: 'darkUnlock' });
    }
    showToast(`금서 [${def.name}] 해독 완료! 이제 수련 슬롯에 등록하세요.`);
  };

  const handleUpgradeSkillWithStones = (skillId: string) => {
    const learned = state.skills[skillId];
    if (!learned?.unlocked || learned.level >= stats.maxSkillLevel) return;
    const cost = getSkillUpgradeCost(learned.level, skillId);
    if (state.stones < cost) return;
    playSfx('heal', state.settings.sfxEnabled);
    setState((prev) => ({
      ...prev,
      stones: prev.stones - cost,
      skills: {
        ...prev.skills,
        [skillId]: { ...learned, level: learned.level + 1, exp: 0 },
      },
    }));
  };

  const handleEquipItem = (uid: string) => {
    playSfx('click', state.settings.sfxEnabled);
    setState((prev) => {
      const target = prev.inventory.find((i) => i.uid === uid);
      if (!target) return prev;
      const current = prev.equipped[target.slot];
      const remaining = prev.inventory.filter((i) => i.uid !== uid);
      if (current) remaining.unshift(current);
      return {
        ...prev,
        equipped: { ...prev.equipped, [target.slot]: target },
        inventory: remaining,
      };
    });
  };

  // P0-5: 최적 일괄 장착 — 부위별로 보관함 최고 점수 장비로 교체
  const handleEquipBest = () => {
    const plan = planBestLoadout(state.equipped, state.inventory, state.school);
    if (plan.swaps.length === 0) {
      showToast('이미 최적의 마도구를 장착하고 있습니다.');
      return;
    }
    playSfx('heal', state.settings.sfxEnabled);
    showToast(`✦ ${plan.swaps.length}개 부위 교체 — 전투력 +${plan.totalGain.toLocaleString()}`);
    setState((prev) => {
      const p = planBestLoadout(prev.equipped, prev.inventory, prev.school);
      return { ...prev, equipped: p.equipped, inventory: p.inventory };
    });
  };

  const handleEnhanceEquipped = (slot: EquipSlot) => {
    const item = state.equipped[slot];
    if (!item || item.enhance >= 15) return;
    const cost = getEnhanceCost(item);
    if (state.stones < cost) return;
    playSfx('heal', state.settings.sfxEnabled);
    setState((prev) => {
      const cur = prev.equipped[slot];
      if (!cur) return prev;
      return {
        ...prev,
        stones: prev.stones - cost,
        equipped: { ...prev.equipped, [slot]: { ...cur, enhance: cur.enhance + 1 } },
      };
    });
  };

  const handleReforgeEquipped = (slot: EquipSlot) => {
    const item = state.equipped[slot];
    if (!item || state.arcaneDust < 80) return;
    playSfx('cast', state.settings.sfxEnabled);
    const cats: MagicCategory[] = ['flame', 'frost', 'thunder', 'earth', 'dark'];
    const picked = cats[Math.floor(Math.random() * cats.length)];
    const pct = Math.round(10 + RARITY_META[item.rarity].order * 5 + item.tier * 2);
    setState((prev) => {
      const cur = prev.equipped[slot];
      if (!cur) return prev;
      return {
        ...prev,
        arcaneDust: prev.arcaneDust - 80,
        equipped: {
          ...prev.equipped,
          [slot]: {
            ...cur,
            stats: { ...cur.stats, elementBonus: { category: picked, pct } },
          },
        },
      };
    });
    showToast('속성 옵션 재련 완료!');
  };

  const handleDismantleItem = (uid: string) => {
    playSfx('click', state.settings.sfxEnabled);
    setState((prev) => {
      const target = prev.inventory.find((i) => i.uid === uid);
      if (!target) return prev;
      return {
        ...prev,
        inventory: prev.inventory.filter((i) => i.uid !== uid),
        arcaneDust: prev.arcaneDust + RARITY_META[target.rarity].dustValue,
      };
    });
  };

  const handleDismantleBulk = (below: Rarity) => {
    const limit = RARITY_META[below].order;
    const dustGain = state.inventory.reduce(
      (acc, item) => (RARITY_META[item.rarity].order < limit ? acc + RARITY_META[item.rarity].dustValue : acc),
      0
    );
    if (dustGain > 0) showToast(`일괄 분해 완료! 마력 가루 +${dustGain}`);
    setState((prev) => {
      let dust = 0;
      const keep: EquipmentItem[] = [];
      for (const item of prev.inventory) {
        if (RARITY_META[item.rarity].order < limit) {
          dust += RARITY_META[item.rarity].dustValue;
        } else {
          keep.push(item);
        }
      }
      return { ...prev, inventory: keep, arcaneDust: prev.arcaneDust + dust };
    });
  };

  const handleBuyShopBox = (kind: 'gear' | 'tome' | 'egg' | 'dustGear') => {
    playSfx('click', state.settings.sfxEnabled);
    const gearBoxCost = Math.round(160 * Math.pow(1.55, state.selectedAct - 1));
    if (kind === 'gear') {
      if (state.stones < gearBoxCost) return;
      const item = generateEquipment(state.selectedAct);
      setState((prev) => ({
        ...prev,
        stones: prev.stones - gearBoxCost,
        inventory: [item, ...prev.inventory].slice(0, 36),
      }));
      showToast(`[${item.name}] 획득!`);
    } else if (kind === 'dustGear') {
      if (state.arcaneDust < 120) return;
      const rarity = rollRarity(state.selectedAct, 32);
      const safeRarity: Rarity = rarity === 'common' ? 'rare' : rarity;
      const item = generateEquipment(state.selectedAct, undefined, safeRarity);
      setState((prev) => ({
        ...prev,
        arcaneDust: prev.arcaneDust - 120,
        inventory: [item, ...prev.inventory].slice(0, 36),
      }));
      showToast(`연금 성공! [${item.name}]`);
    } else if (kind === 'tome') {
      if (state.stones < 450) return;
      setState((prev) => ({ ...prev, stones: prev.stones - 450, tomeShards: prev.tomeShards + 1 }));
      showToast('금서 조각 +1 구매!');
    } else if (kind === 'egg') {
      if (state.stones < 380) return;
      setState((prev) => ({ ...prev, stones: prev.stones - 380, eggShards: prev.eggShards + 1 }));
      showToast('사역마 알 조각 +1 구매!');
    }
  };

  const handleHatchFamiliar = (id: FamiliarId) => {
    const def = FAMILIARS[id];
    if (state.stones < def.hatchCost || state.eggShards < (def.eggFragmentCost ?? 0)) return;
    playSfx('victory', state.settings.sfxEnabled);
    setState((prev) => ({
      ...prev,
      stones: prev.stones - def.hatchCost,
      eggShards: prev.eggShards - (def.eggFragmentCost ?? 0),
      familiars: { ...prev.familiars, [id]: { id, level: 1, evolution: 0 } },
      activeFamiliar: prev.activeFamiliar ?? id,
    }));
    showToast(`사역마 [${def.name}] 부화 성공!`);
  };

  const handleUpgradeFamiliar = (id: FamiliarId) => {
    const owned = state.familiars[id];
    if (!owned || owned.level >= 60) return;
    const cost = getFamiliarUpgradeCost(owned.level);
    if (state.stones < cost) return;
    playSfx('heal', state.settings.sfxEnabled);
    setState((prev) => ({
      ...prev,
      stones: prev.stones - cost,
      familiars: { ...prev.familiars, [id]: { ...owned, level: owned.level + 1 } },
    }));
  };

  const handleEvolveFamiliar = (id: FamiliarId) => {
    const owned = state.familiars[id];
    if (!owned || owned.evolution >= 2) return;
    const evo = getFamiliarEvoCost(owned.evolution);
    if (
      owned.level < evo.reqLevel ||
      state.rank < evo.reqRank ||
      state.stones < evo.stones ||
      state.eggShards < evo.eggShards
    ) {
      return;
    }
    const nextEvo = (owned.evolution + 1) as 0 | 1 | 2;
    playSfx('victory', state.settings.sfxEnabled);
    setState((prev) => ({
      ...prev,
      stones: prev.stones - evo.stones,
      eggShards: prev.eggShards - evo.eggShards,
      familiars: { ...prev.familiars, [id]: { ...owned, evolution: nextEvo } },
    }));
    showToast(`사역마 각성! [${FAMILIARS[id].evolvedNames[nextEvo]}]`);
  };

  const handleExploreAbyssStep = () => {
    if (state.abyss.lanterns <= 0 || state.abyss.activeNode) return;
    playSfx('click', state.settings.sfxEnabled);
    const node = generateAbyssNode(state.abyss.depth);
    setState((prev) => ({
      ...prev,
      abyss: {
        ...prev.abyss,
        lanterns: prev.abyss.lanterns - 1,
        depth: prev.abyss.depth + 1,
        activeNode: node,
        lastResult: null,
      },
    }));
  };

  const handleResolveAbyssChoice = (choice: AbyssChoice) => {
    playSfx('click', state.settings.sfxEnabled);
    if (choice.outcomeType === 'fight') {
      setState((prev) => ({
        ...prev,
        abyss: { ...prev.abyss, activeNode: null },
      }));
      setTab('battle');
      startCombatNow(state, stats, 'abyssElite');
      return;
    }

    const baseStone = Math.round(120 * Math.pow(1.48, state.highestAct - 1));
    setState((prev) => {
      let stones = prev.stones;
      let tomeShards = prev.tomeShards;
      let eggShards = prev.eggShards;
      let arcaneDust = prev.arcaneDust;
      let inventory = prev.inventory;
      let level = prev.level;
      let exp = prev.exp;
      let result = '';

      if (choice.outcomeType === 'tome') {
        if (Math.random() < 0.78) {
          tomeShards += 2;
          stones += baseStone;
          result = `금단의 기운을 해독했습니다! 금서 조각 +2, 마석 +${baseStone.toLocaleString()}.`;
        } else {
          const loss = Math.min(stones, Math.round(baseStone * 0.25));
          stones -= loss;
          tomeShards += 1;
          result = `제단이 마력을 삼켰지만 금서 조각 +1을 건졌습니다. (마석 -${loss})`;
        }
      } else if (choice.outcomeType === 'treasure') {
        stones += Math.round(baseStone * 1.15);
        arcaneDust += 35;
        result = `안개 속에서 마석 +${Math.round(baseStone * 1.15).toLocaleString()}, 마력 가루 +35 획득!`;
      } else if (choice.outcomeType === 'gamble') {
        const rarity = rollRarity(prev.highestAct, 28);
        const item = generateEquipment(prev.highestAct, undefined, rarity === 'common' ? 'rare' : rarity);
        const added = addDroppedItem(prev, item);
        inventory = added.inventory;
        arcaneDust = added.arcaneDust;
        result = added.kept
          ? `봉인함에서 [${item.name}] (${RARITY_META[item.rarity].name})을(를) 얻었습니다!`
          : `보관함이 가득 차 [${item.name}]이(가) 마력 가루로 분해되었습니다.`;
      } else if (choice.outcomeType === 'egg') {
        eggShards += 2;
        result = `따뜻한 둥지에서 사역마 알 조각 +2 획득!`;
      } else if (choice.outcomeType === 'heal') {
        const expGain = Math.round(expForNextLevel(prev.level) * 0.35);
        const lvRes = applyExpAndLevelUp(prev.level, prev.exp, expGain);
        level = lvRes.level;
        exp = lvRes.exp;
        arcaneDust += 40;
        result = `마력 잔해를 흡수해 경험치 +${expGain.toLocaleString()}, 마력 가루 +40 획득!`;
      } else {
        const expGain = Math.round(expForNextLevel(prev.level) * 0.12);
        const lvRes = applyExpAndLevelUp(prev.level, prev.exp, expGain);
        level = lvRes.level;
        exp = lvRes.exp;
        result = `조용히 우회하여 안전하게 다음 구역으로 나아갔습니다. (경험치 +${expGain.toLocaleString()})`;
      }

      return {
        ...prev,
        level,
        exp,
        stones,
        tomeShards,
        eggShards,
        arcaneDust,
        inventory,
        abyss: { ...prev.abyss, activeNode: null, lastResult: result },
      };
    });
  };

  const handleBuyPrestigeUpgrade = (id: PrestigeUpgradeId) => {
    const def = PRESTIGE_UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const curLv = state.prestige.upgrades[id] ?? 0;
    if (curLv >= def.maxLevel) return;
    const cost = getPrestigeUpgradeCost(def, curLv);
    if (state.prestige.starRemnants < cost) return;
    playSfx('victory', state.settings.sfxEnabled);
    setState((prev) => {
      const nextUp = { ...prev.prestige.upgrades, [id]: curLv + 1 };
      const trainingSlots = [...prev.trainingSlots];
      if (id === 'extraTrainSlot') trainingSlots.push(null);
      return {
        ...prev,
        trainingSlots,
        prestige: {
          ...prev.prestige,
          starRemnants: prev.prestige.starRemnants - cost,
          upgrades: nextUp,
        },
      };
    });
    showToast(`성좌 각인 완료: ${def.name} Lv.${curLv + 1}`);
  };

  // 알림 점
  const nextRank = state.rank < 5 ? RANKS[state.rank + 1] : null;
  const examReady =
    nextRank !== null &&
    state.level >= nextRank.reqLevel &&
    (nextRank.reqClearedAct === 0 || state.clearedActs.includes(nextRank.reqClearedAct));
  const abyssReady = state.abyss.lanterns >= state.abyss.maxLanterns;

  const expReq = expForNextLevel(state.level);
  const expPct = Math.min(100, Math.round((state.exp / Math.max(1, expReq)) * 100));

  return (
    <div className="app-outer">
      <div className="phone-shell">
        {!state.created || rebirthPending ? (
          <CharacterCreation
            isRebirth={rebirthPending}
            rebirthCount={state.prestige.rebirthCount}
            initialName={state.playerName}
            onComplete={handleCharacterCreate}
            onCancelRebirth={() => setRebirthPending(false)}
          />
        ) : (
          <>
            {/* 상단 상태 헤더 */}
            <header className="top-header">
              <div className="header-row">
                <div className="player-badge">
                  <button
                    type="button"
                    className="player-avatar-mini"
                    onClick={() => setHeroModalOpen(true)}
                    title="캐릭터 원화 크게 보기"
                    aria-label="캐릭터 원화 크게 보기"
                  >
                    <PlayerPortrait
                      school={state.school}
                      gender={state.gender}
                      awakened={state.rank >= 3}
                      variant="avatar"
                    />
                  </button>
                  <div className="player-meta">
                    <div className="player-name-line">
                      <span className="player-name">{state.playerName}</span>
                      <span className="rank-tag">{RANKS[state.rank].name}</span>
                    </div>
                    <div className="player-sub">
                      Lv.{state.level} · {SCHOOLS[state.school].name}
                      {state.prestige.rebirthCount > 0 ? ` · ${state.prestige.rebirthCount}회귀` : ''}
                    </div>
                  </div>
                </div>

                <div className="currency-strip">
                  <span className="curr-pill gold" title="마석">
                    ◆ {state.stones.toLocaleString()}
                  </span>
                  <span className="curr-pill tome" title="금서 조각">
                    ✦ {state.tomeShards}
                  </span>
                </div>
              </div>
              <div className="exp-thin-bar">
                <div className="exp-thin-fill" style={{ width: `${expPct}%` }} />
              </div>
            </header>

            {toast && <div className="toast-float">{toast}</div>}

            {/* 메인 스크롤 영역 */}
            <main className="main-content">
              {tab === 'battle' && (
                <BattleTab
                  state={state}
                  stats={stats}
                  combat={combat}
                  onChangeStage={handleChangeStage}
                  onChallengeActBoss={handleChallengeActBoss}
                  bossRetryIn={bossRetryIn}
                  onReturnNormalStage={handleReturnNormalStage}
                  onCycleSpeed={() => {
                    const nextSpeed =
                      state.settings.speed === 1 ? 2 : state.settings.speed === 2 ? 3 : 1;
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, speed: nextSpeed },
                    }));
                  }}
                  onToggleAutoAdvance={() =>
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, autoAdvance: !prev.settings.autoAdvance },
                    }))
                  }
                  onOpenStory={(act) =>
                    setStoryModal({ kind: 'act', act, phase: 'intro', archiveMode: true })
                  }
                  onOpenHeroModal={() => setHeroModalOpen(true)}
                />
              )}

              {tab === 'school' && (
                <SchoolTab
                  state={state}
                  stats={stats}
                  onAssignTraining={handleAssignTraining}
                  onUnlockDarkSkill={handleUnlockDarkSkill}
                  onUpgradeSkillWithStones={handleUpgradeSkillWithStones}
                  onChallengeRankExam={handleChallengeRankExam}
                  onOpenStory={(act, archiveMode) =>
                    setStoryModal({ kind: 'act', act, phase: 'intro', archiveMode })
                  }
                  onSelectAct={(act) => {
                    handleChangeStage(act, 0);
                    setTab('battle');
                  }}
                />
              )}

              {tab === 'deck' && (
                <DeckGearTab
                  state={state}
                  stats={stats}
                  onUpdateDeck={(deck) => {
                    playSfx('click', state.settings.sfxEnabled);
                    setState((prev) => ({ ...prev, deck }));
                  }}
                  onEquipItem={handleEquipItem}
                  onEquipBest={handleEquipBest}
                  onEnhanceEquipped={handleEnhanceEquipped}
                  onReforgeEquipped={handleReforgeEquipped}
                  onDismantleItem={handleDismantleItem}
                  onDismantleBulk={handleDismantleBulk}
                  onSetAutoDismantle={(below) =>
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, autoDismantleBelow: below },
                    }))
                  }
                  onBuyShopBox={handleBuyShopBox}
                />
              )}

              {tab === 'familiar' && (
                <FamiliarTab
                  state={state}
                  onHatchFamiliar={handleHatchFamiliar}
                  onSelectFamiliar={(id) => {
                    playSfx('click', state.settings.sfxEnabled);
                    setState((prev) => ({ ...prev, activeFamiliar: id }));
                  }}
                  onUpgradeFamiliar={handleUpgradeFamiliar}
                  onEvolveFamiliar={handleEvolveFamiliar}
                />
              )}

              {tab === 'abyss' && (
                <AbyssTab
                  state={state}
                  stats={stats}
                  onExploreAbyssStep={handleExploreAbyssStep}
                  onResolveAbyssChoice={handleResolveAbyssChoice}
                  onChallengeTower={handleChallengeTower}
                  onBuyPrestigeUpgrade={handleBuyPrestigeUpgrade}
                  onStartRebirthFlow={() => {
                    clearPendingCombatTimer();
                    setRebirthPending(true);
                  }}
                  onToggleSfx={() =>
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, sfxEnabled: !prev.settings.sfxEnabled },
                    }))
                  }
                  onImportSaveCode={(code) => {
                    const loaded = importSaveCode(code);
                    if (!loaded) return false;
                    setState(loaded);
                    saveGameToStorage(loaded);
                    startCombatNow(loaded, computePlayerStats(loaded), 'stage');
                    return true;
                  }}
                  onHardReset={() => {
                    clearPendingCombatTimer();
                    clearGameStorage();
                    setState(createEmptyUncreatedState());
                    setTab('battle');
                  }}
                />
              )}
            </main>

            {/* 하단 5탭 네비게이션 */}
            <nav className="bottom-nav" aria-label="주요 메뉴">
              <button
                type="button"
                className={`nav-btn ${tab === 'battle' ? 'active' : ''}`}
                onClick={() => setTab('battle')}
              >
                <Swords size={18} />
                <span>전투</span>
              </button>
              <button
                type="button"
                className={`nav-btn ${tab === 'school' ? 'active' : ''}`}
                onClick={() => setTab('school')}
              >
                <BookOpen size={18} />
                <span>학교</span>
                {examReady && <span className="nav-dot" />}
              </button>
              <button
                type="button"
                className={`nav-btn ${tab === 'deck' ? 'active' : ''}`}
                onClick={() => setTab('deck')}
              >
                <Shield size={18} />
                <span>덱·장비</span>
              </button>
              <button
                type="button"
                className={`nav-btn ${tab === 'familiar' ? 'active' : ''}`}
                onClick={() => setTab('familiar')}
              >
                <PawPrint size={18} />
                <span>사역마</span>
              </button>
              <button
                type="button"
                className={`nav-btn ${tab === 'abyss' ? 'active' : ''}`}
                onClick={() => setTab('abyss')}
              >
                <Compass size={18} />
                <span>심연</span>
                {abyssReady && <span className="nav-dot" />}
              </button>
            </nav>

            {offlineSummary && (
              <OfflineModal summary={offlineSummary} onClose={() => setOfflineSummary(null)} />
            )}

            {storyModal && (
              <StoryModal
                state={state}
                story={storyModal}
                onClose={() => setStoryModal(null)}
              />
            )}

            {heroModalOpen && (
              <HeroPortraitModal
                state={state}
                stats={stats}
                onClose={() => setHeroModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
