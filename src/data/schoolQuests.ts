import type {
  GameState,
  MagicCategory,
  ProfessorId,
  SchoolId,
  SchoolJournalState,
} from '../types/game';

export interface SchoolQuestReward {
  stones?: number;
  arcaneDust?: number;
  tomeShards?: number;
  starRemnants?: number;
  affinityGain: number;
}

export interface SchoolQuestPassive {
  magicPct?: number;
  hpPct?: number;
  defPct?: number;
  critRate?: number;
  critDmg?: number;
  categoryBonus?: { category: MagicCategory; pct: number };
}

export interface SchoolQuestDef {
  id: string;
  school: SchoolId;
  chapter: 1 | 2 | 3 | 4;
  mentorProf: ProfessorId;
  title: string;
  subtitle: string;
  briefing: string;
  epilogueQuote: string;
  objectiveLabel: string;
  target: number;
  getProgress: (state: GameState) => number;
  reward: SchoolQuestReward;
  passive: SchoolQuestPassive;
  passiveLabel: string;
}

export interface CampusNoticeDef {
  id: string;
  numberTag: string;
  categoryTag: string;
  title: string;
  authorProf: ProfessorId;
  authorLabel: string;
  dateLabel: string;
  unlockHint: string;
  isUnlocked: (state: GameState) => boolean;
  body: string[];
  marginScribble: string;
  rewardStones: number;
}

export interface SchoolQuestBonuses {
  magicPct: number;
  hpPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  categoryBonuses: Partial<Record<MagicCategory, number>>;
}

const FLAME_QUESTS: readonly SchoolQuestDef[] = [
  {
    id: 'fq_1',
    school: 'flame',
    chapter: 1,
    mentorProf: 'karen',
    title: '제1장 · 꺼지지 않는 불씨의 입문',
    subtitle: '잿빛 화로의 영지 · 기초 발화 검정',
    briefing:
      '화로 교실 천장이 또 그을렸다고 교장 영감이 잔소리지만 신경 쓸 거 없어, {name}. 수정 광산에서 붉은 수정 파편을 잠재우든 마수들을 잿더미로 만들든, 먼저 불꽃이 흔들리지 않는다는 걸 보여줘.',
    epilogueQuote:
      '호오, 제법이잖아 {name}! 불씨가 안개에 먹히지 않고 단단히 붙었어. 화로 교실 소화기 미비에 대한 면책 서약서? 그건 그냥 책상 서랍 맨 밑에 구겨 넣어.',
    objectiveLabel: '제1막 클리어 또는 마수 25체 토벌',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(1) || s.totalKills >= 25 ? 1 : 0),
    reward: { stones: 500, affinityGain: 8 },
    passive: { categoryBonus: { category: 'flame', pct: 3 } },
    passiveLabel: '화염 위력 +3%',
  },
  {
    id: 'fq_2',
    school: 'flame',
    chapter: 2,
    mentorProf: 'karen',
    title: '제2장 · 연옥 화로의 호흡법',
    subtitle: '흑염 화로 교실 · 중급 연소 통제',
    briefing:
      '아무 데나 흑염구를 날리다간 도서관 연체 장부까지 태워 먹고 마르타 사서장한테 봉인 테이프로 묶인다, {name}. 봉인 감시자 말라키를 넘어 [정규 마법사] 인가를 받아 화력을 제어할 그릇부터 증명해.',
    epilogueQuote:
      '드디어 불길의 고삐를 쥐었군, {name}. 덕분에 이번 달 천장 석고 수리비 청구서엔 네 이름 대신 세바스티안 녀석 서리 결로가 공범으로 적혔으니 안심해라!',
    objectiveLabel: '정규 마법사(2계급) 이상 승급 달성',
    target: 2,
    getProgress: (s) => s.rank,
    reward: { stones: 1400, arcaneDust: 40, affinityGain: 10 },
    passive: { magicPct: 2 },
    passiveLabel: '마력 +2%',
  },
  {
    id: 'fq_3',
    school: 'flame',
    chapter: 3,
    mentorProf: 'karen',
    title: '제3장 · 가죽 암가드 아래의 맹세',
    subtitle: '데런 전선 회상 · 동료의 등을 지키는 불꽃',
    briefing:
      '내 팔의 이 화상 흉터는 12년 전 데런 왕도 철수전에서 동료들을 감싸다 얻은 거야. 화려하게 터뜨리는 건 누구나 해. 거울 마녀 이졸데나 혈월의 마녀를 꺾고 [비술사]가 되어, 급소만 태우는 전선의 불꽃을 익혀 와라, {name}.',
    epilogueQuote:
      '좋아, {name}. 이제 네 흑염은 자기 몸만 태우는 불장난이 아니라 전우의 등을 맡길 횃불이야. 세바스티안 녀석한텐 비밀로 하고, 잿불 훈장의 기세를 그대로 넘겨주마.',
    objectiveLabel: '비술사(3계급) 이상 승급 또는 제3막 클리어',
    target: 3,
    getProgress: (s) => (s.clearedActs.includes(3) ? Math.max(s.rank, 3) : s.rank),
    reward: { stones: 3000, tomeShards: 2, affinityGain: 12 },
    passive: { critDmg: 6 },
    passiveLabel: '치명타 피해 +6%',
  },
  {
    id: 'fq_4',
    school: 'flame',
    chapter: 4,
    mentorProf: 'karen',
    title: '제4장 · 잿더미 너머 별을 점화하는 자',
    subtitle: '잿빛 화로의 비오의 · 심연의 태양 계승',
    briefing:
      '검은 안개가 별빛마저 집어삼킨 세상이다, {name}. 심연 군단장 말레고스의 공세를 뚫거나 시간의 윤회를 건너온 네가, 이제 잿빛 화로의 마지막 불꽃을 아스트라의 하늘에 되돌려 놓을 차례야.',
    epilogueQuote:
      '하하! 보라고 {name}, 꺼져가던 하늘에 네 흑염이 새벽처럼 번졌어! 돌아오면 잿빛 영지식 독주를 한 잔 따라주지 — 물론 교장 영감 시말서 결제부터 먼저 끝내고 말이야.',
    objectiveLabel: '제5막 클리어 또는 시간 회귀 1회 이상 달성',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(5) || s.prestige.rebirthCount >= 1 ? 1 : 0),
    reward: { starRemnants: 5, arcaneDust: 80, affinityGain: 15 },
    passive: { magicPct: 3, categoryBonus: { category: 'flame', pct: 6 } },
    passiveLabel: '마력 +3% · 화염 위력 +6%',
  },
];

