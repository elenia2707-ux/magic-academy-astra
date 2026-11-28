import type { GameState } from '../types/game';

export type CodexCategory = 'chronicle' | 'schools' | 'glossary' | 'secrets';

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  eraTag: string;
  title: string;
  subtitle: string;
  summary: string;
  body: string[];
  curatorNote: string;
  curatorName: string;
  unlockHint: string;
  isUnlocked: (state: GameState) => boolean;
  rewardStones: number;
  passive: {
    magicPct?: number;
    hpPct?: number;
    defPct?: number;
    rewardPct?: number;
  };
  passiveLabel: string;
}

export interface CodexBonuses {
  magicPct: number;
  hpPct: number;
  defPct: number;
  rewardPct: number;
}

export const CODEX_CATEGORIES: readonly { id: CodexCategory; label: string }[] = [
  { id: 'chronicle', label: '연대기' },
  { id: 'schools', label: '학파·마법' },
  { id: 'glossary', label: '용어 사전' },
  { id: 'secrets', label: '극비 기록' },
];

export const CODEX_ENTRIES: readonly CodexEntry[] = [
  // ===================== 연대기 (chronicle, 6편) =====================
  {
    id: 'ch_founding',
    category: 'chronicle',
    eraTag: '태초 · 창건기',
    title: '태초: 별빛을 삼킨 현자와 아스트라 건립',
    subtitle: '최초의 대현자 발바르의 타락과 초대 교장 아스티엔의 결계',
    summary:
      '별빛을 수호하던 최초의 현자 발바르가 절망 끝에 마왕으로 타락하자, 초대 교장 아스티엔이 성좌 맥 위에 아스트라 마법학교를 세웠다.',
    body: [
      '아득한 옛날, 밤하늘의 아스트라 성좌를 홀로 수호하던 최초의 대현자 발바르는 인간들의 끝없는 배신과 구원 없는 시대에 절망했다. 결국 그는 수호하던 모든 별빛을 스스로 삼켜 마왕으로 군림했고, 대륙의 하늘엔 처음으로 검은 안개가 드리워졌다.',
      '그 어둠에 맞선 이가 바로 초대 교장 아스티엔이었다. 아스티엔은 대륙의 성좌 맥이 교차하는 고지대에 아스트라 마법학교를 건립하고, 꺼져가는 별빛을 증폭하는 거대한 외벽 결계와 6계급 승급 시험 체계를 남겼다.',
      '그로부터 수백 년이 흐른 지금도 천문 교장실과 학교 정문에는 아스티엔이 새긴 별빛 문장이 살아 숨 쉰다. 물론 300년 전 예산으로 만든 석상 수호자 칼리온이 아직 현역으로 굴려지고 있다는 사소한 행정 사정은 별개의 이야기다.',
    ],
    curatorNote:
      '초대 교장님께서 남기신 시험 문제집과 결계 유지 규칙은 천 년째 단 한 줄도 개정되지 않았습니다. 덕분에 오늘도 교장실에는 야간 조명 대신 감사관의 독촉장이 먼저 도착합니다.',
    curatorName: '교장 베르나르',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { magicPct: 0.4 },
    passiveLabel: '마력 +0.4%',
  },
  {
    id: 'ch_eclipse',
    category: 'chronicle',
    eraTag: '12년 전 · 흑식의 밤',
    title: '12년 전: 대재앙 「흑식(黑蝕)」의 밤',
    subtitle: '밤하늘이 꺼지고 별빛이 부서진 대륙 최악의 재앙',
    summary:
      '마왕 발바르의 부활과 함께 대륙 전역의 별빛이 꺼지며 데런 왕도, 님펜 숲, 백야 가문이 차례로 무너진 날의 기록.',
    body: [
      '12년 전 어느 밤, 북쪽 하늘에서 쏟아진 검은 안개가 대륙의 성좌를 통째로 가렸다. 훗날 사관들이 「흑식(黑蝕)」이라 부른 그 대재앙 속에서 살아남은 도시는 아스트라 결계 안쪽뿐이었다.',
      '흑식의 최전선에서 초대 교장 아스티엔의 지팡이는 금이 갈 정도로 마력을 소진했고, 당시 동행했던 베르나르의 눈가에는 지워지지 않는 검은 저주 흉터가 남았다. 같은 밤, 데런 왕도가 성문을 닫았고 님펜의 북쪽 숲은 붉은 불길에 휩싸였다.',
      '재앙이 한 차례 잦아든 뒤 세라피나는 성당 치유실의 황동 성광 등불에 불을 밝혔다. 그 불꽃은 밤낮없는 교대 근무와 약병 라벨 누락 사태 속에서도 12년 동안 단 한 번도 꺼지지 않았다.',
    ],
    curatorNote:
      '그날 밤 이후 성당 등불을 끄지 않은 건 신앙심 때문만은 아닙니다. 불이 꺼지면 복도 끝 어둠 속에서 무엇이 걸어 나올지, 여기 있는 누구도 확인하고 싶지 않으니까요.',
    curatorName: '성광 교수 세라피나',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { hpPct: 0.4 },
    passiveLabel: '최대 HP +0.4%',
  },
  {
    id: 'ch_knoss',
    category: 'chronicle',
    eraTag: '흑식 직후 · 지하 대서고',
    title: '지하 대서고의 실종: 전임 사서장 크노스',
    subtitle: '쇠사슬 서고 안쪽에 스스로를 가둔 기록자의 경고',
    summary:
      '흑식의 날, 마왕을 없앨 금서를 추적하던 전임 사서장 크노스는 “학교 안에 마왕의 파편이 살아 있다”는 말과 열쇠 한 개만 남기고 사라졌다.',
    body: [
      '흑식이 닥친 직후, 아스트라 금서 도서관의 전임 사서장 크노스는 마왕 발바르의 부활을 완전히 끊어낼 금지된 술식을 추적했다. 그러나 서고 심층에서 그가 마주친 것은 승리의 해법이 아니라, 학교 결계 안쪽에 숨 쉬고 있던 이질적인 심장의 파동이었다.',
      '그날 밤 크노스는 성당 치유실 등불 앞에서 오래 기도한 뒤, 후임 마르타에게 낡은 철제 열쇠 단 한 개만을 건네고 지하 대서고의 문을 안쪽에서 걸어 잠갔다. 12년 뒤 철문이 부서졌을 때, 그는 이미 쇠사슬 금서에 잠식된 망령 대사서가 되어 있었다.',
      '마르타는 스승의 영혼을 안식에 들게 한 뒤에도 목에 걸린 철제 열쇠를 풀지 않는다. 다만 열람 규칙만은 한층 엄격해져, 금서 연체료는 여전히 복리로 정확히 정산되고 있다.',
    ],
    curatorNote:
      '스승님은 늘 “책장을 닫지 못하면 책장이 우릴 닫는다”고 하셨지요. 덕분에 저는 지금도 서고 정숙 규정을 어긴 학생이나 영혼에게는 예외 없이 철제 자로 응대합니다.',
    curatorName: '사서장 마르타',
    unlockHint: '제2막 진입 또는 제1막 클리어 시 해금',
    isUnlocked: (s) => s.highestAct >= 2 || s.clearedActs.includes(1),
    rewardStones: 200,
    passive: { magicPct: 0.4 },
    passiveLabel: '마력 +0.4%',
  },
  {
    id: 'ch_nymphen',
    category: 'chronicle',
    eraTag: '흑식 직후 · 님펜 숲',
    title: '붉은 달과 시든 장미: 님펜 숲의 비극',
    subtitle: '옛 정령학 수석 모르가나의 타락과 아이린의 침묵',
    summary:
      '졸업식 직후 불타버린 북쪽 님펜 숲. 아스트라의 결계를 지키느라 구원하지 못한 옛 벗 모르가나는 붉은 달의 마녀가 되어 탑에 남았다.',
    body: [
      '흑식이 터지기 직전 졸업식 날, 아스트라 최연소 정령학 수석이던 모르가나는 동향 친구 아이린의 옷깃에 붉은 장미 한 송이를 꽂아주며 각자의 숲으로 돌아가더라도 잊지 말자고 약속했다.',
      '그러나 곧장 덮쳐온 흑식의 불길이 님펜 숲을 집어삼켰다. 아스트라 본관의 별빛 결계를 유지하는 데 모든 마력이 묶여 있던 교수진은 북쪽 숲 끝까지 지원군을 보낼 수 없었고, 혼자 남겨진 모르가나는 타락한 정령들과 함께 혈월의 의식에 빠져들었다.',
      '후일 세바스티안이 그 시든 장미가 부서지지 않도록 얇은 영구 서리 결계로 코팅해 주었을 때, 아이린은 아무 말 없이 고개를 숙였다. 붉은 달이 가라앉은 밤에도 꽃잎의 가시는 여전히 시렸다.',
    ],
    curatorNote:
      '정령들은 이제 그 숲에 다시 들꽃이 피기 시작했다고 속삭여 주었어요. 모르가나가 남긴 마지막 질문을 안고서라도, 저는 남은 학생들의 결계를 끝까지 엮겠습니다.',
    curatorName: '결계학 아이린',
    unlockHint: '제3막 진입 또는 제2막 클리어 시 해금',
    isUnlocked: (s) => s.highestAct >= 3 || s.clearedActs.includes(2),
    rewardStones: 240,
    passive: { defPct: 0.5 },
    passiveLabel: '방어 +0.5%',
  },
  {
    id: 'ch_deren',
    category: 'chronicle',
    eraTag: '흑식 전선 · 데런 왕도',
    title: '함락된 데런 왕도와 마지막 서약',
    subtitle: '성문을 닫고 스러진 알드리치 기사단과 아스트라의 부채',
    summary:
      '12년 전 아스트라가 숨을 고를 시간을 벌기 위해 스스로 성문을 닫았던 데런 왕도. 데스나이트 단장 알드리치는 저주 속에서도 심연의 문을 막아서 있었다.',
    body: [
      '데런 왕도는 아스트라 마법학교와 끝까지 맹약을 지킨 마지막 인간 왕국이었다. 흑식의 군세가 몰려오던 밤, 기사단장 알드리치는 아스트라의 어린 제자들과 결계가 무너지지 않도록 왕도 성문을 스스로 닫아 시간을 벌었다.',
      '카렌의 팔에 남은 오래된 화상 흉터와 세바스티안의 금이 간 백야 가문 은빛 인장은 모두 그 처절했던 철수 전선에서 새겨진 흔적이다. 왕도는 함락되었고 궁정 연금술사와 리치들마저 망자가 되었으나, 알드리치는 피난민을 쫓는 대신 북쪽 심연의 문 앞을 가로막은 채 12년을 버텼다.',
      '마침내 아스트라의 비술사가 그의 갑주를 꿰뚫어 안식을 허락했을 때, 알드리치는 베르나르에게 “그 아이를 살리기로 택한 그날의 결정을 원망하지 않았다”는 마지막 경례를 남겼다.',
    ],
    curatorNote:
      '모르덴 교수가 내 나무 부적 옆에 알드리치의 낡은 검집 조각을 묻는 날, 교장실 양주병이 반 병쯤 비어 있었지만 누구도 경비 청구서를 묻지 않았네.',
    curatorName: '교장 베르나르',
    unlockHint: '제4막 진입 또는 제3막 클리어 시 해금',
    isUnlocked: (s) => s.highestAct >= 4 || s.clearedActs.includes(3),
    rewardStones: 280,
    passive: { hpPct: 0.5 },
    passiveLabel: '최대 HP +0.5%',
  },
  {
    id: 'ch_vessel',
    category: 'chronicle',
    eraTag: '제5~6막 · 숨겨진 진실',
    title: '그릇의 진실과 별이 잠든 왕좌',
    subtitle: '신입생 담임 루시아의 정체와 12년 만에 돌아온 성좌',
    summary:
      '초대 교장 아스티엔이 마왕의 심장 조각을 봉인해 탄생한 ‘그릇’ 루시아. 처형을 막고 제자를 길러낸 베르나르의 도박 끝에 발바르의 왕좌가 무너졌다.',
    body: [
      '12년 전 아스티엔은 마왕 발바르를 완전히 소멸시키지 못하자, 폭주하던 마왕의 심장 조각을 떼어내 한 인간의 육신 속에 가두는 최후의 봉인을 실행했다. 그 봉인의 그릇이 바로 오늘날 신입생 출석부를 들고 웃는 담임 교수 루시아였다.',
      '원로들이 위험을 이유로 그릇의 처형을 요구했을 때, 베르나르는 그녀를 별빛 결계 안쪽에 붙들어 두는 조건으로 목숨을 지켰다. 그리고 그릇을 희생시키는 대신 마왕을 정면으로 쓰러뜨릴 ‘별의 계승자’를 키우기 위해 금서 도서관의 빗장까지 풀었다.',
      '검은 왕좌의 첨탑에서 마왕 발바르가 쓰러지자, 12년 만에 아스트라 밤하늘의 성좌가 제자리를 찾았고 루시아 손목의 검은 봉인 리본은 조용히 빛이 되어 흩어졌다.',
    ],
    curatorNote:
      '이제 교문 밖 풀밭을 맨발로 밟아도 손목이 아프지 않아요. 물론 월요일 교무 회의록의 ‘부상 4건 제외’ 각주는 여전히 수정할 일이 산더미지만요.',
    curatorName: '담임 교수 루시아',
    unlockHint: '제5막 진입 또는 시간 회귀 1회 이상 시 해금',
    isUnlocked: (s) => s.highestAct >= 5 || s.prestige.rebirthCount >= 1,
    rewardStones: 350,
    passive: { magicPct: 0.6 },
    passiveLabel: '마력 +0.6%',
  },

  // ===================== 학파·마법 (schools, 6편) =====================
  {
    id: 'sc_flame',
    category: 'schools',
    eraTag: '4대 학파 · 흑염학',
    title: '흑염학: 잿빛 화로의 전선',
    subtitle: '화상과 연옥 폭발로 적을 재로 만드는 고화력 학파',
    summary:
      '잿빛 화로의 영지에서 기원한 흑염 학파는 두려움마저 불태우는 고화력 마법을 추구하며, 카렌 교수가 화로 교실을 지휘한다.',
    body: [
      '흑염 학파의 마법사들은 마력을 12% 끌어올리고 화염 마법 위력을 15% 증폭시키는 잿불의 호흡을 익힌다. 『불씨탄』과 『흑염구』로 적에게 화상을 누적시킨 뒤, 『연옥 폭발』과 『심연의 태양』으로 불길을 한꺼번에 기폭하는 것이 기본 교범이다.',
      '지도 교수 카렌은 “불꽃을 다루는 자는 두려움마저 태워야 한다”고 호통치지만, 정작 흑염 화로 교실에는 방화 결계는커녕 양동이 하나 놓여 있지 않다. 천장 석고가 녹아내릴 때마다 아래층 서리 교실과 수리비 공방전이 벌어지는 것이 일상이 되었다.',
      '그럼에도 전선에 선 흑염 학파 마법사들의 등은 언제나 동료들의 방패가 된다. 카렌의 가죽 암가드 아래 새겨진 오래된 화상 흉터가 그 증거다.',
    ],
    curatorNote:
      '실습하다 천장 좀 그을렸다고 시말서 쓰게 하는 교장 영감이 더 지독하지. 어쨌든 전장에서 살아남으려면 화력이 제일 확실한 보험이야.',
    curatorName: '흑염학 카렌',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { magicPct: 0.3 },
    passiveLabel: '마력 +0.3%',
  },
  {
    id: 'sc_frost',
    category: 'schools',
    eraTag: '4대 학파 · 빙결학',
    title: '빙결학: 몰락한 백야 가문의 서리',
    subtitle: '냉정한 마나 순환과 빙결 제어로 장기전을 지배하는 학파',
    summary:
      '백야의 설원 영지에서 내려온 영원한 서리 학파. 세바스티안 교수가 마나 순환의 절제와 빙결 전술을 가르친다.',
    body: [
      '영원한 서리 학파는 감정에 휩쓸려 마력을 허비하는 것을 최악의 실수로 여긴다. 최대 마나 18% 증폭과 매 턴 마나 회복 +4라는 안정적인 순환 위에서 『서리 바늘』, 『빙결 창』, 『절대영도』로 적의 행동을 꽁꽁 묶어버린다.',
      '백야 서리 교실은 몰락한 백야 엘프 귀족 가문의 후예 세바스티안이 맡고 있다. 교실 내부가 영하로 유지되는 탓에 식당 수프가 얼어붙거나 복도 벽면에 고드름이 자라는 사고가 빈번하지만, 전선에서 마나가 말라 죽는 제자는 거의 없다.',
      '가슴에 달린 금이 간 은빛 인장은 12년 전 데런 왕도 전선에서 깨진 것이며, 세바스티안은 지금도 야간 보충 수업을 통해 제자의 생존률을 0.1%라도 끌어올리려 든다.',
    ],
    curatorNote:
      '착각하지 마라. 제자들을 붙잡아 두고 마나 순환과 방어술을 닦달하는 건, 교장실에 제출할 사망 보고서 서식 칸을 채우기가 귀찮아서일 뿐이다.',
    curatorName: '빙결학 세바스티안',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { defPct: 0.4 },
    passiveLabel: '방어 +0.4%',
  },
  {
    id: 'sc_thunder',
    category: 'schools',
    eraTag: '4대 학파 · 뇌전학',
    title: '뇌전학: 폭풍 첨탑과 외벽 결계',
    subtitle: '압도적 치명타와 연쇄 감전으로 어둠보다 빠르게 꿰뚫는 학파',
    summary:
      '폭풍 첨탑의 영지 출신 천재 볼타가 이끄는 뇌전 학파. 다단히트 뇌격으로 보스조차 단숨에 무너뜨리는 한편 아스트라 외벽 결계를 지탱한다.',
    body: [
      '뇌전 학파의 신조는 단순하다. 적이 지팡이를 들기 반 박자 전에 심장을 꿰뚫는 것. 기본 치명타 확률 +10%와 치명타 피해 +20%를 바탕으로 『연쇄 낙뢰』, 『뇌운 소환』, 『뇌신의 강림』을 연사해 감전 상태의 적을 섬멸한다.',
      '최연소 수석 출신 볼타 교수는 전투 마법뿐 아니라 아스트라 외벽 결계 증폭 회로를 홀로 유지 보수하고 있다. 기숙사가 정전되거나 지붕 피뢰침에 학생의 예비 지팡이가 꽂혀 있는 날이면, 대개 첨탑에서 신형 회로 실험이 성공했다는 뜻이다.',
      '참고로 아스트라 교칙상 폭풍 첨탑의 뇌전 여성 마법사에게는 방전 고글 착용이 허가되나, 남성 마법사에게는 시야 확보와 수채화 정면 규율에 따라 고글이 지급되지 않는다.',
    ],
    curatorNote:
      '기숙사 전등이 세 번 깜빡였다고 정전 사고라고 부르지 마. 그건 ‘외벽 결계 최대 출력 과부하 테스트’의 정상적인 부수 효과라고.',
    curatorName: '뇌전학 볼타',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { magicPct: 0.3 },
    passiveLabel: '마력 +0.3%',
  },
  {
    id: 'sc_earth',
    category: 'schools',
    eraTag: '4대 학파 · 대지·사령학',
    title: '대지·사령학: 석비에 새겨진 전우들',
    subtitle: '철벽 방어, 피해 반사, 독·저주로 강적을 말려 죽이는 생존 학파',
    summary:
      '고대 석비의 숲을 기원으로 둔 침묵의 대지 학파. 늑대 수인 현자 모르덴이 무너지지 않는 방벽과 망자들의 기억을 전수한다.',
    body: [
      '침묵의 대지 학파는 폭풍이 지나간 뒤 끝까지 서 있는 자만이 승자라고 가르친다. 최대 체력 +18%, 방어력 +20%의 단단한 기반 위에 『가시 방벽』의 피해 반사와 『대지의 구속』, 『망자의 성채』로 적 스스로 제 무덤을 파게 만든다.',
      '석비 지하 교실을 지키는 모르덴 교수는 한쪽 귀의 오래된 전투 흉터와 전우들의 이름이 새겨진 나무 룬 부적을 지니고 다닌다. 교실이 서늘한 탓에 때로 3학년 망령이 조용히 청강하러 들어오곤 하지만, 모르덴은 그들마저 출석부에 조퇴 처리로 예우해 준다.',
      '전선의 화려한 영웅담은 흑염이나 뇌전이 가져갈지 몰라도, 살아남아 다음 날 교문을 다시 밟는 쪽은 언제나 대지 학파다.',
    ],
    curatorNote:
      '죽은 자들은 거짓을 말하지 않는다. 발밑의 땅을 믿는 마법사라면, 내 나무 부적에 새긴 이름 목록에 자신의 이름을 서둘러 보탤 일은 없을 것이다.',
    curatorName: '대지학 모르덴',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { hpPct: 0.4 },
    passiveLabel: '최대 HP +0.4%',
  },
  {
    id: 'sc_ward_holy',
    category: 'schools',
    eraTag: '공용 학문 · 결계·성광',
    title: '결계와 성광: 아스트라의 두 방패',
    subtitle: '아이린의 정령 결계와 세라피나의 성광 치유술',
    summary:
      '어떤 학파에 속하든 전선에서 살아 돌아오기 위해 필수적으로 익혀야 하는 정령 결계와 성광 치유 체계.',
    body: [
      '아스트라에서는 공격 학파만으로는 4막 데런 왕도 이후의 강적을 버텨낼 수 없다. 아이린 교수가 가르치는 결계·정령학의 『실디의 방패』, 『원혼의 거울』, 『별빛 결계』는 적의 치명적인 강공격 예고 턴을 정면으로 받아내는 생존의 열쇠다.',
      '성당 치유실의 세라피나 교수가 주관하는 성광·치유학은 『빛의 손길』, 『성수의 정화』, 『여신의 재생』, 『성광의 축복』으로 구성되어 있다. 상태이상을 씻어낼 뿐 아니라 흑마법 시전 시 지불하는 생명력 대가를 메우는 데도 필수적이다.',
      '치유실에는 언제나 허브차와 성수가 준비되어 있으나, 세라피나가 사흘 밤을 새워 약병 라벨이 떨어진 날에는 시음 전에 반짝임 정도를 꼭 확인하는 편이 좋다.',
    ],
    curatorNote:
      '결계는 공격을 막는 벽이 아니라 소중한 사람을 지키겠다는 마음의 형태예요. 밤마다 정령들이 기숙사 야식 위치를 제보하는 건… 부가 기능이지만요.',
    curatorName: '결계학 아이린',
    unlockHint: '시전자 승급 또는 제2막 진입 시 해금',
    isUnlocked: (s) => s.rank >= 1 || s.highestAct >= 2,
    rewardStones: 200,
    passive: { defPct: 0.5 },
    passiveLabel: '방어 +0.5%',
  },
  {
    id: 'sc_dark',
    category: 'schools',
    eraTag: '금제 학문 · 금서 도서관',
    title: '금서 도서관과 흑마법의 대가',
    subtitle: '생명력을 바쳐 별을 떨어뜨리는 3계급 해금 비술',
    summary:
      '정규 마법사 이상에게만 문이 열리는 금서 도서관. 금서 조각으로 해독하는 흑마법은 막대한 파괴력과 함께 시전자의 피를 요구한다.',
    body: [
      '3계급 [정규 마법사]로 승급해 봉인 감시자 말라키를 넘어서면 비로소 마르타 사서장이 관리하는 금서 도서관의 빗장이 열린다. 베르나르 교장이 원로들의 반대를 무릅쓰고 이 문을 개방한 이유는, 빛만으로는 마왕 발바르를 벨 수 없다는 냉혹한 판단 때문이었다.',
      '『영혼 착취』, 『피의 서약』, 『심연의 낙인』, 『종말의 별』로 이어지는 흑마법은 금서 조각을 소모해 해독하며, 전투 중 시전자의 현재 체력을 대가로 마력을 폭주시키거나 적의 생명을 빨아들인다.',
      '세라피나는 흑마법을 익힌 제자를 책망하는 대신, 영혼이 어둠에 깎일 때마다 성당 치유실의 꺼지지 않는 등불 아래로 돌아오라고 당부한다.',
    ],
    curatorNote:
      '금서를 하루 연체하면 마석, 사흘 연체하면 영혼 일부로 정산합니다. 반납 기한만 지키신다면, 그 어떤 금지된 페이지라도 기꺼이 펼쳐 드리죠.',
    curatorName: '사서장 마르타',
    unlockHint: '정규 마법사 승급 또는 흑마법 1종 이상 습득 시 해금',
    isUnlocked: (s) =>
      s.rank >= 2 || Object.keys(s.skills).some((k) => k.startsWith('dark_')),
    rewardStones: 260,
    passive: { magicPct: 0.5 },
    passiveLabel: '마력 +0.5%',
  },

  // ===================== 용어 사전 (glossary, 5편) =====================
  {
    id: 'gl_barrier',
    category: 'glossary',
    eraTag: '용어 사전 · 거점·결계',
    title: '별빛 결계와 아스트라 본관',
    subtitle: '초대 교장 아스티엔이 세운 대륙 최후의 방벽과 교내 생활',
    summary:
      '검은 안개를 막아내는 다층 성좌 방벽과 그 안에서 돌아가는 아스트라 본관, 교실, 양호실, 감사 서류의 세계.',
    body: [
      '아스트라 마법학교 외곽을 감싼 ‘별빛 결계’는 밤하늘의 잔존 성좌 마력을 끌어와 검은 안개의 침식을 차단하는 최후의 방어막이다. 평시에는 볼타 교수의 첨탑 회로와 아이린 교수의 정령 결계가 이중으로 부하를 분담한다.',
      '결계 안쪽의 본관 회랑과 교실들은 12년째 전시 체제로 운영되고 있다. 신입생 오리엔테이션 서약서 뒷면에는 실습 중 수정에 찔려도 성당 치유실 이용권 외엔 배상하지 않는다는 면책 조항이 적혀 있으며, 복도 양초 예산은 매달 결계 유지비로 삭감된다.',
      '세라피나가 자리를 비운 날 양호실 당직을 마르타가 서게 되면, 부상당한 학생들은 치료비 대신 금서 봉인 테이프의 따가움을 견디며 급히 전장으로 복귀하곤 한다.',
    ],
    curatorNote:
      '양호실 시트는 핏자국이 잘 안 빠지니 다음부턴 신발이라도 벗고 쓰러져 주시길. 사망 서류는 교장실 결재가 세 번이나 필요해서 다들 피곤하거든요.',
    curatorName: '사서장 마르타',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { hpPct: 0.3 },
    passiveLabel: '최대 HP +0.3%',
  },
  {
    id: 'gl_ranks',
    category: 'glossary',
    eraTag: '용어 사전 · 계급 체계',
    title: '아스트라 6계급과 승급 시험관 5인',
    subtitle: '견습생에서 대마도사까지, 실전 전투로 인가받는 마도사 위계',
    summary:
      '견습생→시전자→정규 마법사→비술사→심연 마도사→대마도사로 이어지는 6계급과 각 관문을 지키는 5인의 시험관.',
    body: [
      '아스트라의 6계급은 단순한 호칭이 아니라 덱 슬롯, 수련 슬롯, 사역마 사육실, 금서 도서관, 고급 연금 재련, 그리고 6막 출정 권한을 가르는 실질적 인가 등급이다. 견습생으로 입학한 자는 Lv.8과 1막 클리어를 거쳐 첫 승급 시험에 선다.',
      '다섯 관문을 지키는 시험관은 300년 전 구형 예산으로 만들어진 [석상 수호자 칼리온], 쪽지 시험 요령을 쓰면 책상째 묶어버리는 [봉인 감시자 말라키], 거울에 비친 안색으로 야식 여부까지 지적하는 [거울 마녀 이졸데], 양호실 항의 서한의 주범 [심연 심판관 베스퍼], 그리고 [초대 교장의 환영 아스티엔]이다.',
      '이 다섯 시험관을 모두 넘어 [대마도사]에 올라야만 비로소 검은 왕좌의 첨탑으로 진군할 자격을 인정받는다.',
    ],
    curatorNote:
      '시험관들이 하나같이 괴팍해 보여도 실력만큼은 의심할 여지가 없지. 특히 아스티엔 스승님의 별의 심판은 천 년이 지나도 자비가 없더군.',
    curatorName: '교장 베르나르',
    unlockHint: '시전자 승급 또는 Lv.8 달성 시 해금',
    isUnlocked: (s) => s.rank >= 1 || s.level >= 8,
    rewardStones: 180,
    passive: { rewardPct: 0.5 },
    passiveLabel: '마석·EXP 보상 +0.5%',
  },
  {
    id: 'gl_resources',
    category: 'glossary',
    eraTag: '용어 사전 · 재화·연금',
    title: '마석 · 금서 조각 · 마력 가루 · 별의 잔재',
    subtitle: '아스트라의 마법 경제를 지탱하는 4대 핵심 매개체',
    summary:
      '교내 수련과 마도구 강화, 흑마법 해독, 사역마 진화, 그리고 성좌 회귀 영구 각인에 쓰이는 4대 자원의 기원.',
    body: [
      '「마석」은 수정 광산과 마수 토벌에서 회수되는 기본 마력 결정으로, 스킬 강화·마도구 제련·후반 비전 각인까지 아스트라 경제의 혈액 역할을 한다. 「마력 가루」는 불필요한 마도구를 분해할 때 남는 정제 결정으로 연금 재련과 룬 각성에 필수다.',
      '「금서 조각」은 찢겨 흩어진 금서의 낱장이며 흑마법 해독의 열쇠가 되고, 「사역마 알 조각」은 심연 미궁과 전선에서 회수되어 유체 사역마의 부화·진화에 쓰인다.',
      '마지막으로 「별의 잔재」는 6막을 넘어선 대마도사가 시간 회귀를 선택할 때 영혼에 응축되는 성좌의 기억 조각이다. 회차가 거듭되어도 사라지지 않으며 영구 성좌 각인의 밑거름이 된다.',
    ],
    curatorNote:
      '가끔 학생들이 길바닥 마력 가루를 분필 가루로 착각해 칠판에 낙서를 하더군요. 지난주 ‘마왕보다 월요일 1교시가 더 무섭다’ 사건도 그 탓이었습니다.',
    curatorName: '교장 베르나르',
    unlockHint: '기본 개방',
    isUnlocked: () => true,
    rewardStones: 150,
    passive: { rewardPct: 0.5 },
    passiveLabel: '마석·EXP 보상 +0.5%',
  },
  {
    id: 'gl_familiars',
    category: 'glossary',
    eraTag: '용어 사전 · 사역마 계약',
    title: '사역마 계약과 학파 공명',
    subtitle: '유체에서 각성체까지 3단계로 진화하는 전장의 동반자',
    summary:
      '시전자 계급부터 개방되는 사역마 사육실. 6종의 사역마는 고유 행동과 함께 특정 학파와 공명 시너지를 발휘한다.',
    body: [
      '2계급 [시전자]가 되면 사역마 사육실의 출입이 허가된다. 마도사는 검은 까마귀, 뼈 골렘, 영혼불, 그림자 늑대, 서리 올빼미, 흑염 박쥐 가운데 동반자를 부화시켜 유체·성체·각성체 3단계로 성장시킨다.',
      '사역마는 출신 학파와 맞물릴 때 폭발적인 ‘학파 공명’을 일으킨다. 흑염과 박쥐의 《혈월의 화로 계약》, 서리와 올빼미의 《백야의 겨울 서약》, 뇌전과 늑대의 《폭풍 송곳니 추격》, 대지와 골렘의 《석비의 철벽 공명》이 대표적이다.',
      '전 학파 공명인 까마귀와 영혼불 역시 활약이 남다르다. 다만 까마귀는 금서 연체 독촉장만 골라 물어오고, 영혼불은 통금 후 무단 외출한 학생의 머리 위를 환하게 비춰 사감에게 자수시킨다는 보고가 끊이지 않는다.',
    ],
    curatorNote:
      '영혼불이 기숙사 복도에서 길 잃은 신입생을 잘 데려다주긴 하는데… 사감 앞에서도 끝까지 꺼지지 않는 건 솔직히 조금 미안하네요.',
    curatorName: '담임 교수 루시아',
    unlockHint: '사역마 1종 이상 보유 또는 제2막 진입 시 해금',
    isUnlocked: (s) => Object.values(s.familiars).some(Boolean) || s.highestAct >= 2,
    rewardStones: 200,
    passive: { hpPct: 0.4 },
    passiveLabel: '최대 HP +0.4%',
  },
  {
    id: 'gl_abyss_tower',
    category: 'glossary',
    eraTag: '용어 사전 · 엔드게임 심연',
    title: '심연 미궁과 무한 심연 탑 4심층',
    subtitle: '등불을 들고 걷는 16칸 미궁과 초월 군주들이 지키는 4대 심층',
    summary:
      '아스트라 균열 아래 뻗은 주사위 순환 미궁과, 5층마다 6인의 심연 군주가 버티는 무한 심연 탑의 구조.',
    body: [
      '심연 균열 바깥쪽에는 5×5 외곽 16칸이 맞물려 도는 ‘심연 미궁’이 펼쳐져 있다. 탐사자는 심연 등불을 밝혀 제단·봉인된 함·망토 상인·등불 사냥꾼의 매복을 뚫고 금서와 알 조각을 회수한다.',
      '더 깊은 곳에는 네 개 심층으로 나뉜 「무한 심연 탑」이 솟아 있다. 제1심층 침묵의 회랑(1~10F), 제2심층 잿빛 용광로(11~20F), 제3심층 거울의 성좌(21~30F), 그리고 31F 이상으로 끝없이 이어지는 제4심층 무한의 검은 왕좌다.',
      '5의 배수 층마다 서기관 카시엘(5F), 간수 바르칸(10F), 공녀 셀레네(15F), 흑기사 드라켄(20F), 악마 말코르(25F), 군주 아자라엘(30F)이 버티고 있으며, 35층 이후에는 ‘초월’의 이름으로 몇 번이고 다시 나타난다.',
    ],
    curatorNote:
      '25층 악마가 토해낸 잿더미에서 온전한 금서 쪽지가 날아왔더군요. 제 필체로 ‘반납 완료’ 도장까지 찍어두었으니 이번 분기 장부는 깔끔합니다.',
    curatorName: '사서장 마르타',
    unlockHint: '제6막 클리어, 회귀 1회, 또는 심연 탐험 1회 이상 시 해금',
    isUnlocked: (s) =>
      s.clearedActs.includes(6) || s.prestige.rebirthCount >= 1 || s.abyss.depth >= 1,
    rewardStones: 250,
    passive: { rewardPct: 0.6 },
    passiveLabel: '마석·EXP 보상 +0.6%',
  },

  // ===================== 극비 기록 (secrets, 3편) =====================
  {
    id: 'sec_lucia_ribbon',
    category: 'secrets',
    eraTag: '극비 문서 · 제1급',
    title: '[극비] 루시아 손목의 룬 봉인 리본 감정서',
    subtitle: '별빛 결계 이탈 시 발현되는 발열 반응 및 마왕 심장 공명 보고서',
    summary:
      '담임 루시아의 손목에 감긴 검은 봉인 리본은 장식이 아니라, 마왕의 심장 조각이 결계 밖의 어둠과 공명해 폭주하는 것을 억누르는 술식이다.',
    body: [
      '본 문서는 천문 교장실 개인 금고와 성당 치유실의 비공개 진료 차트를 대조해 작성되었다. 피검자 루시아는 12년 전 흑식 당시 초대 교장 아스티엔의 최종 봉인 술식에 의해 형성된 특이 개체이며, 체내에 마왕 발바르의 심장 파편을 품고 있다.',
      '제1막 수정 광산 심층 조사 당시 붉은 수정 군주 락엘르가 격렬히 반응한 것도, 피검자 손목의 룬 문양 검은 리본이 타는 듯이 달아오른 것도 모두 본체 파편과의 공명 현상이었다. 이 때문에 베르나르는 그녀가 별빛 결계 바깥으로 한 걸음도 나가지 못하도록 엄명했다.',
      '주목할 점은, 검은 봉인의 차가움에 잠 못 들던 루시아가 특정 신입생의 발소리를 들을 때마다 맥박과 리본 온도가 정상치로 안정된다는 사실이다. 이는 단순한 봉인 술식만으로는 설명되지 않는 별빛의 공명이다.',
    ],
    curatorNote:
      '가끔 밤마다 손목이 시려서 깨곤 하지만… 당신이 무사히 돌아오는 발소리를 들으면 신기하게도 금세 따뜻해져요. 이 비밀을 알고도 곁에 있어 주실 건가요?',
    curatorName: '담임 교수 루시아',
    unlockHint: '제3막 클리어 또는 루시아 친밀도 60 이상 달성 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(3) || (s.affinity?.points.lucia ?? 0) >= 60,
    rewardStones: 350,
    passive: { magicPct: 0.6 },
    passiveLabel: '마력 +0.6%',
  },
  {
    id: 'sec_bernard_scar',
    category: 'secrets',
    eraTag: '극비 문서 · 제1급',
    title: '[극비] 흑식 흉터와 금이 간 아스티엔의 지팡이',
    subtitle: '12년 전 교장 베르나르와 기사단장 알드리치의 밀약',
    summary:
      '아스티엔의 지팡이가 왜 금이 간 채로 베르나르의 손에 남았으며, 왜 그가 원로들의 처형 명령을 거역했는가에 대한 비밀 기록.',
    body: [
      '12년 전 흑식의 밤, 데런 왕도의 알드리치가 성문을 닫고 버티는 사이 아스티엔과 베르나르는 검은 안개의 핵에 도달했다. 아스티엔은 자신의 지팡이에 금이 가는 것을 감수하고 발바르의 심장을 떼어내 봉인했으며, 그 여파로 베르나르의 눈가에는 영구적인 흑식 저주 흉터가 새겨졌다.',
      '직후 소집된 대륙 원로회는 마왕의 파편을 품은 루시아를 즉시 처형해야 한다고 압박했다. 그러나 베르나르는 스승 아스티엔이 마지막으로 남긴 뜻과 알드리치의 희생을 저버릴 수 없어, 교장 권한으로 처형을 거부하고 그녀를 아스트라 회랑에 숨겼다.',
      '이후 베르나르는 원로회의 감시와 매년 깎이는 학교 예산 속에서도 금서 도서관 개방까지 준비하며 단 하나의 가능성 — 루시아를 죽이지 않고 마왕을 베어낼 후계자의 성장을 기다려 왔다.',
    ],
    curatorNote:
      '내 책상 맨 아래 서랍엔 비상 기금과 천문 비술서, 그리고 12년 동안 쓰지 못한 사직서가 들어 있네. 자네가 별빛을 되찾는 날까지 그 서랍은 열지 않을 생각이다.',
    curatorName: '교장 베르나르',
    unlockHint: '제4막 클리어 또는 베르나르 친밀도 60 이상 달성 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(4) || (s.affinity?.points.bernard ?? 0) >= 60,
    rewardStones: 380,
    passive: { defPct: 0.6 },
    passiveLabel: '방어 +0.6%',
  },
  {
    id: 'sec_rebirth_loop',
    category: 'secrets',
    eraTag: '극비 문서 · 성좌 윤회',
    title: '[극비] 성좌 윤회 관측 기록 (회귀자 보고서)',
    subtitle: '시간을 거슬러 올라도 사라지지 않는 별의 잔재와 교사진의 기시감',
    summary:
      '제6막 이후 발현되는 ‘시간 회귀’ 현상에 관한 심연 관측 기록. 왜 루시아, 베르나르, 그리고 발바르까지 윤회의 흔적을 기억하는가.',
    body: [
      '아스트라 천문대 비공개 관측 일지에 따르면, 검은 왕좌의 첨탑에서 마왕 발바르가 쓰러진 뒤 특정 계승자는 「별의 잔재」를 영혼에 새긴 채 입학식 날로 시간을 되감을 수 있다. 이 현상은 단순한 환상이 아니라, 성좌 서약에 따라 적의 위력과 운명의 무게까지 함께 변주되는 실제 윤회다.',
      '놀라운 점은 인과율의 잔향이다. 회귀를 겪은 계승자를 처음 마주한 입학식에서 베르나르는 설명할 수 없는 노련한 각오를 간파하고, 루시아는 “아주 오래전부터 손을 잡아준 사람” 같은 기시감에 눈을 껌벅인다. 1~6막의 보스들과 심연 탑 군주들조차 “몇 번을 되감아도 변하지 않는 눈빛”과 “수십 번 제적 처리한 출석부”를 중얼거린다.',
      '기록실의 도감, 업적, 교수진과의 인연, 그리고 이 코덱스가 회귀 이후에도 영구히 남는 이유는 바로 이 때문이다. 모든 회차의 기억이 결국 하나의 완전한 구원으로 수렴하기를 성좌가 기록하고 있기 때문이다.',
    ],
    curatorNote:
      '이번 회차에서도 결국 그 서고 문을 여셨군요. 몇 번째 시간의 책장을 넘기고 계시든, 아스트라 기록실의 연체료와 영구 패시브는 변함없이 정확히 이월해 드립니다.',
    curatorName: '사서장 마르타',
    unlockHint: '제6막 클리어 또는 시간 회귀 1회 이상 달성 시 해금',
    isUnlocked: (s) => s.clearedActs.includes(6) || s.prestige.rebirthCount >= 1,
    rewardStones: 450,
    passive: { rewardPct: 1 },
    passiveLabel: '마석·EXP 보상 +1%',
  },
];

