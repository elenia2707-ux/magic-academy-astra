import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FastForward, Skull } from 'lucide-react';
import { ACTS } from '../data/acts';
import { getMonsterArt } from '../data/art';
import { FAMILIARS } from '../data/familiars';
import { CATEGORY_META, getCharacterTitle, RANKS, SCHOOLS } from '../data/schools';
import { SKILL_MAP } from '../data/skills';
import type { CombatRuntime, ComputedStats, GameState, StatusEffect, StatusType } from '../types/game';
import { FamiliarPortrait, MonsterPortrait, PlayerPortrait } from './GothicArt';
import { MonsterShowcaseModal } from './Modals';
import { SkillIcon, SpellImpactVfx } from './SkillArt';

interface Props {
  state: GameState;
  stats: ComputedStats;
  combat: CombatRuntime;
  onChangeStage: (act: number, stageIndex: number) => void;
  onChallengeActBoss: () => void;
  onReturnNormalStage: () => void;
  onCycleSpeed: () => void;
  onToggleAutoAdvance: () => void;
  onOpenStory: (act: number) => void;
  onOpenHeroModal: () => void;
}

const STATUS_LABEL: Record<StatusType, string> = {
  burn: '화상',
  freeze: '빙결',
  shock: '감전',
  poison: '독',
  curse: '저주',
  shield: '보호막',
  atkUp: '마력↑',
  reflect: '반사',
  regen: '재생',
};

const StatusRow: React.FC<{ list: StatusEffect[] }> = ({ list }) => (
  <div className="status-row">
    {list.map((st) => (
      <span key={st.type} className="status-chip">
        {STATUS_LABEL[st.type]} {st.turns}
      </span>
    ))}
  </div>
);

