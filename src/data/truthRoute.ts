import type {
  DialogueLine,
  GameState,
  ProfessorId,
  TruthRouteState,
} from '../types/game';

export interface TruthLetterReward {
  starRemnants?: number;
  arcaneDust?: number;
  tomeShards?: number;
  eggShards?: number;
}

export interface TruthLetterPassive {
  magicPct?: number;
  hpPct?: number;
  defPct?: number;
  critRate?: number;
  critDmg?: number;
  rewardPct?: number;
}

export interface TruthLetterDef {
  id: string;
  order: number;
  waxLabel: string;
  title: string;
  senderName: string;
  senderRole: string;
  portraitProf: ProfessorId;
  dateTag: string;
  unlockHint: string;
  isUnlocked: (state: GameState) => boolean;
  body: string[];
  postscript: string;
  reward: TruthLetterReward;
  passive: TruthLetterPassive;
  passiveLabel: string;
}

export interface TruthRouteBonuses {
  magicPct: number;
  hpPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  rewardPct: number;
}

export const TRUTH_LETTERS: readonly TruthLetterDef[] = [
  {
    id: 'truth_knoss',
    order: 1,
    waxLabel: '제1서신',
    title: '전임 사서장 크노스의 찢긴 출납부',
    senderName: '마르타 (전임 사서장 크노스 미공개 기록)',
    senderRole: '금서 도서관 · 12년 전 흑식 직후',
    portraitProf: 'martha',
    dateTag: '흑식 제3야 · 지하 대서고 3열 봉인 직전',
    unlockHint: '시간 회귀 1회 이상 또는 제4막 클리어 시 해금',
    isUnlocked: (s) => s.prestige.rebirthCount >= 1 || s.clearedActs.includes(4),
    body: [
      '마르타, 네가 이 찢긴 출납부의 여백을 펼칠 때쯤이면 난 이미 서고 3열의 쇠사슬 안쪽에 문을 잠근 뒤일 거다. 성당의 황동 등불 앞에서 밤을 새우며 몇 번이나 계산을 고쳐 적었지만, 잉크가 마를 때마다 결론은 같았어. 아스트라의 별빛 결계 안쪽에… 마왕 발바르의 심장 파편이 살아 숨 쉬고 있다.',
      '더 잔인한 사실은, 그 심장이 괴물이 아니라 열두 해의 시간을 버텨낼 어린 인간의 형상을 하고 있다는 점이다. 나는 붉은 별의 공명이 아스트라를 안에서부터 찢어버릴까 두려워 기록을 멈추고 스스로를 봉인하기로 했다. 훗날 회귀의 기억을 품고 이 서고로 걸어 들어올 {name}에게라도 전해 주렴. 내가 두려워했던 것은 그 아이의 존재가 아니라, 원로회가 그 아이를 처형대로 끌어낼 미래였다고.',
      '덧붙여, 내가 25층 심연 서고 쪽으로 추방해 둔 폐기 각주 더미에서 자꾸 악마 말코르 녀석이 페이지를 뜯어 먹고 있더구나. 혹시 훗날 그 괴물이 뱉어낸 낱장이 너의 책상으로 날아들거든, 내 낡은 철제 열쇠 대신 네 필체로 깔끔히 ‘반납 완료’ 도장을 찍어주길 바란다. 기록자의 마지막 자존심이다.',
    ],
    postscript:
      '마르타 추신 — 스승님께서 끝내 남기신 12년 치 연체료는 ‘사망·실종 특례’로 탕감 처리했습니다. 다만 {name} 씨, 이 미공개 서신의 열람 기한도 오늘 자정까지이니 구겨지지 않게 조심하세요.',
    reward: { starRemnants: 2, arcaneDust: 40 },
    passive: { magicPct: 1.5 },
    passiveLabel: '영구 마력 +1.5%',
  },
  {
    id: 'truth_irene_rose',
    order: 2,
    waxLabel: '제2서신',
    title: '아이린의 시든 붉은 장미 편지',
    senderName: '결계·정령 교수 아이린',
    senderRole: '정령 결계 교실 · 님펜 숲의 기록',
    portraitProf: 'irene',
    dateTag: '12년 전 졸업식 다음 날 · 님펜 숲 화재의 밤',
    unlockHint: '시간 회귀 1회 이상 및 (제3막 클리어 또는 아이린 친밀도 20 이상) 시 해금',
    isUnlocked: (s) =>
      s.prestige.rebirthCount >= 1 &&
      (s.clearedActs.includes(3) || (s.affinity?.points.irene ?? 0) >= 20),
    body: [
      '모르가나, 네가 졸업식 날 내 옷깃에 꽂아주었던 붉은 장미는 북쪽 하늘이 검은 재로 뒤덮이던 밤, 님펜 숲으로 향하는 마지막 바람 앞에서 결국 바싹 말라버렸단다. 본관 외벽 결계가 무너지면 아이들이 전부 죽는다는 교장 선생님의 절규 앞에서, 나는 정령들의 손을 놓은 채 문지방을 넘지 못했어.',
      '몇 번의 계절이 지나고 네가 붉은 달의 탑에서 그 장미를 기억한 채 눈을 감았을 때, 세바스티안 교수가 말없이 내 가슴의 마른 꽃잎 위에 얇은 영구 서리 결계를 씌워 주었지. 회귀의 밤을 건너온 {name}이(가) 님펜 숲의 가시덩굴을 베어낼 때마다, 내 정령들은 사실 네 발소리에서 아주 오래전 내가 놓쳤던 용기의 온기를 느꼈다고 속삭여 주었단다.',
      '이제야 깨달았어. 결계란 상처를 가두기 위해 세우는 벽이 아니라, 끝내 놓치지 않겠다고 맹세한 이들을 안아주는 품이라는 걸. {name}, 네가 시간을 거슬러 오르며 지켜낸 매 순간 덕분에, 시든 장미의 가시도 이제는 아픔보다 고마움으로 나를 찌르는구나.',
    ],
    postscript:
      '세바스티안의 비공식 각주 — 교내 동결 마법을 식물에 무단 시술한 시말서는 교장실에 제출하지 않았다. 꽃잎이 부서지지 않게 유지했을 뿐이니, 감상적인 보고서는 사양한다.',
    reward: { starRemnants: 2, eggShards: 2 },
    passive: { defPct: 2 },
    passiveLabel: '영구 방어 +2%',
  },
  {
    id: 'truth_aldrich_oath',
    order: 3,
    waxLabel: '제3서신',
    title: '데런 성문에서 회수된 봉인 명령서',
    senderName: '대지·사령 교수 모르덴 (알드리치 유품 대필)',
    senderRole: '석비 지하 교실 · 데런 왕도 12년 전 문서',
    portraitProf: 'morden',
    dateTag: '흑식의 밤 · 데런 왕도 북문 폐쇄령 직전',
    unlockHint: '시간 회귀 1회 이상 및 제4막 클리어 시 해금',
    isUnlocked: (s) => s.prestige.rebirthCount >= 1 && s.clearedActs.includes(4),
    body: [
      '베르나르에게 전하는 이 명령서는, 내 나무 룬 부적 옆에 묻어두었던 알드리치의 부러진 검집 안쪽에서 뒤늦게 발견된 밀서다. 12년 전 데런의 성문을 닫기 직전, 알드리치는 아스트라의 지원군이 결계를 버리면서까지 오지 못하리라는 걸 이미 알고 있었지. 붉은 불길 속에서 카렌의 팔이 타들어가고 세바스티안의 백야 인장이 갈라지는 것을 본 뒤, 녀석은 스스로 성문을 잠갔다.',
      '“아스트라의 어린 마법사들이 살아야 한다. 그리고 아스티엔 스승님이 목숨을 걸고 봉인한 그 아이가 괴물로 처형당하게 두지 마라.” 저주받은 데스나이트가 된 뒤에도 알드리치는 피난민을 쫓지 않았고, 무한 심연 탑 20층의 흑기사 드라켄마저 ‘교대 근무자가 올 때까지 물러서지 않는다’며 그 밤의 수비 규율을 기억하고 있었지. 회귀의 칼날로 그들에게 안식을 준 {name}의 걸음이 아니었다면, 전우들의 영혼은 끝없는 경계 근무 속에 갇혀 있었을 터다.',
      '사후 보고서의 행간을 읽어보니, 왕성 지하의 궁정 리치마저 죽은 뒤에까지 시민 구호 배급 서류에 도장을 찍고 있었다더군. 우습고도 서글픈 전우들이지. {name}, 네가 몇 번째 시간선에서 내 지하 교실로 내려오든, 내 나무 부적엔 아직 네 이름을 새기지 않았으니 끝까지 살아남아 다음 계절을 밟거라.',
    ],
    postscript:
      '모르덴 추신 — 카렌에게는 아직 말하지 마라. 그 녀석, 알드리치가 성문 앞에서 제 등을 밀어줬던 밤 이야기를 꺼내면 또 술병을 들이켠 채 화로 교실 천장을 태워 먹을 테니까.',
    reward: { starRemnants: 3, tomeShards: 2 },
    passive: { hpPct: 2 },
    passiveLabel: '영구 체력 +2%',
  },
  {
    id: 'truth_bernard_confession',
    order: 4,
    waxLabel: '제4서신',
    title: '교장 베르나르의 미발송 유서',
    senderName: '아스트라 교장 베르나르',
    senderRole: '천문 교장실 · 맨 아래 서랍 밀봉 문서',
    portraitProf: 'bernard',
    dateTag: '흑식 제1년 · 원로회 처형 명령 거부 당일',
    unlockHint: '시간 회귀 1회 이상 및 (제5막 클리어 또는 베르나르 친밀도 60 이상) 시 해금',
    isUnlocked: (s) =>
      s.prestige.rebirthCount >= 1 &&
      (s.clearedActs.includes(5) || (s.affinity?.points.bernard ?? 0) >= 60),
    body: [
      '이 편지를 읽고 있는 이가 원로회의 심문관이라면, 먼저 내 책상 맨 아래 서랍에 12년 치 감사 서류와 함께 넣어둔 사직서부터 수리해 주길 바란다. 하지만 이 봉인을 뜯은 자가 {name}이라면, 늙은 교장이 숨겨온 가장 어두운 도박과 스승 아스티엔의 마지막 유언을 전할 때가 된 모양이군.',
      '흑식의 밤, 스승님께서는 지팡이에 금이 갈 정도로 마력을 쥐어짜 발바르의 심장을 떼어내셨고 내 눈가에 지워지지 않을 저주 흉터가 남았다. 스승님께선 숨을 거두시기 직전 “별빛이 깃든 어린 그릇을 결코 죽이지 마라. 진정한 계승자는 [별의 잔재]를 품고 시간을 거슬러서라도 모두가 사는 해답을 찾아올 것이다”라 남기셨지. 내가 원로들의 처형 요구를 거역하고 루시아의 손목에 검은 봉인을 채운 채 금서 도서관의 빗장까지 열어젖힌 것은, 오직 그 예언을 믿었기 때문이다.',
      '몇 번이고 시간을 되감아 이 교문을 다시 밟은 {name}이여. 발바르가 엔딩 너머에서 네 영혼의 윤회를 알아본 이유는, 네가 짊어진 [별의 잔재]가 사실 스승 아스티엔이 마지막 별빛으로 짜 놓은 회귀의 서약 그 자체였기 때문이다. 이번 생에서 우리가 끝내 모든 빚을 청산하자꾸나.',
    ],
    postscript:
      '베르나르 추신 — 사직서 밑에는 혹시 모를 사태에 대비한 비상 기금과 왕국 감사관용 ‘양초 예산 삭감 및 천장 수리비 면책 조항’ 원본도 동봉해 두었다. 마왕을 쓰러뜨려도 월말 정산은 피해 갈 수 없더군.',
    reward: { starRemnants: 3, arcaneDust: 60 },
    passive: { critDmg: 6 },
    passiveLabel: '영구 치명 피해 +6%',
  },
  {
    id: 'truth_lucia_ribbon',
    order: 5,
    waxLabel: '제5서신',
    title: '루시아의 손목 리본 안쪽에 적힌 고백',
    senderName: '신입생 담임 교수 루시아',
    senderRole: '아스트라 본관 회랑 · 검은 봉인 리본 이면',
    portraitProf: 'lucia',
    dateTag: '별빛이 돌아오기 전날 밤 · 회랑 창가',
    unlockHint: '시간 회귀 1회 이상 및 (제6막 클리어 또는 루시아 친밀도 60 이상) 시 해금',
    isUnlocked: (s) =>
      s.prestige.rebirthCount >= 1 &&
      (s.clearedActs.includes(6) || (s.affinity?.points.lucia ?? 0) >= 60),
    body: [
      '검은 리본의 안쪽 면에 아주 작은 은색 잉크로 적어 두는 이 글은, 혹시 제가 발바르의 심장에 삼켜지더라도 {name}만큼은 자책하지 않았으면 해서 남기는 고백이에요. 12년 동안 저는 교문 밖 풀밭 한 번 밟지 못한 채 아스트라의 그릇으로 살아왔지만, 결코 불행하지만은 않았어요. 신입생 출석부를 정리하고, 다친 제자들을 세라피나 교수님께 업어 나르는 매일이 저를 진짜 살아 있는 사람으로 만들어 주었으니까요.',
      '그리고 무엇보다… 제가 가슴에 달고 다니던 ‘어두운 별빛 브로치’의 진짜 주인이 누구였는지도, 회귀를 거듭할수록 조금씩 떠올랐어요. 그것은 12년 전 스승 아스티엔께서 제 가슴에 꽂아주신 마지막 성좌의 핀이자, 시간을 거슬러 다시 입학식 문턱에 설 미래의 {name}을(를) 알아보라고 남겨두신 표식이더군요. 그래서 첫 회차 이후로 당신을 볼 때마다 손목의 차가운 봉인이 거짓말처럼 따뜻해졌던 거예요.',
      '만약 제가 끝내 그릇의 운명을 벗고 당신과 교문 밖 언덕을 나란히 걸을 수 있는 새벽이 온다면… 그땐 더 이상 ‘실종’이나 ‘양호실 직행’ 칸이 아니라, 당신과 제 이름 나란히 졸업 축하란에 붉은 펜으로 동그라미를 크게 그려 넣고 싶어요. 몇 번의 밤을 건너와서라도 제 손을 놓지 않아 줘서, 정말 고마워요 {name}.',
    ],
    postscript:
      '루시아 추신 — 이 리본 안쪽 글씨는 절대 세바스티안 교수님께 보이지 마세요. 필기체가 감상적이라며 붉은 펜으로 첨삭해 주실 게 분명하니까요.',
    reward: { starRemnants: 4, tomeShards: 3 },
    passive: { magicPct: 2, critRate: 2 },
    passiveLabel: '영구 마력 +2% · 치확 +2%',
  },
];

