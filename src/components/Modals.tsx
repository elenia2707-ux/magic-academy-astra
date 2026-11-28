import { effectiveStoneReward } from '../data/economy';
import React, { useEffect, useState } from 'react';
import { ACTS } from '../data/acts';
import { getEquippedTitleDef } from '../data/archive';
import { hasAwakenedHeroArt } from '../data/art';
import {
  DARK_MAGIC_UNLOCK_LINES,
  getProfessorGreeting,
  getSchoolProfessorId,
  PROFESSORS,
  RANK_EXAM_DIALOGUES,
  resolveDialogueText,
} from '../data/professors';
import { getCharacterQuote, getCharacterTitle, RANKS, SCHOOLS } from '../data/schools';
import { formatDuration } from '../engine/offline';
import type {
  ComputedStats,
  DialogueLine,
  GameState,
  MonsterDef,
  OfflineSummary,
  ProfessorId,
  StoryPhase,
} from '../types/game';
import { AstraCrestSvg, MonsterPortrait, NpcPortrait, PlayerPortrait } from './GothicArt';

export type StoryModalPayload =
  | { kind: 'act'; act: number; phase: StoryPhase; archiveMode?: boolean }
  | { kind: 'darkUnlock' }
  | { kind: 'rankExam'; rank: number; stage: 'start' | 'clear' };

export const OfflineModal: React.FC<{
  summary: OfflineSummary;
  onClose: () => void;
}> = ({ summary, onClose }) => (
  <div className="modal-backdrop">
    <div className="modal-card">
      <h3 className="modal-title">오프라인 방치 정산</h3>
      <div style={{ fontSize: 12, color: '#9a9386', marginBottom: 10 }}>
        부재중 <strong>{formatDuration(summary.elapsedSec)}</strong> 동안 아스트라에서 자동
        전투와 수련이 진행되었습니다.
      </div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-box">
          <span>토벌 수</span>
          <strong>{summary.kills.toLocaleString()}체</strong>
        </div>
        <div className="stat-box">
          <span>획득 경험치</span>
          <strong>+{summary.expGained.toLocaleString()}</strong>
        </div>
        <div className="stat-box">
          <span>획득 마석</span>
          <strong style={{ color: '#e3c481' }}>+{summary.stonesGained.toLocaleString()}</strong>
        </div>
        <div className="stat-box">
          <span>획득 마도구</span>
          <strong>{summary.itemsFound}개</strong>
        </div>
      </div>
      {summary.lanternsRecovered > 0 && (
        <div style={{ fontSize: 12, color: '#c5bdb0', marginBottom: 6 }}>
          심연 탐험 등불 +{summary.lanternsRecovered} 회복
        </div>
      )}
      {summary.trainedSkills.length > 0 && (
        <div className="list-card" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: '#e3c481', fontWeight: 700, marginBottom: 4 }}>
            교실 수련 성과
          </div>
          <div style={{ fontSize: 12, color: '#ede7da' }}>{summary.trainedSkills.join(', ')}</div>
        </div>
      )}
      <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
        보상 수령하고 복귀하기
      </button>
    </div>
  </div>
);

const PHASE_LABELS: { id: StoryPhase; label: string }[] = [
  { id: 'intro', label: '도입' },
  { id: 'mid', label: '중반' },
  { id: 'boss', label: '보스' },
  { id: 'clear', label: '후일담' },
];

function isActPhaseUnlocked(state: GameState, actNumber: number, phase: StoryPhase): boolean {
  if (phase === 'intro') return actNumber <= state.highestAct;
  if (state.clearedActs.includes(actNumber)) return true;
  if (actNumber < state.highestAct) return true;
  if (actNumber > state.highestAct) return false;
  const viewed = state.viewedStoryKeys ?? [];
  if (phase === 'mid') {
    return state.highestStageInAct >= 2 || viewed.includes(`${actNumber}_mid`);
  }
  if (phase === 'boss') {
    return state.highestStageInAct >= 4 || viewed.includes(`${actNumber}_boss`);
  }
  return false;
}

