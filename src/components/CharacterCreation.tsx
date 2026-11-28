import React, { useState } from 'react';
import { REBIRTH_VOW_ORDER, REBIRTH_VOWS } from '../data/rebirthVows';
import { getCharacterQuote, getCharacterTitle, SCHOOLS } from '../data/schools';
import type { Gender, RebirthVowId, SchoolId } from '../types/game';
import { AstraCrestSvg, PlayerPortrait } from './GothicArt';

interface Props {
  isRebirth?: boolean;
  rebirthCount?: number;
  initialName?: string;
  onComplete: (name: string, gender: Gender, school: SchoolId, vow?: RebirthVowId) => void;
  onCancelRebirth?: () => void;
}

const SCHOOL_ORDER: SchoolId[] = ['flame', 'frost', 'thunder', 'earth'];

export const CharacterCreation: React.FC<Props> = ({
  isRebirth = false,
  rebirthCount = 0,
  initialName = '',
  onComplete,
  onCancelRebirth,
}) => {
  const [name, setName] = useState(initialName || '아스텔');
  const [gender, setGender] = useState<Gender>('female');
  const [school, setSchool] = useState<SchoolId>('flame');
  const [vow, setVow] = useState<RebirthVowId>('none');

  const schoolInfo = SCHOOLS[school];
  const title = getCharacterTitle(school, gender);
  const quote = getCharacterQuote(school, gender);

  return (
    <div className="creation-screen">
      <div className="creation-header">
        <div className="creation-crest">
          <AstraCrestSvg size={50} />
        </div>
        <h1 className="creation-title">마법학교 아스트라</h1>
        <p className="creation-subtitle">
          {isRebirth
            ? `제 ${rebirthCount + 1}회차 시간 회귀 · 새로운 별빛의 입학서`
            : '검은 안개 속 최후의 마법학교 · 신입생 입학서'}
        </p>
      </div>

      <div className="preview-card wc-preview-card">
        <div className="wc-preview-frame">
          <PlayerPortrait school={school} gender={gender} variant="preview" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: schoolInfo.color, fontWeight: 700 }}>
            {schoolInfo.name} · {title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              fontWeight: 700,
              margin: '3px 0 5px',
            }}
          >
            {name.trim() || '견습생'}
          </div>
          <div style={{ fontSize: 11.5, color: '#dfd6c7', marginBottom: 6, lineHeight: 1.5 }}>
            “{quote}”
          </div>
          <div style={{ fontSize: 11, color: '#9c9589', lineHeight: 1.45 }}>
            {schoolInfo.flavor}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">1. 이름 &amp; 성별</h2>
          <span className="panel-sub">아스트라 학적부 기재</span>
        </div>
        <input
          id="player-name-input"
          className="input-gothic"
          type="text"
          maxLength={10}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="마법사의 이름을 입력하세요"
        />
        <div className="gender-row" style={{ marginTop: 9 }}>
          <button
            type="button"
            className={`btn ${gender === 'male' ? 'btn-gold' : ''}`}
            onClick={() => setGender('male')}
          >
            남성 마법사
          </button>
          <button
            type="button"
            className={`btn ${gender === 'female' ? 'btn-gold' : ''}`}
            onClick={() => setGender('female')}
          >
            여성 마법사
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">2. 출신 학파 선택</h2>
          <span className="panel-sub">8종 수채화 원화 &amp; 고유 마법</span>
        </div>
        <div className="school-grid">
          {SCHOOL_ORDER.map((sid) => {
            const info = SCHOOLS[sid];
            const selected = school === sid;
            return (
              <button
                key={sid}
                type="button"
                className={`school-choice ${selected ? 'selected' : ''}`}
                onClick={() => setSchool(sid)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: info.color,
                    }}
                  />
                  <strong style={{ fontSize: 13 }}>{info.name}</strong>
                </div>
                <div style={{ fontSize: 11, color: '#9a9386', marginBottom: 4 }}>
                  {info.originVillage}
                </div>
                <div style={{ fontSize: 11, color: '#d8cfc0' }}>{info.passiveDesc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {isRebirth && (
        <div className="panel rebirth-vow-panel">
          <div className="panel-title-row">
            <h2 className="panel-title">3. 성좌의 회귀 서약 (회차 변형 규칙)</h2>
            <span className="panel-sub">축복 &amp; 대가 선택</span>
          </div>
          <div className="rebirth-vow-grid">
            {REBIRTH_VOW_ORDER.map((vid) => {
              const v = REBIRTH_VOWS[vid];
              const selected = vow === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  className={`vow-choice-card${selected ? ' selected' : ''}`}
                  style={{ ['--vow-accent' as string]: v.accentColor } as React.CSSProperties}
                  onClick={() => setVow(v.id)}
                  aria-pressed={selected}
                >
                  <div className="vow-choice-top">
                    <div className="vow-choice-title-group">
                      <span
                        className="vow-choice-dot"
                        style={{ background: v.accentColor }}
                      />
                      <strong className="vow-choice-name">{v.name}</strong>
                      <span className="vow-choice-subtitle">{v.subtitle}</span>
                    </div>
                    <span
                      className={`vow-remnant-badge${v.remnantBonusPct > 0 ? ' is-bonus' : ''}`}
                    >
                      {v.remnantBonusPct > 0 ? `+${v.remnantBonusPct}% 잔재` : '기본'}
                    </span>
                  </div>
                  <div className="vow-blessing">✦ 축복: {v.blessingDesc}</div>
                  <div className="vow-curse">⚠ 대가: {v.curseDesc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          id="start-academy-btn"
          type="button"
          className="btn btn-gold btn-block"
          style={{ padding: '12px 16px', fontSize: 14 }}
          onClick={() =>
            onComplete(name.trim() || '아스텔', gender, school, isRebirth ? vow : 'none')
          }
        >
          {isRebirth ? '별의 잔재를 품고 새로 입학하기' : '아스트라 마법학교 입학하기'}
        </button>
        {isRebirth && onCancelRebirth && (
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancelRebirth}>
            회귀 취소하고 돌아가기
          </button>
        )}
      </div>
    </div>
  );
};