export const TRUTH_LETTER_MAP: Record<string, TruthLetterDef> = Object.fromEntries(
  TRUTH_LETTERS.map((letter) => [letter.id, letter])
);

export const TRUE_ENDING_REWARD = {
  starRemnants: 10,
  magicPct: 4,
  hpPct: 4,
  rewardPct: 5,
} as const;

export const TRUE_ENDING_LINES: DialogueLine[] = [
  {
    speaker: '교장 베르나르',
    role: '아스트라 교장 · 진실의 새벽',
    portrait: { kind: 'professor', id: 'bernard' },
    text: '다섯 통의 봉인이 모두 열렸구나, {name}. 아스티엔 스승님의 유언도, 알드리치의 맹세도, 네가 수많은 윤회를 건너 모아온 [별의 잔재] 속에서 비로소 하나의 별자리로 이어졌다. 이제 흑식의 12년은 완전히 끝났네.',
  },
  {
    speaker: '사서장 마르타',
    role: '금서 도서관',
    portrait: { kind: 'professor', id: 'martha' },
    text: '크노스 스승님의 출납부에도, 25층 악마 말코르가 토해낸 금서 쪽지에도 오늘부로 ‘완결 및 반납 완료’ 도장을 찍었습니다. 물론 {name} 씨의 성좌 윤회 기록 역시 연체료 0마석으로 영구 보존해 두었지요.',
  },
  {
    speaker: '결계·정령 교수 아이린',
    role: '정령 결계 교실',
    portrait: { kind: 'professor', id: 'irene' },
    text: '보이시나요? 님펜 숲의 정령들이 외벽 결계 너머에서 새벽 이슬을 물어오고 있어요. 이 시든 붉은 장미도… 이제는 죄책감이 아니라, 우리가 끝내 지켜낸 이들의 증표로 가볍게 숨 쉬는 것 같아요.',
  },
  {
    speaker: '성광 교수 세라피나',
    role: '성당 치유실',
    portrait: { kind: 'professor', id: 'seraphina' },
    text: '12년 동안 단 한 번도 끄지 못했던 황동 성광 등불이 오늘 아침 처음으로 자연스럽게 햇빛과 섞여 잦아들었습니다. 과로하던 볼타 교수님의 손 떨림도, 핏자국 가득하던 양호실 명단도 이제야 평온을 찾았네요.',
  },
  {
    speaker: '담임 교수 루시아',
    role: '아스트라 정문 언덕',
    portrait: { kind: 'professor', id: 'lucia' },
    text: '손목에 아무것도 감겨 있지 않은 채 아스트라의 새벽 공기를 마시는 건 12년 만에 처음이에요, {name}. 어두운 별빛 브로치가 지금처럼 맑게 빛나는 날이 오다니… 몇 번의 시간을 되감아서라도 저를 데려와 주셔서 감사합니다.',
  },
  {
    speaker: '{name}',
    role: '아스트라 진실의 계승자',
    portrait: { kind: 'player' },
    text: '이제 어느 시간선에서도 혼자 남는 사람은 없을 거예요. …그나저나 교장 선생님, 하늘의 별빛은 돌아왔는데 책상 위 ‘화로 교실 천장 수리비와 양초 예산 감사 서류’는 정말 어떻게 처리하실 건가요?',
  },
];

