import React, { useState } from 'react';
import type { MagicCategory, SkillRuneBranch, SpellVfxEvent } from '../types/game';
import { getSkillArtUrl } from '../data/art';

const CAT_PALETTE: Record<
  MagicCategory,
  { bg1: string; bg2: string; stroke: string; glow: string; border: string }
> = {
  flame: {
    bg1: '#3a1714',
    bg2: '#160d0e',
    stroke: '#f08a5d',
    glow: '#d95b38',
    border: 'rgba(217, 91, 56, 0.58)',
  },
  frost: {
    bg1: '#152c3b',
    bg2: '#0d151d',
    stroke: '#b7e6f7',
    glow: '#6bb4cf',
    border: 'rgba(107, 180, 207, 0.58)',
  },
  thunder: {
    bg1: '#352a14',
    bg2: '#15120d',
    stroke: '#ffe38d',
    glow: '#d8b45c',
    border: 'rgba(216, 180, 92, 0.65)',
  },
  earth: {
    bg1: '#192f21',
    bg2: '#0e1612',
    stroke: '#a7ddb5',
    glow: '#6ca67a',
    border: 'rgba(108, 166, 122, 0.58)',
  },
  ward: {
    bg1: '#1f2836',
    bg2: '#0f1219',
    stroke: '#d5e4f5',
    glow: '#9cb0c9',
    border: 'rgba(156, 176, 201, 0.56)',
  },
  holy: {
    bg1: '#382f1b',
    bg2: '#16130e',
    stroke: '#fff2c4',
    glow: '#e6cf98',
    border: 'rgba(230, 207, 152, 0.62)',
  },
  dark: {
    bg1: '#331524',
    bg2: '#120b14',
    stroke: '#f094a8',
    glow: '#b55264',
    border: 'rgba(181, 82, 100, 0.65)',
  },
};