const FROST_QUESTS: readonly SchoolQuestDef[] = [
  {
    id: 'iq_1',
    school: 'frost',
    chapter: 1,
    mentorProf: 'sebastian',
    title: '제1장 · 흔들리지 않는 얼음의 호흡',
    subtitle: '백야의 설원 영지 · 마력 절제 기초',
    briefing:
      '감정에 휩쓸려 마나를 낭비하는 건 흑염 학파나 하는 야만적인 짓이다, {name}. 식당 수프가 얼어붙든 말든 교실 온도는 유지할 테니, 먼저 수정 광산이나 초입 전선에서 흐트러짐 없는 처리를 증명해 보여라.',
    epilogueQuote:
      '…흥, 호흡이 흐트러지지 않고 제법 깔끔히 정리해 왔군, {name}. 착각하지 마라. 칭찬이 아니라 교장실에 제출할 사망 보고서 한 장을 덜 쓴 것에 대한 안도일 뿐이다.',
    objectiveLabel: '제1막 클리어 또는 마수 25체 토벌',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(1) || s.totalKills >= 25 ? 1 : 0),
    reward: { stones: 500, affinityGain: 8 },
    passive: { categoryBonus: { category: 'frost', pct: 3 } },
    passiveLabel: '빙결 위력 +3%',
  },
  {
    id: 'iq_2',
    school: 'frost',
    chapter: 2,
    mentorProf: 'sebastian',
    title: '제2장 · 백야 서고의 냉각 순환',
    subtitle: '백야 서리 교실 · 정밀 마나 조율',
    briefing:
      '마력이 고갈된 마법사는 칼 없는 기사와 다름없다. 말라키의 시험을 넘어 [정규 마법사] 인가를 얻고 돌아오거라, {name}. 백야의 전장에서 살아남으려면 공격보다 냉정한 순환이 먼저다.',
    epilogueQuote:
      '정규 마법사라… 이제야 조금은 백야의 후계자다운 눈빛을 갖췄군, {name}. 내 찻잔 온도가 식기 전에 다음 술식을 훑어보도록. 잿빛 홍차 한 잔쯤은 내어주지.',
    objectiveLabel: '정규 마법사(2계급) 이상 승급 달성',
    target: 2,
    getProgress: (s) => s.rank,
    reward: { stones: 1400, arcaneDust: 40, affinityGain: 10 },
    passive: { hpPct: 3 },
    passiveLabel: '최대 HP +3%',
  },
  {
    id: 'iq_3',
    school: 'frost',
    chapter: 3,
    mentorProf: 'sebastian',
    title: '제3장 · 금이 간 은빛 인장의 무게',
    subtitle: '백야 가문 유산 · 절대영도의 방벽',
    briefing:
      '내 가슴의 금 간 인장이 왜 여전히 빛을 잃지 않았는지 묻는 제자들이 많다. 잃어버린 가문 대신 눈앞의 제자라도 끝까지 살려 보내기 위해서다. 이졸데의 거울 시험을 깨고 [비술사]가 되어 돌아와라, {name}.',
    epilogueQuote:
      '…고집 하나는 꺾이지 않는군, {name}. 좋다. 네가 붉은 달의 저주 앞에서도 얼어붙지 않도록, 백야 가문 최후의 결빙 방어 술식을 이 자리에서 정식으로 인가하겠다.',
    objectiveLabel: '비술사(3계급) 이상 승급 또는 제3막 클리어',
    target: 3,
    getProgress: (s) => (s.clearedActs.includes(3) ? Math.max(s.rank, 3) : s.rank),
    reward: { stones: 3000, tomeShards: 2, affinityGain: 12 },
    passive: { defPct: 3 },
    passiveLabel: '방어 +3%',
  },
  {
    id: 'iq_4',
    school: 'frost',
    chapter: 4,
    mentorProf: 'sebastian',
    title: '제4장 · 영원설원의 마지막 계승자',
    subtitle: '백야의 비오의 · 시들지 않는 영구 서리',
    briefing:
      '아이린 교수의 시든 장미에 얇은 서리 결계를 씌웠던 것처럼, 소중한 것은 차가운 얼음 속에서만 부서지지 않는 법이다. 5막의 균열을 뚫거나 윤회의 새벽을 밟은 {name}이여, 이제 백야의 모든 서리를 너에게 맡긴다.',
    epilogueQuote:
      '…제시간에 살아 돌아왔군, {name}. 몰락한 백야 가문이 남긴 마지막 긍지가 오늘 네 손끝에서 완성되었다. 이제 사망 보고서 양식은 서랍 깊숙이 봉인해 두도록 하지.',
    objectiveLabel: '제5막 클리어 또는 시간 회귀 1회 이상 달성',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(5) || s.prestige.rebirthCount >= 1 ? 1 : 0),
    reward: { starRemnants: 5, arcaneDust: 80, affinityGain: 15 },
    passive: { magicPct: 3, categoryBonus: { category: 'frost', pct: 6 } },
    passiveLabel: '마력 +3% · 빙결 위력 +6%',
  },
];

