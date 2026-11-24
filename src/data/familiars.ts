import type { FamiliarDef, FamiliarId } from '../types/game';

export const FAMILIARS: Record<FamiliarId, FamiliarDef> = {
  raven: {
    id: 'raven',
    name: '검은 까마귀',
    evolvedNames: ['잿빛 어린 까마귀', '밤의 전령 까마귀', '심연의 오딘 까마귀'],
    role: '저주 & 방어 약화',
    hatchCost: 300,
    intervalTurns: 2,
    description: '2턴마다 적을 쪼아 피해를 주고 저주(받는 피해 증가)를 겁니다.',
    passiveLabel: '마력 +8% (진화당 +6%)',
    passiveMagicPct: 8,
  },
  golem: {
    id: 'golem',
    name: '뼈 골렘',
    evolvedNames: ['작은 뼈 인형', '수호 뼈 골렘', '고대 해골 거신'],
    role: '보호막 & 탱킹 보조',
    hatchCost: 420,
    intervalTurns: 3,
    description: '3턴마다 주인에게 단단한 뼈 보호막을 씌워 강공격을 버텨냅니다.',
    passiveLabel: '최대 체력 +12%, 방어 +10%',
    passiveHpPct: 12,
    passiveDefPct: 10,
  },
  wisp: {
    id: 'wisp',
    name: '영혼불',
    evolvedNames: ['희미한 도깨비불', '푸른 영혼불', '성좌의 불꽃 정령'],
    role: '마나 회복 & 치유',
    hatchCost: 480,
    intervalTurns: 2,
    description: '2턴마다 주인의 체력과 마나를 함께 회복시켜 로테이션을 매끄럽게 유지합니다.',
    passiveLabel: '턴당 마나 회복 +6',
    passiveMpRegen: 6,
  },
  wolf: {
    id: 'wolf',
    name: '그림자 늑대',
    evolvedNames: ['검은 강아지 그림자', '밤안개 늑대', '월식의 펜리르'],
    role: '치명타 추가 공격',
    hatchCost: 750,
    eggFragmentCost: 3,
    intervalTurns: 2,
    description: '2턴마다 그림자에서 튀어나와 높은 치명타 확률로 적을 물어뜯습니다.',
    passiveLabel: '치명타 확률 +7%',
    passiveCritRate: 7,
  },
  owl: {
    id: 'owl',
    name: '서리 올빼미',
    evolvedNames: ['눈송이 올빼미', '백야의 서리 올빼미', '영원설원의 현자조'],
    role: '빙결 & 마력 지원',
    hatchCost: 900,
    eggFragmentCost: 4,
    intervalTurns: 3,
    description: '3턴마다 냉기 날개짓으로 피해를 주고 확률적으로 적을 빙결시킵니다.',
    passiveLabel: '마력 +10%, 마나 회복 +4',
    passiveMagicPct: 10,
    passiveMpRegen: 4,
  },
  bat: {
    id: 'bat',
    name: '흑염 박쥐',
    evolvedNames: ['작은 핏빛 박쥐', '흑염 흡혈 박쥐', '혈월의 진조 사역마'],
    role: '화상 & 생명력 흡수',
    hatchCost: 1100,
    eggFragmentCost: 5,
    intervalTurns: 2,
    description: '2턴마다 적을 태우며 화상을 남기고 피해량의 일부로 주인을 회복시킵니다.',
    passiveLabel: '마력 +12%, 최대 체력 +8%',
    passiveMagicPct: 12,
    passiveHpPct: 8,
  },
};

export const FAMILIAR_LIST: FamiliarDef[] = Object.values(FAMILIARS);

export function getFamiliarUpgradeCost(level: number): number {
  return Math.round(90 * Math.pow(1.24, level - 1));
}

export function getFamiliarEvoCost(currentEvo: 0 | 1 | 2): { stones: number; eggShards: number; reqLevel: number; reqRank: number } {
  if (currentEvo === 0) {
    return { stones: 1200, eggShards: 3, reqLevel: 10, reqRank: 2 };
  }
  return { stones: 7500, eggShards: 8, reqLevel: 25, reqRank: 4 };
}
