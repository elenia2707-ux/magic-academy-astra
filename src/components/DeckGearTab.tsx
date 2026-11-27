import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Hammer, Plus, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react';
import {
  getEnhanceCost,
  getEnhanceMultiplier,
  getItemScoreFor,
  planBestLoadout,
  RARITY_META,
  SLOT_LABELS,
} from '../data/equipment';
import { CATEGORY_META } from '../data/schools';
import { SKILL_MAP } from '../data/skills';
import type { ComputedStats, EquipmentItem, EquipSlot, GameState, Rarity } from '../types/game';
import { SkillIcon } from './SkillArt';

interface Props {
  state: GameState;
  stats: ComputedStats;
  onUpdateDeck: (deck: string[]) => void;
  onEquipItem: (uid: string) => void;
  onEquipBest: () => void;
  onEnhanceEquipped: (slot: EquipSlot) => void;
  onReforgeEquipped: (slot: EquipSlot) => void;
  onDismantleItem: (uid: string) => void;
  onDismantleBulk: (below: Rarity) => void;
  onSetAutoDismantle: (below: Rarity | 'none') => void;
  onBuyShopBox: (kind: 'gear' | 'tome' | 'egg' | 'dustGear') => void;
}

const SLOTS: EquipSlot[] = ['staff', 'robe', 'grimoire', 'relic'];

