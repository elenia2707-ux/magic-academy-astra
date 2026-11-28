import React, { useMemo, useState } from 'react';
import { Award, BookOpen, Check, Crown, HelpCircle, Lock, ScrollText, Sparkles } from 'lucide-react';
import {
  ACHIEVEMENTS,
  BESTIARY_ENTRIES,
  ensureArchive,
  formatArchiveReward,
  getArchiveBonuses,
  getClaimableAchievementCount,
  getClaimableBestiaryCount,
  getDiscoveredBestiaryCount,
  getEffectiveBestiaryKills,
  getEquippedTitleDef,
  isAchievementClaimable,
  isBestiaryClaimable,
} from '../data/archive';
import type { BestiaryGroup } from '../data/archive';
import {
  CODEX_CATEGORIES,
  CODEX_ENTRIES,
  getClaimableCodexCount,
  getClaimedCodexCount,
  getUnlockedCodexCount,
  isCodexClaimable,
  isCodexClaimed,
  isCodexUnlocked,
} from '../data/codex';
import type { CodexCategory, CodexEntry } from '../data/codex';
import type { GameState, MonsterDef } from '../types/game';
import { MonsterPortrait } from './GothicArt';

interface Props {
  state: GameState;
  onClaimBestiary: (artKey: string) => void;
  onClaimAllBestiary: () => void;
  onClaimAchievement: (id: string) => void;
  onEquipTitle: (id: string | null) => void;
  onClaimCodex?: (codexId: string) => void;
  onInspectMonster: (payload: {
    monster: MonsterDef;
    actLabel: string;
    researchNote: string;
    killCount: number;
  }) => void;
}

type ArchiveMode = 'bestiary' | 'achievements' | 'codex';
type BestiaryFilter = 'all' | BestiaryGroup;
type CodexFilter = 'all' | CodexCategory;

const BESTIARY_FILTERS: { id: BestiaryFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'act1', label: '1막' },
  { id: 'act2', label: '2막' },
  { id: 'act3', label: '3막' },
  { id: 'act4', label: '4막' },
  { id: 'act5', label: '5막' },
  { id: 'act6', label: '6막' },
  { id: 'exam', label: '시험' },
];