const DialogueRow: React.FC<{ line: DialogueLine; state: GameState }> = ({ line, state }) => {
  const isSchoolVariant = Boolean(line.schoolVariants?.[state.school]);
  const schoolProfId = getSchoolProfessorId(state.school);
  const schoolProf = PROFESSORS[schoolProfId];

  const resolvedSpeaker = isSchoolVariant
    ? `${schoolProf.role} ${schoolProf.name}`
    : line.speaker.replaceAll('{name}', state.playerName || '견습생');

  const rawText = resolveDialogueText(line, state);
  // Strip optional leading "[학파 교수] " prefix if present since speaker badge already shows it
  const cleanText = isSchoolVariant ? rawText.replace(/^\[[^\]]+\]\s*/, '') : rawText;
  const isNgPlusBranch = state.prestige.rebirthCount >= 1 && Boolean(line.ngPlusText);

  const renderAvatar = () => {
    if (isSchoolVariant) {
      return <NpcPortrait id={schoolProfId} variant="avatar" alt={schoolProf.name} />;
    }
    const key = line.portrait;
    if (!key || key.kind === 'system') {
      return <AstraCrestSvg size={32} />;
    }
    if (key.kind === 'professor') {
      return <NpcPortrait id={key.id} variant="avatar" alt={PROFESSORS[key.id].name} />;
    }
    if (key.kind === 'boss') {
      return <MonsterPortrait artKey={key.artKey} isBoss variant="thumb" alt={resolvedSpeaker} />;
    }
    return (
      <PlayerPortrait
        school={state.school}
        gender={state.gender}
        awakened={state.rank >= 3}
        variant="avatar"
      />
    );
  };

  const isBossSpeaker = !isSchoolVariant && line.portrait?.kind === 'boss';

  return (
    <div className={`dialogue-box dialogue-vn ${isBossSpeaker ? 'boss-line' : ''}`}>
      <div className={`dialogue-avatar ${isBossSpeaker ? 'boss' : ''}`}>{renderAvatar()}</div>
      <div className="dialogue-body">
        <div className="dialogue-speaker-row">
          <span className="dialogue-speaker">{resolvedSpeaker}</span>
          {line.role && <span className="dialogue-role">{line.role}</span>}
          {isNgPlusBranch && <span className="dialogue-ng-tag">시간 회귀</span>}
        </div>
        <div className="dialogue-text">“{cleanText}”</div>
      </div>
    </div>
  );
};