export function createDefaultTruthRoute(): TruthRouteState {
  return {
    openedLetters: [],
    epilogueClaimed: false,
  };
}

export function ensureTruthRoute(
  raw?: Partial<TruthRouteState> | null
): TruthRouteState {
  const base = createDefaultTruthRoute();
  if (!raw || typeof raw !== 'object') return base;

  const openedSet = new Set<string>();
  if (Array.isArray(raw.openedLetters)) {
    for (const id of raw.openedLetters) {
      if (typeof id === 'string' && Object.prototype.hasOwnProperty.call(TRUTH_LETTER_MAP, id)) {
        openedSet.add(id);
      }
    }
  }

  return {
    openedLetters: Array.from(openedSet),
    epilogueClaimed: Boolean(raw.epilogueClaimed),
  };
}

export function isTruthLetterUnlocked(state: GameState, def: TruthLetterDef): boolean {
  return def.isUnlocked(state);
}

export function isTruthLetterOpened(state: GameState, id: string): boolean {
  return ensureTruthRoute(state.truthRoute).openedLetters.includes(id);
}

export function isTruthLetterClaimable(state: GameState, def: TruthLetterDef): boolean {
  return isTruthLetterUnlocked(state, def) && !isTruthLetterOpened(state, def.id);
}

export function getOpenedTruthLetterCount(state: GameState): number {
  return ensureTruthRoute(state.truthRoute).openedLetters.length;
}

