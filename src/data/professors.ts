import type {
  DialogueLine,
  GameState,
  MagicCategory,
  ProfessorId,
  SchoolId,
} from '../types/game';

export interface ProfessorDef {
  id: ProfessorId;
  name: string;
  role: string;
  classroom: string;
  category?: MagicCategory;
  accent: string;
  personality: string;
  bio: string;
  foreshadowProp: string;
}

export const PROFESSOR_ORDER: ProfessorId[] = [
  'bernard',
  'lucia',
  'karen',
  'sebastian',
  'volta',
  'morden',
  'irene',
  'seraphina',
  'martha',
];

export const CATEGORY_PROFESSOR: Record<MagicCategory, ProfessorId> = {
  flame: 'karen',
  frost: 'sebastian',
  thunder: 'volta',
  earth: 'morden',
  ward: 'irene',
  holy: 'seraphina',
  dark: 'martha',
};

export const PROFESSORS: Record<ProfessorId, ProfessorDef> = {
  bernard: {
    id: 'bernard',
    name: '베르나르',
    role: '아스트라 교장',
    classroom: '천문 교장실',
    accent: '#c8a45d',
    personality: '중후 · 과묵 · 단호함',
    bio: '12년 전 대재앙 흑식에서 살아남아 아스트라를 지켜온 대마도사. 제자들을 지키기 위해 무거운 비밀을 홀로 짊어지고 있다.',
    foreshadowProp: '눈가의 흑식 저주 흉터 & 금이 간 초대 교장 아스티엔의 지팡이',
  },
  lucia: {
    id: 'lucia',
    name: '루시아',
    role: '신입생 담임 교수',
    classroom: '아스트라 본관 회랑',
    accent: '#b48fd9',
    personality: '다정 · 섬세 · 아련함',
    bio: '누구보다 따뜻하게 신입생들을 보살피는 담임 교수. 어째서인지 학교의 별빛 결계 밖으로 한 걸음도 나가지 않는다.',
    foreshadowProp: '손목에 단단히 감긴 룬 문양 검은 봉인 리본 & 어두운 별빛 브로치',
  },
  karen: {
    id: 'karen',
    name: '카렌',
    role: '흑염학 교수',
    classroom: '흑염 화로 교실',
    category: 'flame',
    accent: '#d95b38',
    personality: '호탕 · 거침없음 · 의리파',
    bio: '잿빛 화로 영지 출신의 전선 마도사. 불꽃을 다루는 자는 두려움마저 태워야 한다며 제자들을 혹독하지만 뜨겁게 이끈다.',
    foreshadowProp: '가죽 암가드 아래의 오래된 화상 흉터 & 그을린 잿불 훈장',
  },
  sebastian: {
    id: 'sebastian',
    name: '세바스티안',
    role: '빙결학 교수',
    classroom: '백야 서리 교실',
    category: 'frost',
    accent: '#6bb4cf',
    personality: '냉소 · 정확 · 츤데레',
    bio: '몰락한 백야 엘프 귀족 가문의 후예. 차갑고 까칠하게 쏘아붙이지만, 제자가 전장에서 살아 돌아오기를 누구보다 꼼꼼히 챙긴다.',
    foreshadowProp: '가슴에 단 금이 간 백야 가문 은빛 인장',
  },
  volta: {
    id: 'volta',
    name: '볼타',
    role: '뇌전학 교수',
    classroom: '폭풍 첨탑 교실',
    category: 'thunder',
    accent: '#d8b45c',
    personality: '쿨함 · 괴짜 천재 · 자신감',
    bio: '폭풍 첨탑 최연소 수석 출신의 뇌전 대마도사. 아스트라 외벽 결계 증폭과 최전선 낙뢰 전술을 도맡고 있다.',
    foreshadowProp: '코트 깃에 새겨진 번개 그을음 흉터 & 황금빛 뇌전',
  },
  morden: {
    id: 'morden',
    name: '모르덴',
    role: '대지·사령학 교수',
    classroom: '석비 지하 교실',
    category: 'earth',
    accent: '#6ca67a',
    personality: '침착 · 중후 · 과묵',
    bio: '수많은 전장을 버텨낸 백전노장 늑대 수인 현자. 쓰러진 전우들의 목소리를 대지의 룬으로 기억하며 후학을 지킨다.',
    foreshadowProp: '한쪽 귀의 오래된 전투 흉터 & 전우들의 이름이 적힌 나무 룬 부적',
  },
  irene: {
    id: 'irene',
    name: '아이린',
    role: '결계·정령학 교수',
    classroom: '정령 결계 교실',
    category: 'ward',
    accent: '#8fc5a8',
    personality: '우아 · 온화 · 강인함',
    bio: '님펜 숲에서 온 요정족 정령술사. 언제나 온화하게 결계를 가르치지만, 북쪽 숲에 붉은 달이 뜰 때면 말없이 가슴을 쥔다.',
    foreshadowProp: '가슴에 꽂힌 시든 붉은 장미 한 송이 (3막 모르가나의 옛 선물)',
  },
  seraphina: {
    id: 'seraphina',
    name: '세라피나',
    role: '성광·치유학 교수',
    classroom: '성당 치유실',
    category: 'holy',
    accent: '#e6cf98',
    personality: '고요 · 자애 · 단단함',
    bio: '아스트라 성당 치유실을 지키는 고딕 수도원 출신 치유사. 절망에 잠식된 영혼마저 꺼지지 않는 성광으로 감싼다.',
    foreshadowProp: '흑식 이후 단 한 번도 꺼지지 않은 황동 성광 등불 & 은빛 묵주',
  },
  martha: {
    id: 'martha',
    name: '마르타',
    role: '금서 도서관 사서장',
    classroom: '금서 도서관',
    category: 'dark',
    accent: '#b55264',
    personality: '엄격 · 서늘 · 오컬트',
    bio: '12년 전 실종된 전임 사서장 크노스의 뒤를 이어 금서 서고를 관리하는 여인. 금기를 다루는 자의 이성을 냉혹하게 저울질한다.',
    foreshadowProp: '목에 건 전임 사서장 크노스의 낡은 철제 열쇠 1개 & 쇠사슬 금서',
  },
};

