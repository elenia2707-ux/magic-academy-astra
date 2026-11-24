import type { Gender, MagicCategory, MonsterDef, RankIndex, SchoolId } from '../types/game';

export interface SchoolInfo {
  id: SchoolId;
  name: string;
  shortName: string;
  originVillage: string;
  color: string;
  softColor: string;
  passiveDesc: string;
  starterSkillId: string;
  maleTitle: string;
  femaleTitle: string;
  maleQuote: string;
  femaleQuote: string;
  flavor: string;
  statWeights: {
    magicMult: number;
    hpMult: number;
    defMult: number;
    critBonus: number;
    mpRegenBonus: number;
  };
}

export const SCHOOLS: Record<SchoolId, SchoolInfo> = {
  flame: {
    id: 'flame',
    name: '흑염 학파',
    shortName: '흑염',
    originVillage: '잿빛 화로의 영지',
    color: '#d95b38',
    softColor: 'rgba(217, 91, 56, 0.16)',
    passiveDesc: '마력 +12%, 화염 마법 위력 +15%',
    starterSkillId: 'flame_1',
    maleTitle: '잿불의 후계자',
    femaleTitle: '흑염의 무녀',
    maleQuote: '꺼져가는 세계라면, 내 손의 불꽃으로 어둠째 태워버리겠어.',
    femaleQuote: '차가운 안개 따위, 잿빛 화염 앞에서는 한 줌 재에 불과해.',
    flavor: '화상을 중첩시키고 연옥의 불꽃으로 터뜨리는 고화력 학파입니다.',
    statWeights: { magicMult: 1.12, hpMult: 0.96, defMult: 0.95, critBonus: 3, mpRegenBonus: 0 },
  },
  frost: {
    id: 'frost',
    name: '영원한 서리 학파',
    shortName: '서리',
    originVillage: '백야의 설원 영지',
    color: '#6bb4cf',
    softColor: 'rgba(107, 180, 207, 0.16)',
    passiveDesc: '최대 마나 +18%, 턴당 마나 회복 +4, 빙결 위력 +15%',
    starterSkillId: 'frost_1',
    maleTitle: '설원의 기록자',
    femaleTitle: '겨울밤의 귀족',
    maleQuote: '감정에 휩쓸리면 죽는다. 얼음처럼 냉정하게 적의 숨통을 얼릴 뿐.',
    femaleQuote: '서리가 내린 자리엔 어떤 마수도 함부로 발을 들이지 못하죠.',
    flavor: '빙결로 적의 행동을 묶고 안정적인 마나 순환으로 장기전을 지배합니다.',
    statWeights: { magicMult: 1.04, hpMult: 1.02, defMult: 1.02, critBonus: 2, mpRegenBonus: 4 },
  },
  thunder: {
    id: 'thunder',
    name: '뇌전 학파',
    shortName: '뇌전',
    originVillage: '폭풍 첨탑의 영지',
    color: '#d8b45c',
    softColor: 'rgba(216, 180, 92, 0.16)',
    passiveDesc: '치명타 확률 +10%, 치명타 피해 +20%, 뇌전 위력 +15%',
    starterSkillId: 'thunder_1',
    maleTitle: '낙뢰의 추격자',
    femaleTitle: '폭풍의 현자 후보',
    maleQuote: '망설일 틈도 없이 끝내주지. 번개는 언제나 어둠보다 빠르니까.',
    femaleQuote: '하늘의 심판이 내려앉는 순간, 모든 저주는 산산이 부서질 거야.',
    flavor: '높은 치명타와 연쇄 감전으로 보스조차 단숨에 꿰뚫는 폭발형 학파입니다.',
    statWeights: { magicMult: 1.06, hpMult: 0.95, defMult: 0.96, critBonus: 10, mpRegenBonus: 2 },
  },
  earth: {
    id: 'earth',
    name: '침묵의 대지 학파',
    shortName: '대지',
    originVillage: '고대 석비의 숲',
    color: '#6ca67a',
    softColor: 'rgba(108, 166, 122, 0.16)',
    passiveDesc: '최대 체력 +18%, 방어력 +20%, 대지·사령 위력 +15%',
    starterSkillId: 'earth_1',
    maleTitle: '석비의 수호자',
    femaleTitle: '고목의 영매',
    maleQuote: '결코 무너지지 않는 성벽이 되겠다. 마지막 별빛이 살아남을 때까지.',
    femaleQuote: '대지와 망자들의 속삭임이 내 편인 한, 쓰러지는 건 저들일 테니까.',
    flavor: '견고한 방벽과 피해 반사, 독·저주로 강적을 말려 죽이는 생존 특화 학파입니다.',
    statWeights: { magicMult: 0.98, hpMult: 1.18, defMult: 1.2, critBonus: 0, mpRegenBonus: 1 },
  },
};

export const CATEGORY_META: Record<
  MagicCategory,
  { name: string; color: string; short: string; classroom: string }
> = {
  flame: { name: '흑염학', color: '#d95b38', short: '흑염', classroom: '흑염 화로 교실' },
  frost: { name: '빙결학', color: '#6bb4cf', short: '서리', classroom: '백야 서리 교실' },
  thunder: { name: '뇌전학', color: '#d8b45c', short: '뇌전', classroom: '폭풍 첨탑 교실' },
  earth: { name: '대지·사령학', color: '#6ca67a', short: '대지', classroom: '석비 지하 교실' },
  ward: { name: '결계·정령학', color: '#9cb0c9', short: '결계', classroom: '정령 결계 교실' },
  holy: { name: '성광·치유학', color: '#e6cf98', short: '성광', classroom: '성당 치유실' },
  dark: { name: '금제 흑마법', color: '#b55264', short: '흑마법', classroom: '금서 도서관' },
};