const THUNDER_QUESTS: readonly SchoolQuestDef[] = [
  {
    id: 'tq_1',
    school: 'thunder',
    chapter: 1,
    mentorProf: 'volta',
    title: '제1장 · 반 박자 앞선 전류',
    subtitle: '폭풍 첨탑의 영지 · 초고속 낙뢰 입문',
    briefing:
      '어이 {name}, 어젯밤 기숙사가 정전된 건 내 실험 실패가 아니라 외벽 결계 부하 테스트였다고. 그런 사소한 소문보다 당장 광산이든 어디든 가서 적들이 지팡이 들기 전에 스파크로 끝장내는 속도부터 보여줘!',
    epilogueQuote:
      '오호, 손끝에서 튀는 전류 결이 아주 매끈한데, {name}? 그 기세면 내 코트 깃 그을린 거랑 맞먹겠어. 보상으로 네 예비 지팡이 피뢰침 전용 면제권 하나 끊어줄게.',
    objectiveLabel: '제1막 클리어 또는 마수 25체 토벌',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(1) || s.totalKills >= 25 ? 1 : 0),
    reward: { stones: 500, affinityGain: 8 },
    passive: { categoryBonus: { category: 'thunder', pct: 3 } },
    passiveLabel: '뇌전 위력 +3%',
  },
  {
    id: 'tq_2',
    school: 'thunder',
    chapter: 2,
    mentorProf: 'volta',
    title: '제2장 · 폭풍 첨탑의 과부하 회로',
    subtitle: '폭풍 첨탑 교실 · 연쇄 감전 설계',
    briefing:
      '단발 번개론 금방 안개에 삼켜진다고. 아스트라 외벽 결계처럼 마력 회로를 직렬로 묶어 연속 방전을 터뜨려야지! 말라키를 뚫고 [정규 마법사] 배지를 달아 오면 내 비공식 축전 노트를 넘겨줄게, {name}.',
    epilogueQuote:
      '하하, 말라키 녀석 쇠사슬까지 감전시켜 버릴 기세던데? 좋아 {name}, 이제 네 회로 출력도 슬슬 교장실 전신주 수리비 청구서 목록에 오를 수준이 됐어!',
    objectiveLabel: '정규 마법사(2계급) 이상 승급 달성',
    target: 2,
    getProgress: (s) => s.rank,
    reward: { stones: 1400, arcaneDust: 40, affinityGain: 10 },
    passive: { magicPct: 2 },
    passiveLabel: '마력 +2%',
  },
  {
    id: 'tq_3',
    school: 'thunder',
    chapter: 3,
    mentorProf: 'volta',
    title: '제3장 · 번개 그을음 너머의 정밀 각도',
    subtitle: '천재의 교본 · 심장 관통 치명 연산',
    briefing:
      '외벽 결계를 혼자 돌리다 보면 가끔 왼손이 떨릴 때도 있지. 하지만 전장에선 0.1초의 흔들림이 생사를 갈라. [비술사] 승급이나 붉은 달의 탑 돌파로 네 낙뢰가 빗나가지 않는다는 걸 증명해 봐, {name}!',
    epilogueQuote:
      '완벽해, {name}! 이젠 내가 과로사로 쓰러지기 전에 아스트라 결계를 맡길 후임이 생긴 기분인데? 세라피나 교수님 진료비 외상 장부도 슬슬 청산할 때가 됐어.',
    objectiveLabel: '비술사(3계급) 이상 승급 또는 제3막 클리어',
    target: 3,
    getProgress: (s) => (s.clearedActs.includes(3) ? Math.max(s.rank, 3) : s.rank),
    reward: { stones: 3000, tomeShards: 2, affinityGain: 12 },
    passive: { critRate: 2 },
    passiveLabel: '치명타 확률 +2%',
  },
  {
    id: 'tq_4',
    school: 'thunder',
    chapter: 4,
    mentorProf: 'volta',
    title: '제4장 · 성좌를 가르는 황금빛 섬광',
    subtitle: '폭풍 첨탑의 비오의 · 뇌신의 심판 계승',
    briefing:
      '5막 균열 너머로 쏟아지는 공허의 파도마저 찢어발길 때야, {name}. 네가 5막의 선봉을 베어냈든 시간을 되감아 돌아왔든 상관없어. 이 황금빛 뇌전의 정점을 아스트라의 새로운 등대로 세우자고.',
    epilogueQuote:
      '크하, 눈부셔서 앞이 안 보일 지경이네 {name}! 이제 첨탑 최상층 공용 열쇠도 네 몫이야. 어둠이 다시 몰려오든 정전이 나든, 우리 폭풍은 절대 멈추지 않아.',
    objectiveLabel: '제5막 클리어 또는 시간 회귀 1회 이상 달성',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(5) || s.prestige.rebirthCount >= 1 ? 1 : 0),
    reward: { starRemnants: 5, arcaneDust: 80, affinityGain: 15 },
    passive: { magicPct: 3, categoryBonus: { category: 'thunder', pct: 6 } },
    passiveLabel: '마력 +3% · 뇌전 위력 +6%',
  },
];