export function hasLearnedDarkMagic(state: GameState): boolean {
  return Object.keys(state.skills).some((id) => id.startsWith('dark_'));
}

export function getProfessorGreeting(profId: ProfessorId, state: GameState): string {
  const { school, rank, prestige } = state;
  const rebirth = prestige.rebirthCount;
  const hasDark = hasLearnedDarkMagic(state);
  const name = state.playerName || '견습생';

  switch (profId) {
    case 'bernard':
      if (rebirth >= 1) {
        return `…기묘하군, ${name}. 그대의 눈빛엔 이미 수많은 밤하늘을 건너온 자의 무게가 서려 있어. 이번 생엔 기필코 끝을 보도록 하라.`;
      }
      if (hasDark) {
        return '금서 도서관의 어둠까지 짊어졌군. 괜찮다, 네가 이성을 잃지 않는 한 아스트라의 교장으로서 끝까지 네 편에 서겠다.';
      }
      if (rank >= 5) {
        return '대마도사의 자리에 올랐구나. 초대 교장님의 지팡이가 이토록 뜨겁게 공명한 건 12년 만이다.';
      }
      return '별빛이 꺼져가는 시대다. 하지만 아스트라의 교문이 열려 있는 한, 우리는 결코 무릎 꿇지 않는다.';

    case 'lucia':
      if (rebirth >= 1) {
        return `어라… ${name}, 이상하네요. 분명 처음 만났을 텐데 왜 이렇게 익숙하고… 마음이 놓이는 걸까요? 마치 아주 오래전부터 나를 지켜준 사람처럼.`;
      }
      if (state.clearedActs.includes(5)) {
        return '제 비밀을 알고도 손을 놓지 않아 줘서 고마워요… 이번엔 제가 끝까지 당신의 곁에서 기도할게요.';
      }
      if (state.clearedActs.includes(1)) {
        return `잘 돌아왔어요, ${name}! 수정 광산 이후로 손목의 봉인이 유독 차갑긴 하지만… 당신이 곁에 있으니 괜찮을 거예요.`;
      }
      return `어서 와요, ${name}. 무리하지 말고 교실에서 차근차근 마법을 익혀요. 다치면 언제든 제게 달려와야 해요?`;

    case 'karen':
      if (school === 'flame') {
        return `하하, 우리 흑염 학파 에이스 ${name} 왔구나! 안개 따위 재도 안 남게 태워버리자고. 이 화상 흉터? 제대로 불을 다룬 훈장이지!`;
      }
      if (school === 'frost') {
        return '오, 백야 설원 쪽 애가 화로 교실엔 무슨 일이야? 세바스티안 녀석처럼 얼음장 굴지만 말고 가끔은 뜨거운 맛도 보라고!';
      }
      return '어이 신입, 어느 학파든 전장에선 화력이 곧 생존이야. 불꽃이 두려우면 흑염 화로 교실에 발 들이지 마!';

    case 'sebastian':
      if (school === 'frost') {
        return `…제시간에 왔군, ${name}. 백야의 후계자답게 호흡이 흔들리지 않아. 이 금이 간 인장의 몫까지, 냉정하게 적을 얼려라.`;
      }
      if (school === 'flame') {
        return '흥, 불장난이나 치던 흑염 학파 치곤 제법 버티는군. 화력만 믿고 마나가 마르면 그걸로 끝이니, 빙결의 절제를 배워둬라.';
      }
      return '감정은 마력 순환의 적이다. 백야 서리 교실에선 단 한 치의 오차도 용납하지 않으니 각오하도록.';

    case 'volta':
      if (school === 'thunder') {
        return `오, 내 제자 ${name}! 오늘 손끝에서 번개 결이 아주 매끈한데? 어둠이 눈 깜짝할 사이에 황금빛 낙뢰로 꿰뚫어 버리자고.`;
      }
      if (school === 'earth') {
        return '대지 학파는 참 묵직해서 좋지. 다만 가끔은 방패 뒤에 숨는 것보다 번개처럼 먼저 꽂아 넣는 게 훨씬 빠르다는 걸 기억해 둬.';
      }
      return '폭풍 첨탑에 어서 와. 결계든 마법이든 핵심은 단 하나 — 적보다 반 박자 빠르게 심장을 꿰뚫는 거지.';

    case 'morden':
      if (school === 'earth') {
        return `잘 왔다, ${name}. 대지의 맥박이 네 발걸음을 반기고 있구나. 이 나무 부적에 새긴 전우들의 몫까지, 끝까지 무너지지 마라.`;
      }
      if (school === 'thunder') {
        return '번개처럼 빠른 것도 재능이지. 허나 폭풍이 지나간 뒤 끝까지 서 있는 건 언제나 대지다. 버티는 법을 잊지 마라.';
      }
      return '죽은 자들은 거짓을 말하지 않는다. 석비 지하 교실에선 소란을 버리고, 발밑의 오래된 목소리에 귀를 기울이거라.';

    case 'irene':
      if (state.clearedActs.includes(3)) {
        return '모르가나를 잠재워 주셔서 감사해요… 이 시든 장미도 이제야 조금 가벼워진 것 같아요. 남은 이들의 결계는 제가 끝까지 지킬게요.';
      }
      return '결계는 공격을 막는 벽이 아니라, 소중한 사람을 지키겠다는 마음의 형태예요. 오늘도 정령들이 당신 곁을 맴돌고 있네요.';

    case 'seraphina':
      if (hasDark) {
        return '…당신의 영혼에서 금서의 차가운 그림자가 느껴지네요. 책망하진 않겠습니다. 대신 어둠이 마음을 갉아먹을 때마다, 꼭 이 성광 등불 아래로 돌아오세요.';
      }
      return '다친 곳은 없나요? 검은 안개가 아무리 짙어도, 이 작은 등불 하나가 꺼지지 않는 한 우리는 길을 잃지 않습니다.';

    case 'martha':
      if (hasDark) {
        return '후후… 결국 금단의 페이지를 펼치셨군요. 전임자 크노스처럼 먹히지 않으려면, 그대의 이성을 칼날처럼 벼려두세요.';
      }
      if (rank < 2) {
        return '아직 3계급 [정규 마법사]가 아니시군요. 이 낡은 열쇠 너머의 서고는 섣부른 호기심만으로 발을 들일 곳이 아닙니다.';
      }
      return '정규 마법사의 자격을 갖추셨군요. 금서 조각을 가져오시면, 학교가 숨겨둔 가장 위험하고 확실한 힘을 해독해 드리죠.';
  }
}

