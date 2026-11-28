export interface TowerLordDef {
  /** 1..6 (5F, 10F, 15F, 20F, 25F, 30F 기준 순환) */
  tier: number;
  floorLabel: string;
  name: string;
  title: string;
  /** MONSTER_ART(src/data/art.ts)에 존재하는 유효 키 */
  artKey: string;
  heavyName: string;
  encounterQuote: string;
  ngPlusQuote: string;
  /** 탑 탭 및 격파 토스트에 표시되는 짧은 분위기 기록 */
  clearNote: string;
  /** 군주 최초/반복 격파 시 지급되는 추가 금서 조각 (3 + tier) */
  bonusTomeShards: number;
}

export const TOWER_LORDS: readonly TowerLordDef[] = [
  {
    tier: 1,
    floorLabel: '5F',
    name: '검은 회랑의 서기관 카시엘',
    title: '5층 심연 군주 · 찢긴 출석부의 망령',
    artKey: 'boss_wraith',
    heavyName: '영혼 연체 처분',
    encounterQuote:
      '심연 탑 무단 출입, 복장 불량, 그리고 사망 신고 미제출… 학칙 제44조에 따라 네 목숨을 압류한다.',
    ngPlusQuote:
      '이상하군… 네 이름은 이미 수십 번 제적 처리했는데, 왜 출석부 맨 윗줄에 다시 잉크가 번지지?',
    clearNote:
      '찢긴 출석부 사이로 마른 잉크 가루가 흩날린다. “지각 사유: 생존”이라는 붉은 도장이 찍혀 있었다.',
    bonusTomeShards: 4,
  },
  {
    tier: 2,
    floorLabel: '10F',
    name: '잿빛 용광로의 간수 바르칸',
    title: '10층 심연 군주 · 녹아내린 연금 골렘',
    artKey: 'boss_golem',
    heavyName: '노심 과압 붕괴',
    encounterQuote:
      '실패한 과제물과 터진 도가니들이 이 아래로 버려졌다. 이제는 우리가 너를 제련할 차례다.',
    ngPlusQuote:
      '또 그 별빛의 불순물이 돌아왔군. 몇 번을 녹여도 같은 균열로 깨지는 걸 보니, 고집만은 일품이다.',
    clearNote:
      '식어가는 골렘의 흉갑 안쪽에서 12년 전 연금학 실습 낙제 도장이 박힌 황동 판이 굴러나왔다.',
    bonusTomeShards: 5,
  },
  {
    tier: 3,
    floorLabel: '15F',
    name: '유리 거울의 공녀 셀레네',
    title: '15층 심연 군주 · 반사된 백야의 마녀',
    artKey: 'exam_3',
    heavyName: '만화경 단죄',
    encounterQuote:
      '거울은 오만한 마법사의 가장 추한 표정만 기억하지. 자, 네 안의 겁쟁이와 인사를 나누렴.',
    ngPlusQuote:
      '어머, 이번 회차의 넌 거울을 보며 눈도 깜짝 안 하네? 시간을 되감다 표정까지 닳아 버린 모양이지.',
    clearNote:
      '부서진 흑요석 거울 조각마다 웃음기가 사라졌다. 가장 큰 파편에는 탑 꼭대기를 올려다보는 뒷모습만 남았다.',
    bonusTomeShards: 6,
  },
  {
    tier: 4,
    floorLabel: '20F',
    name: '검은 서약의 단장 드라켄',
    title: '20층 심연 군주 · 별을 등진 흑기사',
    artKey: 'boss_knight',
    heavyName: '무명 서약의 참격',
    encounterQuote:
      '흑식의 밤, 나는 이 지하 문을 지키라는 명령을 받았다. 교대 근무자가 아직 오지 않았으니 물러설 수 없다.',
    ngPlusQuote:
      '네 검과 마력의 궤적을 기억한다. 또다시 나를 베어 교대해 주려는가… 그렇다면 전력을 다해 맞이하마.',
    clearNote:
      '무릎 꿇은 흑기사의 투구에서 빛이 꺼졌다. 낡은 근무 일지의 마지막 줄엔 “교대 완료”라고 적혀 있었다.',
    bonusTomeShards: 7,
  },
  {
    tier: 5,
    floorLabel: '25F',
    name: '심연 서고의 포식자 말코르',
    title: '25층 심연 군주 · 금서를 삼킨 악마',
    artKey: 'boss_demon',
    heavyName: '금기 문장 폭식',
    encounterQuote:
      '크하하! 폐기된 논문과 금지된 주석들로 배를 채웠지. 요즘 아스트라 학생들은 각주도 제대로 못 달더군!',
    ngPlusQuote:
      '이 익숙한 성좌의 맛… 너는 이미 금서의 결말을 읽어버린 독자구나. 그렇다면 이번엔 개정판으로 삼켜주지.',
    clearNote:
      '악마가 토해낸 잿더미 속에서 온전한 금서 쪽지가 날아올랐다. 여백엔 마르타의 필체로 “반납 완료”라 적혀 있다.',
    bonusTomeShards: 8,
  },
  {
    tier: 6,
    floorLabel: '30F',
    name: '꺼진 성좌의 군주 아자라엘',
    title: '30층 심연 군주 · 무너진 왕좌의 그림자',
    artKey: 'demon_lord',
    heavyName: '성좌 소멸 선고',
    encounterQuote:
      '별빛이 닿지 않는 심연의 꼭대기까지 기어올랐구나. 꺼진 별들의 무게를 버틸 수 있는지 시험해 주마.',
    ngPlusQuote:
      '또다시 이 왕좌의 그림자 앞에 섰는가, 윤회의 마도사여. 끝없는 탑의 끝에서 네가 찾는 답은 여전히 차갑다.',
    clearNote:
      '왕좌의 그림자가 안개처럼 걷히자, 더 깊은 상층으로 이어지는 나선 계단이 조용히 모습을 드러냈다.',
    bonusTomeShards: 9,
  },
];