export const DeckGearTab: React.FC<Props> = ({
  state,
  stats,
  onUpdateDeck,
  onEquipItem,
  onEquipBest,
  onEnhanceEquipped,
  onReforgeEquipped,
  onDismantleItem,
  onDismantleBulk,
  onSetAutoDismantle,
  onBuyShopBox,
}) => {
  const [sub, setSub] = useState<'deck' | 'gear' | 'shop'>('deck');

  const unlockedSkillIds = Object.values(state.skills)
    .filter((s) => s.unlocked)
    .map((s) => s.id);

  const deck = state.deck.slice(0, stats.maxDeckSlots);

  const moveDeck = (idx: number, dir: -1 | 1) => {
    const next = [...deck];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onUpdateDeck(next);
  };

  const removeFromDeck = (idx: number) => {
    const next = deck.filter((_, i) => i !== idx);
    onUpdateDeck(next);
  };

  const addToDeck = (sid: string) => {
    if (deck.includes(sid) || deck.length >= stats.maxDeckSlots) return;
    onUpdateDeck([...deck, sid]);
  };

  const renderStatSummary = (item: EquipmentItem) => {
    const m = getEnhanceMultiplier(item.enhance);
    const parts: string[] = [];
    if (item.stats.magic) parts.push(`마력 +${Math.round(item.stats.magic * m)}`);
    if (item.stats.maxHp) parts.push(`HP +${Math.round(item.stats.maxHp * m)}`);
    if (item.stats.def) parts.push(`방어 +${Math.round(item.stats.def * m)}`);
    if (item.stats.maxMp) parts.push(`MP +${Math.round(item.stats.maxMp * m)}`);
    if (item.stats.critRate) parts.push(`치명 +${item.stats.critRate}%`);
    if (item.stats.critDmg) parts.push(`치피 +${item.stats.critDmg}%`);
    if (item.stats.mpRegen) parts.push(`마나회복 +${item.stats.mpRegen}`);
    if (item.stats.elementBonus) {
      parts.push(
        `${CATEGORY_META[item.stats.elementBonus.category].short} +${item.stats.elementBonus.pct}%`
      );
    }
    return parts.join(' · ');
  };

  // P0-5: 최적 일괄 장착 미리보기 (교체 가능한 부위 수 / 전투력 상승량)
  const bestPlan = planBestLoadout(state.equipped, state.inventory, state.school);
  const upgradeCount = bestPlan.swaps.length;

  const gearBoxCost = Math.round(160 * Math.pow(1.55, state.selectedAct - 1));

  return (
    <div>
      <div className="subtabs">
        <button
          type="button"
          className={`subtab-btn ${sub === 'deck' ? 'active' : ''}`}
          onClick={() => setSub('deck')}
        >
          스킬 덱
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'gear' ? 'active' : ''}`}
          onClick={() => setSub('gear')}
        >
          마도구 ({state.inventory.length})
          {upgradeCount > 0 && <span className="gear-upgrade-dot">▲{upgradeCount}</span>}
        </button>
        <button
          type="button"
          className={`subtab-btn ${sub === 'shop' ? 'active' : ''}`}
          onClick={() => setSub('shop')}
        >
          상점·연금
        </button>
      </div>

      {sub === 'deck' && (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">심플 로테이션 편성</h2>
              <span className="panel-sub">
                {deck.length} / {stats.maxDeckSlots} 슬롯
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#9a9386', marginBottom: 9 }}>
              매 턴 <strong>1순위 → {stats.maxDeckSlots}순위</strong> 순서대로 쿨타임과 마나가
              가능한 첫 번째 마법을 자동 시전합니다.
            </div>
            <div className="item-list">
              {Array.from({ length: stats.maxDeckSlots }).map((_, idx) => {
                const sid = deck[idx];
                const def = sid ? SKILL_MAP[sid] : null;
                const learned = sid ? state.skills[sid] : null;
                return (
                  <div key={idx} className={`list-card ${def ? 'highlight' : ''}`}>
                    {def && learned ? (
                      <div className="list-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                          <SkillIcon skillId={def.id} category={def.category} size="md" />
                          <div style={{ minWidth: 0 }}>
                            <div className="list-title">
                              <span className="tag">{idx + 1}</span>
                              <span>{def.name}</span>
                              <span style={{ fontSize: 11, color: '#e3c481' }}>
                                Lv.{learned.level}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#9a9386', marginTop: 2 }}>
                              MP {def.mpCost} · 쿨 {def.cooldown}턴
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            disabled={idx === 0}
                            onClick={() => moveDeck(idx, -1)}
                            aria-label="위로"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            disabled={idx >= deck.length - 1}
                            onClick={() => moveDeck(idx, 1)}
                            aria-label="아래로"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => removeFromDeck(idx)}
                            aria-label="제거"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#6f6a62' }}>
                        {idx + 1}순위 — 비어 있음 (아래 습득 마법에서 추가)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">습득한 마법 목록</h2>
              <span className="panel-sub">{unlockedSkillIds.length}종 보유</span>
            </div>
            <div className="item-list">
              {unlockedSkillIds.map((sid) => {
                const def = SKILL_MAP[sid];
                const learned = state.skills[sid];
                if (!def || !learned) return null;
                const inDeck = deck.includes(sid);
                return (
                  <div key={sid} className="list-card">
                    <div className="list-actions">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                        <SkillIcon skillId={def.id} category={def.category} size="md" />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="list-title">
                            <span>{def.name}</span>
                            <span className="tag">Lv.{learned.level}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#9a9386', marginTop: 2 }}>
                            {def.description}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${inDeck ? 'btn-ghost' : 'btn-gold'}`}
                        disabled={inDeck || deck.length >= stats.maxDeckSlots}
                        onClick={() => addToDeck(sid)}
                      >
                        <Plus size={12} />
                        {inDeck ? '장착됨' : '추가'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {sub === 'gear' && (
        <>
          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">장착 중인 마도구</h2>
              <span className="panel-sub">마력 가루: {state.arcaneDust.toLocaleString()}</span>
            </div>
            <button
              type="button"
              className={`btn btn-equip-best ${upgradeCount > 0 ? 'btn-gold has-upgrade' : 'btn-ghost'}`}
              disabled={upgradeCount === 0}
              onClick={onEquipBest}
            >
              <Sparkles size={13} />
              {upgradeCount > 0
                ? `최적 일괄 장착 — ${upgradeCount}부위 · 전투력 +${bestPlan.totalGain.toLocaleString()}`
                : '최적 장비 장착 중'}
            </button>
            <div className="equip-grid">
              {SLOTS.map((slot) => {
                const item = state.equipped[slot];
                const cost = item ? getEnhanceCost(item) : 0;
                return (
                  <div key={slot} className="list-card" style={{ padding: 9 }}>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: '#8b8479',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 3,
                      }}
                    >
                      <span>{SLOT_LABELS[slot]}</span>
                      {item && (
                        <span style={{ color: RARITY_META[item.rarity].color, fontWeight: 700 }}>
                          {RARITY_META[item.rarity].name} T{item.tier}
                        </span>
                      )}
                    </div>
                    {item ? (
                      <>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: RARITY_META[item.rarity].color,
                            marginBottom: 4,
                          }}
                        >
                          {item.name} {item.enhance > 0 ? `+${item.enhance}` : ''}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#c5bdb0', minHeight: 30, marginBottom: 6 }}>
                          {renderStatSummary(item)}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-gold"
                            style={{ flex: 1 }}
                            disabled={state.stones < cost || item.enhance >= 15}
                            onClick={() => onEnhanceEquipped(slot)}
                          >
                            <Hammer size={11} />
                            {item.enhance >= 15 ? 'MAX' : `${cost.toLocaleString()}`}
                          </button>
                          {state.rank >= 3 && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={state.arcaneDust < 80}
                              onClick={() => onReforgeEquipped(slot)}
                              title="마력 가루 80으로 속성 옵션 재련"
                            >
                              재련
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#6f6a62', padding: '14px 0' }}>
                        장착된 마도구 없음
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title-row">
              <h2 className="panel-title">보관함 ({state.inventory.length}/36)</h2>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onDismantleBulk('epic')}
                >
                  <Trash2 size={11} />
                  희귀 이하 분해
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: '#9a9386',
                marginBottom: 8,
              }}
            >
              <span>자동 분해 필터</span>
              <select
                value={state.settings.autoDismantleBelow}
                onChange={(e) => onSetAutoDismantle(e.target.value as Rarity | 'none')}
                style={{
                  background: '#0d0c11',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 6,
                  padding: '3px 7px',
                  fontSize: 11.5,
                }}
              >
                <option value="none">사용 안 함</option>
                <option value="rare">일반 자동 분해 (추천)</option>
                <option value="epic">희귀 이하 자동 분해</option>
                <option value="ancient">영웅 이하 자동 분해</option>
              </select>
            </div>

            {state.inventory.length === 0 ? (
              <div style={{ fontSize: 12, color: '#8b8479', textAlign: 'center', padding: 14 }}>
                전투를 진행하거나 상점에서 마도구를 획득하세요.
              </div>
            ) : (
              <div className="item-list">
                {state.inventory.map((item) => {
                  const cur = state.equipped[item.slot];
                  const diff =
                    getItemScoreFor(item, state.school) - (cur ? getItemScoreFor(cur, state.school) : 0);
                  return (
                    <div key={item.uid} className="list-card">
                      <div className="list-top">
                        <span
                          className="list-title"
                          style={{ color: RARITY_META[item.rarity].color }}
                        >
                          [{SLOT_LABELS[item.slot]}] {item.name}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: diff > 0 ? '#8ad0a2' : diff < 0 ? '#df8285' : '#9a9386',
                          }}
                        >
                          {diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : '동일'}
                        </span>
                      </div>
                      <div className="list-desc">{renderStatSummary(item)}</div>
                      <div className="list-actions">
                        <span style={{ fontSize: 11, color: '#8b8479' }}>
                          {RARITY_META[item.rarity].name} · 티어 {item.tier}
                        </span>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-gold"
                            onClick={() => onEquipItem(item.uid)}
                          >
                            장착
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => onDismantleItem(item.uid)}
                          >
                            분해 (+{RARITY_META[item.rarity].dustValue})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {sub === 'shop' && (
        <div className="panel">
          <div className="panel-title-row">
            <h2 className="panel-title">
              <ShoppingBag size={14} style={{ verticalAlign: -2, marginRight: 5 }} />
              아스트라 상점가 &amp; 지하 연금실
            </h2>
            <span className="panel-sub">마력 가루 {state.arcaneDust.toLocaleString()}</span>
          </div>

          <div className="item-list">
            <div className="list-card">
              <div className="list-top">
                <span className="list-title">봉인된 마도구 상자 (티어 {state.selectedAct})</span>
                <span className="tag" style={{ color: '#e3c481' }}>
                  마석 {gearBoxCost.toLocaleString()}
                </span>
              </div>
              <div className="list-desc">
                현재 선택한 막 등급의 랜덤 마도구 1종을 즉시 연성합니다.
              </div>
              <button
                type="button"
                className="btn btn-sm btn-gold"
                disabled={state.stones < gearBoxCost}
                onClick={() => onBuyShopBox('gear')}
              >
                상자 개봉
              </button>
            </div>

            <div className="list-card">
              <div className="list-top">
                <span className="list-title">고급 연금 마도구 (희귀 이상 보장)</span>
                <span className="tag">마력 가루 120</span>
              </div>
              <div className="list-desc">
                분해로 모은 마력 가루를 응축해 희귀~신화 등급 마도구를 제작합니다.
              </div>
              <button
                type="button"
                className="btn btn-sm btn-gold"
                disabled={state.arcaneDust < 120}
                onClick={() => onBuyShopBox('dustGear')}
              >
                연금 제작
              </button>
            </div>

            <div className="list-card">
              <div className="list-top">
                <span className="list-title">낡은 금서 조각 1개</span>
                <span className="tag" style={{ color: '#d68592' }}>
                  마석 450
                </span>
              </div>
              <div className="list-desc">
                금서 도서관에서 금지된 흑마법을 해독하는 데 쓰이는 귀한 조각입니다.
              </div>
              <button
                type="button"
                className="btn btn-sm"
                disabled={state.stones < 450}
                onClick={() => onBuyShopBox('tome')}
              >
                구매하기
              </button>
            </div>

            <div className="list-card">
              <div className="list-top">
                <span className="list-title">사역마 알 조각 1개</span>
                <span className="tag">마석 380</span>
              </div>
              <div className="list-desc">
                희귀 사역마를 부화시키거나 2·3단계 각성 진화에 필요합니다.
              </div>
              <button
                type="button"
                className="btn btn-sm"
                disabled={state.stones < 380}
                onClick={() => onBuyShopBox('egg')}
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
