import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Copy,
  Dices,
  Flame,
  Lock,
  Music,
  RotateCcw,
  Save,
  Settings,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ABYSS_BOARD_TILES } from '../data/abyssEvents';
import {
  calculateRebirthReward,
  getPrestigeUpgradeCost,
  PRESTIGE_UPGRADES,
} from '../data/prestige';
import { getRebirthVow, REBIRTH_VOW_ORDER, REBIRTH_VOWS } from '../data/rebirthVows';
import {
  ARCANE_IMPRINTS,
  ARCANE_TRANSMUTES,
  ensureSanctum,
  getImprintCost,
} from '../data/sanctum';
import { SCHOOLS } from '../data/schools';
import { getNextTowerLordFloor } from '../data/towerLords';
import { BGM_TRACKS, type BgmTrackId } from '../engine/bgm';
import { exportSaveCode } from '../engine/save';
import type {
  AbyssChoice,
  ArcaneImprintId,
  ArcaneTransmuteId,
  ComputedStats,
  GameState,
  PrestigeUpgradeId,
} from '../types/game';
import { MonsterPortrait } from './GothicArt';

/** 3x3 주사위 눈 도트 위치 (0..8) */
const DIE_PIPS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface Props {
  state: GameState;
  stats: ComputedStats;
  currentBgmTrack: BgmTrackId;
  onExploreAbyssStep: (rolledFace?: number) => void;
  onResolveAbyssChoice: (choice: AbyssChoice) => void;
  onChallengeTower: () => void;
  onUpgradeImprint: (id: ArcaneImprintId) => void;
  onTransmuteStones: (id: ArcaneTransmuteId) => void;
  onBuyPrestigeUpgrade: (id: PrestigeUpgradeId) => void;
  onStartRebirthFlow: () => void;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
  onChangeBgmVolume: (volume: number) => void;
  onImportSaveCode: (code: string) => boolean;
  onHardReset: () => void;
}