export const StoryModal: React.FC<{
  state: GameState;
  story: StoryModalPayload;
  onClose: () => void;
}> = ({ state, story, onClose }) => {
  const initialPhase: StoryPhase = story.kind === 'act' ? story.phase : 'intro';
  const [activePhase, setActivePhase] = useState<StoryPhase>(initialPhase);

  useEffect(() => {
    if (story.kind === 'act') {
      setActivePhase(story.phase);
    }
  }, [story]);

  let subtitle = '';
  let title = '';
  let lines: DialogueLine[] = [];
  let buttonText = '계속 진행하기';

  if (story.kind === 'act') {
    const actDef = ACTS[Math.max(0, Math.min(ACTS.length - 1, story.act - 1))];
    subtitle = `${actDef.location} · ${actDef.subtitle}`;
    const phaseSuffix: Record<StoryPhase, string> = {
      intro: '',
      mid: ' · 중반 사건',
      boss: ' · 보스 조우',
      clear: ' · 완결',
    };
    title = `${actDef.title}${phaseSuffix[activePhase]}`;
    lines =
      activePhase === 'intro'
        ? actDef.introLines
        : activePhase === 'mid'
          ? actDef.midLines
          : activePhase === 'boss'
            ? actDef.bossLines
            : actDef.clearLines;
    buttonText =
      story.archiveMode
        ? '기록 닫기'
        : activePhase === 'intro'
          ? '임무 출격하기'
          : activePhase === 'boss'
            ? '보스전 돌입!'
            : '계속 진행하기';
  } else if (story.kind === 'darkUnlock') {
    subtitle = '금서 도서관 · 금기의 개방';
    title = '흑마법 최초 해독';
    lines = DARK_MAGIC_UNLOCK_LINES;
    buttonText = '금단의 힘을 받아들이기';
  } else {
    const rankInfo = RANKS[Math.min(5, Math.max(1, story.rank))];
    const examDial = RANK_EXAM_DIALOGUES[story.rank] ?? RANK_EXAM_DIALOGUES[1];
    subtitle = `천문 교장실 · ${rankInfo.name} (${rankInfo.english})`;
    title = story.stage === 'start' ? `${rankInfo.name} 승급 시험 개시` : `${rankInfo.name} 승급 인가!`;
    lines = story.stage === 'start' ? examDial.start : examDial.clear;
    buttonText = story.stage === 'start' ? '승급 시험 돌입!' : '새로운 계급 수락하기';
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card story-vn-modal">
        <div style={{ fontSize: 11, color: '#9a9386', marginBottom: 2 }}>{subtitle}</div>
        <h3 className="modal-title">{title}</h3>

        {story.kind === 'act' && (
          <div className="story-phase-tabs">
            {PHASE_LABELS.map((item) => {
              const unlocked = isActPhaseUnlocked(state, story.act, item.id);
              const active = activePhase === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!unlocked}
                  className={`story-phase-btn ${active ? 'active' : ''}`}
                  onClick={() => setActivePhase(item.id)}
                >
                  {unlocked ? item.label : `${item.label} 🔒`}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ margin: '10px 0 12px' }}>
          {lines.map((line, idx) => (
            <DialogueRow key={`${activePhase}_${idx}`} line={line} state={state} />
          ))}
        </div>

        <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export const ProfessorShowcaseModal: React.FC<{
  professorId: ProfessorId;
  state: GameState;
  onClose: () => void;
}> = ({ professorId, state, onClose }) => {
  const prof = PROFESSORS[professorId];
  const greeting = getProfessorGreeting(professorId, state);
  const isMySchool = prof.category === state.school;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card hero-showcase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wc-full-frame">
          <NpcPortrait id={professorId} variant="full" alt={prof.name} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: prof.accent, fontWeight: 700 }}>
            {prof.classroom} · {prof.role}
            {isMySchool ? ' ★ 내 담당 교수' : ''}
          </div>
          <h3 className="modal-title" style={{ margin: '3px 0 4px', textAlign: 'center' }}>
            {prof.name}
          </h3>
          <div style={{ fontSize: 11, color: '#9a9386', marginBottom: 8 }}>{prof.personality}</div>
        </div>
        <div className="dialogue-box" style={{ marginBottom: 8 }}>
          <div className="dialogue-text">“{greeting}”</div>
        </div>
        <div className="list-card" style={{ marginBottom: 8, fontSize: 11.5, lineHeight: 1.5 }}>
          <div style={{ color: '#ede7da', marginBottom: 5 }}>{prof.bio}</div>
          <div style={{ color: '#c8a45d', fontSize: 11 }}>
            관찰 포인트 · <span style={{ color: '#c5bdb0' }}>{prof.foreshadowProp}</span>
          </div>
        </div>
        <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export const HeroPortraitModal: React.FC<{
  state: GameState;
  stats: ComputedStats;
  onClose: () => void;
}> = ({ state, stats, onClose }) => {
  const school = SCHOOLS[state.school];
  const hasAw = hasAwakenedHeroArt(state.school, state.gender);
  const isAwakenedUnlocked = state.rank >= 3 && hasAw;
  const [showAwakened, setShowAwakened] = useState(isAwakenedUnlocked);
  const equippedTitle = getEquippedTitleDef(state);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card hero-showcase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wc-full-frame">
          <PlayerPortrait
            school={state.school}
            gender={state.gender}
            variant="full"
            awakened={isAwakenedUnlocked && showAwakened}
          />
          {isAwakenedUnlocked && showAwakened && (
            <div className="awakened-badge">★ 4계급 비술사 각성</div>
          )}
        </div>
        {isAwakenedUnlocked && (
          <div className="awakened-toggle-row">
            <button
              type="button"
              className={`awakened-toggle-btn ${showAwakened ? 'active' : ''}`}
              onClick={() => setShowAwakened(true)}
            >
              각성 외형
            </button>
            <button
              type="button"
              className={`awakened-toggle-btn ${!showAwakened ? 'active' : ''}`}
              onClick={() => setShowAwakened(false)}
            >
              견습 시절
            </button>
          </div>
        )}
        {!isAwakenedUnlocked && hasAw && (
          <div className="awakened-teaser">
            ★ 4계급 [비술사] 승급 시 20대 성숙판 각성 외형이 자동 해금됩니다!
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: school.color, fontWeight: 700 }}>
            {school.name} · {RANKS[state.rank].name} ({RANKS[state.rank].english})
          </div>
          <h3 className="modal-title" style={{ margin: '3px 0 4px', textAlign: 'center' }}>
            {state.playerName} — {getCharacterTitle(state.school, state.gender)}
          </h3>
          {equippedTitle && (
            <div className="hero-title-badge">「{equippedTitle.titleName}」</div>
          )}
          <div style={{ fontSize: 11.5, color: '#c5bdb0', marginBottom: 10 }}>
            “{getCharacterQuote(state.school, state.gender)}”
          </div>
        </div>
        <div className="stat-grid" style={{ marginBottom: 10 }}>
          <div className="stat-box">
            <span>마력</span>
            <strong>{stats.magic.toLocaleString()}</strong>
          </div>
          <div className="stat-box">
            <span>체력</span>
            <strong>{stats.maxHp.toLocaleString()}</strong>
          </div>
          <div className="stat-box">
            <span>방어</span>
            <strong>{stats.def.toLocaleString()}</strong>
          </div>
          <div className="stat-box">
            <span>치명</span>
            <strong>{stats.critRate}%</strong>
          </div>
        </div>
        <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export const MonsterShowcaseModal: React.FC<{
  monster: MonsterDef;
  actLabel?: string;
  rebirthCount?: number;
  researchNote?: string;
  killCount?: number;
  onClose: () => void;
}> = ({ monster, actLabel, rebirthCount = 0, researchNote, killCount, onClose }) => {
  const quote =
    rebirthCount >= 1 && monster.ngPlusQuote ? monster.ngPlusQuote : monster.encounterQuote;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card hero-showcase-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wc-square-full-frame wc-boss-full-frame">
          <MonsterPortrait
            artKey={monster.artKey}
            isBoss={monster.isBoss}
            variant="full"
            alt={monster.name}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: monster.isBoss ? '#e07b7f' : '#9a9386', fontWeight: 700 }}>
            {actLabel ? `${actLabel} · ` : ''}
            {monster.title}
          </div>
          <h3 className="modal-title" style={{ margin: '3px 0 6px', textAlign: 'center' }}>
            {monster.name}
          </h3>
        </div>
        {quote && (
          <div className="dialogue-box" style={{ marginBottom: 9, borderLeftColor: '#cf4c50' }}>
            <div className="dialogue-text" style={{ fontSize: 11.5 }}>
              “{quote}”
            </div>
          </div>
        )}
        <div className="stat-grid" style={{ marginBottom: 9 }}>
          <div className="stat-box">
            <span>체력</span>
            <strong>{monster.hp.toLocaleString()}</strong>
          </div>
          <div className="stat-box">
            <span>공격 / 방어</span>
            <strong>
              {monster.atk.toLocaleString()} / {monster.def.toLocaleString()}
            </strong>
          </div>
          <div className="stat-box">
            <span>보상 EXP</span>
            <strong>{monster.expReward.toLocaleString()}</strong>
          </div>
          <div className="stat-box">
            <span>보상 마석</span>
            <strong style={{ color: '#e3c481' }}>{effectiveStoneReward(monster.stoneReward).toLocaleString()}</strong>
          </div>
        </div>
        {monster.heavyName && (
          <div className="list-card" style={{ marginBottom: 10, fontSize: 11.5 }}>
            <span style={{ color: '#e07b7f', fontWeight: 700 }}>보스 필살기</span> ·{' '}
            <strong>{monster.heavyName}</strong> ({monster.heavyInterval ?? 3}턴 주기)
          </div>
        )}
        {researchNote && (
          <div className="familiar-lore-box parchment">
            <div className="familiar-lore-title archive-lore-head">
              <span>아스트라 박물 연구 메모</span>
              {typeof killCount === 'number' && killCount > 0 && (
                <span className="archive-lore-kills">처치 {killCount.toLocaleString()}회</span>
              )}
            </div>
            <div className="familiar-lore-note">{researchNote}</div>
          </div>
        )}
        <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};