const renderGlyph = (skillId: string, stroke: string, glow: string) => {
  switch (skillId) {
    // ===== 흑염 =====
    case 'flame_1': // 불씨탄
      return (
        <>
          <path d="M24 9 C28 16 32 20 31 27 C30 33 26 37 24 37 C18 37 16 31 17 25 C18 20 22 15 24 9 Z" fill={glow} fillOpacity="0.35" stroke={stroke} strokeWidth="2" />
          <path d="M24 20 C26 24 27 28 24 33 C21 29 21 25 24 20 Z" fill={stroke} />
          <circle cx="15" cy="14" r="1.6" fill={stroke} />
          <circle cx="33" cy="17" r="1.4" fill={stroke} />
        </>
      );
    case 'flame_2': // 흑염구
      return (
        <>
          <circle cx="24" cy="25" r="10" fill="#13090c" stroke={stroke} strokeWidth="2.1" />
          <path d="M16 18 C19 11 25 8 28 13 C33 15 35 22 33 28" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="24" cy="25" r="4.5" fill={glow} fillOpacity="0.85" />
          <circle cx="23" cy="24" r="1.8" fill="#fff3df" />
        </>
      );
    case 'flame_3': // 잿빛 화염벽
      return (
        <>
          <path d="M11 36 L11 22 C11 18 14 15 16 12 C18 16 19 19 19 23 L19 36" fill={glow} fillOpacity="0.32" stroke={stroke} strokeWidth="1.8" />
          <path d="M20 36 L20 18 C20 14 23 10 24 8 C26 12 28 15 28 19 L28 36" fill={glow} fillOpacity="0.45" stroke={stroke} strokeWidth="1.9" />
          <path d="M29 36 L29 22 C29 18 32 15 34 13 C36 16 37 20 37 23 L37 36" fill={glow} fillOpacity="0.32" stroke={stroke} strokeWidth="1.8" />
          <line x1="9" y1="36" x2="39" y2="36" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'flame_4': // 연옥 폭발
      return (
        <>
          <polygon points="24,7 28,17 39,15 31,24 38,34 27,31 24,41 21,31 10,34 17,24 9,15 20,17" fill={glow} fillOpacity="0.36" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="5" fill={stroke} />
          <circle cx="24" cy="24" r="2.2" fill="#1b090c" />
        </>
      );
    case 'flame_5': // 심연의 태양
      return (
        <>
          <circle cx="24" cy="24" r="13" stroke={glow} strokeWidth="1.6" strokeDasharray="3 2.5" fill="none" />
          <circle cx="24" cy="24" r="8.5" fill="#10070a" stroke={stroke} strokeWidth="2.2" />
          <path d="M24 6 L26 12 L24 10 L22 12 Z M24 42 L26 36 L24 38 L22 36 Z M6 24 L12 22 L10 24 L12 26 Z M42 24 L36 22 L38 24 L36 26 Z" fill={stroke} />
          <circle cx="24" cy="24" r="4" stroke={stroke} strokeWidth="1.2" fill="none" opacity="0.7" />
        </>
      );

    // ===== 서리 =====
    case 'frost_1': // 서리 바늘
      return (
        <>
          <polygon points="34,11 26,23 22,19" fill={glow} fillOpacity="0.45" stroke={stroke} strokeWidth="1.7" />
          <polygon points="28,21 17,36 14,33 25,18" fill={stroke} fillOpacity="0.85" />
          <line x1="12" y1="22" x2="22" y2="12" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="26" y1="36" x2="36" y2="26" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
    case 'frost_2': // 빙결 창
      return (
        <>
          <polygon points="37,10 29,24 23,18" fill={stroke} />
          <line x1="11" y1="37" x2="29" y2="19" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="21,21 26,26 17,31" fill={glow} fillOpacity="0.5" stroke={stroke} strokeWidth="1.4" />
        </>
      );
    case 'frost_3': // 설원의 숨결
      return (
        <>
          <path d="M24 9 L36 16 L36 30 L24 39 L12 30 L12 16 Z" fill={glow} fillOpacity="0.22" stroke={stroke} strokeWidth="1.9" />
          <path d="M16 24 C19 19 25 19 29 23 C31 25 30 29 26 29 C23 29 22 26 24 24" stroke={stroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      );
    case 'frost_4': // 절대영도
      return (
        <>
          <line x1="24" y1="8" x2="24" y2="40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="16" x2="38" y2="32" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="38" y1="16" x2="10" y2="32" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <polygon points="24,17 30,20.5 30,27.5 24,31 18,27.5 18,20.5" fill={glow} fillOpacity="0.45" stroke={stroke} strokeWidth="1.5" />
        </>
      );
    case 'frost_5': // 영원의 빙하
      return (
        <>
          <polygon points="24,7 34,19 30,38 18,38 14,19" fill={glow} fillOpacity="0.34" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <polyline points="24,7 24,38" stroke={stroke} strokeWidth="1.4" opacity="0.75" />
          <polyline points="14,19 24,25 34,19" stroke={stroke} strokeWidth="1.4" fill="none" opacity="0.75" />
          <polygon points="10,27 14,22 15,36 9,36" fill={glow} fillOpacity="0.25" stroke={stroke} strokeWidth="1.4" />
          <polygon points="38,27 34,22 33,36 39,36" fill={glow} fillOpacity="0.25" stroke={stroke} strokeWidth="1.4" />
        </>
      );

    // ===== 뇌전 =====
    case 'thunder_1': // 스파크
      return (
        <>
          <polygon points="27,8 14,25 23,25 19,40 34,21 25,21" fill={stroke} stroke="#fff8dc" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="13" cy="14" r="1.5" fill={stroke} />
          <circle cx="35" cy="34" r="1.5" fill={stroke} />
        </>
      );
    case 'thunder_2': // 연쇄 낙뢰
      return (
        <>
          <polyline points="19,8 12,21 19,21 14,35" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="32,12 24,25 31,25 26,39" stroke="#fff7d6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <line x1="19" y1="21" x2="25" y2="25" stroke={glow} strokeWidth="1.6" strokeDasharray="2 2" />
        </>
      );
    case 'thunder_3': // 뇌운 소환
      return (
        <>
          <path d="M13 21 C10 21 9 18 11 15 C12 12 16 11 19 12 C21 9 27 9 29 12 C33 12 36 15 35 19 C35 21 33 21 31 21 Z" fill={glow} fillOpacity="0.32" stroke={stroke} strokeWidth="1.8" />
          <polyline points="16,23 13,30 17,30 14,38" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="25,22 22,30 26,30 23,39" stroke="#fff7d6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="33,23 30,30 34,30 31,37" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case 'thunder_4': // 천벌의 창
      return (
        <>
          <line x1="11" y1="37" x2="35" y2="13" stroke="#fff7d6" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="38,10 34,20 28,14" fill={stroke} />
          <polyline points="15,24 22,22 20,28 29,25" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case 'thunder_5': // 뇌신의 강림
      return (
        <>
          <circle cx="24" cy="24" r="14" stroke={glow} strokeWidth="1.5" strokeDasharray="4 2.5" fill="none" />
          <polygon points="24,7 17,22 23,22 19,40 32,21 26,21" fill="#fff7d6" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <polyline points="10,16 15,22 11,29" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <polyline points="38,16 33,22 37,29" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      );

    // ===== 대지·사령 =====
    case 'earth_1': // 암석 파편
      return (
        <>
          <polygon points="24,10 34,19 30,34 16,35 12,21" fill={glow} fillOpacity="0.34" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <polyline points="24,10 22,23 30,34" stroke={stroke} strokeWidth="1.4" fill="none" />
          <line x1="12" y1="21" x2="22" y2="23" stroke={stroke} strokeWidth="1.4" />
        </>
      );
    case 'earth_2': // 가시 방벽
      return (
        <>
          <path d="M24 9 L36 14 L34 29 L24 39 L14 29 L12 14 Z" fill={glow} fillOpacity="0.32" stroke={stroke} strokeWidth="2" />
          <polyline points="15,15 10,11 M33,15 38,11 M14,27 8,28 M34,27 40,28" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 16 L24 31 M19 22 L29 22" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case 'earth_3': // 대지의 구속
      return (
        <>
          <polygon points="20,38 22,12 26,12 28,38" fill={glow} fillOpacity="0.36" stroke={stroke} strokeWidth="1.8" />
          <path d="M12 34 C14 25 22 25 24 20 C26 15 34 15 36 10" stroke={stroke} strokeWidth="2.1" strokeLinecap="round" fill="none" />
          <path d="M36 35 C34 27 26 28 24 23 C22 19 14 19 12 14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      );
    case 'earth_4': // 석화의 저주
      return (
        <>
          <path d="M9 24 C14 15 34 15 39 24 C34 33 14 33 9 24 Z" fill={glow} fillOpacity="0.28" stroke={stroke} strokeWidth="2" />
          <polygon points="24,18 29,24 24,30 19,24" fill={stroke} />
          <line x1="16" y1="13" x2="19" y2="17" stroke={stroke} strokeWidth="1.6" />
          <line x1="32" y1="35" x2="29" y2="31" stroke={stroke} strokeWidth="1.6" />
        </>
      );
    case 'earth_5': // 망자의 성채
      return (
        <>
          <path d="M11 38 L11 16 L16 16 L16 20 L21 20 L21 12 L27 12 L27 20 L32 20 L32 16 L37 16 L37 38 Z" fill={glow} fillOpacity="0.35" stroke={stroke} strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M21 38 L21 29 C21 26 27 26 27 29 L27 38" fill="#0e1612" stroke={stroke} strokeWidth="1.6" />
        </>
      );

    // ===== 결계·정령 =====
    case 'ward_1': // 실디의 방패
      return (
        <>
          <polygon points="24,8 37,16 37,32 24,40 11,32 11,16" fill={glow} fillOpacity="0.26" stroke={stroke} strokeWidth="2" />
          <polygon points="24,15 31,19 31,29 24,33 17,29 17,19" fill="none" stroke={stroke} strokeWidth="1.4" opacity="0.8" />
        </>
      );
    case 'ward_2': // 마력 증폭
      return (
        <>
          <path d="M24 8 L28 19 L39 23 L28 27 L24 38 L20 27 L9 23 L20 19 Z" fill={glow} fillOpacity="0.32" stroke={stroke} strokeWidth="1.8" />
          <polyline points="17,14 24,7 31,14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      );
    case 'ward_3': // 원혼의 거울
      return (
        <>
          <ellipse cx="24" cy="24" rx="11" ry="15" fill={glow} fillOpacity="0.24" stroke={stroke} strokeWidth="2" />
          <line x1="18" y1="18" x2="29" y2="29" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" />
          <line x1="20" y1="14" x2="26" y2="20" stroke={stroke} strokeWidth="1.3" opacity="0.7" />
        </>
      );
    case 'ward_4': // 별빛 결계
      return (
        <>
          <circle cx="24" cy="24" r="14" fill={glow} fillOpacity="0.2" stroke={stroke} strokeWidth="1.8" />
          <polygon points="24,11 35,30 13,30" fill="none" stroke={stroke} strokeWidth="1.5" />
          <polygon points="24,37 35,18 13,18" fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="24" r="2.8" fill={stroke} />
        </>
      );

    // ===== 성광·치유 =====
    case 'holy_1': // 빛의 손길
      return (
        <>
          <path d="M24 9 L24 39 M12 21 L36 21" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="24" cy="21" r="6" fill={glow} fillOpacity="0.35" stroke={stroke} strokeWidth="1.5" />
        </>
      );
    case 'holy_2': // 성수의 정화
      return (
        <>
          <path d="M24 9 C24 9 34 21 34 28 C34 34 29.5 38 24 38 C18.5 38 14 34 14 28 C14 21 24 9 24 9 Z" fill={glow} fillOpacity="0.32" stroke={stroke} strokeWidth="2" />
          <path d="M24 20 L24 32 M19 26 L29 26" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'holy_3': // 여신의 재생
      return (
        <>
          <path d="M11 24 C11 16 17 12 24 18 C31 12 37 16 37 24 C37 31 24 38 24 38 C24 38 11 31 11 24 Z" fill={glow} fillOpacity="0.3" stroke={stroke} strokeWidth="1.9" />
          <ellipse cx="24" cy="11" rx="7" ry="2.2" fill="none" stroke={stroke} strokeWidth="1.6" />
        </>
      );
    case 'holy_4': // 성광의 축복
      return (
        <>
          <circle cx="24" cy="24" r="13" stroke={stroke} strokeWidth="1.5" strokeDasharray="3 2" fill={glow} fillOpacity="0.2" />
          <path d="M24 7 L27 21 L41 24 L27 27 L24 41 L21 27 L7 24 L21 21 Z" fill={stroke} />
          <circle cx="24" cy="24" r="3" fill="#2c2212" />
        </>
      );

    // ===== 흑마법 =====
    case 'dark_1': // 영혼 착취
      return (
        <>
          <path d="M29 10 C18 11 13 22 18 32 C22 39 32 39 36 33 C28 35 22 29 22 22 C22 16 25 12 29 10 Z" fill={glow} fillOpacity="0.4" stroke={stroke} strokeWidth="1.9" />
          <circle cx="30" cy="23" r="4" fill={stroke} />
        </>
      );
    case 'dark_2': // 피의 서약
      return (
        <>
          <path d="M15 12 L33 12 L30 24 C29 28 26 30 24 30 C22 30 19 28 18 24 Z" fill={glow} fillOpacity="0.4" stroke={stroke} strokeWidth="2" />
          <line x1="24" y1="30" x2="24" y2="38" stroke={stroke} strokeWidth="2.2" />
          <line x1="17" y1="38" x2="31" y2="38" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M24 15 C26 19 26 22 24 24 C22 22 22 19 24 15 Z" fill="#fff0f4" />
        </>
      );
    case 'dark_3': // 심연의 낙인
      return (
        <>
          <polygon points="24,8 38,34 10,34" fill={glow} fillOpacity="0.26" stroke={stroke} strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M16 26 C20 21 28 21 32 26 C28 31 20 31 16 26 Z" fill="#130912" stroke={stroke} strokeWidth="1.6" />
          <line x1="24" y1="22.5" x2="24" y2="29.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'dark_4': // 종말의 별
      return (
        <>
          <circle cx="24" cy="24" r="13.5" fill="#0d0610" stroke={stroke} strokeWidth="2" />
          <path d="M24 6 L27 19 L40 24 L27 29 L24 42 L21 29 L8 24 L21 19 Z" fill={glow} fillOpacity="0.55" stroke={stroke} strokeWidth="1.5" />
          <circle cx="24" cy="24" r="4.5" fill="#0b050d" stroke="#ffe1e8" strokeWidth="1.4" />
        </>
      );
    default:
      return (
        <path d="M24 10 L28 20 L38 24 L28 28 L24 38 L20 28 L10 24 L20 20 Z" fill={glow} fillOpacity="0.4" stroke={stroke} strokeWidth="1.8" />
      );
  }
};

export const SkillIcon: React.FC<{
  skillId: string;
  category: MagicCategory;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
  rune?: SkillRuneBranch | null;
  variant?: 'square' | 'coin';
}> = ({
  skillId,
  category,
  size = 'md',
  locked = false,
  rune = null,
  variant = 'square',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const pal = CAT_PALETTE[category];
  const px = size === 'sm' ? 24 : size === 'lg' ? 44 : 38;
  const gradId = `sg_${skillId}_${size}`;
  const artUrl = getSkillArtUrl(skillId);
  const showArt = Boolean(artUrl) && !imgFailed;

  return (
    <div
      className={`skill-icon-box skill-icon-${size} skill-icon-${variant} ${locked ? 'locked' : ''} ${rune ? 'has-rune' : ''} ${showArt ? 'is-watercolor' : ''}`}
      style={{ borderColor: pal.border }}
      aria-hidden="true"
    >
      {showArt ? (
        <img
          className="skill-icon-img"
          src={artUrl!}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg width={px} height={px} viewBox="0 0 48 48" fill="none">
          <defs>
            <radialGradient id={gradId} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor={pal.bg1} />
              <stop offset="100%" stopColor={pal.bg2} />
            </radialGradient>
          </defs>
          <rect x="1" y="1" width="46" height="46" rx="8" fill={`url(#${gradId})`} />
          <rect
            x="3.5"
            y="3.5"
            width="41"
            height="41"
            rx="6"
            stroke={pal.border}
            strokeWidth="0.9"
            opacity="0.55"
          />
          {renderGlyph(skillId, pal.stroke, pal.glow)}
        </svg>
      )}
      {rune && (
        <span className="skill-rune-pip" title={`각성 룬 ${rune.toUpperCase()}`}>
          {rune.toUpperCase()}
        </span>
      )}
    </div>
  );
};

export const SpellImpactVfx: React.FC<{ vfx: SpellVfxEvent }> = ({ vfx }) => {
  const cat = vfx.category;
  return (
    <div
      key={`impact_${vfx.id}`}
      className={`spell-impact-layer impact-${cat} ${vfx.isCrit ? 'impact-crit' : ''}`}
      aria-hidden="true"
    >
      {cat === 'thunder' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <polyline
            points="78,4 48,46 66,48 34,114"
            stroke="#d8b45c"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.55"
          />
          <polyline
            points="78,4 48,46 66,48 34,114"
            stroke="#fffbe6"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <polyline
            points="54,40 24,58 32,74"
            stroke="#ffe38d"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <polyline
            points="64,52 94,72 82,92"
            stroke="#ffe38d"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="56" cy="58" r="24" stroke="#ffe38d" strokeWidth="2.2" fill="none" opacity="0.8" />
        </svg>
      )}

      {cat === 'flame' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <circle cx="60" cy="60" r="34" fill="#d95b38" fillOpacity="0.28" stroke="#f08a5d" strokeWidth="2.5" />
          <path
            d="M60 14 C72 34 92 46 86 74 C82 92 68 102 60 102 C44 102 32 88 34 66 C36 46 50 32 60 14 Z"
            fill="#1f0a0e"
            fillOpacity="0.55"
            stroke="#ff9d6e"
            strokeWidth="3"
          />
          <path
            d="M60 36 C68 48 72 64 60 84 C48 68 50 52 60 36 Z"
            fill="#ffd6a8"
            fillOpacity="0.88"
          />
        </svg>
      )}

      {cat === 'frost' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <polygon points="60,12 72,46 106,60 72,74 60,108 48,74 14,60 48,46" fill="#6bb4cf" fillOpacity="0.34" stroke="#d8f4ff" strokeWidth="2.5" />
          <polygon points="60,28 84,60 60,92 36,60" fill="#e6f9ff" fillOpacity="0.45" stroke="#ffffff" strokeWidth="2" />
          <line x1="22" y1="22" x2="98" y2="98" stroke="#c4ecfa" strokeWidth="2" opacity="0.8" />
          <line x1="98" y1="22" x2="22" y2="98" stroke="#c4ecfa" strokeWidth="2" opacity="0.8" />
        </svg>
      )}

      {cat === 'earth' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <polygon points="24,104 40,36 52,104" fill="#2c4a35" fillOpacity="0.72" stroke="#a7ddb5" strokeWidth="2.4" />
          <polygon points="48,104 62,18 76,104" fill="#3a6346" fillOpacity="0.78" stroke="#c6f2d0" strokeWidth="2.6" />
          <polygon points="70,104 86,42 98,104" fill="#2c4a35" fillOpacity="0.72" stroke="#a7ddb5" strokeWidth="2.4" />
          <ellipse cx="60" cy="96" rx="44" ry="10" stroke="#a7ddb5" strokeWidth="2.2" fill="none" />
        </svg>
      )}

      {cat === 'ward' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <polygon points="60,12 102,36 102,84 60,108 18,84 18,36" fill="#9cb0c9" fillOpacity="0.24" stroke="#e4eef9" strokeWidth="2.8" />
          <polygon points="60,26 88,42 88,78 60,94 32,78 32,42" fill="none" stroke="#c2d6ed" strokeWidth="1.8" strokeDasharray="5 3" />
        </svg>
      )}

      {cat === 'holy' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <rect x="44" y="6" width="32" height="108" fill="#e6cf98" fillOpacity="0.24" />
          <path d="M60 12 L66 52 L106 60 L66 68 L60 108 L54 68 L14 60 L54 52 Z" fill="#fff6d6" fillOpacity="0.88" stroke="#e6cf98" strokeWidth="2" />
          <circle cx="60" cy="60" r="32" stroke="#fff2c4" strokeWidth="2" fill="none" opacity="0.75" />
        </svg>
      )}

      {cat === 'dark' && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <circle cx="60" cy="60" r="32" fill="#0f0612" fillOpacity="0.65" stroke="#d96c84" strokeWidth="2.8" />
          <path d="M16 96 Q58 54 104 20" stroke="#ff9db2" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M24 22 Q62 60 98 98" stroke="#b55264" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </svg>
      )}

      {(cat === 'basic' || cat === 'enemy') && (
        <svg viewBox="0 0 120 120" className="impact-svg">
          <path
            d="M22 92 Q58 58 98 26"
            stroke={cat === 'enemy' ? '#ef7f83' : '#e3c481'}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="22"
            stroke={cat === 'enemy' ? '#ef7f83' : '#e3c481'}
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
        </svg>
      )}
    </div>
  );
};
