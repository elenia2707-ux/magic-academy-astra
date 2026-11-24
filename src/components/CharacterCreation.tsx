import React, { useState } from 'react';
import { getCharacterQuote, getCharacterTitle, SCHOOLS } from '../data/schools';
import type { Gender, SchoolId } from '../types/game';
import { AstraCrestSvg, PlayerSilhouetteSvg } from './GothicArt';

interface Props {
  isRebirth?: boolean;
  rebirthCount?: number;
  initialName?: string;
  onComplete: (name: string, gender: Gender, school: SchoolId) => void;
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

  const schoolInfo = SCHOOLS[school];
  const title = getCharacterTitle(school, gender);
  const quote = getCharacterQuote(school, gender);

  return (
    <div className="creation-screen">
      <div className="creation-header">
        <div className="creation-crest">
          <AstraCrestSvg size={56} />
        </div>
        <h1 className="creation-title">마법학교 아스트라</h1>
        <p className="creation-subtitle">
          {isRebirth
            ? `제 ${rebirthCount + 1}회차 시간 회귀 · 새로운 별빛의 입학서`
            : '검은 안개 속 최후의 마법학교 · 신입생 입학서'}
        </p>
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
          <span className="panel-sub">고유 마법 및 패시브 결정</span>
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

      <div className="preview-card">
        <div className="portrait-frame" style={{ marginBottom: 0, flexShrink: 0 }}>
          <PlayerSilhouetteSvg school={school} gender={gender} size={74} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: schoolInfo.color, fontWeight: 700 }}>
            {schoolInfo.name} · {title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              fontWeight: 700,
              margin: '2px 0 4px',
            }}
          >
            {name.trim() || '견습생'}
          </div>
          <div style={{ fontSize: 11.5, color: '#c5bdb0', marginBottom: 5 }}>
            “{quote}”
          </div>
          <div style={{ fontSize: 11, color: '#8b8479' }}>{schoolInfo.flavor}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          id="start-academy-btn"
          type="button"
          className="btn btn-gold btn-block"
          style={{ padding: '12px 16px', fontSize: 14 }}
          onClick={() => onComplete(name.trim() || '아스텔', gender, school)}
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
