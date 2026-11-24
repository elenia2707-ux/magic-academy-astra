import React, { useState } from 'react';
import {
  Compass,
  Copy,
  Flame,
  Lock,
  RotateCcw,
  Save,
  Settings,
  Swords,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  calculateRebirthReward,
  getPrestigeUpgradeCost,
  PRESTIGE_UPGRADES,
} from '../data/prestige';
import { exportSaveCode } from '../engine/save';
import type { AbyssChoice, ComputedStats, GameState, PrestigeUpgradeId } from '../types/game';

interface Props {
  state: GameState;
  stats: ComputedStats;
  onExploreAbyssStep: () => void;
  onResolveAbyssChoice: (choice: AbyssChoice) => void;
  onChallengeTower: () => void;
  onBuyPrestigeUpgrade: (id: PrestigeUpgradeId) => void;
  onStartRebirthFlow: () => void;
  onToggleSfx: () => void;
  onImportSaveCode: (code: string) => boolean;
  onHardReset: () => void;
}

export const AbyssTab: React.FC<Props> = ({
  state,
  stats,
  onExploreAbyssStep,
  onResolveAbyssChoice,
  onChallengeTower,
  onBuyPrestigeUpgrade,
  onStartRebirthFlow,
  onToggleSfx,
  onImportSaveCode,
  onHardReset,
}) => {
  const [sub, setSub] = useState<'explore' | 'tower' | 'rebirth' | 'system'>('explore');
  const [importText, setImportText] = useState('');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const towerUnlocked = state.clearedActs.includes(6) || state.prestige.rebirthCount > 0;
  const rebirthReward = calculateRebirthReward(state);
  const canRebirth = rebirthReward > 0;

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

      {/* 1. 서브: 심연 탐험 */}
      {sub === 'explore' && (
        <div className="panel">
          <div className="panel-title-row">
            <h2 className="panel-title">
              <Compass size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              심연 미궁 탐험 (서브)
            </h2>
            <span className="panel-sub" style={{ color: '#e3c481' }}>
              등불 {state.abyss.lanterns} / {state.abyss.maxLanterns}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: '#9a9386', marginBottom: 10 }}>
            메인 스토리와 무관한 선택형 미궁입니다. 20분마다 등불이 1개 회복되며, 금서 조각·알
            조각·희귀 마도구를 얻을 수 있습니다. (현재 심도: {state.abyss.depth}칸)
          </div>

          {state.abyss.lastResult && (
            <div
              className="list-card"
              style={{ marginBottom: 10, borderColor: 'var(--border-gold)', fontSize: 12 }}
            >
              {state.abyss.lastResult}
            </div>
          )}

          {state.abyss.activeNode ? (
            <div className="list-card highlight">
              <div className="list-top">
                <span className="list-title" style={{ color: '#e3c481' }}>
                  [{state.abyss.activeNode.step}칸] {state.abyss.activeNode.title}
                </span>
              </div>
              <div className="list-desc" style={{ lineHeight: 1.55 }}>
                {state.abyss.activeNode.description}
              </div>
              <div className="item-list">
                {state.abyss.activeNode.choices.map((ch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-block"
                    style={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 2,
                      padding: '9px 11px',
                    }}
                    onClick={() => onResolveAbyssChoice(ch)}
                  >
                    <span style={{ fontSize: 12.5 }}>{ch.label}</span>
                    <span style={{ fontSize: 10.5, color: '#9a9386', fontWeight: 400 }}>
                      {ch.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={state.abyss.lanterns <= 0}
              onClick={onExploreAbyssStep}
            >
              <Flame size={14} />
              등불 1개를 밝혀 안개 속으로 전진
            </button>
          )}
        </div>
      )}

      {/* 2. 무한 심연 탑 */}
      {sub === 'tower' && (
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
          ) : (
            <div className="list-card highlight">
              <div className="list-top">
                <span className="list-title" style={{ color: '#e3c481' }}>
                  도전 가능: 제 {state.towerFloor}층
                </span>
                <span className="tag">보상: 금서·마석·회귀 점수</span>
              </div>
              <div className="list-desc">
                층수가 오를수록 적이 기하급수적으로 강해집니다. 덱 순서와 흑마법·사역마를
                극한까지 조합해 보세요.
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
          )}
        </div>
      )}

      {/* 3. 선택형 환생: 시간 회귀 & 별의 성좌 */}
      {sub === 'rebirth' && (
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
              <strong>새로운 출신 학파와 성별</strong>로 다시 입학할 수 있습니다.
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
            <button
              type="button"
              className="btn btn-gold btn-block"
              disabled={!canRebirth}
              onClick={onStartRebirthFlow}
            >
              {canRebirth
                ? `시간 회귀 실행 (+${rebirthReward} 별의 잔재 획득)`
                : '3막 클리어 또는 3계급(정규 마법사)부터 회귀 가능'}
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
      )}

      {/* 4. 기록 · 스탯 · 세이브 백업 */}
      {sub === 'system' && (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">
                <Settings size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
                마법사 상세 능력치
              </h2>
              <button type="button" className="btn btn-sm" onClick={onToggleSfx}>
                {state.settings.sfxEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                효과음 {state.settings.sfxEnabled ? 'ON' : 'OFF'}
              </button>
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