const EARTH_QUESTS: readonly SchoolQuestDef[] = [
  {
    id: 'eq_1',
    school: 'earth',
    chapter: 1,
    mentorProf: 'morden',
    title: '제1장 · 지맥 위에 세우는 첫 돌',
    subtitle: '고대 석비의 숲 · 부동자세 입문',
    briefing:
      '석비 지하 교실이 서늘하다고 꺼리는 학생이 많지만, 땅속에 잠든 옛 선배들은 누구보다 묵묵히 네 걸음을 지켜보고 있다, {name}. 서두르지 말고 첫 임무와 토벌을 견뎌내 대지의 무게부터 몸에 익히거라.',
    epilogueQuote:
      '…흔들림 없는 발걸음이로구나, {name}. 지하 교실의 조용한 청강생들도 고개를 끄덕이고 있다. 네 이름이 내 나무 룬 부적에 새겨질 일은 당분간 없겠군.',
    objectiveLabel: '제1막 클리어 또는 마수 25체 토벌',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(1) || s.totalKills >= 25 ? 1 : 0),
    reward: { stones: 500, affinityGain: 8 },
    passive: { categoryBonus: { category: 'earth', pct: 3 } },
    passiveLabel: '대지 위력 +3%',
  },
  {
    id: 'eq_2',
    school: 'earth',
    chapter: 2,
    mentorProf: 'morden',
    title: '제2장 · 가시 방벽과 침묵의 인내',
    subtitle: '석비 지하 교실 · 고대 뿌리 공명',
    briefing:
      '화려한 불꽃이나 번개는 잠깐이면 꺼지지만, 뿌리 내린 바위는 폭풍이 지난 뒤에도 제자리에 남는다. [정규 마법사] 승급 시험을 돌파해 네 뼈와 방벽이 쉽게 부서지지 않음을 증명하라, {name}.',
    epilogueQuote:
      '잘 버텨냈다, {name}. 땅을 밟는 태도가 한층 묵직해졌구나. 지하 서고의 먼지 속에서 3학년 망령이 두고 간 ‘조퇴계’ 마석 수당도 네 몫으로 정리해 두었다.',
    objectiveLabel: '정규 마법사(2계급) 이상 승급 달성',
    target: 2,
    getProgress: (s) => s.rank,
    reward: { stones: 1400, arcaneDust: 40, affinityGain: 10 },
    passive: { hpPct: 3 },
    passiveLabel: '최대 HP +3%',
  },
  {
    id: 'eq_3',
    school: 'earth',
    chapter: 3,
    mentorProf: 'morden',
    title: '제3장 · 나무 룬 부적의 이름들을 위하여',
    subtitle: '백전노장의 전승 · 무너지지 않는 성벽',
    briefing:
      '한쪽 귀의 이 흉터와 나무 부적에 새겨진 전우들의 이름은 12년 전 흑식의 밤이 남긴 빚이다. [비술사]가 되거나 님펜 숲의 비극을 잠재우고 돌아와, 끝까지 살아남아 다음 세대를 지탱할 방패가 되거라, {name}.',
    epilogueQuote:
      '…알드리치의 부러진 검집 조각마저 오늘따라 가볍게 울리는구나, {name}. 너라면 어떤 검은 안개 앞에서도 동료들을 등 뒤에 품고 끝까지 서 있을 터다.',
    objectiveLabel: '비술사(3계급) 이상 승급 또는 제3막 클리어',
    target: 3,
    getProgress: (s) => (s.clearedActs.includes(3) ? Math.max(s.rank, 3) : s.rank),
    reward: { stones: 3000, tomeShards: 2, affinityGain: 12 },
    passive: { defPct: 4 },
    passiveLabel: '방어 +4%',
  },
  {
    id: 'eq_4',
    school: 'earth',
    chapter: 4,
    mentorProf: 'morden',
    title: '제4장 · 망자의 성채, 산 자의 요새',
    subtitle: '고대 석비의 비오의 · 영원한 대지 계승',
    briefing:
      '심연의 균열이 대지를 가르고 숱한 윤회가 스쳐 가도, 끝내 남는 것은 지켜낸 땅과 기억뿐이다. 5막을 돌파하거나 회귀의 고리를 밟은 {name}이여, 이제 아스트라를 받치는 가장 단단한 주춧돌을 이어받거라.',
    epilogueQuote:
      '폭풍이 지나간 뒤 끝까지 서 있는 것은 결국 대지이고, 오늘 그 자리에 네가 서 있구나, {name}. 먼저 간 전우들도 이제는 안심하고 흙 속에서 쉴 수 있을 것이다.',
    objectiveLabel: '제5막 클리어 또는 시간 회귀 1회 이상 달성',
    target: 1,
    getProgress: (s) => (s.clearedActs.includes(5) || s.prestige.rebirthCount >= 1 ? 1 : 0),
    reward: { starRemnants: 5, arcaneDust: 80, affinityGain: 15 },
    passive: { magicPct: 3, categoryBonus: { category: 'earth', pct: 6 } },
    passiveLabel: '마력 +3% · 대지 위력 +6%',
  },
];

