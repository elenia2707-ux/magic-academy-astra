import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FastForward, FlaskConical, Music, Skull, VolumeX, X } from 'lucide-react';
import { ACTS } from '../data/acts';
import { getMonsterArt } from '../data/art';
import type { AcademyEventDef } from '../data/blackComedyEvents';
import { FAMILIARS } from '../data/familiars';
import { getActiveInfirmaryEffect } from '../data/infirmary';
import { CATEGORY_META, getCharacterTitle, RANKS, SCHOOLS } from '../data/schools';
import { SKILL_MAP } from '../data/skills';
import type { CombatRuntime, ComputedStats, GameState, StatusEffect, StatusType } from '../types/game';
import { FamiliarPortrait, MonsterPortrait, NpcPortrait, PlayerPortrait } from './GothicArt';
import { MonsterShowcaseModal } from './Modals';
import { SkillIcon, SpellImpactVfx } from './SkillArt';

interface Props {
  state: GameState;
  stats: ComputedStats;
  combat: CombatRuntime;
  onChangeStage: (act: number, stageIndex: number) => void;
  onChallengeActBoss: () => void;
  /** 보스 패배 후 자동 재도전까지 남은 처치 수 (0이면 즉시) */
  bossRetryIn: number;
  onReturnNormalStage: () => void;
  onCycleSpeed: () => void;
  onToggleAutoAdvance: () => void;
  pendingStoryCount: number;
  onOpenStory: (act: number) => void;
  onOpenHeroModal: () => void;
  onToggleInfirmaryDismiss: () => void;
  activeEvent: AcademyEventDef | null;
  onResolveEvent: (choiceId: string) => void;
  onDismissEvent: () => void;
  onToggleBgm: () => void;
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
  bossRetryIn,
  onReturnNormalStage,
  onCycleSpeed,
  onToggleAutoAdvance,
  pendingStoryCount,
  onOpenStory,
  onOpenHeroModal,
  onToggleInfirmaryDismiss,
  activeEvent,
  onResolveEvent,
  onDismissEvent,
  onToggleBgm,
}) => {
  const logRef = useRef<HTMLDivElement | null>(null);
  const [enemyModalOpen, setEnemyModalOpen] = useState(false);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
      // 넘칠 때만 상단 페이드 베일을 켬 (짧은 로그 첫 줄이 흐려지지 않게)
      logRef.current.classList.toggle('is-scrolled', logRef.current.scrollTop > 0);
    }
  }, [combat.logs]);

  const actDef = ACTS[Math.max(0, Math.min(ACTS.length - 1, state.selectedAct - 1))];
  const isSpecialMode = combat.mode !== 'stage';
  const hpPct = Math.max(0, Math.min(100, (combat.playerHp / Math.max(1, combat.playerMaxHp)) * 100));
  const enemyHpPct = Math.max(0, Math.min(100, (combat.enemyHp / Math.max(1, combat.enemyMaxHp)) * 100));
  const activeInfirmary = getActiveInfirmaryEffect(state);
  const infirmary = state.infirmary;

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
          <button
            type="button"
            className={`btn btn-sm btn-ghost bgm-quick-btn ${
              (state.settings.bgmEnabled ?? true) ? 'is-on' : 'is-off'
            }`}
            onClick={onToggleBgm}
            title={(state.settings.bgmEnabled ?? true) ? '배경음 끄기' : '배경음 켜기'}
            aria-label="배경음 토글"
          >
            {(state.settings.bgmEnabled ?? true) ? <Music size={12} /> : <VolumeX size={12} />}
          </button>
          {!isSpecialMode ? (
            <button
              type="button"
              className={`btn btn-sm btn-ghost story-btn ${pendingStoryCount > 0 ? 'has-pending' : ''}`}
              onClick={() => onOpenStory(state.selectedAct)}
              title="막 스토리"
              aria-label={pendingStoryCount > 0 ? '스토리 대기 중 · 눌러서 바로 읽기' : '막 스토리'}
            >
              <BookOpen size={12} />
              {pendingStoryCount > 0 && (
                <span className="story-ruby-dot" aria-hidden="true" />
              )}
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

      {/* P1-8: 스토리 대기열 힌트 바 (누르면 25초 숨 고르기 없이 바로 읽기) */}
      {!isSpecialMode && pendingStoryCount > 0 && (
        <button
          type="button"
          className="story-pending-hint"
          onClick={() => onOpenStory(state.selectedAct)}
        >
          <span className="story-pending-hint-left">
            <span className="story-pending-gem" aria-hidden="true" />
            <span>
              📜 스토리 대기 중{pendingStoryCount > 1 ? ` (${pendingStoryCount})` : ''}
            </span>
          </span>
          <span className="story-pending-cta">바로 읽기 ›</span>
        </button>
      )}

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
            <div className="combatant-name ribbon">{state.playerName}</div>
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
            className={`combatant-card enemy-card ${combat.enemy.isBoss ? 'boss' : ''} ${
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
            <div className="combatant-name ribbon">{combat.enemy.name}</div>
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

      {/* P1-3: 양호실 야간 당직 마르타 짧은 대사 & 처방 버프/디버프 */}
      {activeInfirmary && infirmary && (
        infirmary.dismissed ? (
          <button
            type="button"
            className="infirmary-mini-bar parchment"
            onClick={onToggleInfirmaryDismiss}
            title="탭하여 마르타의 양호실 메모 다시 보기"
          >
            <span className="infirmary-effect-name">
              <FlaskConical size={13} />
              {activeInfirmary.name} · {activeInfirmary.badgeText}
            </span>
            <span className="infirmary-effect-left">남은 {infirmary.battlesLeft}전투</span>
          </button>
        ) : (
          <div className="infirmary-card parchment">
            <div className="infirmary-head">
              <div className="infirmary-avatar">
                <NpcPortrait id="martha" variant="avatar" alt="사서장 마르타" />
              </div>
              <div className="infirmary-body">
                <div className="infirmary-meta">
                  <span className="infirmary-speaker">사서장 마르타</span>
                  <span className="infirmary-chart">양호실 차트 #{infirmary.visits}</span>
                  <button
                    type="button"
                    className="infirmary-close"
                    onClick={onToggleInfirmaryDismiss}
                    aria-label="양호실 대사 접기"
                    title="대사 접기 (효과는 유지)"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="infirmary-quote">“{infirmary.quote}”</div>
              </div>
            </div>
            <div className={`infirmary-effect-row ${activeInfirmary.tone}`}>
              <span className="infirmary-effect-name">
                <FlaskConical size={13} />
                {activeInfirmary.name} ({activeInfirmary.badgeText})
              </span>
              <span className="infirmary-effect-left">남은 {infirmary.battlesLeft}전투</span>
            </div>
          </div>
        )
      )}

      {/* P1-4: 전투 중 블랙코미디 교내 이벤트 양피지 카드 */}
      {activeEvent && (
        <div className="event-card parchment">
          <div className="infirmary-head">
            <div className="infirmary-avatar">
              <NpcPortrait
                id={activeEvent.professorId}
                variant="avatar"
                alt={activeEvent.speaker}
              />
            </div>
            <div className="infirmary-body">
              <div className="infirmary-meta">
                <span className="event-badge">교내 소식</span>
                <span className="event-title">{activeEvent.title}</span>
                <button
                  type="button"
                  className="infirmary-close"
                  onClick={onDismissEvent}
                  aria-label="이벤트 닫기"
                  title="무시하고 닫기"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="event-speaker-sub">{activeEvent.speaker}</div>
              <div className="infirmary-quote">
                “{activeEvent.prompt.replaceAll('{name}', state.playerName || '견습생')}”
              </div>
            </div>
          </div>
          <div className="event-choices">
            {activeEvent.choices.map((ch) => (
              <button
                key={ch.id}
                type="button"
                className="event-choice-btn"
                onClick={() => onResolveEvent(ch.id)}
              >
                <span>{ch.label}</span>
                <span className="event-choice-hint">{ch.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

          {!isSpecialMode &&
            state.selectedStage < 4 &&
            (state.selectedAct < state.highestAct || state.highestStageInAct >= 3) && (
              <button
                type="button"
                className="btn btn-sm btn-crimson boss-cta-pulse"
                onClick={onChallengeActBoss}
              >
                <Skull size={13} />
                제 {state.selectedAct}막 보스 도전
              </button>
            )}
        </div>
        {!isSpecialMode && state.settings.autoAdvance && (
          <div className="auto-boss-hint">
            {combat.stageIndex === 4
              ? '⚔ 막 보스전 진행 중 — 패배하면 4번째 사냥터에서 재정비합니다.'
              : bossRetryIn > 0
                ? `재정비 중… ${bossRetryIn}마리 더 처치하면 보스에 자동 재도전`
                : '자동 전진 ON: 4번째 사냥터를 돌파하면 막 보스에 자동 도전합니다.'}
          </div>
        )}
        <div className="list-actions" style={{ marginTop: 6 }}>
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
