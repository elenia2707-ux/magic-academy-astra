import React, { useMemo, useState } from 'react';
import { Award, BookOpen, Check, Crown, HelpCircle, Sparkles } from 'lucide-react';
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
import type { GameState, MonsterDef } from '../types/game';
import { MonsterPortrait } from './GothicArt';

interface Props {
  state: GameState;
  onClaimBestiary: (artKey: string) => void;
  onClaimAllBestiary: () => void;
  onClaimAchievement: (id: string) => void;
  onEquipTitle: (id: string | null) => void;
  onInspectMonster: (payload: {
    monster: MonsterDef;
    actLabel: string;
    researchNote: string;
    killCount: number;
  }) => void;
}

type ArchiveMode = 'bestiary' | 'achievements';
type BestiaryFilter = 'all' | BestiaryGroup;

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
  onInspectMonster,
}) => {
  const [mode, setMode] = useState<ArchiveMode>('bestiary');
  const [filter, setFilter] = useState<BestiaryFilter>('all');

  const archive = ensureArchive(state.archive);
  const discoveredCount = getDiscoveredBestiaryCount(state);
  const claimedAchCount = archive.claimedAchievements.length;
  const claimableBestiary = getClaimableBestiaryCount(state);
  const claimableAchievements = getClaimableAchievementCount(state);
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
          <span className="panel-sub">도감 · 업적 영구 누적 (회귀 유지)</span>
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
              몬스터를 기록하거나 업적을 달성하면 영구 능력치가 누적됩니다.
            </span>
          )}
        </div>
      </div>

      {/* Inner 2-tab switch */}
      <div className="archive-mode-tabs">
        <button
          type="button"
          className={`archive-mode-btn ${mode === 'bestiary' ? 'active' : ''}`}
          onClick={() => setMode('bestiary')}
        >
          <BookOpen size={13} />
          <span>몬스터 도감</span>
          {claimableBestiary > 0 && <span className="subtab-badge">{claimableBestiary}</span>}
        </button>
        <button
          type="button"
          className={`archive-mode-btn ${mode === 'achievements' ? 'active' : ''}`}
          onClick={() => setMode('achievements')}
        >
          <Award size={13} />
          <span>업적 · 칭호</span>
          {claimableAchievements > 0 && (
            <span className="subtab-badge">{claimableAchievements}</span>
          )}
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
    </div>
  );
};