export const SCHOOL_QUESTS: Record<SchoolId, readonly SchoolQuestDef[]> = {
  flame: FLAME_QUESTS,
  frost: FROST_QUESTS,
  thunder: THUNDER_QUESTS,
  earth: EARTH_QUESTS,
};

export const ALL_SCHOOL_QUESTS: readonly SchoolQuestDef[] = [
  ...FLAME_QUESTS,
  ...FROST_QUESTS,
  ...THUNDER_QUESTS,
  ...EARTH_QUESTS,
];

export const SCHOOL_QUEST_MAP: Record<string, SchoolQuestDef> = Object.fromEntries(
  ALL_SCHOOL_QUESTS.map((q) => [q.id, q])
);

export const CAMPUS_NOTICES: readonly CampusNoticeDef[] = [
  {
    id: 'notice_01',
    numberTag: '공고 제24-01호',
    categoryTag: '행정·예산',
    title: '별빛 결계 유지비 증액에 따른 복도 양초 예산 삭감 안내',
    authorProf: 'bernard',
    authorLabel: '교장실 · 왕국 감사 대응팀',
    dateLabel: '신학기 입학식 주간',
    unlockHint: '기본 열람 가능',
    isUnlocked: () => true,
    body: [
      '금월 외벽 별빛 결계 유지 마석이 전년 대비 34% 초과 집행됨에 따라, 본관 1~4층 복도 및 기숙사 계단의 야간 양초 보급량을 절반으로 감축합니다. 점등 시간 외에는 촛대 원령의 푸른 불빛을 참고하거나 영혼불 사역마 소지자와 동행하시기 바랍니다.',
      '야간 통행 중 어둠으로 인해 계단에서 발을 헛디디거나 석상 수호자 칼리온의 발끝에 걸려 넘어지는 사고는 전액 ‘수강생 개인 과실’로 처리되며, 성당 치유실 이용권 외 별도의 산재 마석은 지급되지 않습니다.',
    ],
    marginScribble:
      '※ 추신 (볼타): 기숙사 전등이 깜빡이는 건 정전이 아니라 외벽 결계 부하 테스트 중이니 교장실에 양초 추가 청구서 내지 말 것.',
    rewardStones: 120,
  },
  {
    id: 'notice_02',
    numberTag: '공고 제24-04호',
    categoryTag: '시설·안전',
    title: '흑염 화로 교실 천장 붕괴 및 소화기 미비 관련 긴급 공지',
    authorProf: 'karen',
    authorLabel: '흑염학 교무실 (공동 서명: 세바스티안)',
    dateLabel: '제1학기 실습 2주차',
    unlockHint: '기본 열람 가능',
    isUnlocked: () => true,
    body: [
      '어제 오후 흑염학 기초 실습 도중 신입생 다수의 연옥 불씨가 천장 석고까지 도달하여 2층 복도 일부가 녹아내렸습니다. 이에 따라 화로 교실 내 모래 양동이 설치 안건이 상정되었으나, 카렌 교수의 “화력이 식으면 실력이 죽는다”는 반대로 최종 부결되었습니다.',
      '아울러 바로 아래층 백야 서리 교실 바닥에 서리 결로가 형성되어 수리비 책임 공방이 진행 중입니다. 교장실 감사관이 질의할 경우 모든 재학생은 “천장 균열은 12년 전 흑식 때부터 있던 것”으로 답변을 통일해 주시기 바랍니다.',
    ],
    marginScribble:
      '※ 사후 각주 (세바스티안): 본인은 해당 공범 각서에 동의한 적 없다. 다만 식당 수프가 또 얼었다는 항의 서류는 화로 교실 쪽으로 이관했다.',
    rewardStones: 140,
  },
  {
    id: 'notice_03',
    numberTag: '공고 제24-09호',
    categoryTag: '보건·당직',
    title: '성당 치유실 야간 라벨 분실 약병 주의 및 양호실 당직 교대표',
    authorProf: 'seraphina',
    authorLabel: '성당 치유실 · 아스트라 보건위원회',
    dateLabel: '1막 수정 광산 조사 이후',
    unlockHint: '제1막 클리어 또는 Lv.6 달성 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(1) || s.level >= 6,
    body: [
      '세라피나 교수의 72시간 연속 황동 등불 유지 근무 여파로, 치유실 약장 3열에 보관된 성수 약병과 극세쓴맛 강장제의 종이 라벨 14매가 탈락하였습니다. 시음 전 빛이 더 맑게 반짝이는 쪽을 선택하시되, 오음 시에도 해독 마법이 즉시 시전되므로 안심하시기 바랍니다.',
      '금주 화·목 야간에는 세라피나 교수의 피난민 구호 출장으로 인해 사서장 마르타가 양호실 대리 당직을 섭니다. 환자복 핏자국 오염 방지를 위해 가급적 신발을 벗고 쓰러져 주시고, 붕대 부족 시 금서 봉인 테이프 응급 봉합이 시행될 수 있습니다.',
    ],
    marginScribble:
      '※ 당직자 메모 (마르타): 지난주 봉인 테이프를 뜯고 기어서 탈주한 2학년생 3명은 현재 전선에서 이상하게도 완치 판정을 받았습니다.',
    rewardStones: 160,
  },
  {
    id: 'notice_04',
    numberTag: '공고 제24-12호',
    categoryTag: '도서·연체',
    title: '금서 도서관 장기 연체자 일제 정리 및 복리 정산 고지서',
    authorProf: 'martha',
    authorLabel: '금서 도서관 사서장실',
    dateLabel: '지하 대서고 철문 파손 이후',
    unlockHint: '정규 마법사(2계급) 이상 또는 제2막 클리어 시 해금',
    isUnlocked: (s) => s.rank >= 2 || s.clearedActs.includes(2),
    body: [
      '지하 대서고 3열의 쇠사슬이 해제됨에 따라 300년 전 구형 예산기부터 누적된 미납 도서 412권에 대한 연체료 정산을 개시합니다. 학칙 제19조에 의거하여 하루 연체 시 마석 정산, 사흘 이상 연체 시 영혼 일부 담보가 원칙이나, 이번 분기에는 서고 먼지 털기 노역으로 대체 신청이 가능합니다.',
      '참고로 12년 전 실종된 전임 사서장 크노스 님의 미반납 목록은 ‘사망·실종 특례’로 탕감 처리되었습니다. 단, 떠도는 양피지 망령이 반납함을 물어뜯는 경우가 잦으니 반납 시 반드시 사서장 직인을 확인하십시오.',
    ],
    marginScribble:
      '※ 추신 (마르타): 검은 까마귀 사역마가 물어온 독촉장을 찢어 버린 학생은 다음 날 책상과 의자가 쇠사슬로 묶여 있을 예정입니다.',
    rewardStones: 180,
  },
  {
    id: 'notice_05',
    numberTag: '공고 제24-17호',
    categoryTag: '기숙사·순찰',
    title: '정령 야간 순찰 규정 개정 및 영혼불 사역마 소지자 통금 안내',
    authorProf: 'irene',
    authorLabel: '정령 결계 교실 · 기숙사 사감부',
    dateLabel: '사역마 사육실 개방 주간',
    unlockHint: '제2막 진입 또는 사역마 1종 이상 보유 시 해금',
    isUnlocked: (s) =>
      s.highestAct >= 2 || Object.values(s.familiars).some(Boolean),
    body: [
      '최근 외벽 별빛 결계 틈새를 점검하는 정령 순찰대가 침입자 색출과 동시에 기숙사 내 야식 밀반입 및 무단 외출 학생의 좌표까지 상세히 보고하고 있습니다. 정령들에게 말린 별꽃 과자를 뇌물로 건네는 행위는 결계 교란죄로 간주됩니다.',
      '특히 [영혼불] 사역마를 동반한 재학생은 통금 시간 이후 복도 이동 시, 본인의 의사와 무관하게 사역마가 머리 위를 백열등처럼 환하게 비춰 자동 자수 처리되는 사례가 급증하고 있으니 야간 행동을 자제해 주시기 바랍니다.',
    ],
    marginScribble:
      '※ 담임 메모 (루시아): 자수 처리된 신입생들의 출석부엔 ‘실종’ 대신 ‘야식 압수 후 귀실’로 곱게 고쳐 적어 두었으니 너무 주눅 들지 마세요.',
    rewardStones: 180,
  },
  {
    id: 'notice_06',
    numberTag: '공고 제24-21호',
    categoryTag: '행정·전력',
    title: '폭풍 첨탑 예비 지팡이 피뢰침 강제 징발 및 감가상각 보상안',
    authorProf: 'volta',
    authorLabel: '폭풍 첨탑 연구실 · 외벽 결계 관리반',
    dateLabel: '제3학기 폭풍 경보 발령일',
    unlockHint: '제3막 진입 또는 비술사(3계급) 이상 시 해금',
    isUnlocked: (s) => s.highestAct >= 3 || s.rank >= 3,
    body: [
      '장마철 낙뢰 폭주로 인해 본관 지붕의 구리 피뢰침 3기가 증발함에 따라, 분실물 센터에 보관 중이던 학생 예비 지팡이 19자루를 첨탑 지붕에 임시 접지용으로 매설하였습니다. 해당 지팡이는 10만 볼트 과충전을 거쳐 평소보다 3배 바삭하게 그을린 상태입니다.',
      '소유주 본인이 지붕 위에서 직접 뽑아갈 경우 지팡이 회수를 허가하며, 감가상각 보상금 대신 연구실 서랍에 굴러다니는 정제 마력 가루를 현장에서 즉시 정산해 드립니다. (우천 시 맨손 접촉 엄금)',
    ],
    marginScribble:
      '※ 감사실 경고 (베르나르): 다음에도 학생 물품으로 지붕 피뢰침을 대체하면 첨탑 연구실 월간 홍차 예산까지 전부 몰수하겠다.',
    rewardStones: 200,
  },
  {
    id: 'notice_07',
    numberTag: '공고 제24-25호',
    categoryTag: '교칙·복장',
    title: '뇌전 학파 방전 고글 지급 기준 및 석비 지하 교실 청강생 예우 규칙',
    authorProf: 'morden',
    authorLabel: '아스트라 학사관리처 · 공동 교무위원회',
    dateLabel: '학파 통합 전술 훈련일',
    unlockHint: '제3막 클리어 또는 제4막 진입 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(3) || s.highestAct >= 4,
    body: [
      '금년도 학칙 재검토에 따라 폭풍 첨탑의 뇌전 여성 마법사에게 지급되는 절연 방전 고글은 현행대로 유지하되, 남성 마법사에게는 수채화 정면 시야 확보 규율에 의거해 별도 고글을 지급하지 않음을 재확인합니다. 앞머리 정전기 정리는 개인 빗을 지참하십시오.',
      '또한 석비 지하 교실의 경우 12년 전 흑식 당시 졸업하지 못한 3학년 망령 청강생이 뒷좌석에 착석하는 경우가 있으나, 출석부에 [조퇴]로 표기하면 조용히 마석을 두고 퇴실하므로 불필요한 퇴마 주문을 영창하지 마시기 바랍니다.',
    ],
    marginScribble:
      '※ 각주 (모르덴): 지난주 신입생 하나가 망령 선배한테 필기 노트를 빌려 달랬다가 300년 전 구판 교재를 받아 왔더군. 뜻밖에 요긴했다.',
    rewardStones: 220,
  },
  {
    id: 'notice_08',
    numberTag: '공고 제24-29호',
    categoryTag: '출결·면학',
    title: '전시 체제 출석부 양식 안내 및 승급 시험관 항의 서한 열람 요약',
    authorProf: 'lucia',
    authorLabel: '신입생 담임실 · 천문 교장실',
    dateLabel: '데런 왕도 출격 전야',
    unlockHint: '제4막 클리어 또는 심연 마도사(4계급) 이상 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(4) || s.rank >= 4,
    body: [
      '현재 아스트라 본관 회랑에서 운용 중인 출석부에는 일반 결석란 대신 [실종] 및 [양호실 직행] 란이 기본 인쇄되어 있습니다. 장기 원정 출격 전 반드시 담임 루시아에게 행선지 메모를 남겨 [무사 귀환] 칸이 공란이 되지 않도록 협조 부탁드립니다.',
      '한편 성당 치유실로부터 “심연 심판관 베스퍼의 합격률이 너무 낮아 병상이 모자란다”는 공식 항의 서한이 14분기 연속 접수되었으나, 교장 베르나르는 “대마도사 시험관 아스티엔 환영보단 사정이 나은 편”이라며 안건을 보류했습니다.',
    ],
    marginScribble:
      '※ 담임 소감 (루시아): 부상 4건 제외 전원 생존이라도 괜찮아요. 다들 두 발로만 돌아와 주시면 출석부엔 웃으며 동그라미 쳐드릴게요.',
    rewardStones: 240,
  },
  {
    id: 'notice_09',
    numberTag: '공고 제24-34호',
    categoryTag: '극비·전선',
    title: '외벽 결계 최대 가동(부하 10배) 경보 및 12년 전 사직서 처리 보류 공고',
    authorProf: 'bernard',
    authorLabel: '천문 교장실 · 비상 방위사령부',
    dateLabel: '제5막 심연의 균열 개방 직후',
    unlockHint: '제5막 클리어 또는 대마도사(5계급) 이상 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(5) || s.rank >= 5,
    body: [
      '북쪽 검은 안개의 협곡에서 심연 군단장 말레고스의 공세가 관측됨에 따라, 아스트라 본관 외벽 결계 출력이 평시의 열 배로 고정되었습니다. 모든 재학생은 정문 결계 10미터 이내 접근을 삼가고, 손목에 검은 봉인 문양이 있는 교직원을 마주쳐도 동요하지 마십시오.',
      '더불어 교장실 책상 맨 아래 서랍에서 12년 전에 작성된 ‘교장 베르나르 사직서’가 발견되었으나, 왕국 감사관이 “마왕 토벌 및 천장 수리비 정산 완료 전까지는 사표 수리 불가” 판정을 내려 당분간 원안대로 집무가 이어집니다.',
    ],
    marginScribble:
      '※ 교장 추신 (베르나르): 마왕보다 월말 결산이 끈질기다는 사실을 오늘 다시 배웠다. 그래도 내 제자들이 돌아올 집은 내가 지켜 두마.',
    rewardStones: 270,
  },
  {
    id: 'notice_10',
    numberTag: '공고 특-01호',
    categoryTag: '윤회·특례',
    title: '성좌 회귀자 학적 이월 특례 및 25층 반납 완료 도장 승계 안내',
    authorProf: 'martha',
    authorLabel: '아스트라 기록실 · 천문 윤회관측반',
    dateLabel: '별빛이 돌아온 뒤 · 영원한 신학기',
    unlockHint: '제6막 클리어 또는 시간 회귀 1회 이상 달성 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(6) || s.prestige.rebirthCount >= 1,
    body: [
      '검은 왕좌의 첨탑 너머 [별의 잔재]를 품고 입학식 날로 되돌아온 성좌 회귀자의 경우, 학칙 특례 제99조에 따라 기록실 도감, 교수진 인연, 학파 전승 패시브 및 본 게시판 열람 이력이 연체료 0마석으로 전액 영구 이월됩니다.',
      '아울러 무한 심연 탑 5층 서기관 카시엘이 “수십 번 제적 처리했는데 출석부 맨 윗줄에 다시 이름이 번진다”고 민원을 제기했으나, 마르타 사서장이 25층 악마 말코르가 뱉어낸 금서 쪽지에 직접 ‘반납 완료’ 도장을 찍어주며 정식으로 학적을 재인가하였습니다.',
    ],
    marginScribble:
      '※ 일동 합동 메모: 몇 번째 시간선을 건너 다시 입학식을 치르더라도, 월요일 1교시 지각 면제는 불가합니다. — 아스트라 교수진 일동',
    rewardStones: 300,
  },
];

