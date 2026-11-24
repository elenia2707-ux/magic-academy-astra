import React from 'react';
import type { FamiliarId, Gender, MagicCategory, SchoolId } from '../types/game';
import { CATEGORY_META, SCHOOLS } from '../data/schools';

export const AstraCrestSvg: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="44" stroke="#c8a45d" strokeWidth="1.8" opacity="0.7" />
    <circle
      cx="50"
      cy="50"
      r="36"
      stroke="#c8a45d"
      strokeWidth="1"
      strokeDasharray="3 3"
      opacity="0.55"
    />
    <path
      d="M50 10 L57 42 L89 50 L57 58 L50 90 L43 58 L11 50 L43 42 Z"
      fill="#c8a45d"
    />
    <path
      d="M50 26 L54 46 L74 50 L54 54 L50 74 L46 54 L26 50 L46 46 Z"
      fill="#111015"
    />
    <circle cx="50" cy="50" r="5" fill="#e3c481" />
  </svg>
);

export const PlayerSilhouetteSvg: React.FC<{
  school: SchoolId;
  gender: Gender;
  size?: number;
}> = ({ school, gender, size = 72 }) => {
  const accent = SCHOOLS[school].color;
  return (
    <svg width={size} height={size} viewBox="0 0 100 110" fill="none">
      {/* 고딕 후광 문양 */}
      <circle cx="50" cy="40" r="28" stroke={accent} strokeWidth="1.2" opacity="0.38" />
      <path
        d="M50 8 L54 22 L68 26 L54 30 L50 44 L46 30 L32 26 L46 22 Z"
        fill={accent}
        opacity="0.22"
      />
      {/* 망토 및 어깨 실루엣 */}
      {gender === 'male' ? (
        <>
          {/* 남캐: 각진 하이칼라 고딕 코트 & 지팡이 */}
          <path
            d="M20 106 L27 64 C30 56 38 53 50 53 C62 53 70 56 73 64 L80 106 Z"
            fill="#15141c"
            stroke="#c8a45d"
            strokeWidth="1.4"
          />
          <path d="M36 54 L50 70 L64 54" stroke={accent} strokeWidth="1.8" />
          {/* 짧은 샤프 헤어 + 얼굴 실루엣 */}
          <ellipse cx="50" cy="36" rx="12" ry="14" fill="#1c1a24" stroke="#d8cfc0" strokeWidth="1.2" />
          <path
            d="M36 34 C36 21 44 17 52 17 C61 17 65 24 64 35 L60 28 L53 26 L44 29 Z"
            fill="#0b0a0f"
            stroke={accent}
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          {/* 여캐: 유려한 후드 망토 & 긴 머리카락 실루엣 */}
          <path
            d="M23 106 L31 63 C34 55 41 53 50 53 C59 53 66 55 69 63 L77 106 Z"
            fill="#15141c"
            stroke="#c8a45d"
            strokeWidth="1.4"
          />
          <path
            d="M34 33 C30 48 31 66 36 74 M66 33 C70 48 69 66 64 74"
            stroke="#0b0a0f"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path d="M39 55 L50 72 L61 55" stroke={accent} strokeWidth="1.8" />
          <ellipse cx="50" cy="36" rx="11.5" ry="13.5" fill="#1c1a24" stroke="#d8cfc0" strokeWidth="1.2" />
          <path
            d="M36 36 C36 21 43 16 50 16 C57 16 64 21 64 36 C60 28 55 25 50 25 C45 25 40 28 36 36 Z"
            fill="#0b0a0f"
            stroke={accent}
            strokeWidth="1"
          />
          {/* 마녀 리본/별 장식 */}
          <circle cx="50" cy="20" r="3" fill={accent} />
        </>
      )}
      {/* 눈빛 */}
      <circle cx="45.5" cy="37" r="1.4" fill={accent} />
      <circle cx="54.5" cy="37" r="1.4" fill={accent} />
      {/* 지팡이 & 학파 마력 오브 */}
      <line x1="78" y1="24" x2="74" y2="104" stroke="#c8a45d" strokeWidth="2.2" />
      <circle cx="78" cy="21" r="6" fill={accent} opacity="0.88" />
      <circle cx="78" cy="21" r="2.5" fill="#fff7e6" />
    </svg>
  );
};

