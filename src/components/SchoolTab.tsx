import React, { useState } from 'react';
import { BookMarked, Flame, GraduationCap, Lock, Sparkles, Swords } from 'lucide-react';
import { ACTS } from '../data/acts';
import { CATEGORY_META, RANK_EXAM_BOSSES, RANKS, SCHOOLS } from '../data/schools';
import { getSkillsForPlayer, SKILL_MAP } from '../data/skills';
import { getSkillUpgradeCost } from '../engine/stats';
import type { ComputedStats, GameState, MonsterDef, SkillDef } from '../types/game';
import { CategoryDot, MonsterPortrait } from './GothicArt';
import { MonsterShowcaseModal } from './Modals';

interface Props {
  state: GameState;
  stats: ComputedStats;
  onAssignTraining: (slotIdx: number, skillId: string | null) => void;
  onUnlockDarkSkill: (skillId: string) => void;
  onUpgradeSkillWithStones: (skillId: string) => void;
  onChallengeRankExam: () => void;
  onOpenStory: (act: number) => void;
  onSelectAct: (act: number) => void;
}

export const SchoolTab: React.FC<Props> = ({
  state,
  stats,
  onAssignTraining,
  onUnlockDarkSkill,
  onUpgradeSkillWithStones,
  onChallengeRankExam,
  onOpenStory,
  onSelectAct,
}) => {
  const [sub, setSub] = useState<'class' | 'forbidden' | 'headmaster'>('class');
  const [inspectBoss, setInspectBoss] = useState<{ monster: MonsterDef; actLabel: string } | null>(
    null
  );

  const allSkills = getSkillsForPlayer(state.school);
  const normalSkills = allSkills.filter((s) => s.category !== 'dark');
  const darkSkills = allSkills.filter((s) => s.category === 'dark');

  const nextRank = state.rank < 5 ? RANKS[state.rank + 1] : null;
  const canTakeExam =
    nextRank !== null &&
    state.level >= nextRank.reqLevel &&
    (nextRank.reqClearedAct === 0 || state.clearedActs.includes(nextRank.reqClearedAct));

  const renderSkillCard = (skill: SkillDef) => {
    const learned = state.skills[skill.id];
    const unlocked = Boolean(learned?.unlocked);
    const rankLocked = state.rank < skill.requiredRank;
    const trainingIdx = state.trainingSlots.indexOf(skill.id);
    const isTraining = trainingIdx >= 0;
    const isDark = skill.category === 'dark';
    const needsTomeDecode = isDark && !learned;

    const reqSec = unlocked
      ? skill.trainCostSec * (0.9 + (learned?.level ?? 1) * 0.45)
      : skill.trainCostSec;
    const pct = learned ? Math.min(100, Math.round((learned.exp / Math.max(1, reqSec)) * 100)) : 0;
    const isMax = unlocked && (learned?.level ?? 1) >= stats.maxSkillLevel;
    const stoneCost = unlocked ? getSkillUpgradeCost(learned.level) : 0;

    const handleStartTrain = () => {
      if (isTraining) {
        onAssignTraining(trainingIdx, null);
        return;
      }
      const emptyIdx = state.trainingSlots.findIndex((s) => s === null);
      const targetIdx = emptyIdx >= 0 ? emptyIdx : 0;
      onAssignTraining(targetIdx, skill.id);
    };

    return (
      <div key={skill.id} className={`list-card ${isTraining ? 'highlight' : ''}`}>
        <div className="list-top">
          <div className="list-title">
            <CategoryDot category={skill.category} />
            <span>{skill.name}</span>
            {unlocked ? (
              <span className="tag" style={{ color: '#e3c481' }}>
                Lv.{learned.level}/{stats.maxSkillLevel}
              </span>
            ) : (
              <span className="tag">미습득</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: '#8b8479' }}>
            MP {skill.mpCost} · 쿨 {skill.cooldown}턴
          </span>
        </div>

        <div className="list-desc">{skill.description}</div>

        {!rankLocked && !needsTomeDecode && !isMax && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}

        <div className="list-actions">
          <span style={{ fontSize: 11, color: '#9a9386' }}>
            {CATEGORY_META[skill.category].classroom} · 요구: {RANKS[skill.requiredRank].name}
          </span>

          {rankLocked ? (
            <span className="tag">
              <Lock size={11} /> {RANKS[skill.requiredRank].name} 해금
            </span>
          ) : needsTomeDecode ? (
            <button
              type="button"
              className="btn btn-sm btn-crimson"
              disabled={state.tomeShards < (skill.tomeCost ?? 3)}
              onClick={() => onUnlockDarkSkill(skill.id)}
            >
              금서 해독 (조각 {skill.tomeCost})
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 5 }}>
              {!isMax && (
                <button
                  type="button"
                  className={`btn btn-sm ${isTraining ? 'btn-gold' : ''}`}
                  onClick={handleStartTrain}
                >
                  {isTraining ? `수련중 (${pct}%)` : unlocked ? '숙련 수련' : '수업 등록'}
                </button>
              )}
              {unlocked && !isMax && (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={state.stones < stoneCost}
                  onClick={() => onUpgradeSkillWithStones(skill.id)}
                >
                  즉시 강화 ({stoneCost.toLocaleString()})
                </button>
              )}
              {isMax && <span className="tag">마스터</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="subtabs">
        <button
          type="button"
          className={`subtab-btn ${sub === 'class' ? 'active' : ''}`}
          onClick={() => setSub('class')}
        >
          마법 교실
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'forbidden' ? 'active' : ''}`}
          onClick={() => setSub('forbidden')}
        >
          금서 도서관
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'headmaster' ? 'active' : ''}`}
          onClick={() => setSub('headmaster')}
        >
          교장실·승급
        </button>
      </div>

      {/* 자동 수련 슬롯 요약 (교실/도서관 공통) */}
      {sub !== 'headmaster' && (
        <div className="panel">
          <div className="panel-title-row">
            <h2 className="panel-title">자동 수련 슬롯</h2>
            <span className="panel-sub">
              속도 {Math.round(stats.trainSpeedMult * 100)}% · 오프라인 적용
            </span>
          </div>
          <div className="item-list">
            {Array.from({ length: stats.maxTrainSlots }).map((_, idx) => {
              const sid = state.trainingSlots[idx];
              const def = sid ? SKILL_MAP[sid] : null;
              const learned = sid ? state.skills[sid] : undefined;
              const req = def
                ? learned?.unlocked
                  ? def.trainCostSec * (0.9 + learned.level * 0.45)
                  : def.trainCostSec
                : 1;
              const pct = learned ? Math.min(100, Math.round((learned.exp / req) * 100)) : 0;
              return (
                <div key={idx} className="list-card" style={{ padding: '8px 10px' }}>
                  <div className="list-top" style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      슬롯 {idx + 1}: {def ? def.name : '비어 있음 (아래에서 선택)'}
                    </span>
                    {def && (
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => onAssignTraining(idx, null)}
                      >
                        중단
                      </button>
                    )}
                  </div>
                  {def && (
                    <div className="progress-bar" style={{ margin: '4px 0 0' }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sub === 'class' && (
        <div className="panel">
          <div className="panel-title-row">
            <h2 className="panel-title">
              <Flame size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              {SCHOOLS[state.school].name} &amp; 공용 교실
            </h2>
            <span className="panel-sub">총 {normalSkills.length}종</span>
          </div>
          <div className="item-list">{normalSkills.map(renderSkillCard)}</div>
        </div>
      )}

      {sub === 'forbidden' && (
        <div className="panel">
          <div className="panel-title-row">
            <h2 className="panel-title">
              <BookMarked size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              금서 도서관 · 흑마법
            </h2>
            <span className="panel-sub" style={{ color: '#d68592' }}>
              보유 금서 조각: {state.tomeShards}
            </span>
          </div>
          {state.rank < 2 ? (
            <div className="list-card">
              <div style={{ fontSize: 12.5, color: '#c5bdb0', lineHeight: 1.6 }}>
                <Lock size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                금서 도서관의 철문은 <strong>3계급 [정규 마법사]</strong> 이상에게만 열립니다.
                <br />
                보스전과 심연 탐험에서 미리 <strong>금서 조각</strong>을 모아두세요.
              </div>
            </div>
          ) : (
            <div className="item-list">{darkSkills.map(renderSkillCard)}</div>
          )}
        </div>
      )}

      {sub === 'headmaster' && (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">
                <GraduationCap size={15} style={{ verticalAlign: -2, marginRight: 5 }} />
                계급 승급 시험
              </h2>
              <span className="panel-sub">현재: {RANKS[state.rank].name}</span>
            </div>

            {nextRank ? (
              <div className="list-card highlight">
                <div className="list-top">
                  <span className="list-title" style={{ color: '#e3c481' }}>
                    다음 계급: {nextRank.name} ({nextRank.english})
                  </span>
                  <span className="tag">스탯 ×{nextRank.statMult}</span>
                </div>
                <div className="list-desc">
                  해금 혜택: <strong>{nextRank.unlockNote}</strong>
                </div>
                <div style={{ fontSize: 11.5, color: '#9a9386', marginBottom: 9 }}>
                  요구 조건: 레벨 {nextRank.reqLevel} 이상 (현재 {state.level}) · 제{' '}
                  {nextRank.reqClearedAct}막 클리어 (
                  {state.clearedActs.includes(nextRank.reqClearedAct) ? '달성' : '미달성'})
                  <br />
                  시험관: {RANK_EXAM_BOSSES[nextRank.rank]?.name}
                </div>
                <button
                  type="button"
                  className="btn btn-gold btn-block"
                  disabled={!canTakeExam}
                  onClick={onChallengeRankExam}
                >
                  <Swords size={14} />
                  {canTakeExam ? `${nextRank.name} 승급 시험 도전!` : '승급 조건 미충족'}
                </button>
              </div>
            ) : (
              <div className="list-card highlight">
                <div style={{ color: '#e3c481', fontWeight: 700, marginBottom: 4 }}>
                  <Sparkles size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                  최고 계급 [대마도사] 달성!
                </div>
                <div style={{ fontSize: 12, color: '#c5bdb0' }}>
                  아스트라의 모든 정규 계급을 정복했습니다. 이제 제 6막 마왕 토벌과 심연의
                  끝을 향해 나아가세요.
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">메인 에피소드 &amp; 챕터 보스 (1~6막)</h2>
              <span className="panel-sub">{state.clearedActs.length} / 6 클리어</span>
            </div>
            <div className="item-list">
              {ACTS.map((act) => {
                const locked = act.act > state.highestAct;
                const cleared = state.clearedActs.includes(act.act);
                const boss = act.stages[4];
                return (
                  <div key={act.act} className="list-card">
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 7 }}>
                      <button
                        type="button"
                        className="wc-boss-thumb"
                        onClick={() =>
                          setInspectBoss({ monster: boss, actLabel: `제 ${act.act}막 보스` })
                        }
                        title={`${boss.name} 보스 원화 크게 보기`}
                        aria-label={`${boss.name} 보스 원화 크게 보기`}
                      >
                        <MonsterPortrait
                          artKey={boss.artKey}
                          isBoss
                          variant="thumb"
                          alt={boss.name}
                        />
                      </button>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="list-top" style={{ marginBottom: 2 }}>
                          <span className="list-title">{act.title}</span>
                          <span
                            className="tag"
                            style={{ color: cleared ? '#8ad0a2' : locked ? '#8b8479' : '#e3c481' }}
                          >
                            {cleared ? '클리어' : locked ? '잠김' : '진행중'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#c5bdb0', marginBottom: 2 }}>
                          {act.location} — {act.subtitle}
                        </div>
                        <div style={{ fontSize: 11, color: '#e07b7f' }}>
                          보스: {boss.name}
                        </div>
                      </div>
                    </div>
                    <div className="list-actions">
                      <span style={{ fontSize: 11, color: '#8b8479' }}>
                        권장: {RANKS[act.requiredRank].name}
                      </span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() =>
                            setInspectBoss({ monster: boss, actLabel: `제 ${act.act}막 보스` })
                          }
                        >
                          보스 원화
                        </button>
                        {!locked && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => onOpenStory(act.act)}
                            >
                              스토리
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-gold"
                              onClick={() => onSelectAct(act.act)}
                            >
                              출격
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {inspectBoss && (
        <MonsterShowcaseModal
          monster={inspectBoss.monster}
          actLabel={inspectBoss.actLabel}
          onClose={() => setInspectBoss(null)}
        />
      )}
    </div>
  );
};