export const DARK_MAGIC_UNLOCK_LINES: DialogueLine[] = [
  {
    speaker: '사서장 마르타',
    role: '금서 도서관',
    portrait: { kind: 'professor', id: 'martha' },
    text: '후후… 결국 금서의 봉인을 푸셨군요, {name}. 이제 그대의 마력 회로엔 지울 수 없는 심연의 잉크가 스며들었습니다.',
  },
  {
    speaker: '성광 교수 세라피나',
    role: '성당 치유실',
    portrait: { kind: 'professor', id: 'seraphina' },
    text: '잠깐, 정말 괜찮겠나요…? 흑마법은 사용자의 생명력까지 대가로 요구해요. 어둠에 삼켜질 것 같으면 언제든 성당으로 오세요, 제발…',
  },
  {
    speaker: '교장 베르나르',
    role: '아스트라 교장',
    portrait: { kind: 'professor', id: 'bernard' },
    text: '그만두게, 세라피나. 금서 도서관의 빗장을 연 건 나다. 빛만으로 마왕을 벨 수 없다면, 어둠마저 쥐고 걸어야 할 자가 필요하니까. …부디 이성을 잃지 마라, {name}.',
  },
];

export const RANK_EXAM_DIALOGUES: Record<
  number,
  { start: DialogueLine[]; clear: DialogueLine[] }