export const MonsterSilhouetteSvg: React.FC<{
  artKey: string;
  isBoss?: boolean;
  size?: number;
}> = ({ artKey, isBoss, size = 74 }) => {
  const glow = isBoss ? '#cf4c50' : '#c8a45d';

  return (
    <svg width={size} height={size} viewBox="0 0 100 105" fill="none">
      {isBoss && (
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="#cf4c50"
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity="0.45"
        />
      )}
      {artKey === 'slime' && (
        <>
          <path
            d="M22 76 C20 48 34 32 50 32 C66 32 80 48 78 76 C78 86 22 86 22 76 Z"
            fill="#1e2428"
            stroke="#6bb4cf"
            strokeWidth="1.8"
          />
          <circle cx="41" cy="57" r="3" fill="#e3c481" />
          <circle cx="59" cy="57" r="3" fill="#e3c481" />
        </>
      )}
      {artKey === 'bat' && (
        <>
          <path
            d="M12 46 Q30 28 44 46 L50 36 L56 46 Q70 28 88 46 Q72 62 60 58 L50 72 L40 58 Q28 62 12 46 Z"
            fill="#1b161d"
            stroke="#d95b38"
            strokeWidth="1.6"
          />
          <circle cx="46" cy="49" r="2" fill="#f0786c" />
          <circle cx="54" cy="49" r="2" fill="#f0786c" />
        </>
      )}
      {artKey === 'goblin' && (
        <>
          <path
            d="M28 42 L16 34 L30 50 C30 62 38 72 50 72 C62 72 70 62 70 50 L84 34 L72 42 C68 28 32 28 28 42 Z"
            fill="#1c1f1a"
            stroke="#c8a45d"
            strokeWidth="1.6"
          />
          <circle cx="42" cy="49" r="2.5" fill="#d95b38" />
          <circle cx="58" cy="49" r="2.5" fill="#d95b38" />
          <path d="M35 88 L42 71 L58 71 L65 88 Z" fill="#15141a" stroke="#8b8479" strokeWidth="1.4" />
        </>
      )}
      {(artKey === 'golem' || artKey === 'boss_golem') && (
        <>
          <polygon
            points="50,14 78,34 84,78 62,92 38,92 16,78 22,34"
            fill="#1c1820"
            stroke={glow}
            strokeWidth="2"
          />
          <polygon points="50,24 62,46 50,58 38,46" fill={isBoss ? '#a83236' : '#6ca67a'} opacity="0.65" />
          <rect x="37" y="40" width="8" height="4" fill="#ffe299" />
          <rect x="55" y="40" width="8" height="4" fill="#ffe299" />
        </>
      )}
      {(artKey === 'wraith' || artKey === 'boss_wraith') && (
        <>
          <path
            d="M50 14 C68 14 76 32 74 60 L80 92 L64 82 L50 94 L36 82 L20 92 L26 60 C24 32 32 14 50 14 Z"
            fill="#14131c"
            stroke={glow}
            strokeWidth="1.8"
          />
          <path d="M38 38 L46 43 L38 45 Z" fill="#e6cf98" />
          <path d="M62 38 L54 43 L62 45 Z" fill="#e6cf98" />
          <path d="M36 62 L64 62" stroke={glow} strokeWidth="1.2" opacity="0.5" />
        </>
      )}
      {artKey === 'mimic' && (
        <>
          <rect x="20" y="34" width="60" height="48" rx="6" fill="#1e1916" stroke="#c8a45d" strokeWidth="2" />
          <path d="M20 54 L32 62 L44 54 L56 62 L68 54 L80 62" stroke="#ede7da" strokeWidth="2" />
          <circle cx="38" cy="44" r="3" fill="#cf4c50" />
          <circle cx="62" cy="44" r="3" fill="#cf4c50" />
        </>
      )}
      {(artKey === 'knight' || artKey === 'boss_knight') && (
        <>
          <path
            d="M32 22 L50 12 L68 22 L66 50 L50 58 L34 50 Z"
            fill="#191a22"
            stroke={glow}
            strokeWidth="1.8"
          />
          <path d="M22 94 L30 58 L70 58 L78 94 Z" fill="#14141b" stroke="#9a9386" strokeWidth="1.6" />
          <line x1="38" y1="36" x2="62" y2="36" stroke="#cf4c50" strokeWidth="2.5" />
          <line x1="82" y1="16" x2="76" y2="94" stroke="#d8cfc0" strokeWidth="2.2" />
        </>
      )}
      {(artKey === 'witch' || artKey === 'boss_witch') && (
        <>
          <path d="M50 10 L76 42 L24 42 Z" fill="#17141e" stroke={glow} strokeWidth="1.8" />
          <ellipse cx="50" cy="43" rx="34" ry="6" fill="#1b1724" stroke={glow} strokeWidth="1.4" />
          <path d="M32 48 L24 94 L76 94 L68 48 Z" fill="#131119" stroke="#9a9386" strokeWidth="1.4" />
          <circle cx="43" cy="56" r="2.2" fill="#e6cf98" />
          <circle cx="57" cy="56" r="2.2" fill="#e6cf98" />
        </>
      )}
      {artKey === 'beast' && (
        <>
          <path
            d="M24 22 L38 36 L62 36 L76 22 L78 58 L64 82 L50 88 L36 82 L22 58 Z"
            fill="#1a171c"
            stroke="#c8a45d"
            strokeWidth="1.8"
          />
          <circle cx="40" cy="50" r="2.8" fill="#cf4c50" />
          <circle cx="60" cy="50" r="2.8" fill="#cf4c50" />
          <path d="M40 68 L45 74 L50 68 L55 74 L60 68" stroke="#ede7da" strokeWidth="1.8" />
        </>
      )}
      {artKey === 'elemental' && (
        <>
          <path
            d="M50 12 L72 44 L62 84 L50 92 L38 84 L28 44 Z"
            fill="#1b1822"
            stroke="#d95b38"
            strokeWidth="1.8"
          />
          <circle cx="50" cy="48" r="12" fill="#d95b38" opacity="0.45" />
          <circle cx="50" cy="48" r="5" fill="#fff2d6" />
        </>
      )}
      {artKey === 'archmage' && (
        <>
          <path d="M26 94 L34 46 L50 22 L66 46 L74 94 Z" fill="#15141d" stroke="#e3c481" strokeWidth="1.8" />
          <circle cx="50" cy="36" r="11" fill="#0d0c11" stroke="#e3c481" strokeWidth="1.4" />
          <path d="M50 8 L53 18 L63 21 L53 24 L50 34 L47 24 L37 21 L47 18 Z" fill="#e3c481" />
        </>
      )}
      {(artKey === 'boss_demon' || artKey === 'demon_lord') && (
        <>
          {/* 거대 뿔과 왕관 실루엣 */}
          <path
            d="M24 14 C16 28 22 44 34 46 M76 14 C84 28 78 44 66 46"
            stroke="#cf4c50"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M32 34 L50 22 L68 34 L76 92 L50 84 L24 92 Z"
            fill="#151118"
            stroke="#cf4c50"
            strokeWidth="2"
          />
          <path d="M38 46 L46 50 L38 52 Z" fill="#ffcf75" />
          <path d="M62 46 L54 50 L62 52 Z" fill="#ffcf75" />
          {artKey === 'demon_lord' && (
            <path d="M36 22 L43 10 L50 20 L57 10 L64 22" stroke="#e3c481" strokeWidth="2.2" />
          )}
        </>
      )}
    </svg>
  );
};

