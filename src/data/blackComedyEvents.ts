import type { GameState, ProfessorId } from '../types/game';
import { EXP_CURVE } from './economy';

export type EventRewardKind = 'stones_dust' | 'exp' | 'dust' | 'stones' | 'tome' | 'egg';

export interface AcademyEventChoice {
  id: string;
  label: string;
  hint: string;
  rewardKind: EventRewardKind;
  resultText: string;
}

export interface AcademyEventDef {
  id: string;
  title: string;
  speaker: string;
  professorId: ProfessorId;
  prompt: string;
  choices: [AcademyEventChoice, AcademyEventChoice];
}

export interface ResolvedEventReward {
  stones?: number;
  exp?: number;
  arcaneDust?: number;
  tomeShards?: number;
  eggShards?: number;
}

/**
 * P1-4: 아스트라 마법학교 건조한 블랙코미디 이벤트 풀 (10종).
 * 다크 판타지 톤을 유지하되, 예산 삭감·과로·안전불감증 같은 서늘한 일상 유머로 구성.
 */
export const BLACK_COMEDY_EVENTS: AcademyEventDef[] = [
  {
    id: 'ev_candle_budget',
    title: '교장실 예산 삭감 공문',
    speaker: '교장 베르나르',
    professorId: 'bernard',
    prompt:
      '결계 유지비 때문에 이번 달 양초 예산이 깎였다. 복도에서 넘어져도 개인 과실이니 서명하도록, {name}.',
    choices: [
      {
        id: 'sign',
        label: '서명하고 비상 양초를 받는다',
        hint: '마석 · 가루',
        rewardKind: 'stones_dust',
        resultText: '반쯤 탄 양초와 소액 수당을 받았다.',
      },
      {
        id: 'note',
        label: '여백에 ‘별빛은 무료’라 적는다',
        hint: '경험치',
        rewardKind: 'exp',
        resultText: '베르나르가 무표정하게 고개를 끄덕였다.',
      },
    ],
  },
  {
    id: 'ev_karen_ceiling',
    title: '화로 교실 천장 면책 각서',
    speaker: '흑염학 카렌',
    professorId: 'karen',
    prompt:
      '어이 {name}, 방금 연습 마법이 천장 석고를 또 녹였어. 수리비 청구서 날아오기 전에 입 맞추자고.',
    choices: [
      {
        id: 'alibi',
        label: '“원래 금이 가 있었습니다”',
        hint: '마석',
        rewardKind: 'stones',
        resultText: '카렌이 흡족해하며 입막음 마석을 찔러줬다.',
      },
      {
        id: 'scrape',
        label: '떨어진 석고에서 마력 잔재를 긁는다',
        hint: '마력 가루',
        rewardKind: 'dust',
        resultText: '그을린 잔해 속에서 의외로 순도 높은 가루를 건졌다.',
      },
    ],
  },
  {
    id: 'ev_sebastian_soup',
    title: '식당의 냉동 수프 사태',
    speaker: '빙결학 세바스티안',
    professorId: 'sebastian',
    prompt:
      '복도 온도 유지를 위해 서리를 풀었더니 식당 수프가 전부 얼어버렸다. …불만 있나, {name}?',
    choices: [
      {
        id: 'chew',
        label: '묵묵히 얼음 수프를 씹어 먹는다',
        hint: '경험치',
        rewardKind: 'exp',
        resultText: '이가 시렸지만 빙결학의 냉정함을 몸으로 익혔다.',
      },
      {
        id: 'crystal',
        label: '서리 결정만 떼어 주머니에 넣는다',
        hint: '마석 · 가루',
        rewardKind: 'stones_dust',
        resultText: '식사는 걸렀지만 쓸 만한 마력 결정을 얻었다.',
      },
    ],
  },
  {
    id: 'ev_volta_rod',
    title: '지붕의 비공식 피뢰침',
    speaker: '뇌전학 볼타',
    professorId: 'volta',
    prompt:
      '지붕 피뢰침이 벼락에 녹아서 임시로 네 예비 지팡이를 꽂아뒀어. 충전은 아주 잘 됐던데?',
    choices: [
      {
        id: 'harvest',
        label: '과충전된 마석만 조용히 회수한다',
        hint: '마석',
        rewardKind: 'stones',
        resultText: '지팡이는 그을렸지만 묵직한 마석이 떨어졌다.',
      },
      {
        id: 'claim',
        label: '지팡이 감가상각비를 청구한다',
        hint: '마력 가루',
        rewardKind: 'dust',
        resultText: '볼타가 서랍 속 연금 가루를 대신 털어줬다.',
      },
    ],
  },
  {
    id: 'ev_morden_roll',
    title: '지하 교실의 망령 출석부',
    speaker: '대지학 모르덴',
    professorId: 'morden',
    prompt:
      '지하 교실을 지나던 3학년 망령이 결석계 대신 낡은 마석을 두고 갔군. 살아 있는 자가 챙겨라.',
    choices: [
      {
        id: 'take',
        label: '묵념하고 마석을 챙긴다',
        hint: '마석 · 가루',
        rewardKind: 'stones_dust',
        resultText: '차갑지만 쓸모 있는 유품을 건네받았다.',
      },
      {
        id: 'excuse',
        label: '출석부에 ‘조퇴’라고 적어준다',
        hint: '금서 조각',
        rewardKind: 'tome',
        resultText: '감사 인사 대신 낡은 금서 페이지 한 장이 날아왔다.',
      },
    ],
  },
  {
    id: 'ev_martha_overdue',
    title: '12년 치 도서 연체 독촉장',
    speaker: '사서장 마르타',
    professorId: 'martha',
    prompt:
      '실종된 선배의 금서 연체료가 복리로 쌓여 있더군요. 마침 지나가시는 {name} 씨가 대신 정리해 주시겠어요?',
    choices: [
      {
        id: 'dusting',
        label: '서고 먼지 털기로 연체료를 탕감받는다',
        hint: '금서 조각',
        rewardKind: 'tome',
        resultText: '책장 틈새에서 떨어져 나온 금서 조각을 챙겼다.',
      },
      {
        id: 'retreat',
        label: '“전 신입생인데요” 하며 뒷걸음질',
        hint: '경험치',
        rewardKind: 'exp',
        resultText: '위험을 감지하고 빠지는 감각이 한층 예리해졌다.',
      },
    ],
  },
  {
    id: 'ev_irene_pot',
    title: '결계 틈새의 수상한 잡초',
    speaker: '결계학 아이린',
    professorId: 'irene',
    prompt:
      '정령들이 결계 틈새 잡초를 먹어치우더니 묘하게 빛나는 돌을 토해냈어요… 장갑 끼고 주워 보실래요?',
    choices: [
      {
        id: 'pick',
        label: '장갑을 끼고 돌을 회수한다',
        hint: '마석 · 가루',
        rewardKind: 'stones_dust',
        resultText: '미약하게 맥동하는 정령석 파편을 확보했다.',
      },
      {
        id: 'pet',
        label: '정령들 머리를 쓰다듬어 준다',
        hint: '알 조각',
        rewardKind: 'egg',
        resultText: '기분 좋아진 정령이 따뜻한 알 조각을 안겨줬다.',
      },
    ],
  },
  {
    id: 'ev_seraphina_label',
    title: '라벨이 떨어진 성당 약병',
    speaker: '성광학 세라피나',
    professorId: 'seraphina',
    prompt:
      '사흘 밤을 새웠더니 성수 병과 감기약 병의 라벨이 헷갈리네요… {name}, 어느 쪽이 덜 반짝이나요?',
    choices: [
      {
        id: 'drink',
        label: '덜 반짝이는 병을 시음한다',
        hint: '경험치',
        rewardKind: 'exp',
        resultText: '몹시 썼지만 뜻밖에 머리가 맑아졌다.',
      },
      {
        id: 'relabel',
        label: '라벨을 새로 적어 정리해 드린다',
        hint: '마석 · 가루',
        rewardKind: 'stones_dust',
        resultText: '세라피나가 고마워하며 비상 마석과 약초 가루를 건넸다.',
      },
    ],
  },
  {
    id: 'ev_lucia_minutes',
    title: '교무 회의록의 작은 각주',
    speaker: '담임 루시아',
    professorId: 'lucia',
    prompt:
      '회의록에 ‘오늘도 학생 전원 생존(부상 4건 제외)’이라고 적었어요. …우리 반은 모범적인 편이죠, {name}?',
    choices: [
      {
        id: 'agree',
        label: '“생존만으로 감사하죠”',
        hint: '마석',
        rewardKind: 'stones',
        resultText: '루시아가 씁쓸하게 웃으며 격려 마석을 쥐여줬다.',
      },
      {
        id: 'bandage',
        label: '교탁 옆 비상 보급품을 챙긴다',
        hint: '알 조각',
        rewardKind: 'egg',
        resultText: '비상 상자 구석에서 사역마 알 조각을 발견했다.',
      },
    ],
  },
  {
    id: 'ev_chalkboard',
    title: '복도 칠판의 익명 낙서',
    speaker: '교장 베르나르',
    professorId: 'bernard',
    prompt:
      '칠판에 ‘마왕보다 월요일 1교시가 더 무섭다’고 적혀 있더군. 글씨체가 낯익은데, {name}?',
    choices: [
      {
        id: 'erase',
        label: '아무 말 없이 칠판 지우개로 문지른다',
        hint: '마력 가루',
        rewardKind: 'dust',
        resultText: '분필 가루 속에 섞인 마력 결정까지 싹 쓸어 담았다.',
      },
      {
        id: 'ditto',
        label: '밑에 ‘동의함’을 작게 덧붙인다',
        hint: '경험치',
        rewardKind: 'exp',
        resultText: '베르나르가 한숨을 쉬고는 못 본 척 지나갔다.',
      },
    ],
  },
];