export const ArchivePanel: React.FC<Props> = ({
  state,
  onClaimBestiary,
  onClaimAllBestiary,
  onClaimAchievement,
  onEquipTitle,
  onClaimCodex,
  onInspectMonster,
}) => {
  const [mode, setMode] = useState<ArchiveMode>('bestiary');
  const [filter, setFilter] = useState<BestiaryFilter>('all');
  const [codexFilter, setCodexFilter] = useState<CodexFilter>('all');
  const [readingCodex, setReadingCodex] = useState<CodexEntry | null>(null);

  const archive = ensureArchive(state.archive);
  const discoveredCount = getDiscoveredBestiaryCount(state);
  const claimedAchCount = archive.claimedAchievements.length;
  const claimableBestiary = getClaimableBestiaryCount(state);
  const claimableAchievements = getClaimableAchievementCount(state);
  const unlockedCodex = getUnlockedCodexCount(state);
  const claimedCodex = getClaimedCodexCount(state);
  const claimableCodex = getClaimableCodexCount(state);
  const equippedTitle = getEquippedTitleDef(state);
  const bonuses = getArchiveBonuses(state);

  const activeBonusChips = useMemo(() => {
    const chips: string[] = [];
    if (bonuses.magicPct > 0) chips.push(`마력 +${bonuses.magicPct}%`);
    if (bonuses.hpPct > 0) chips.push(`체력 +${bonuses.hpPct}%`);
    if (bonuses.defPct > 0) chips.push(`방어 +${bonuses.defPct}%`);
    if (bonuses.critRate > 0) chips.push(`치명 +${bonuses.critRate}%`);
    if (bonuses.critDmg > 0) chips.push(`치피 +${bonuses.critDmg}%`);
    if (bonuses.mpRegen > 0) chips.push(`MP재생 +${bonuses.mpRegen}`);
    if (bonuses.rewardPct > 0) chips.push(`보상 +${bonuses.rewardPct}%`);
    return chips;
  }, [bonuses]);

  const filteredBestiary = useMemo(() => {
    if (filter === 'all') return BESTIARY_ENTRIES;
    return BESTIARY_ENTRIES.filter((entry) => entry.group === filter);
  }, [filter]);

  const filteredCodex = useMemo(() => {
    if (codexFilter === 'all') return CODEX_ENTRIES;
    return CODEX_ENTRIES.filter((entry) => entry.category === codexFilter);
  }, [codexFilter]);

  const codexCategoryLabels = useMemo(() => {
    const map = {} as Record<CodexCategory, string>;
    for (const cat of CODEX_CATEGORIES) {
      map[cat.id] = cat.label;
    }
    return map;
  }, []);

  const sortedAchievements = useMemo(() => {
    return ACHIEVEMENTS.map((def, idx) => {
      const claimed = archive.claimedAchievements.includes(def.id);
      const claimable = isAchievementClaimable(state, def);
      const tier = claimable ? 0 : claimed ? 2 : 1;
      return { def, idx, claimed, claimable, tier };
    }).sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.idx - b.idx));
  }, [archive.claimedAchievements, state]);

  return (
    <div className="panel archive-panel">
      {/* Header & Summary Card */}
      <div className="archive-summary-card">
        <div className="panel-title-row archive-header-row">
          <h2 className="panel-title">
            <BookOpen size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
            아스트라 기록실
          </h2>
          <span className="panel-sub">도감 · 업적 · 연대기 영구 누적 (회귀 유지)</span>
        </div>

        <div className="archive-stat-row">
          <div className="archive-stat-tile">
            <span className="archive-stat-label">도감 발견</span>
            <strong className="archive-stat-value">
              {discoveredCount}/{BESTIARY_ENTRIES.length}
            </strong>
          </div>
          <div className="archive-stat-tile">
            <span className="archive-stat-label">업적 달성</span>
            <strong className="archive-stat-value">
              {claimedAchCount}/{ACHIEVEMENTS.length}
            </strong>
          </div>
          <div className="archive-stat-tile">
            <span className="archive-stat-label">장착 칭호</span>
            <strong className="archive-stat-value archive-stat-title">
              {equippedTitle ? `「${equippedTitle.titleName}」` : '미장착'}
            </strong>
          </div>
        </div>

        <div className="archive-bonus-strip">
          {activeBonusChips.length > 0 ? (
            <>
              <span className="archive-bonus-head">
                <Sparkles size={11} /> 영구 보너스
              </span>
              <div className="archive-bonus-chips">
                {activeBonusChips.map((chip) => (
                  <span key={chip} className="archive-bonus-chip">
                    {chip}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <span className="archive-bonus-empty">
              몬스터를 기록하거나 업적·코덱스를 달성하면 영구 능력치가 누적됩니다.
            </span>
          )}
        </div>
      </div>

      {/* Inner 3-tab switch */}
      <div className="archive-mode-tabs">
        <button
          type="button"
          className={`archive-mode-btn ${mode === 'bestiary' ? 'active' : ''}`}
          onClick={() => setMode('bestiary')}
        >
          <BookOpen size={12} />
          <span>몬스터 도감</span>
          {claimableBestiary > 0 && <span className="subtab-badge">{claimableBestiary}</span>}
        </button>
        <button
          type="button"
          className={`archive-mode-btn ${mode === 'achievements' ? 'active' : ''}`}
          onClick={() => setMode('achievements')}
        >
          <Award size={12} />
          <span>업적 · 칭호</span>
          {claimableAchievements > 0 && (
            <span className="subtab-badge">{claimableAchievements}</span>
          )}
        </button>
        <button
          type="button"
          className={`archive-mode-btn ${mode === 'codex' ? 'active' : ''}`}
          onClick={() => setMode('codex')}
        >
          <ScrollText size={12} />
          <span>연대기·사전</span>
          {claimableCodex > 0 && <span className="subtab-badge">{claimableCodex}</span>}
        </button>
      </div>

      {/* Bestiary View */}
      {mode === 'bestiary' && (
        <div className="archive-bestiary-section">
          {claimableBestiary > 0 && (
            <button
              type="button"
              className="btn btn-gold btn-block archive-claim-all-btn"
              onClick={onClaimAllBestiary}
            >
              <Sparkles size={14} />
              미수령 도감 일괄 기록 (+{claimableBestiary})
            </button>
          )}

          <div className="archive-filter-row" role="tablist" aria-label="도감 구역 필터">
            {BESTIARY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`filter-pill archive-filter-pill ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bestiary-grid">
            {filteredBestiary.map((entry) => {
              const kills = getEffectiveBestiaryKills(state, entry);
              const discovered = kills > 0;
              const claimed = archive.claimedBestiary.includes(entry.artKey);
              const claimable = isBestiaryClaimable(state, entry);

              if (!discovered) {
                return (
                  <div
                    key={entry.artKey}
                    className={`bestiary-card is-locked ${entry.isBoss ? 'is-boss' : ''}`}
                  >
                    <div className="bestiary-top-static">
                      <div className="bestiary-thumb is-locked">
                        <HelpCircle size={22} className="bestiary-locked-icon" />
                      </div>
                      <div className="bestiary-meta">
                        <div className="bestiary-tag-row">
                          <span className="bestiary-tag">{entry.actLabel}</span>
                          {entry.isExam ? (
                            <span className="bestiary-tag tag-exam">시험관</span>
                          ) : entry.isBoss ? (
                            <span className="bestiary-tag tag-boss">보스</span>
                          ) : null}
                        </div>
                        <div className="bestiary-name">???</div>
                        <div className="bestiary-kills">조우 기록 없음</div>
                      </div>
                    </div>
                    <div className="bestiary-foot">
                      <span className="bestiary-locked-label">미발견</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={entry.artKey}
                  className={`bestiary-card ${entry.isBoss ? 'is-boss' : ''} ${
                    claimable ? 'is-claimable' : ''
                  } ${claimed ? 'is-claimed' : ''}`}
                >
                  <button
                    type="button"
                    className="bestiary-inspect-btn"
                    onClick={() =>
                      onInspectMonster({
                        monster: entry.monster,
                        actLabel: entry.actLabel,
                        researchNote: entry.researchNote,
                        killCount: kills,
                      })
                    }
                    title={`${entry.name} 상세 연구 메모 보기`}
                  >
                    <div className="bestiary-thumb">
                      <MonsterPortrait
                        artKey={entry.artKey}
                        isBoss={entry.isBoss}
                        variant="thumb"
                        alt={entry.name}
                      />
                    </div>
                    <div className="bestiary-meta">
                      <div className="bestiary-tag-row">
                        {entry.isExam ? (
                          <span className="bestiary-tag tag-exam">시험관</span>
                        ) : entry.isBoss ? (
                          <span className="bestiary-tag tag-boss">보스</span>
                        ) : (
                          <span className="bestiary-tag">{entry.actLabel}</span>
                        )}
                      </div>
                      <div className="bestiary-name">{entry.name}</div>
                      <div className="bestiary-kills">처치 {kills.toLocaleString()}회</div>
                      <div className="bestiary-passive">{entry.passiveLabel}</div>
                    </div>
                  </button>

                  <div className="bestiary-foot">
                    {claimable ? (
                      <>
                        <span className="bestiary-reward-hint">
                          {formatArchiveReward(entry.reward)}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-gold bestiary-claim-btn"
                          onClick={() => onClaimBestiary(entry.artKey)}
                        >
                          기록
                        </button>
                      </>
                    ) : (
                      <span className="bestiary-claimed-seal">
                        <Check size={11} strokeWidth={3} />
                        기록됨
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements & Titles View */}
      {mode === 'achievements' && (
        <div className="achievement-list">
          {sortedAchievements.map(({ def, claimed, claimable }) => {
            const cur = def.getProgress(state);
            const clamped = Math.min(cur, def.target);
            const pct = Math.min(100, Math.round((clamped / Math.max(1, def.target)) * 100));
            const isEquipped = claimed && archive.equippedTitle === def.id;
            const rewardText = formatArchiveReward(def.reward);

            if (claimable) {
              return (
                <div key={def.id} className="achievement-card parchment is-claimable">
                  <div className="ach-head">
                    <div className="ach-title-group">
                      <span className="ach-name">{def.name}</span>
                      <span className="ach-title-pill">
                        <Crown size={10} /> 칭호 「{def.titleName}」
                      </span>
                    </div>
                    <span className="ach-ready-tag">달성 가능</span>
                  </div>
                  <div className="ach-desc">{def.description}</div>
                  <div className="ach-meta-row">
                    <span className="ach-passive">{def.passiveLabel.startsWith('영구') ? def.passiveLabel : `영구 ${def.passiveLabel}`}</span>
                    {rewardText && <span className="ach-reward">보상: {rewardText}</span>}
                  </div>
                  <div className="ach-foot">
                    <span className="ach-count">
                      {clamped.toLocaleString()} / {def.target.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-gold"
                      onClick={() => onClaimAchievement(def.id)}
                    >
                      수령
                    </button>
                  </div>
                </div>
              );
            }

            if (claimed) {
              return (
                <div
                  key={def.id}
                  className={`achievement-card is-claimed ${isEquipped ? 'is-equipped' : ''}`}
                >
                  <div className="ach-head">
                    <div className="ach-title-group">
                      <span className="ach-name">{def.name}</span>
                      <span className="ach-title-pill">
                        <Crown size={10} /> 칭호 「{def.titleName}」
                      </span>
                    </div>
                    <span className="wax-seal">
                      <Check size={10} strokeWidth={3} />
                      달성
                    </span>
                  </div>
                  <div className="ach-desc">{def.description}</div>
                  <div className="ach-foot">
                    <span className="ach-passive">{def.passiveLabel.startsWith('영구') ? def.passiveLabel : `영구 ${def.passiveLabel}`}</span>
                    <button
                      type="button"
                      className={`btn btn-sm ${isEquipped ? 'btn-gold' : 'btn-ghost'} ach-equip-btn`}
                      onClick={() => onEquipTitle(isEquipped ? null : def.id)}
                    >
                      {isEquipped ? '장착 중' : '칭호 장착'}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={def.id} className="achievement-card is-progress">
                <div className="ach-head">
                  <div className="ach-title-group">
                    <span className="ach-name">{def.name}</span>
                    <span className="ach-title-pill">
                      <Crown size={10} /> 칭호 「{def.titleName}」
                    </span>
                  </div>
                  <span className="ach-count">
                    {clamped.toLocaleString()} / {def.target.toLocaleString()}
                  </span>
                </div>
                <div className="ach-desc">{def.description}</div>
                <div className="archive-progress-track">
                  <div className="archive-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="ach-meta-row">
                  <span className="ach-passive">{def.passiveLabel.startsWith('영구') ? def.passiveLabel : `영구 ${def.passiveLabel}`}</span>
                  {rewardText && <span className="ach-reward">보상: {rewardText}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* P5-1: Chronicle & Glossary Codex View */}
      {mode === 'codex' && (
        <div className="archive-codex-section">
          <div className="codex-head-bar">
            <span className="codex-head-title">
              <ScrollText size={12} />
              아스트라 세계관 코덱스
            </span>
            <span className="codex-head-counts">
              해금 {unlockedCodex}/{CODEX_ENTRIES.length} · 열람 {claimedCodex}/{CODEX_ENTRIES.length}
            </span>
          </div>

          <div className="codex-filter-row" role="tablist" aria-label="코덱스 분류 필터">
            <button
              type="button"
              className={`filter-pill archive-filter-pill ${codexFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCodexFilter('all')}
            >
              전체
            </button>
            {CODEX_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`filter-pill archive-filter-pill ${codexFilter === cat.id ? 'active' : ''}`}
                onClick={() => setCodexFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="codex-list">
            {filteredCodex.map((entry) => {
              const unlocked = isCodexUnlocked(state, entry);
              const claimed = isCodexClaimed(state, entry.id);
              const claimable = isCodexClaimable(state, entry);

              if (!unlocked) {
                const lockedTitle =
                  entry.category === 'secrets' ? '봉인된 극비 문서' : entry.title;
                return (
                  <div key={entry.id} className="codex-card is-locked">
                    <div className="codex-card-head">
                      <span className="codex-era-tag">{entry.eraTag}</span>
                      <span className="codex-lock-pill">
                        <Lock size={11} />
                        봉인
                      </span>
                    </div>
                    <div className="codex-card-title">{lockedTitle}</div>
                    <div className="codex-lock-hint">{entry.unlockHint}</div>
                  </div>
                );
              }

              if (claimable) {
                return (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    className="codex-card parchment is-claimable"
                    onClick={() => setReadingCodex(entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setReadingCodex(entry);
                      }
                    }}
                  >
                    <div className="codex-card-head">
                      <span className="codex-era-tag">{entry.eraTag}</span>
                      <span className="codex-unread-tag">✦ 미열람</span>
                    </div>
                    <div className="codex-card-title">{entry.title}</div>
                    {entry.subtitle && (
                      <div className="codex-card-subtitle">{entry.subtitle}</div>
                    )}
                    <div className="codex-card-summary">{entry.summary}</div>
                    <div className="codex-card-foot">
                      <span className="codex-reward-preview">
                        +◆{entry.rewardStones.toLocaleString()} · {entry.passiveLabel}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-gold codex-open-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadingCodex(entry);
                        }}
                      >
                        열람하기
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  className={`codex-card ${claimed ? 'is-claimed' : ''}`}
                  onClick={() => setReadingCodex(entry)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setReadingCodex(entry);
                    }
                  }}
                >
                  <div className="codex-card-head">
                    <span className="codex-era-tag">{entry.eraTag}</span>
                    <span className="codex-claimed-seal">
                      <Check size={10} strokeWidth={3} />
                      열람됨
                    </span>
                  </div>
                  <div className="codex-card-title">{entry.title}</div>
                  <div className="codex-card-summary">{entry.summary}</div>
                  <div className="codex-card-foot">
                    <span className="codex-passive-label">{entry.passiveLabel}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost codex-reread-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReadingCodex(entry);
                      }}
                    >
                      다시 읽기
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* P5-1: Codex Manuscript Reader Modal */}
      {readingCodex && (() => {
        const canClaim = isCodexClaimable(state, readingCodex) && Boolean(onClaimCodex);
        const alreadyClaimed = isCodexClaimed(state, readingCodex.id);
        const categoryLabel =
          codexCategoryLabels[readingCodex.category] ?? readingCodex.category;
        return (
          <div
            className="modal-backdrop codex-reader-backdrop"
            onClick={() => setReadingCodex(null)}
          >
            <div
              className="modal-card codex-reader-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="codex-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="codex-modal-header">
                <div className="codex-modal-meta-row">
                  <span className="codex-modal-cat-pill">{categoryLabel}</span>
                  <span className="codex-modal-era">{readingCodex.eraTag}</span>
                </div>
                <h3 id="codex-modal-title" className="modal-title codex-modal-title">
                  {readingCodex.title}
                </h3>
                {readingCodex.subtitle && (
                  <div className="codex-modal-subtitle">{readingCodex.subtitle}</div>
                )}
              </div>

              <div className="codex-manuscript-body parchment">
                {readingCodex.body.map((paragraph, idx) => (
                  <p key={idx} className="codex-manuscript-p">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="codex-curator-note">
                <span className="codex-curator-speaker">— {readingCodex.curatorName}:</span>{' '}
                <span className="codex-curator-text">“{readingCodex.curatorNote}”</span>
              </div>

              <div className="codex-modal-actions">
                {canClaim ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-gold btn-block codex-claim-btn"
                      onClick={() => onClaimCodex?.(readingCodex.id)}
                    >
                      ✦ 열람 기록 완료 (+◆{readingCodex.rewardStones.toLocaleString()} ·{' '}
                      {readingCodex.passiveLabel})
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-block codex-close-btn"
                      onClick={() => setReadingCodex(null)}
                    >
                      닫기
                    </button>
                  </>
                ) : (
                  <>
                    {alreadyClaimed && (
                      <div className="codex-claimed-pill">
                        <Check size={12} strokeWidth={3} />
                        <span>열람 기록 완료 · {readingCodex.passiveLabel}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-gold btn-block codex-close-btn"
                      onClick={() => setReadingCodex(null)}
                    >
                      닫기
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