export const CAMPUS_NOTICE_MAP: Record<string, CampusNoticeDef> = Object.fromEntries(
  CAMPUS_NOTICES.map((n) => [n.id, n])
);

export function createDefaultSchoolJournal(): SchoolJournalState {
  return {
    claimedQuests: [],
    readNotices: [],
  };
}

export function ensureSchoolJournal(
  raw?: Partial<SchoolJournalState> | null
): SchoolJournalState {
  const base = createDefaultSchoolJournal();
  if (!raw || typeof raw !== 'object') return base;

  const questSet = new Set<string>();
  if (Array.isArray(raw.claimedQuests)) {
    for (const id of raw.claimedQuests) {
      if (typeof id === 'string' && Object.prototype.hasOwnProperty.call(SCHOOL_QUEST_MAP, id)) {
        questSet.add(id);
      }
    }
  }

  const noticeSet = new Set<string>();
  if (Array.isArray(raw.readNotices)) {
    for (const id of raw.readNotices) {
      if (typeof id === 'string' && Object.prototype.hasOwnProperty.call(CAMPUS_NOTICE_MAP, id)) {
        noticeSet.add(id);
      }
    }
  }

  return {
    claimedQuests: Array.from(questSet),
    readNotices: Array.from(noticeSet),
  };
}