export const BattleTab: React.FC<Props> = ({
  state,
  stats,
  combat,
  onChangeStage,
  onChallengeActBoss,
  onReturnNormalStage,
  onCycleSpeed,
  onToggleAutoAdvance,
  onOpenStory,
  onOpenHeroModal,
}) => {
  const logRef = useRef<HTMLDivElement | null>(null);
  const [enemyModalOpen, setEnemyModalOpen] = useState(false);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [combat.logs]);

  const actDef = ACTS[Math.max(0, Math.min(ACTS.length - 1, state.selectedAct - 1))];
  const isSpecialMode = combat.mode !== 'stage';
  const hpPct = Math.max(0, Math.min(100, (combat.playerHp / Math.max(1, combat.playerMaxHp)) * 100));
  const mpPct = Math.max(0, Math.min(100, (combat.playerMp / Math.max(1, combat.playerMaxMp)) * 100));
  const enemyHpPct = Math.max(0, Math.min(100, (combat.enemyHp / Math.max(1, combat.enemyMaxHp)) * 100));

  const canGoPrev = state.selectedAct > 1 || state.selectedStage > 0;
  const maxStageForAct =
    state.selectedAct < state.highestAct
      ? 4
      : Math.min(4, state.highestStageInAct);
  const canGoNext =
    state.selectedStage < maxStageForAct ||
    (state.selectedAct < state.highestAct && state.selectedStage === 4);

  const handlePrev = () => {
    if (state.selectedStage > 0) {
      onChangeStage(state.selectedAct, state.selectedStage - 1);
    } else if (state.selectedAct > 1) {
      onChangeStage(state.selectedAct - 1, 3);
    }
  };

  const handleNext = () => {
    if (state.selectedStage < maxStageForAct) {
      onChangeStage(state.selectedAct, state.selectedStage + 1);
    } else if (state.selectedAct < state.highestAct) {
      onChangeStage(state.selectedAct + 1, 0);
    }
  };

  const activeDeck = state.deck.slice(0, stats.maxDeckSlots);
  const activeFam = state.activeFamiliar ? state.familiars[state.activeFamiliar] : undefined;

  return (
    <div>
      {/* 스테이지 컨트롤 바 */}
      <div className="stage-bar">
        <div className="stage-selector">
          {!isSpecialMode && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={!canGoPrev}
              onClick={handlePrev}
              aria-label="이전 스테이지"
            >
              <ChevronLeft size={14} />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="stage-label">
              {combat.mode === 'rankBoss'
                ? '교장실 승급 시험전'
                : combat.mode === 'tower'
                  ? `무한 심연 탑 · ${combat.towerFloor}층`
                  : combat.mode === 'abyssElite'
                    ? '심연 미궁 정예전'
                    : `${state.selectedAct}-${state.selectedStage + 1} · ${actDef.location}`}
            </div>
          </div>
          {!isSpecialMode && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              disabled={!canGoNext}
              onClick={handleNext}
              aria-label="다음 스테이지"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onCycleSpeed}
            title="전투 배속"
          >
            <FastForward size={12} />
            {state.settings.speed}x
          </button>
          {!isSpecialMode ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => onOpenStory(state.selectedAct)}
              title="막 스토리"
            >
              <BookOpen size={12} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-crimson"
              onClick={onReturnNormalStage}
            >
              철수
            </button>
          )}
        </div>
      </div>

      {/* 고딕 수채화 카드 전투 무대 */}
      <div className="arena-card">
        <div className="arena-banner">
          <span>
            턴 {combat.turn} · {RANKS[state.rank].name} {SCHOOLS[state.school].shortName}
          </span>
          {combat.enemyTelegraph ? (
            <span className="telegraph-pill">
              강공격 예고: {combat.enemy.heavyName ?? '강타'}
            </span>
          ) : (
            <span>
              보상 EXP {combat.enemy.expReward.toLocaleString()} · 마석{' '}
              {combat.enemy.stoneReward.toLocaleString()}
            </span>
          )}
        </div>

        <div className="duel-grid">
          {/* 플레이어 수채화 카드 */}
          <div
            className={`combatant-card ${
              combat.lastVfx?.target === 'player' && !combat.lastVfx.isHeal ? 'shake' : ''
            }`}
          >
            {combat.lastVfx?.target === 'player' && (
              <div key={combat.lastVfx.id} className="vfx-popup">
                <div className="vfx-label">{combat.lastVfx.label}</div>
                <div className={`vfx-num ${combat.lastVfx.isHeal ? 'heal' : ''}`}>
                  {combat.lastVfx.amountText}
                </div>
              </div>
            )}
            <button
              type="button"
              className="portrait-frame portrait-frame-art"
              onClick={onOpenHeroModal}
              title="탭하여 캐릭터 원화 크게 보기"
              aria-label="캐릭터 원화 크게 보기"
            >
              <PlayerPortrait
                school={state.school}
                gender={state.gender}
                variant="card"
                awakened={state.rank >= 3}
              />
              {combat.lastVfx?.target === 'player' && <SpellImpactVfx vfx={combat.lastVfx} />}
              {state.activeFamiliar && activeFam && (
                <div className="familiar-mini-badge" title={FAMILIARS[state.activeFamiliar].name}>
                  <FamiliarPortrait id={state.activeFamiliar} variant="badge" />
                </div>
              )}
            </button>
            <div className="combatant-name">{state.playerName}</div>
            <div className="combatant-role">
              Lv.{state.level} {getCharacterTitle(state.school, state.gender)}
            </div>

            <div className="meter-wrap">
              <div className="meter-top">
                <span>HP</span>
                <span>
                  {combat.playerHp.toLocaleString()} / {combat.playerMaxHp.toLocaleString()}
                </span>
              </div>
              <div className="meter-track">
                <div className="meter-fill hp" style={{ width: `${hpPct}%` }} />
              </div>
            </div>

            <div className="meter-wrap">
              <div className="meter-top">
                <span>MP</span>
                <span>
                  {combat.playerMp} / {combat.playerMaxMp}
                </span>
              </div>
              <div className="meter-track">
                <div className="meter-fill mp" style={{ width: `${mpPct}%` }} />
              </div>
            </div>

            {combat.playerShield > 0 && (
              <div className="meter-wrap">
                <div className="meter-top">
                  <span>보호막</span>
                  <span>{combat.playerShield.toLocaleString()}</span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-fill shield"
                    style={{
                      width: `${Math.min(100, (combat.playerShield / Math.max(1, combat.playerMaxHp)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <StatusRow list={combat.playerStatuses} />
          </div>

          {/* 몬스터 카드 */}
          <div
            className={`combatant-card ${combat.enemy.isBoss ? 'boss' : ''} ${
              combat.lastVfx?.target === 'enemy' ? 'shake' : ''
            }`}
          >
            {combat.lastVfx?.target === 'enemy' && (
              <div key={combat.lastVfx.id} className="vfx-popup">
                <div className="vfx-label">{combat.lastVfx.label}</div>
                <div
                  className={`vfx-num ${combat.lastVfx.isCrit ? 'crit' : ''}`}
                  style={{
                    color:
                      combat.lastVfx.category !== 'basic' && combat.lastVfx.category !== 'enemy'
                        ? CATEGORY_META[combat.lastVfx.category].color
                        : undefined,
                  }}
                >
                  {combat.lastVfx.amountText}
                </div>
              </div>
            )}
            <button
              type="button"
              className={`portrait-frame ${
                getMonsterArt(combat.enemy.artKey)
                  ? combat.enemy.isBoss
                    ? 'portrait-frame-art portrait-frame-boss-art'
                    : 'portrait-frame-art'
                  : ''
              }`}
              onClick={() => setEnemyModalOpen(true)}
              title="탭하여 몬스터 원화 및 정보 크게 보기"
              aria-label="몬스터 원화 크게 보기"
            >
              <MonsterPortrait
                artKey={combat.enemy.artKey}
                isBoss={combat.enemy.isBoss}
                variant="card"
                alt={combat.enemy.name}
              />
              {combat.lastVfx?.target === 'enemy' && <SpellImpactVfx vfx={combat.lastVfx} />}
            </button>
            <div className="combatant-name">{combat.enemy.name}</div>
            <div className="combatant-role">{combat.enemy.title}</div>

            <div className="meter-wrap">
              <div className="meter-top">
                <span>HP</span>
                <span>
                  {combat.enemyHp.toLocaleString()} / {combat.enemyMaxHp.toLocaleString()}
                </span>
              </div>
              <div className="meter-track">
                <div className="meter-fill hp" style={{ width: `${enemyHpPct}%` }} />
              </div>
            </div>

            <div className="meter-wrap" style={{ marginTop: 4 }}>
              <div className="meter-top">
                <span>공격 / 방어</span>
                <span>
                  {combat.enemy.atk.toLocaleString()} / {combat.enemy.def.toLocaleString()}
                </span>
              </div>
            </div>

            <StatusRow list={combat.enemyStatuses} />
          </div>
        </div>

        {/* 보스 조우 한 줄 대사 배너 */}
        {(combat.enemy.encounterQuote || combat.enemy.ngPlusQuote) && (
          <div className="boss-quote-strip">
            <span className="boss-quote-speaker">{combat.enemy.name}</span>
            <span className="boss-quote-text">
              “
              {state.prestige.rebirthCount >= 1 && combat.enemy.ngPlusQuote
                ? combat.enemy.ngPlusQuote
                : combat.enemy.encounterQuote}
              ”
            </span>
          </div>
        )}

        {/* 현재 심플 로테이션 스킬 덱 상태 */}
        <div className="rotation-strip">
          {Array.from({ length: stats.maxDeckSlots }).map((_, idx) => {
            const sid = activeDeck[idx];
            const def = sid ? SKILL_MAP[sid] : null;
            const cd = sid ? combat.cooldowns[sid] ?? 0 : 0;
            return (
              <div key={idx} className={`rot-chip ${cd > 0 ? 'on-cd' : ''}`}>
                <div className="rot-idx">{idx + 1}순위</div>
                {def && (
                  <div className="rot-icon-wrap">
                    <SkillIcon skillId={def.id} category={def.category} size="sm" />
                  </div>
                )}
                <div
                  className="rot-name"
                  style={{
                    color: def ? CATEGORY_META[def.category].color : '#6f6a62',
                  }}
                >
                  {def ? def.name : '비어있음'}
                </div>
                <div className="rot-cd">
                  {def ? (cd > 0 ? `대기 ${cd}턴` : `MP ${def.mpCost}`) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 클래식 텍스트 전투 로그 */}
      <div className="combat-log-box" ref={logRef}>
        {combat.logs.map((entry) => (
          <div key={entry.id} className={`log-line ${entry.tone}`}>
            <span className="log-turn">T{entry.turn}</span>
            <span>{entry.text}</span>
          </div>
        ))}
      </div>

      {/* 하단 퀵 액션 */}
      <div className="panel" style={{ padding: '10px 11px', marginBottom: 0 }}>
        <div className="list-actions">
          <button
            type="button"
            className={`btn btn-sm ${state.settings.autoAdvance ? 'btn-gold' : ''}`}
            onClick={onToggleAutoAdvance}
          >
            자동 전진: {state.settings.autoAdvance ? 'ON' : 'OFF'}
          </button>

          {!isSpecialMode && state.selectedStage < 4 && state.highestStageInAct >= 3 && (
            <button
              type="button"
              className="btn btn-sm btn-crimson"
              onClick={onChallengeActBoss}
            >
              <Skull size={13} />
              제 {state.selectedAct}막 보스 도전
            </button>
          )}

          <div style={{ fontSize: 11, color: '#9a9386', marginLeft: 'auto' }}>
            마력 {stats.magic.toLocaleString()} · 치명 {stats.critRate}%
          </div>
        </div>
      </div>

      {enemyModalOpen && (
        <MonsterShowcaseModal
          monster={combat.enemy}
          rebirthCount={state.prestige.rebirthCount}
          onClose={() => setEnemyModalOpen(false)}
        />
      )}
    </div>
  );
};
