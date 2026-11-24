import React from 'react';
import { Lock, Sparkles, Star } from 'lucide-react';
import {
  FAMILIAR_LIST,
  getFamiliarEvoCost,
  getFamiliarUpgradeCost,
} from '../data/familiars';
import { RANKS } from '../data/schools';
import type { FamiliarId, GameState } from '../types/game';
import { FamiliarSilhouetteSvg } from './GothicArt';

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
  const lockedByRank = state.rank < 1;

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
              사역마 사육실은 <strong>2계급 [시전자]</strong> 승급 후 개방됩니다.
              <br />
              1막 수정 광산을 돌파하고 교장실에서 시전자 승급 시험을 치러보세요!
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#9a9386' }}>
            출전한 사역마는 영구 패시브를 제공하고, 전투 중 일정 턴마다 고유 스킬로 주인을
            보조합니다.
          </div>
        )}
      </div>

      {!lockedByRank && (
        <div className="item-list">
          {FAMILIAR_LIST.map((fam) => {
            const owned = state.familiars[fam.id];
            const isActive = state.activeFamiliar === fam.id;
            const evoCost = owned && owned.evolution < 2 ? getFamiliarEvoCost(owned.evolution) : null;
            const upCost = owned ? getFamiliarUpgradeCost(owned.level) : 0;
            const canHatch =
              state.stones >= fam.hatchCost && state.eggShards >= (fam.eggFragmentCost ?? 0);
            const canEvo =
              owned &&
              evoCost &&
              owned.level >= evoCost.reqLevel &&
              state.rank >= evoCost.reqRank &&
              state.stones >= evoCost.stones &&
              state.eggShards >= evoCost.eggShards;

            return (
              <div key={fam.id} className={`list-card ${isActive ? 'highlight' : ''}`}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 7 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 10,
                      background: '#0d0c11',
                      border: `1px solid ${isActive ? 'var(--border-gold)' : 'var(--border-muted)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FamiliarSilhouetteSvg id={fam.id} size={40} />
                  </div>
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
                    <div style={{ fontSize: 11, color: '#9a9386' }}>
                      패시브: {fam.passiveLabel}
                    </div>
                  </div>
                </div>

                <div className="list-desc">{fam.description}</div>

                <div className="list-actions">
                  {!owned ? (
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
      )}
    </div>
  );
};