export function getQuestsForSchool(school: SchoolId): readonly SchoolQuestDef[] {
  return SCHOOL_QUESTS[school];
}

export function isSchoolQuestClaimed(state: GameState, id: string): boolean {
  return ensureSchoolJournal(state.schoolJournal).claimedQuests.includes(id);
}

export function isSchoolQuestClaimable(state: GameState, def: SchoolQuestDef): boolean {
  return (
    def.school === state.school &&
    !isSchoolQuestClaimed(state, def.id) &&
    def.getProgress(state) >= def.target
  );
}

export function getClaimableSchoolQuestCount(state: GameState): number {
  let count = 0;
  for (const def of SCHOOL_QUESTS[state.school]) {
    if (isSchoolQuestClaimable(state, def)) {
      count += 1;
    }
  }
  return count;
}

export function isCampusNoticeUnlocked(state: GameState, def: CampusNoticeDef): boolean {
  return def.isUnlocked(state);
}

export function isCampusNoticeRead(state: GameState, id: string): boolean {
  return ensureSchoolJournal(state.schoolJournal).readNotices.includes(id);
}

export function isCampusNoticeClaimable(state: GameState, def: CampusNoticeDef): boolean {
  return isCampusNoticeUnlocked(state, def) && !isCampusNoticeRead(state, def.id);
}