export interface RankInfo {
  rank: RankIndex;
  name: string;
  english: string;
  reqLevel: number;
  reqClearedAct: number; // 이전 막 요구 (0이면 없음)
  deckSlots: number;
  trainSlots: number;
  statMult: number;
  unlockNote: string;
}

export const RANKS: RankInfo[] = [
  {
    rank: 0,
    name: '견습생',
    english: 'Novice',
    reqLevel: 1,
    reqClearedAct: 0,
    deckSlots: 3,
    trainSlots: 1,
    statMult: 1.0,
    unlockNote: '기본 3스킬 슬롯 · 1수련 슬롯',
  },
  {
    rank: 1,
    name: '시전자',
    english: 'Caster',
    reqLevel: 8,
    reqClearedAct: 1,
    deckSlots: 4,
    trainSlots: 1,
    statMult: 1.28,
    unlockNote: '4번째 스킬 슬롯 · 사역마 사육실 해금',
  },
  {
    rank: 2,
    name: '정규 마법사',
    english: 'Mage',
    reqLevel: 18,
    reqClearedAct: 2,
    deckSlots: 4,
    trainSlots: 2,
    statMult: 1.65,
    unlockNote: '금서 도서관(흑마법) · 2번째 수련 슬롯 해금',
  },
  {
    rank: 3,
    name: '비술사',
    english: 'Arcanist',
    reqLevel: 30,
    reqClearedAct: 3,
    deckSlots: 5,
    trainSlots: 2,
    statMult: 2.15,
    unlockNote: '5번째 스킬 슬롯 · 고급 연금(옵션 재련) 해금',
  },
  {
    rank: 4,
    name: '심연 마도사',
    english: 'Abyss Magus',
    reqLevel: 44,
    reqClearedAct: 4,
    deckSlots: 5,
    trainSlots: 2,
    statMult: 2.85,
    unlockNote: '상위 흑마법 · 사역마 3단계 각성 해금',
  },
  {
    rank: 5,
    name: '대마도사',
    english: 'Archmage',
    reqLevel: 60,
    reqClearedAct: 5,
    deckSlots: 5,
    trainSlots: 2,
    statMult: 3.8,
    unlockNote: '6막 마왕전 개방 · 최고위 아스트라 마법 해금',
  },
];

// 다음 계급(1~5)으로 올라가기 위한 승급 시험 보스
export const RANK_EXAM_BOSSES: Record<number, MonsterDef> = {
  1: {
    id: 'exam_1',
    name: '석상 수호자 칼리온',
    title: '시전자 승급 시험관',
    artKey: 'golem',
    element: 'earth',
    hp: 950,
    atk: 46,
    def: 18,
    expReward: 260,
    stoneReward: 240,
    isBoss: true,
    isRankBoss: true,
    heavyInterval: 3,
    heavyName: '대지 분쇄타',
    heavyMult: 1.75,
  },
  2: {
    id: 'exam_2',
    name: '봉인 감시자 말라키',
    title: '정규 마법사 승급 시험관',
    artKey: 'wraith',
    element: 'dark',
    hp: 3400,
    atk: 118,
    def: 46,
    expReward: 950,
    stoneReward: 780,
    isBoss: true,
    isRankBoss: true,
    heavyInterval: 3,
    heavyName: '금서의 사슬',
    heavyMult: 1.9,
    statusOnHit: { type: 'curse', turns: 2, value: 0.15, chance: 0.4 },
  },
  3: {
    id: 'exam_3',
    name: '거울 마녀 이졸데',
    title: '비술사 승급 시험관',
    artKey: 'witch',
    element: 'frost',
    hp: 10800,
    atk: 265,
    def: 105,
    expReward: 2800,
    stoneReward: 2200,
    isBoss: true,
    isRankBoss: true,
    heavyInterval: 3,
    heavyName: '빙결 거울 파쇄',
    heavyMult: 2.0,
    statusOnHit: { type: 'freeze', turns: 1, value: 0, chance: 0.22 },
  },
  4: {
    id: 'exam_4',
    name: '심연 심판관 베스퍼',
    title: '심연 마도사 승급 시험관',
    artKey: 'knight',
    element: 'dark',
    hp: 32000,
    atk: 540,
    def: 215,
    expReward: 7800,
    stoneReward: 6200,
    isBoss: true,
    isRankBoss: true,
    heavyInterval: 3,
    heavyName: '심판의 흑검',
    heavyMult: 2.15,
    statusOnHit: { type: 'burn', turns: 3, value: 0.35, chance: 0.45 },
  },
  5: {
    id: 'exam_5',
    name: '초대 교장의 환영 아스티엔',
    title: '대마도사 최종 시험관',
    artKey: 'archmage',
    element: 'thunder',
    hp: 96000,
    atk: 1080,
    def: 420,
    expReward: 22000,
    stoneReward: 18000,
    isBoss: true,
    isRankBoss: true,
    heavyInterval: 3,
    heavyName: '별의 심판',
    heavyMult: 2.35,
    statusOnHit: { type: 'shock', turns: 2, value: 0.25, chance: 0.45 },
  },
};

export function getCharacterTitle(school: SchoolId, gender: Gender): string {
  return gender === 'male' ? SCHOOLS[school].maleTitle : SCHOOLS[school].femaleTitle;
}

export function getCharacterQuote(school: SchoolId, gender: Gender): string {
  return gender === 'male' ? SCHOOLS[school].maleQuote : SCHOOLS[school].femaleQuote;
}