export function isTrueEndingUnlocked(state: GameState): boolean {
  return (
    state.prestige.rebirthCount >= 1 &&
    getOpenedTruthLetterCount(state) >= TRUTH_LETTERS.length
  );
}

export function isTrueEndingClaimable(state: GameState): boolean {
  return isTrueEndingUnlocked(state) && !ensureTruthRoute(state.truthRoute).epilogueClaimed;
}

export function getClaimableTruthCount(state: GameState): number {
  let count = 0;
  for (const letter of TRUTH_LETTERS) {
    if (isTruthLetterClaimable(state, letter)) {
      count += 1;
    }
  }
  if (isTrueEndingClaimable(state)) {
    count += 1;
  }
  return count;
}

export function getTruthRouteBonuses(state: GameState): TruthRouteBonuses {
  const totals: TruthRouteBonuses = {
    magicPct: 0,
    hpPct: 0,
    defPct: 0,
    critRate: 0,
    critDmg: 0,
    rewardPct: 0,
  };

  const tr = ensureTruthRoute(state.truthRoute);
  for (const id of tr.openedLetters) {
    const def = TRUTH_LETTER_MAP[id];
    if (!def) continue;
    if (def.passive.magicPct) totals.magicPct += def.passive.magicPct;
    if (def.passive.hpPct) totals.hpPct += def.passive.hpPct;
    if (def.passive.defPct) totals.defPct += def.passive.defPct;
    if (def.passive.critRate) totals.critRate += def.passive.critRate;
    if (def.passive.critDmg) totals.critDmg += def.passive.critDmg;
    if (def.passive.rewardPct) totals.rewardPct += def.passive.rewardPct;
  }

  if (tr.epilogueClaimed) {
    totals.magicPct += TRUE_ENDING_REWARD.magicPct;
    totals.hpPct += TRUE_ENDING_REWARD.hpPct;
    totals.rewardPct += TRUE_ENDING_REWARD.rewardPct;
  }

  totals.magicPct = Math.round(totals.magicPct * 10) / 10;
  totals.hpPct = Math.round(totals.hpPct * 10) / 10;
  totals.defPct = Math.round(totals.defPct * 10) / 10;
  totals.critRate = Math.round(totals.critRate * 10) / 10;
  totals.critDmg = Math.round(totals.critDmg * 10) / 10;
  totals.rewardPct = Math.round(totals.rewardPct * 10) / 10;

  return totals;
}

export function formatTruthReward(reward: TruthLetterReward): string {
  const parts: string[] = [];
  if (reward.starRemnants) parts.push(`별의 잔재 +${reward.starRemnants.toLocaleString()}`);
  if (reward.arcaneDust) parts.push(`가루 +${reward.arcaneDust.toLocaleString()}`);
  if (reward.tomeShards) parts.push(`금서 +${reward.tomeShards.toLocaleString()}`);
  if (reward.eggShards) parts.push(`알 조각 +${reward.eggShards.toLocaleString()}`);
  return parts.join(' · ');
}