function levelExpNeed(level: number): number {
  const mid = Math.max(0, level - EXP_CURVE.midStart);
  return Math.round(
    EXP_CURVE.base * Math.pow(EXP_CURVE.growth, level - 1) +
      level * EXP_CURVE.linear +
      EXP_CURVE.midQuad * mid * mid
  );
}

/** 직전 이벤트와 중복되지 않게 1종 선택 */
export function pickBlackComedyEvent(lastEventId?: string | null): AcademyEventDef {
  const pool =
    lastEventId && BLACK_COMEDY_EVENTS.length > 1
      ? BLACK_COMEDY_EVENTS.filter((e) => e.id !== lastEventId)
      : BLACK_COMEDY_EVENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function resolveEventReward(
  kind: EventRewardKind,
  state: Pick<GameState, 'highestAct' | 'level'>
): ResolvedEventReward {
  const act = Math.max(1, state.highestAct);
  const stoneUnit = Math.round(70 * Math.pow(1.85, act - 1));
  const dustUnit = 10 + act * 4;
  switch (kind) {
    case 'stones':
      return { stones: Math.round(stoneUnit * 1.4) };
    case 'dust':
      return { arcaneDust: Math.round(dustUnit * 1.6) };
    case 'stones_dust':
      return { stones: stoneUnit, arcaneDust: dustUnit };
    case 'exp':
      return { exp: Math.max(30, Math.round(levelExpNeed(state.level) * 0.08)) };
    case 'tome':
      return { tomeShards: 1 };
    case 'egg':
      return { eggShards: 1 };
  }
}

export function formatEventReward(r: ResolvedEventReward): string {
  const parts: string[] = [];
  if (r.stones) parts.push(`마석 +${r.stones.toLocaleString()}`);
  if (r.exp) parts.push(`EXP +${r.exp.toLocaleString()}`);
  if (r.arcaneDust) parts.push(`마력 가루 +${r.arcaneDust}`);
  if (r.tomeShards) parts.push(`금서 조각 +${r.tomeShards}`);
  if (r.eggShards) parts.push(`알 조각 +${r.eggShards}`);
  return parts.join(' · ');
}
