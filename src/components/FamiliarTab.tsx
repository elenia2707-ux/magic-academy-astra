import React, { useState } from 'react';
import { Lock, Sparkles, Star } from 'lucide-react';
import {
  FAMILIAR_LIST,
  FAMILIARS,
  getFamiliarEvoCost,
  getFamiliarUpgradeCost,
} from '../data/familiars';
import { RANKS } from '../data/schools';
import type { FamiliarId, GameState } from '../types/game';
import { FamiliarPortrait } from './GothicArt';

interface Props {
  state: GameState;
  onHatchFamiliar: (id: FamiliarId) => void;
  onSelectFamiliar: (id: FamiliarId | null) => void;
  onUpgradeFamiliar: (id: FamiliarId) => void;
  onEvolveFamiliar: (id: FamiliarId) => void;
}

const EVO_STAGE_LABEL = ['유체', '성체', '각성체'] as const;

export const FamiliarTab: React.FC<Props> = ({
  state,
  onHatchFamiliar,
  onSelectFamiliar,
  onUpgradeFamiliar,
  onEvolveFamiliar,
}) => {
  const [inspectId, setInspectId] = useState<FamiliarId | null>(null);
  const lockedByRank = state.rank < 1;

  const inspectFam = inspectId ? FAMILIARS[inspectId] : null;
  const inspectOwned = inspectId ? state.familiars[inspectId] : undefined;

  return (
    <div>
      <div className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">사역마 사육실</h2>
          <span className="panel-sub">알 조각 보유: {state.eggShards}개</span>
        </div>

        {lockedByRank ? (
          <div className="list-card">
            <div style={{ fontSize: 12.5, color: '#c5bdb0', lineHeight: 1.6 }}>
              <Lock size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              사역마 부화와 출전은 <strong>2계급 [시전자]</strong> 승급 후 개방됩니다.
              <br />
              1막 수정 광산을 돌파하고 교장실에서 시전자 승급 시험을 치러보세요! (아래 도감에서
              사역마 원화를 미리 구경할 수 있습니다.)
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#9a9386' }}>
            출전한 사역마는 영구 패시브를 제공하고, 일정 턴마다 고유 스킬로 주인을 보조합니다.
            초상화를 탭하면 수채화 원화를 크게 볼 수 있어요.
          </div>
        )}
      </div>

      <div className="item-list">
        {FAMILIAR_LIST.map((fam) => {
          const owned = state.familiars[fam.id];
          const isActive = state.activeFamiliar === fam.id;
          const evoCost = owned && owned.evolution < 2 ? getFamiliarEvoCost(owned.evolution) : null;
          const upCost = owned ? getFamiliarUpgradeCost(owned.level) : 0;
          const canHatch =
            !lockedByRank &&
            state.stones >= fam.hatchCost &&
            state.eggShards >= (fam.eggFragmentCost ?? 0);
          const canEvo =
            !lockedByRank &&
            owned &&
            evoCost &&
            owned.level >= evoCost.reqLevel &&
            state.rank >= evoCost.reqRank &&
            state.stones >= evoCost.stones &&
            state.eggShards >= evoCost.eggShards;

          return (
            <div key={fam.id} className={`list-card ${isActive ? 'highlight' : ''}`}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 8 }}>
                <button
                  type="button"
                  className={`wc-familiar-thumb ${isActive ? 'active' : ''}`}
                  onClick={() => setInspectId(fam.id)}
                  title={`${fam.name} 원화 크게 보기`}
                  aria-label={`${fam.name} 원화 크게 보기`}
                >
                  <FamiliarPortrait id={fam.id} variant="card" />
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="list-top" style={{ marginBottom: 2 }}>
                    <span className="list-title">
                      {owned ? fam.evolvedNames[owned.evolution] : fam.name}
                    </span>
                    {owned ? (
                      <span className="tag" style={{ color: '#e3c481' }}>
                        Lv.{owned.level} · {EVO_STAGE_LABEL[owned.evolution]}
                      </span>
                    ) : (
                      <span className="tag">{fam.role}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#9a9386', marginBottom: 4 }}>
                    패시브: {fam.passiveLabel}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#c5bdb0', lineHeight: 1.45 }}>
                    {fam.description}
                  </div>
                </div>
              </div>

              <div className="list-actions">
                {lockedByRank ? (
                  <>
                    <span style={{ fontSize: 11, color: '#8b8479' }}>
                      시전자 승급 후 부화 가능 (마석 {fam.hatchCost.toLocaleString()}
                      {fam.eggFragmentCost ? ` · 알 조각 ${fam.eggFragmentCost}` : ''})
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setInspectId(fam.id)}
                    >
                      원화 보기
                    </button>
                  </>
                ) : !owned ? (
                  <>
                    <span style={{ fontSize: 11, color: '#9a9386' }}>
                      필요: 마석 {fam.hatchCost.toLocaleString()}
                      {fam.eggFragmentCost ? ` · 알 조각 ${fam.eggFragmentCost}` : ''}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-gold"
                      disabled={!canHatch}
                      onClick={() => onHatchFamiliar(fam.id)}
                    >
                      <Sparkles size={12} />
                      부화하기
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`btn btn-sm ${isActive ? 'btn-gold' : ''}`}
                      onClick={() => onSelectFamiliar(isActive ? null : fam.id)}
                    >
                      {isActive ? '출전 중' : '출전'}
                    </button>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={state.stones < upCost || owned.level >= 60}
                        onClick={() => onUpgradeFamiliar(fam.id)}
                      >
                        육성 ({upCost.toLocaleString()})
                      </button>
                      {evoCost && (
                        <button
                          type="button"
                          className="btn btn-sm btn-crimson"
                          disabled={!canEvo}
                          onClick={() => onEvolveFamiliar(fam.id)}
                          title={`Lv.${evoCost.reqLevel}, ${RANKS[evoCost.reqRank].name}, 마석 ${evoCost.stones}, 알조각 ${evoCost.eggShards}`}
                        >
                          <Star size={11} />
                          진화 (Lv.{evoCost.reqLevel})
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {inspectFam && (
        <div className="modal-backdrop" onClick={() => setInspectId(null)}>
          <div className="modal-card hero-showcase-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wc-square-full-frame">
              <FamiliarPortrait id={inspectFam.id} variant="full" />
            </div>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#e3c481', fontWeight: 700 }}>
                사역마 도감 · {inspectFam.role}
              </div>
              <h3 className="modal-title" style={{ margin: '3px 0 4px', textAlign: 'center' }}>
                {inspectOwned
                  ? inspectFam.evolvedNames[inspectOwned.evolution]
                  : inspectFam.name}
              </h3>
              <div style={{ fontSize: 11.5, color: '#c5bdb0', marginBottom: 9, lineHeight: 1.5 }}>
                {inspectFam.description}
              </div>
            </div>
            <div className="list-card" style={{ marginBottom: 10, fontSize: 11.5 }}>
              <div style={{ color: '#9a9386', marginBottom: 3 }}>진화 계보</div>
              <div style={{ color: '#ede7da' }}>
                {inspectFam.evolvedNames.join(' → ')}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-gold btn-block"
              onClick={() => setInspectId(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
