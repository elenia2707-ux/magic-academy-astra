import type { SchoolId } from '../types/game';

export const STARLIGHT_MAX = 100;
export const STARLIGHT_GAIN_TURN = 16;
export const STARLIGHT_GAIN_CRIT = 8;
export const STARLIGHT_GAIN_HIT = 10;
export const STARLIGHT_PERFECT_MULT = 1.45;
export const STARLIGHT_PERFECT_REFUND = 25;

export interface StarlightSkillDef {
  school: SchoolId;
  name: string;
  shortDesc: string;
  perfectHint: string;
  powerPct: number;
  hits: number;
  bonusCrit: number;
  accentColor: string;
}

export const STARLIGHT_SKILLS: Record<SchoolId, StarlightSkillDef> = {
  flame: {
    school: 'flame',
    name: '잿빛 연옥의 낙인',
    shortDesc: '흑염 폭격 · 화상 · 마력↑',
    perfectHint: '예고 파훼 · 피해 +45% & 강화 화상',
    powerPct: 340,
    hits: 1,
    bonusCrit: 25,
    accentColor: '#d95b38',
  },
  frost: {
    school: 'frost',
    name: '백야의 절대영도',
    shortDesc: '서리 폭격 · 확정 빙결 · 회복',
    perfectHint: '예고 파훼 · 2턴 빙결 & 대량 회복',
    powerPct: 290,
    hits: 1,
    bonusCrit: 15,
    accentColor: '#6bb4cf',
  },
  thunder: {
    school: 'thunder',
    name: '성좌 심판의 낙뢰',
    shortDesc: '3연 낙뢰 · 감전 · 쿨타임 단축',
    perfectHint: '예고 파훼 · 3연 낙뢰 +45% & 쿨 -2턴',
    powerPct: 115,
    hits: 3,
    bonusCrit: 35,
    accentColor: '#d8b45c',
  },
  earth: {
    school: 'earth',
    name: '고대 석비의 천벌',
    shortDesc: '대지 강타 · 대보호막 · 반사·저주',
    perfectHint: '예고 파훼 · 보호막 증폭 & HP 20% 회복',
    powerPct: 270,
    hits: 1,
    bonusCrit: 10,
    accentColor: '#6ca67a',
  },
};