export const AbyssTab: React.FC<Props> = ({
  state,
  stats,
  currentBgmTrack,
  onExploreAbyssStep,
  onResolveAbyssChoice,
  onChallengeTower,
  onUpgradeImprint,
  onTransmuteStones,
  onBuyPrestigeUpgrade,
  onStartRebirthFlow,
  onToggleSfx,
  onToggleBgm,
  onChangeBgmVolume,
  onImportSaveCode,
  onHardReset,
}) => {
  const [sub, setSub] = useState<'explore' | 'tower' | 'rebirth' | 'system'>('explore');
  const [importText, setImportText] = useState('');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollingFace, setRollingFace] = useState<number>(state.abyss.lastRoll ?? 1);
  const rollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current !== null) window.clearTimeout(rollTimerRef.current);
    };
  }, []);

  const towerUnlocked = state.clearedActs.includes(6) || state.prestige.rebirthCount > 0;
  const rebirthReward = calculateRebirthReward(state);
  const canRebirth = rebirthReward > 0;

  const boardPos = ((state.abyss.boardPos ?? state.abyss.depth % 16) % 16 + 16) % 16;
  const laps = state.abyss.laps ?? Math.floor(state.abyss.depth / 16);
  const displayFace = isRolling ? rollingFace : (state.abyss.lastRoll ?? 1);
  const activePips = DIE_PIPS[displayFace] ?? DIE_PIPS[1];
  const schoolColor = SCHOOLS[state.school].color;
  const canRoll = !isRolling && state.abyss.lanterns > 0 && !state.abyss.activeNode;

  const handleRollDice = () => {
    if (!canRoll) return;
    const finalRoll = 1 + Math.floor(Math.random() * 6);
    setIsRolling(true);
    let ticks = 0;
    const step = () => {
      ticks += 1;
      if (ticks < 4) {
        setRollingFace(1 + Math.floor(Math.random() * 6));
        rollTimerRef.current = window.setTimeout(step, 70);
      } else {
        setRollingFace(finalRoll);
        setIsRolling(false);
        rollTimerRef.current = null;
        onExploreAbyssStep(finalRoll);
      }
    };
    step();
  };

  const handleCopySave = () => {
    const code = exportSaveCode(state);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => undefined);
    }
    setCopyMsg('세이브 코드가 클립보드에 복사되었습니다!');
    setTimeout(() => setCopyMsg(null), 2600);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = onImportSaveCode(importText);
    setCopyMsg(ok ? '세이브 복원 완료!' : '유효하지 않은 세이브 코드입니다.');
    if (ok) setImportText('');
    setTimeout(() => setCopyMsg(null), 2600);
  };

  return (
    <div>
      <div className="subtabs">
        <button
          type="button"
          className={`subtab-btn ${sub === 'explore' ? 'active' : ''}`}
          onClick={() => setSub('explore')}
        >
          심연 탐험
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'tower' ? 'active' : ''}`}
          onClick={() => setSub('tower')}
        >
          무한 탑
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'rebirth' ? 'active' : ''}`}
          onClick={() => setSub('rebirth')}
        >
          시간 회귀
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'system' ? 'active' : ''}`}
          onClick={() => setSub('system')}
        >
          기록·설정
        </button>
      </div>

      {/* 1. 서브: P1-5 주사위판 심연 미궁 */}
      {sub === 'explore' && (
        <div className="panel">
          <div className="panel-title-row">
            <h2 className="panel-title">
              <Compass size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              심연 미궁 주사위판
            </h2>
            <span className="panel-sub" style={{ color: '#e3c481' }}>
              등불 {state.abyss.lanterns} / {state.abyss.maxLanterns}
            </span>
          </div>
          <div className="abyss-board-sub">
            20분마다 등불 +1 · 한 바퀴(16칸) 완주마다 금서·알 조각·마석 보너스!
          </div>

          {/* 5×5 외곽 16칸 순환 보드 + 중앙 3×3 주사위 허브 */}
          <div className="abyss-board" role="region" aria-label="심연 주사위판">
            {ABYSS_BOARD_TILES.map((tile) => {
              const isCurrent = tile.index === boardPos;
              return (
                <div
                  key={tile.index}
                  className={`abyss-tile tile-${tile.kind} ${isCurrent ? 'current' : ''}`}
                  style={{ gridRow: tile.row, gridColumn: tile.col }}
                  title={`${tile.index}번 칸 · ${tile.title}`}
                >
                  <span className="abyss-tile-glyph">{tile.glyph}</span>
                  <span className="abyss-tile-label">{tile.shortLabel}</span>
                  {isCurrent && (
                    <span
                      className="abyss-pawn"
                      style={{ backgroundColor: schoolColor }}
                      aria-label="현재 위치"
                    />
                  )}
                </div>
              );
            })}

            <div className="abyss-board-center">
              <div className="abyss-center-meta">
                <span>{laps + 1}바퀴</span>
                <span>·</span>
                <span>누적 {state.abyss.depth}칸</span>
              </div>

              <div className={`abyss-die ${isRolling ? 'rolling' : ''}`} aria-label={`주사위 ${displayFace}`}>
                {Array.from({ length: 9 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`die-pip ${activePips.includes(idx) ? 'on' : ''}`}
                  />
                ))}
              </div>

              {state.abyss.activeNode ? (
                <div className="dice-pending-hint" role="status">
                  아래 선택지를 골라주세요 ↓
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-gold btn-sm abyss-roll-btn"
                  disabled={!canRoll}
                  onClick={handleRollDice}
                >
                  <Dices size={13} />
                  {isRolling
                    ? '굴리는 중…'
                    : state.abyss.lanterns <= 0
                      ? '등불 부족'
                      : '굴리기 (등불 1)'}
                </button>
              )}
            </div>
          </div>

          {state.abyss.lastResult && (
            <div className="abyss-result-banner parchment">{state.abyss.lastResult}</div>
          )}

          {state.abyss.activeNode && (
            <div className="abyss-event-card parchment">
              <div className="abyss-event-head">
                <span className="event-badge">
                  {state.abyss.lastRoll ? `🎲 ${state.abyss.lastRoll}칸 이동` : '심연 조우'}
                </span>
                <span className="abyss-event-title">{state.abyss.activeNode.title}</span>
              </div>
              <div className="abyss-event-desc">{state.abyss.activeNode.description}</div>
              <div className="event-choices">
                {state.abyss.activeNode.choices.map((ch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="abyss-choice-btn"
                    onClick={() => onResolveAbyssChoice(ch)}
                  >
                    <span className="abyss-choice-label">{ch.label}</span>
                    <span className="abyss-choice-hint">{ch.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. 무한 심연 탑 & P1-7 심연 비전 제련소 */}
      {sub === 'tower' && (() => {
        const sanctum = ensureSanctum(state.sanctum);
        return (
          <>
            <div className="panel">
              <div className="panel-title-row">
                <h2 className="panel-title">무한 심연 탑</h2>
                <span className="panel-sub">최고 기록: {state.highestTowerFloor}층</span>
              </div>
              {!towerUnlocked ? (
                <div className="list-card">
                  <div style={{ fontSize: 12.5, color: '#c5bdb0', lineHeight: 1.6 }}>
                    <Lock size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                    <strong>제 6막 [부활한 마왕 발바르]</strong> 토벌 후 개방되는 엔드 콘텐츠입니다.
                    <br />
                    5층마다 심연 군주가 등장하며, 올라간 층수만큼 시간 회귀 보상(별의 잔재)이 크게
                    증가합니다.
                  </div>
                </div>
              ) : (() => {
                const upcoming = getNextTowerLordFloor(state.towerFloor);
                const isLordFloor = upcoming.floor === state.towerFloor;
                const quote =
                  state.prestige.rebirthCount >= 1
                    ? upcoming.lord.ngPlusQuote
                    : upcoming.lord.encounterQuote;
                return (
                  <div className="list-card highlight">
                    <div className="list-top">
                      <span className="list-title" style={{ color: '#e3c481' }}>
                        도전 가능: 제 {state.towerFloor}층
                      </span>
                      <span className="tag">
                        {isLordFloor
                          ? `✦ 군주전 · 금서 +${upcoming.lord.bonusTomeShards}`
                          : `다음 군주 ${upcoming.floor}층`}
                      </span>
                    </div>
                    <div className={`tower-lord-preview${isLordFloor ? ' is-now' : ''}`}>
                      <div className="wc-boss-thumb">
                        <MonsterPortrait
                          artKey={upcoming.lord.artKey}
                          isBoss
                          variant="thumb"
                          alt={upcoming.lord.name}
                        />
                      </div>
                      <div className="tower-lord-info">
                        <div className="tower-lord-head">
                          <span className="tower-lord-floor">
                            {isLordFloor ? `${upcoming.floor}층 군주 출현` : `${upcoming.floor}층 예고`}
                          </span>
                          <span className="tower-lord-name">{upcoming.lord.name}</span>
                        </div>
                        <div className="tower-lord-sub">
                          {upcoming.lord.title} · 강공격 [{upcoming.lord.heavyName}]
                        </div>
                        <div className="tower-lord-quote">“{quote}”</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-crimson btn-block"
                      onClick={onChallengeTower}
                    >
                      <Swords size={14} />
                      무한 심연 탑 {state.towerFloor}층 도전
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* P1-7: 후반 마석 소모처 — 심연 비전 제련소 */}
            <div className="panel">
              <div className="panel-title-row">
                <h2 className="panel-title">
                  <Flame size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                  심연 비전 제련소
                </h2>
                <span className="panel-sub" style={{ color: '#e3c481' }}>
                  보유 ◆{state.stones.toLocaleString()}
                </span>
              </div>

              {!towerUnlocked ? (
                <div className="list-card">
                  <div style={{ fontSize: 12.5, color: '#c5bdb0', lineHeight: 1.6 }}>
                    <Lock size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                    <strong>제 6막 클리어</strong> 또는 <strong>시간 회귀 1회</strong> 이후 개방됩니다.
                    <br />
                    남는 마석을 상한 없는 영구 전투 각인과 금서·등불·알 조각 연성에 소모할 수
                    있습니다.
                  </div>
                </div>
              ) : (
                <>
                  <div className="sanctum-intro">
                    장비와 스킬이 한계에 닿은 대마도사를 위한 심연 화로입니다. 마석을 태워
                    무한히 각인하거나 희귀 재료로 연성하세요. 각인은 시간 회귀 후에도 유지됩니다.
                    {sanctum.totalStonesSpent > 0 && (
                      <> (누적 소모 ◆{sanctum.totalStonesSpent.toLocaleString()})</>
                    )}
                  </div>

                  <div className="sanctum-imprint-list">
                    {ARCANE_IMPRINTS.map((def) => {
                      const lv = sanctum.imprints[def.id] ?? 0;
                      const cost = getImprintCost(def.id, lv);
                      const canAfford = state.stones >= cost;
                      return (
                        <div key={def.id} className="list-card">
                          <div className="sanctum-imprint-row">
                            <div className="sanctum-imprint-meta">
                              <div className="list-title" style={{ color: def.accent }}>
                                {def.name}{' '}
                                <span className="tag">Lv.{lv}</span>
                              </div>
                              <div className="sanctum-imprint-sub">
                                {def.subtitle} · Lv당 {def.effectPerLevelLabel}
                              </div>
                              <div className="sanctum-imprint-bonus">
                                현재 효과: <strong>{def.formatCurrentBonus(lv)}</strong>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={`btn btn-sm ${canAfford ? 'btn-gold' : ''}`}
                              disabled={!canAfford}
                              onClick={() => onUpgradeImprint(def.id)}
                            >
                              각인 ◆{cost.toLocaleString()}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="sanctum-transmute-head">
                    <span>
                      <Sparkles size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                      비전 마석 연성
                    </span>
                    <span style={{ fontSize: 11, color: '#a99888' }}>
                      등불 {state.abyss.lanterns}/{state.abyss.maxLanterns} · 금서 {state.tomeShards} · 알 {state.eggShards}
                    </span>
                  </div>
                  <div className="sanctum-transmute-grid">
                    {ARCANE_TRANSMUTES.map((tr) => {
                      const lanternFull =
                        tr.id === 'lantern' && state.abyss.lanterns >= state.abyss.maxLanterns;
                      const disabled = state.stones < tr.cost || lanternFull;
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          className="sanctum-transmute-btn"
                          disabled={disabled}
                          onClick={() => onTransmuteStones(tr.id)}
                          title={tr.hint}
                        >
                          <span className="sanctum-t-name">{tr.name}</span>
                          <span className="sanctum-t-reward">
                            {lanternFull ? '가득 참' : tr.rewardLabel}
                          </span>
                          <span className="sanctum-t-cost">◆{tr.cost.toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        );
      })()}

      {/* 3. 선택형 환생: 시간 회귀 & 별의 성좌 */}
      {sub === 'rebirth' && (() => {
        const curVow = getRebirthVow(state.prestige.activeVow ?? 'none');
        const specialVows = REBIRTH_VOW_ORDER.filter((id) => id !== 'none').map(
          (id) => REBIRTH_VOWS[id]
        );
        return (
          <>
            <div className="panel">
              <div className="panel-title-row">
                <h2 className="panel-title">
                  <RotateCcw size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                  시간 회귀 (선택형 환생)
                </h2>
                <span className="panel-sub" style={{ color: '#e3c481' }}>
                  별의 잔재: {state.prestige.starRemnants}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#c5bdb0', marginBottom: 10, lineHeight: 1.55 }}>
                환생은 <strong>원할 때만</strong> 선택할 수 있습니다. 회귀 시 레벨·계급·장비가
                초기화되는 대신 <strong>별의 잔재</strong>를 영구 획득하고,{' '}
                <strong>새로운 출신 학파와 성별</strong>로 다시 입학할 수 있습니다.{' '}
                <span style={{ color: '#d8b878' }}>
                  별의 성좌 각인과 <strong>심연 비전 제련소 각인</strong>은 회귀 후에도 그대로 유지됩니다.
                </span>
              </div>
              <div className="stat-grid" style={{ marginBottom: 10 }}>
                <div className="stat-box">
                  <span>누적 회귀</span>
                  <strong>{state.prestige.rebirthCount}회</strong>
                </div>
                <div className="stat-box">
                  <span>지금 회귀 보상</span>
                  <strong style={{ color: '#e3c481' }}>+{rebirthReward} 잔재</strong>
                </div>
              </div>

              {/* P3-4: 현재 회차 성좌 서약 상태 & 차기 회귀 서약 미리보기 */}
              <div className="rebirth-vow-summary">
                <div className="rebirth-vow-current">
                  <span className="rebirth-vow-current-label">
                    현재 회차 서약: <strong>{curVow.name}</strong>
                  </span>
                  {curVow.remnantBonusPct > 0 && (
                    <span className="rebirth-vow-bonus-tag">
                      회귀 잔재 보너스 +{curVow.remnantBonusPct}% 적용 중!
                    </span>
                  )}
                </div>
                <div className="rebirth-vow-note">
                  회귀 입학 시 4종의 [성좌 서약(축복·대가)] 중 하나를 선택해 회차 규칙을 바꿀 수 있습니다.
                </div>
                <div className="rebirth-vow-preview-list">
                  {specialVows.map((vow) => (
                    <div key={vow.id} className="rebirth-vow-preview-chip" title={vow.blessingDesc}>
                      <span className="rebirth-vow-preview-name">{vow.name}</span>
                      <span className="rebirth-vow-preview-badge">
                        +{vow.remnantBonusPct}% 잔재
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-gold btn-block"
                disabled={!canRebirth}
                onClick={onStartRebirthFlow}
              >
                {canRebirth
                  ? `시간 회귀 실행 (+${rebirthReward} 별의 잔재 획득)`
                  : '4막 클리어 또는 5계급(심연 마도사)부터 회귀 가능'}
              </button>
            </div>

            <div className="panel">
              <div className="panel-title-row">
                <h2 className="panel-title">별의 성좌 (영구 업그레이드)</h2>
                <span className="panel-sub">모든 회차에 영구 유지</span>
              </div>
              <div className="item-list">
                {PRESTIGE_UPGRADES.map((up) => {
                  const lv = state.prestige.upgrades[up.id] ?? 0;
                  const isMax = lv >= up.maxLevel;
                  const cost = getPrestigeUpgradeCost(up, lv);
                  return (
                    <div key={up.id} className="list-card">
                      <div className="list-top">
                        <span className="list-title">
                          {up.name}
                          <span className="tag">
                            Lv.{lv}/{up.maxLevel}
                          </span>
                        </span>
                        <span style={{ fontSize: 11, color: '#e3c481' }}>{up.effectText(lv)}</span>
                      </div>
                      <div className="list-desc">{up.description}</div>
                      <div className="list-actions">
                        <span style={{ fontSize: 11, color: '#8b8479' }}>
                          {isMax ? '최대 강화 완료' : `비용: 별의 잔재 ${cost}`}
                        </span>
                        {!isMax && (
                          <button
                            type="button"
                            className="btn btn-sm btn-gold"
                            disabled={state.prestige.starRemnants < cost}
                            onClick={() => onBuyPrestigeUpgrade(up.id)}
                          >
                            각인하기
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}

      {/* 4. 기록 · 스탯 · 세이브 백업 */}
      {sub === 'system' && (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">
                <Settings size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                음향 &amp; 마법사 능력치
              </h2>
              <div className="bgm-btn-group">
                <button
                  type="button"
                  className={`btn btn-sm ${(state.settings.bgmEnabled ?? true) ? 'btn-gold' : ''}`}
                  onClick={onToggleBgm}
                >
                  {(state.settings.bgmEnabled ?? true) ? <Music size={12} /> : <VolumeX size={12} />}
                  BGM {(state.settings.bgmEnabled ?? true) ? 'ON' : 'OFF'}
                </button>
                <button type="button" className="btn btn-sm" onClick={onToggleSfx}>
                  {state.settings.sfxEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  효과음 {state.settings.sfxEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="bgm-control-card parchment">
              <div className="bgm-now-row">
                <div className="bgm-track-meta">
                  <div className="bgm-track-title">
                    <Music size={13} />
                    <span>{BGM_TRACKS[currentBgmTrack].title}</span>
                  </div>
                  <div className="bgm-track-sub">
                    {BGM_TRACKS[currentBgmTrack].subtitle} · 상황별 자동 전환
                  </div>
                </div>
              </div>
              <label className="bgm-vol-row">
                <span>음량</span>
                <input
                  type="range"
                  className="bgm-vol-slider"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round((state.settings.bgmVolume ?? 0.55) * 100)}
                  disabled={!(state.settings.bgmEnabled ?? true)}
                  onChange={(e) => onChangeBgmVolume(Number(e.target.value) / 100)}
                />
                <span>{Math.round((state.settings.bgmVolume ?? 0.55) * 100)}%</span>
              </label>
            </div>

            <div className="stat-grid">
              <div className="stat-box">
                <span>마력</span>
                <strong>{stats.magic.toLocaleString()}</strong>
              </div>
              <div className="stat-box">
                <span>최대 체력</span>
                <strong>{stats.maxHp.toLocaleString()}</strong>
              </div>
              <div className="stat-box">
                <span>방어력</span>
                <strong>{stats.def.toLocaleString()}</strong>
              </div>
              <div className="stat-box">
                <span>최대 마나 / 회복</span>
                <strong>
                  {stats.maxMp} (+{stats.mpRegen})
                </strong>
              </div>
              <div className="stat-box">
                <span>치명타 확률 / 피해</span>
                <strong>
                  {stats.critRate}% / {stats.critDmg}%
                </strong>
              </div>
              <div className="stat-box">
                <span>누적 토벌</span>
                <strong>{state.totalKills.toLocaleString()}체</strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">
                <Save size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                세이브 백업 &amp; 복원
              </h2>
              <span className="panel-sub">자동 저장 지원</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#9a9386', marginBottom: 8 }}>
              아이폰 Safari 캐시 정리나 기기 변경에 대비해 세이브 코드를 메모장에 보관해 두세요.
            </div>
            <button
              type="button"
              className="btn btn-gold btn-block"
              style={{ marginBottom: 8 }}
              onClick={handleCopySave}
            >
              <Copy size={13} />
              현재 세이브 코드 복사하기
            </button>
            <textarea
              className="code-area"
              placeholder="백업해 둔 ASTRA1:... 코드를 붙여넣으세요"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{ flex: 1 }}
                onClick={handleImport}
              >
                코드로 불러오기
              </button>
              <button
                type="button"
                className="btn btn-sm btn-crimson"
                onClick={() => {
                  if (window.confirm('정말 모든 세이브(환생 포함)를 초기화할까요?')) {
                    onHardReset();
                  }
                }}
              >
                전체 초기화
              </button>
            </div>
            {copyMsg && (
              <div style={{ fontSize: 11.5, color: '#e3c481', marginTop: 7 }}>{copyMsg}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