export const CODEX_MAP: Record<string, CodexEntry> = Object.fromEntries(
  CODEX_ENTRIES.map((entry) => [entry.id, entry])
);

export function isCodexUnlocked(state: GameState, entry: CodexEntry): boolean {
  return entry.isUnlocked(state);
}

export function isCodexClaimed(state: GameState, id: string): boolean {
  const claimed = state.archive?.claimedCodex;
  return Array.isArray(claimed) && claimed.includes(id);
}

export function isCodexClaimable(state: GameState, entry: CodexEntry): boolean {
  return isCodexUnlocked(state, entry) && !isCodexClaimed(state, entry.id);
}

export function getUnlockedCodexCount(state: GameState): number {
  let count = 0;
  for (const entry of CODEX_ENTRIES) {
    if (isCodexUnlocked(state, entry)) count += 1;
  }
  return count;
}

export function getClaimedCodexCount(state: GameState): number {
  const claimed = state.archive?.claimedCodex;
  if (!Array.isArray(claimed) || claimed.length === 0) return 0;
  const seen = new Set<string>();
  for (const id of claimed) {
    if (typeof id === 'string' && Object.prototype.hasOwnProperty.call(CODEX_MAP, id)) {
      seen.add(id);
    }
  }
  return seen.size;
}

export function getClaimableCodexCount(state: GameState): number {
  let count = 0;
  for (const entry of CODEX_ENTRIES) {
    if (isCodexClaimable(state, entry)) count += 1;
  }
  return count;
}

export function getCodexBonuses(state: GameState): CodexBonuses {
  const totals: CodexBonuses = {
    magicPct: 0,
    hpPct: 0,
    defPct: 0,
    rewardPct: 0,
  };

  const claimed = state.archive?.claimedCodex;
  if (!Array.isArray(claimed) || claimed.length === 0) {
    return totals;
  }

  const seen = new Set<string>();
  for (const id of claimed) {
    if (typeof id !== 'string' || seen.has(id)) continue;
    const entry = CODEX_MAP[id];
    if (!entry) continue;
    seen.add(id);
    if (entry.passive.magicPct) totals.magicPct += entry.passive.magicPct;
    if (entry.passive.hpPct) totals.hpPct += entry.passive.hpPct;
    if (entry.passive.defPct) totals.defPct += entry.passive.defPct;
    if (entry.passive.rewardPct) totals.rewardPct += entry.passive.rewardPct;
  }

  totals.magicPct = Math.round(totals.magicPct * 10) / 10;
  totals.hpPct = Math.round(totals.hpPct * 10) / 10;
  totals.defPct = Math.round(totals.defPct * 10) / 10;
  totals.rewardPct = Math.round(totals.rewardPct * 10) / 10;

  return totals;
}