function toRoman(num: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remain = Math.max(1, Math.floor(num));
  let out = '';
  for (const [val, sym] of table) {
    while (remain >= val) {
      out += sym;
      remain -= val;
    }
  }
  return out;
}

/**
 * 5의 배수 층(5F, 10F, 15F, ...)에 배치된 심연 탑 군주 정보를 반환한다.
 * 30F 초과 시 6종의 군주가 순환하며 칭호에 `초월 II`, `초월 III` 접미사가 붙는다.
 */
export function getTowerLordForFloor(floor: number): TowerLordDef | null {
  if (!Number.isFinite(floor) || floor <= 0 || floor % 5 !== 0) {
    return null;
  }
  const milestoneIndex = Math.floor(floor / 5) - 1; // 5F -> 0, 10F -> 1, ...
  const base = TOWER_LORDS[milestoneIndex % TOWER_LORDS.length];
  const cycle = Math.floor(milestoneIndex / TOWER_LORDS.length) + 1;

  if (cycle === 1) {
    return base;
  }

  const roman = toRoman(cycle);
  return {
    ...base,
    floorLabel: `${floor}F`,
    title: `${base.title} · 초월 ${roman}`,
    bonusTomeShards: base.bonusTomeShards,
  };
}

/**
 * 현재 층(`currentFloor`) 이상에서 가장 가까운 다음 심연 탑 군주 층과 정의를 반환한다.
 * (예: 1~5F → 5F, 6~10F → 10F, 31~35F → 35F 초월 II)
 */
export function getNextTowerLordFloor(currentFloor: number): {
  floor: number;
  lord: TowerLordDef;
} {
  const safeFloor = Math.max(1, Math.floor(currentFloor || 1));
  const nextFloor = Math.ceil(safeFloor / 5) * 5;
  const lord = getTowerLordForFloor(nextFloor) ?? TOWER_LORDS[0];
  return { floor: nextFloor, lord };
}
