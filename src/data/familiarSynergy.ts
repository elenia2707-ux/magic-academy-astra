import type { FamiliarId, MagicCategory, SchoolId } from '../types/game';

export interface FamiliarSynergyDef {
  familiarId: FamiliarId;
  schools: SchoolId[] | 'all';
  name: string;
  badgeLabel: string;
  effectDesc: string;
  actionName: string;
  loreNote: string;
  passive: {
    magicPct?: number;
    defPct?: number;
    critDmgBonus?: number;
    mpRegen?: number;
    elementBonus?: { category: MagicCategory; pct: number };
  };
}

export const FAMILIAR_SYNERGIES: Record<FamiliarId, FamiliarSynergyDef> = {
  bat: {
    familiarId: 'bat',
    schools: ['flame'],
    name: '혈월의 화로 계약',
    badgeLabel: '흑염 학파 공명',
    effectDesc: '화염 위력 +14% · 박쥐 피해/흡혈 +35% · 발동 시 별빛 +6%',
    actionName: '흑염 흡혈 급습',
    loreNote:
      '카렌 교수의 비망록: "흑염 화로 굴뚝이 또 막혔길래 잿덩이인 줄 알고 부지깽이로 찔렀더니, 박쥐가 하품하며 불티를 뱉었다. 이제 굴뚝 청소는 녀석의 수면 시간표에 맞추고 있다."',
    passive: {
      elementBonus: { category: 'flame', pct: 14 },
    },
  },
  owl: {
    familiarId: 'owl',
    schools: ['frost'],
    name: '백야의 겨울 서약',
    badgeLabel: '서리 학파 공명',
    effectDesc: '빙결 위력 +14% · 빙결 확률 +15%p · 빙결 시 마나 +12',
    actionName: '백야 서리 날개짓',
    loreNote:
      '세바스티안 교수의 채점 기록: "서리 영창 자세가 흐트러진 학생 뒤에서 저 올빼미가 고개를 180도 돌린 채 묵묵히 노려보고 있었다. 내 잔소리보다 교정 효과가 빨라서 일단 방치 중이다."',
    passive: {
      elementBonus: { category: 'frost', pct: 14 },
    },
  },
  wolf: {
    familiarId: 'wolf',
    schools: ['thunder'],
    name: '폭풍 송곳니 추격',
    badgeLabel: '뇌전 학파 공명',
    effectDesc: '치명 피해 +25% · 치명률 +15%p · 습격 시 적 감전(2턴)',
    actionName: '그림자 뇌격 습격',
    loreNote:
      '볼타 교수의 실기 일지: "뇌전 실기시험만 시작하면 정전기 때문에 늑대 털이 사방으로 곤두서서 영락없는 검은 성게가 된다. 쓰다듬으려다 손가락이 저린 조교만 이번 학기에 셋이다."',
    passive: {
      critDmgBonus: 25,
    },
  },
  golem: {
    familiarId: 'golem',
    schools: ['earth'],
    name: '석비의 철벽 공명',
    badgeLabel: '대지 학파 공명',
    effectDesc: '방어력 +15% · 보호막 +35% · 전개 시 반사(30%, 2턴)',
    actionName: '고대 뼈 방벽 전개',
    loreNote:
      '모르덴 교수의 비품 대장: "지하 교실의 해부용 해골 표본 두 구가 분실됐다고 보고받았으나, 다음 날 야간 순찰 중인 골렘의 어깨에서 번호표가 달린 갈비뼈를 발견했다. 충성심 하나는 가상하군."',
    passive: {
      defPct: 15,
    },
  },
  raven: {
    familiarId: 'raven',
    schools: 'all',
    name: '심연 전령의 눈',
    badgeLabel: '전 학파 공명',
    effectDesc: '마력 +6% · 저주 강화 · 보스전 사역마/스킬 피해 증가',
    actionName: '심연 급소 강하',
    loreNote:
      '마르타 사서장의 경고문: "일반 까마귀는 반짝이는 동전을 훔치지만, 아스트라의 까마귀는 금서 연체 독촉장만 골라 물어간다. 공범으로 의심되는 학생은 연체료와 깃털 청소비를 함께 납부할 것."',
    passive: {
      magicPct: 6,
    },
  },
  wisp: {
    familiarId: 'wisp',
    schools: 'all',
    name: '성좌 등불의 교감',
    badgeLabel: '전 학파 공명',
    effectDesc: '턴당 마나 회복 +3 · 발동 시 별빛 공명 +8% 추가 충전',
    actionName: '성좌 영혼 숨결',
    loreNote:
      '루시아 교수의 기숙사 순찰 메모: "통금 등불을 깜박한 신입생의 머리 위를 영혼불이 예의 바르게 떠다니며 길을 비춰 주었다. 다만 사감 앞에서도 꺼지지 않아 무단 외출을 친절히 자수시켜 주곤 한다."',
    passive: {
      mpRegen: 3,
    },
  },
};

const SCHOOL_RECOMMENDED_FAMILIAR: Record<SchoolId, FamiliarId> = {
  flame: 'bat',
  frost: 'owl',
  thunder: 'wolf',
  earth: 'golem',
};

export function getFamiliarSynergy(familiarId: FamiliarId): FamiliarSynergyDef {
  return FAMILIAR_SYNERGIES[familiarId];
}

export function isFamiliarSynergyActive(
  familiarId: FamiliarId | null | undefined,
  school: SchoolId,
): boolean {
  if (!familiarId) return false;
  const def = FAMILIAR_SYNERGIES[familiarId];
  if (!def) return false;
  return def.schools === 'all' || def.schools.includes(school);
}

export function getActiveFamiliarSynergy(
  familiarId: FamiliarId | null | undefined,
  school: SchoolId,
): FamiliarSynergyDef | null {
  if (!familiarId || !isFamiliarSynergyActive(familiarId, school)) return null;
  return FAMILIAR_SYNERGIES[familiarId];
}

export function getRecommendedFamiliarForSchool(school: SchoolId): FamiliarId {
  return SCHOOL_RECOMMENDED_FAMILIAR[school];
}