> = {
  1: {
    start: [
      {
        speaker: '교장 베르나르',
        role: '시전자 승급 시험',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '수정 광산의 폭주를 잠재운 실력은 보았다. 이제 [시전자]의 자격을 증명할 차례다. 석상 수호자 칼리온을 쓰러뜨려라!',
      },
    ],
    clear: [
      {
        speaker: '교장 베르나르',
        role: '승급 인가',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '훌륭하군. 오늘부로 그대를 [시전자]로 임명한다. 이제 4번째 마법 슬롯과 사역마 사육실의 출입을 허가하노라.',
      },
    ],
  },
  2: {
    start: [
      {
        speaker: '교장 베르나르',
        role: '정규 마법사 승급 시험',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '지하 서고의 망령을 견뎌냈구나. [정규 마법사]가 되면 금서 도서관의 문이 열린다. 어둠을 다룰 그릇인지, 봉인 감시자 말라키 앞에서 증명해 보여라.',
      },
    ],
    clear: [
      {
        speaker: '교장 베르나르',
        role: '승급 인가',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '[정규 마법사] 승급을 축하한다. 금서 도서관과 두 번째 수련 슬롯이 열렸다. 마르타가 기다리고 있을 것이다.',
      },
    ],
  },
  3: {
    start: [
      {
        speaker: '교장 베르나르',
        role: '비술사 승급 시험',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '붉은 달의 비극을 넘어섰군. 이제 학교의 울타리를 넘어 대륙을 짊어질 [비술사] 시험이다. 거울 마녀 이졸데의 환상을 깨부수어라!',
      },
    ],
    clear: [
      {
        speaker: '교장 베르나르',
        role: '승급 인가',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '그대는 이제 아스트라의 [비술사]다. 다섯 번째 스킬 슬롯과 고급 연금 재련을 허가한다. 곧 데런 왕도로 출격해야 할 것이다.',
      },
    ],
  },
  4: {
    start: [
      {
        speaker: '교장 베르나르',
        role: '심연 마도사 승급 시험',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '알드리치의 마지막을 지켜봐 주었군… 이제 북쪽의 심연을 마주할 [심연 마도사]의 시험이다. 심판관 베스퍼의 흑검을 견뎌내라!',
      },
    ],
    clear: [
      {
        speaker: '교장 베르나르',
        role: '승급 인가',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '놀랍구나, {name}. [심연 마도사]의 자리에 올랐다. 상위 흑마법과 사역마 3단계 각성이 열렸으니, 다가올 결전에 대비하라.',
      },
    ],
  },
  5: {
    start: [
      {
        speaker: '교장 베르나르',
        role: '대마도사 최종 시험',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '12년 전 스승님께서 남기신 마지막 시험이다. 초대 교장 아스티엔의 환영을 뛰어넘어, 아스트라의 새로운 [대마도사]가 되어다오!',
      },
    ],
    clear: [
      {
        speaker: '교장 베르나르',
        role: '최고위 칭호 수여',
        portrait: { kind: 'professor', id: 'bernard' },
        text: '…초대 교장님께서 웃으며 사라지셨군. 오늘부로 그대는 아스트라의 [대마도사]다. 이제 루시아와 우리 모두의 미래를 걸고, 검은 왕좌로 향하라!',
      },
    ],
  },
};

export function resolveDialogueText(line: DialogueLine, state: GameState): string {
  let raw = line.text;
  if (state.prestige.rebirthCount >= 1 && line.ngPlusText) {
    raw = line.ngPlusText;
  } else if (line.schoolVariants?.[state.school]) {
    raw = line.schoolVariants[state.school]!;
  }
  const name = state.playerName || '견습생';
  return raw.replaceAll('{name}', name);
}

export function getSchoolProfessorId(school: SchoolId): ProfessorId {
  return CATEGORY_PROFESSOR[school];
}