export function getClaimableNoticeCount(state: GameState): number {
  let count = 0;
  for (const def of CAMPUS_NOTICES) {
    if (isCampusNoticeClaimable(state, def)) {
      count += 1;
    }
  }
  return count;
}

export function getTotalJournalClaimableCount(state: GameState): number {
  return getClaimableSchoolQuestCount(state) + getClaimableNoticeCount(state);
}

export function getSchoolQuestBonuses(state: GameState): SchoolQuestBonuses {
  const totals: SchoolQuestBonuses = {
    magicPct: 0,
    hpPct: 0,
    defPct: 0,
    critRate: 0,
    critDmg: 0,
    categoryBonuses: {},
  };

  const journal = ensureSchoolJournal(state.schoolJournal);
  if (journal.claimedQuests.length === 0) {
    return totals;
  }

  for (const id of journal.claimedQuests) {
    const def = SCHOOL_QUEST_MAP[id];
    if (!def) continue;
    const p = def.passive;
    if (p.magicPct) totals.magicPct += p.magicPct;
    if (p.hpPct) totals.hpPct += p.hpPct;
    if (p.defPct) totals.defPct += p.defPct;
    if (p.critRate) totals.critRate += p.critRate;
    if (p.critDmg) totals.critDmg += p.critDmg;
    if (p.categoryBonus) {
      const { category, pct } = p.categoryBonus;
      totals.categoryBonuses[category] = (totals.categoryBonuses[category] ?? 0) + pct;
    }
  }

  totals.magicPct = Math.round(totals.magicPct * 10) / 10;
  totals.hpPct = Math.round(totals.hpPct * 10) / 10;
  totals.defPct = Math.round(totals.defPct * 10) / 10;
  totals.critRate = Math.round(totals.critRate * 10) / 10;
  totals.critDmg = Math.round(totals.critDmg * 10) / 10;
  for (const cat of Object.keys(totals.categoryBonuses) as MagicCategory[]) {
    const v = totals.categoryBonuses[cat];
    if (typeof v === 'number') {
      totals.categoryBonuses[cat] = Math.round(v * 10) / 10;
    }
  }

  return totals;
}

export function formatSchoolQuestReward(
  reward: SchoolQuestReward,
  mentorName: string
): string {
  const parts: string[] = [];
  if (reward.stones) parts.push(`마석 +${reward.stones.toLocaleString()}`);
  if (reward.arcaneDust) parts.push(`가루 +${reward.arcaneDust.toLocaleString()}`);
  if (reward.tomeShards) parts.push(`금서 +${reward.tomeShards.toLocaleString()}`);
  if (reward.starRemnants) parts.push(`별의 잔재 +${reward.starRemnants.toLocaleString()}`);
  if (reward.affinityGain > 0) parts.push(`${mentorName} 친밀도 +${reward.affinityGain}`);
  return parts.join(' · ');
}