export const FamiliarSilhouetteSvg: React.FC<{ id: FamiliarId; size?: number }> = ({
  id,
  size = 36,
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {id === 'raven' && (
        <>
          <path d="M10 34 Q24 16 36 26 L54 22 L44 32 Q50 44 32 48 Q18 46 10 34 Z" fill="#18171f" stroke="#c8a45d" strokeWidth="2" />
          <circle cx="38" cy="28" r="2" fill="#e3c481" />
        </>
      )}
      {id === 'golem' && (
        <>
          <rect x="18" y="16" width="28" height="32" rx="6" fill="#1e1d24" stroke="#8fa6bc" strokeWidth="2" />
          <circle cx="27" cy="28" r="2.5" fill="#e3c481" />
          <circle cx="37" cy="28" r="2.5" fill="#e3c481" />
          <line x1="24" y1="38" x2="40" y2="38" stroke="#c5bdb0" strokeWidth="2" />
        </>
      )}
      {id === 'wisp' && (
        <>
          <path d="M32 10 C44 24 46 38 32 52 C18 38 20 24 32 10 Z" fill="#213542" stroke="#6bb4cf" strokeWidth="2" />
          <circle cx="32" cy="34" r="6" fill="#9de1f5" />
        </>
      )}
      {id === 'wolf' && (
        <>
          <path d="M18 16 L26 26 L38 26 L46 16 L48 40 L32 52 L16 40 Z" fill="#16151d" stroke="#d8b45c" strokeWidth="2" />
          <circle cx="26" cy="34" r="2" fill="#f0ca72" />
          <circle cx="38" cy="34" r="2" fill="#f0ca72" />
        </>
      )}
      {id === 'owl' && (
        <>
          <ellipse cx="32" cy="34" rx="16" ry="18" fill="#182026" stroke="#6bb4cf" strokeWidth="2" />
          <circle cx="26" cy="29" r="3" fill="#e3c481" />
          <circle cx="38" cy="29" r="3" fill="#e3c481" />
          <path d="M30 35 L32 39 L34 35 Z" fill="#c8a45d" />
        </>
      )}
      {id === 'bat' && (
        <>
          <path d="M8 30 Q20 18 28 30 L32 24 L36 30 Q44 18 56 30 Q46 42 36 38 L32 46 L28 38 Q18 42 8 30 Z" fill="#211417" stroke="#d95b38" strokeWidth="2" />
          <circle cx="29" cy="32" r="1.8" fill="#f08a8e" />
          <circle cx="35" cy="32" r="1.8" fill="#f08a8e" />
        </>
      )}
    </svg>
  );
};

export const CategoryDot: React.FC<{ category: MagicCategory }> = ({ category }) => (
  <span
    style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: CATEGORY_META[category].color,
      flexShrink: 0,
    }}
  />
);
