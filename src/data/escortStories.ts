import type {
  DialogueLine,
  GameState,
  MagicCategory,
  ProfessorId,
} from '../types/game';
import { ensureAffinity, getAffinityStage } from './affinity';
import type { AcademyEventDef } from './blackComedyEvents';
import { PROFESSOR_ORDER } from './professors';

export interface EscortPassiveBonus {
  magicPct: number;
  hpPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  mpRegen: number;
  darkDamagePct: number;
  expPct: number;
  stonePct: number;
  starlightGainMult: number;
  openingShieldPct: number;
  bossDamagePct: number;
  categoryBonus?: { category: MagicCategory; pct: number } | null;
}

export interface EscortProfile {
  professorId: ProfessorId;
  epithet: string;
  auraSummary: string;
  supportName: string;
  supportSummary: string;
  intervalTurns: number;
  baseBonus: Omit<EscortPassiveBonus, 'starlightGainMult'> & {
    starlightGainBonusPct?: number;
  };
  fieldEvent: AcademyEventDef & {
    affinityBonus: number;
    isEscortEvent: true;
  };
}

export interface SideStoryDef {
  id: string;
  act: number;
  order: 1 | 2;
  title: string;
  subtitle: string;
  leadProfessor: ProfessorId;
  unlockHint: string;
  rewardStones: number;
  rewardAffinity: number;
  lines: DialogueLine[];
}

const ZERO_ESCORT_BONUS: EscortPassiveBonus = {
  magicPct: 0,
  hpPct: 0,
  defPct: 0,
  critRate: 0,
  critDmg: 0,
  mpRegen: 0,
  darkDamagePct: 0,
  expPct: 0,
  stonePct: 0,
  starlightGainMult: 1,
  openingShieldPct: 0,
  bossDamagePct: 0,
  categoryBonus: null,
};

export const ESCORT_PROFILES: Record<ProfessorId, EscortProfile> = {
  lucia: {
    professorId: 'lucia',
    epithet: '신입생 담임 · 별빛의 서약자',
    auraSummary: 'EXP +10% · 개전 보호막 +10%',
    supportName: '별빛 가호',
    supportSummary: '4턴마다 별빛 보호막 전개 & 소량 체력 회복',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 0,
      defPct: 0,
      critRate: 0,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 10,
      stonePct: 0,
      openingShieldPct: 10,
      bossDamagePct: 0,
      categoryBonus: null,
    },
    fieldEvent: {
      id: 'escort_ev_lucia',
      title: '봉인 리본 아래의 현장 점검',
      speaker: '담임 루시아',
      professorId: 'lucia',
      prompt:
        '{name}, 검은 안개가 짙어서 손목의 봉인 리본이 살짝 시리네요… 그래도 현장 보고서에 적을 학생 부상란은 비워 두고 싶어요. 잠시 숨 고르고 갈까요?',
      choices: [
        {
          id: 'check_ribbon',
          label: '리본 매듭을 고쳐 매고 비상 보급품을 나눈다',
          hint: '마석 · 가루 · 호감도 +3',
          rewardKind: 'stones_dust',
          resultText: '루시아가 안도한 듯 미소 지으며 예비 보급 마석과 약초 가루를 건넸다.',
        },
        {
          id: 'note_record',
          label: '전장 관찰 노트를 함께 정리한다',
          hint: '경험치 · 호감도 +3',
          rewardKind: 'exp',
          resultText: '루시아의 정갈한 붉은 밑줄 필기가 실전 마력 운용의 빈틈을 짚어주었다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  karen: {
    professorId: 'karen',
    epithet: '흑염학 교수 · 전선의 잿불',
    auraSummary: '마력 +6% · 치명타 피해 +12% · 화염 +8%',
    supportName: '흑염 지원 사격',
    supportSummary: '4턴마다 흑염 포격으로 화염 피해 & 화상 부여',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 6,
      hpPct: 0,
      defPct: 0,
      critRate: 0,
      critDmg: 12,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      openingShieldPct: 0,
      bossDamagePct: 0,
      categoryBonus: { category: 'flame', pct: 8 },
    },
    fieldEvent: {
      id: 'escort_ev_karen',
      title: '그을린 암가드의 야전 화덕',
      speaker: '흑염학 카렌',
      professorId: 'karen',
      prompt:
        '어이 {name}, 안개가 축축해서 화상 흉터까지 욱신거리네. 어차피 교장 영감한테는 야외 결계 테스트 중이었다고 보고할 테니, 잿더미 속에서 쓸 만한 거나 챙기자고.',
      choices: [
        {
          id: 'collect_cinder',
          label: '흑염으로 태운 결정 잔해를 긁어모은다',
          hint: '마력 가루 · 호감도 +3',
          rewardKind: 'dust',
          resultText: '불꽃에 그을린 결정에서 유독 짙은 마력 가루가 떨어졌다.',
        },
        {
          id: 'spare_flint',
          label: '화로 훈장 손질을 도우며 전선 호흡을 맞춘다',
          hint: '마석 · 호감도 +3',
          rewardKind: 'stones',
          resultText: '카렌이 호탕하게 웃으며 전리품 상자에서 두둑한 마석을 던져주었다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  sebastian: {
    professorId: 'sebastian',
    epithet: '빙결학 교수 · 백야의 잔광',
    auraSummary: '방어 +8% · MP 회복 +3 · 빙결 +8%',
    supportName: '백야 서리 창',
    supportSummary: '4턴마다 서리 창 투척으로 빙결 피해 & MP 회복',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 0,
      defPct: 8,
      critRate: 0,
      critDmg: 0,
      mpRegen: 3,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      openingShieldPct: 0,
      bossDamagePct: 0,
      categoryBonus: { category: 'frost', pct: 8 },
    },
    fieldEvent: {
      id: 'escort_ev_sebastian',
      title: '금이 간 백야 인장과 야전 찻잔',
      speaker: '빙결학 세바스티안',
      professorId: 'sebastian',
      prompt:
        '전투 중에 온수가 식지 않도록 서리 결계로 보온병을 감싸뒀다. …쓸데없는 감상은 접어두고, {name}. 다음 교전 전에 마력 회로 온도부터 낮춰.',
      choices: [
        {
          id: 'sip_tea',
          label: '차갑고 씁쓸한 백야 홍차를 한 모금 마신다',
          hint: '경험치 · 호감도 +3',
          rewardKind: 'exp',
          resultText: '냉기가 폐부까지 스며들며 흐트러졌던 마나 순환이 날카롭게 정돈되었다.',
        },
        {
          id: 'polish_crest',
          label: '금이 간 은빛 인장 주변의 서리 결정을 거둔다',
          hint: '마석 · 가루 · 호감도 +3',
          rewardKind: 'stones_dust',
          resultText: '세바스티안이 혀를 차면서도 맑은 서리 마석과 가루를 내어주었다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  volta: {
    professorId: 'volta',
    epithet: '뇌전학 교수 · 폭풍 첨탑의 수석',
    auraSummary: '치명타율 +5% · 별빛 획득 +20% · 뇌전 +8%',
    supportName: '첨탑 낙뢰 지원',
    supportSummary: '4턴마다 황금빛 낙뢰로 뇌전 피해 & 감전 부여',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 0,
      defPct: 0,
      critRate: 5,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      starlightGainBonusPct: 20,
      openingShieldPct: 0,
      bossDamagePct: 0,
      categoryBonus: { category: 'thunder', pct: 8 },
    },
    fieldEvent: {
      id: 'escort_ev_volta',
      title: '번개 코트의 비공식 축전 실험',
      speaker: '뇌전학 볼타',
      professorId: 'volta',
      prompt:
        '어이 {name}, 방금 전격이 코트 깃 그을음 옆을 스쳐 지나갔는데 전압이 기가 막히게 모이더군! 기숙사 정전 때보다 안전하니까 잠깐만 피뢰침 좀 들어볼래?',
      choices: [
        {
          id: 'ground_coil',
          label: '예비 지팡이를 땅에 박아 과전하를 포집한다',
          hint: '마석 · 호감도 +3',
          rewardKind: 'stones',
          resultText: '전류가 뭉치며 묵직하게 응축된 고순도 마석이 굴러떨어졌다.',
        },
        {
          id: 'tune_arc',
          label: '호흡을 맞춰 뇌전 각도 연산을 받아 적는다',
          hint: '마력 가루 · 호감도 +3',
          rewardKind: 'dust',
          resultText: '탄 내 나는 코트 깃에서 정제된 뇌전 가루와 전술 메모를 얻었다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  morden: {
    professorId: 'morden',
    epithet: '대지·사령학 교수 · 석비의 수호자',
    auraSummary: '최대 HP +10% · 방어 +10% · 대지 +8%',
    supportName: '석비 대지 방벽',
    supportSummary: '4턴마다 대지 보호막 전개 & 반사 효과 부여',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 10,
      defPct: 10,
      critRate: 0,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      openingShieldPct: 0,
      bossDamagePct: 0,
      categoryBonus: { category: 'earth', pct: 8 },
    },
    fieldEvent: {
      id: 'escort_ev_morden',
      title: '전우들의 나무 부적이 닿은 지맥',
      speaker: '대지학 모르덴',
      professorId: 'morden',
      prompt:
        '…잠깐 멈추어라, {name}. 발밑 지맥에서 옛 전우들의 룬 부적이 낮게 울고 있군. 서두르다 발을 헛디디면 땅속 선배들 얼굴 보기 부끄러울 테니, 호흡부터 고르자.',
      choices: [
        {
          id: 'pay_respect',
          label: '지맥 위 낡은 공양석에 조용히 묵념한다',
          hint: '경험치 · 호감도 +3',
          rewardKind: 'exp',
          resultText: '모르덴의 한쪽 귀가 옅게 떨리며 대지의 묵직한 버팀 감각이 전해졌다.',
        },
        {
          id: 'dig_vein',
          label: '드러난 광맥 틈의 부스러기를 수습한다',
          hint: '마석 · 가루 · 호감도 +3',
          rewardKind: 'stones_dust',
          resultText: '오랜 세월 지맥에 눌려 있던 단단한 마석과 석영 가루를 건져 올렸다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  irene: {
    professorId: 'irene',
    epithet: '결계·정령학 교수 · 님펜의 잔향',
    auraSummary: '방어 +8% · 개전 보호막 +14% · 결계 +10%',
    supportName: '정령 정화 결계',
    supportSummary: '4턴마다 해로운 상태 정화 & 정령 보호막 전개',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 0,
      defPct: 8,
      critRate: 0,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      openingShieldPct: 14,
      bossDamagePct: 0,
      categoryBonus: { category: 'ward', pct: 10 },
    },
    fieldEvent: {
      id: 'escort_ev_irene',
      title: '시든 붉은 장미 옆을 맴도는 정령',
      speaker: '결계학 아이린',
      professorId: 'irene',
      prompt:
        '어머, {name}. 제 가슴의 시든 장미 냄새를 맡았는지 길 잃은 작은 정령들이 모여들었어요. 붉은 달의 잔재가 묻어 있어서인지… 무언가를 품고 있네요.',
      choices: [
        {
          id: 'soothe_spirit',
          label: '정령을 달래어 품고 있던 알 조각을 받는다',
          hint: '알 조각 · 호감도 +3',
          rewardKind: 'egg',
          resultText: '온화한 결계 속에서 정령이 작은 사역마 알 조각을 조심스레 내려놓았다.',
        },
        {
          id: 'weave_dew',
          label: '이슬 결계로 안개를 걸러 마석을 모은다',
          hint: '마석 · 가루 · 호감도 +3',
          rewardKind: 'stones_dust',
          resultText: '깨끗이 정화된 결계 틈에서 영롱한 마석과 은빛 가루가 맺혔다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  seraphina: {
    professorId: 'seraphina',
    epithet: '성광·치유학 교수 · 꺼지지 않는 등불',
    auraSummary: '최대 HP +8% · 성광 +10%',
    supportName: '성광 등불 치유',
    supportSummary: '4턴마다 황동 등불의 축복으로 최대 체력 10% 치유',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 8,
      defPct: 0,
      critRate: 0,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      openingShieldPct: 0,
      bossDamagePct: 0,
      categoryBonus: { category: 'holy', pct: 10 },
    },
    fieldEvent: {
      id: 'escort_ev_seraphina',
      title: '안개 속 황동 등불의 야전 진료',
      speaker: '성광학 세라피나',
      professorId: 'seraphina',
      prompt:
        '{name}, 제 황동 등불 심지가 유독 바쁘게 타오르네요. 학교 양호실이 아니라 이 험한 곳에서도 환자 차트를 쓰고 싶진 않으니… 소매 걷고 상처부터 보여주세요.',
      choices: [
        {
          id: 'drink_tonic',
          label: '성당 비상 약병(라벨 있음)을 얌전히 마신다',
          hint: '경험치 · 호감도 +3',
          rewardKind: 'exp',
          resultText: '쓴맛은 여전했지만, 온몸의 피로가 씻기며 시야가 한층 맑아졌다.',
        },
        {
          id: 'tend_lantern',
          label: '황동 등불 심지 그을음을 닦아 드린다',
          hint: '마석 · 가루 · 호감도 +3',
          rewardKind: 'stones_dust',
          resultText: '세라피나가 고맙다며 치유 가방에 넣어둔 비상 마석과 약초 가루를 나눴다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  martha: {
    professorId: 'martha',
    epithet: '금서 도서관 사서장 · 열쇠의 수호자',
    auraSummary: '흑마법 피해 +15% · 마석 획득 +10%',
    supportName: '금서 저주 낭독',
    supportSummary: '4턴마다 금서 낭독으로 암흑 피해 & 저주 부여',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 0,
      hpPct: 0,
      defPct: 0,
      critRate: 0,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 15,
      expPct: 0,
      stonePct: 10,
      openingShieldPct: 0,
      bossDamagePct: 0,
      categoryBonus: null,
    },
    fieldEvent: {
      id: 'escort_ev_martha',
      title: '크노스의 열쇠가 가리킨 유실 페이지',
      speaker: '사서장 마르타',
      professorId: 'martha',
      prompt:
        '어머, {name} 씨. 목에 건 크노스 선배의 철제 열쇠가 이 폐허 쪽으로 떨리고 있군요. 아스트라 외부 반출 금지 도장이 찍힌 낱장이 굴러다니는 모양인데… 대신 수거하시겠어요?',
      choices: [
        {
          id: 'collect_page',
          label: '잉크가 마른 금서 낱장을 조심스레 회수한다',
          hint: '금서 조각 · 호감도 +3',
          rewardKind: 'tome',
          resultText: '마르타가 만족스럽게 봉인 왁스를 찍더니 금서 조각 하나를 배당해 주었다.',
        },
        {
          id: 'collect_fine',
          label: '미납 연체료 대신 현장의 마석을 압수한다',
          hint: '마석 · 호감도 +3',
          rewardKind: 'stones',
          resultText: '서류 정리보다 훨씬 실속 있는 마석 회수 작업이 끝났다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
  bernard: {
    professorId: 'bernard',
    epithet: '아스트라 교장 · 별빛의 지휘자',
    auraSummary: '마력 +6% · 방어 +6% · 보스 피해 +8%',
    supportName: '아스트라 천문 일격',
    supportSummary: '4턴마다 천문 마격 + 별빛 공명 +6%',
    intervalTurns: 4,
    baseBonus: {
      magicPct: 6,
      hpPct: 0,
      defPct: 6,
      critRate: 0,
      critDmg: 0,
      mpRegen: 0,
      darkDamagePct: 0,
      expPct: 0,
      stonePct: 0,
      openingShieldPct: 0,
      bossDamagePct: 8,
      categoryBonus: null,
    },
    fieldEvent: {
      id: 'escort_ev_bernard',
      title: '아스티엔의 지팡이와 현장 결재',
      speaker: '교장 베르나르',
      professorId: 'bernard',
      prompt:
        '교장실을 비우고 직접 나온 건 오랜만이군, {name}. 눈가의 흉터가 시린 걸 보니 전선이 꽤 험해졌어. 마왕군보다 무서운 왕국 회계 감사관이 들이닥치기 전에, 현장 경비부터 정산하자꾸나.',
      choices: [
        {
          id: 'expense_report',
          label: '‘전선 긴급 소모품’ 명목으로 마석을 청구한다',
          hint: '마석 · 호감도 +3',
          rewardKind: 'stones',
          resultText: '베르나르가 한숨과 함께 금이 간 지팡이로 결재 인장을 찍어주었다.',
        },
        {
          id: 'star_lesson',
          label: '아스티엔의 지팡이 공명법을 짧게 사사받는다',
          hint: '경험치 · 호감도 +3',
          rewardKind: 'exp',
          resultText: '12년 전 대재앙을 버텨낸 노교장의 마력 운용 감각이 몸에 배어들었다.',
        },
      ],
      affinityBonus: 3,
      isEscortEvent: true,
    },
  },
};

export const ACT_SIDE_STORIES: Record<number, [SideStoryDef, SideStoryDef]> = {
  1: [
    {
      id: 'act1_side1',
      act: 1,
      order: 1,
      title: '입학식의 숨겨진 면책 조항',
      subtitle: '신입생 오리엔테이션 뒷면의 작은 글씨',
      leadProfessor: 'lucia',
      unlockHint: '제 1막 진입 시 개방',
      rewardStones: 250,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '담임 교수 루시아',
          role: '아스트라 본관 회랑',
          portrait: { kind: 'professor', id: 'lucia' },
          text: '어서 와요, {name}. 입학 서약서 맨 아래 작은 글씨도 꼼꼼히 읽으셨나요? ‘실습 중 수정에 찔리거나 폭발에 휘말려도 학교는 성당 치유실 이용권 외엔 배상하지 않는다’고 적혀 있답니다.',
        },
        {
          speaker: '{name}',
          role: '아스트라 신입생',
          portrait: { kind: 'player' },
          text: '그걸 입학식 끝나고 말씀해 주시다니… 다들 멀쩡히 졸업하긴 하는 건가요?',
        },
        {
          speaker: '성광 교수 세라피나',
          role: '성당 치유실',
          portrait: { kind: 'professor', id: 'seraphina' },
          text: '물론이죠. 다만 졸업장보다 양호실 단골 도장이 먼저 다섯 번 찍히는 학생이 조금 많을 뿐입니다. 황동 등불은 늘 켜 둘 테니 걱정 마세요.',
        },
        {
          speaker: '교장 베르나르',
          role: '아스트라 교장',
          portrait: { kind: 'professor', id: 'bernard' },
          text: '쓸데없는 농담은 거기까지다. 루시아, 손목의 검은 리본 매듭이 헐거워졌군. 신입생 앞에서까지 숨기느라 애쓰지 말고, 광산 경계선 밖엔 절대 발 들이지 말거라.',
        },
      ],
    },
    {
      id: 'act1_side2',
      act: 1,
      order: 2,
      title: '화로 교실과 서리 교실의 천장 청구서',
      subtitle: '광산 출격 뒤편의 소소한 내전',
      leadProfessor: 'karen',
      unlockHint: '제 1막 4스테이지 도달 또는 1막 클리어 시 개방',
      rewardStones: 250,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '흑염학 교수 카렌',
          role: '흑염 화로 교실',
          portrait: { kind: 'professor', id: 'karen' },
          text: '어이, 세바스티안! 내 화로 교실 바닥에 성에 깔린 거 네 소행이지? 암가드 화상 흉터까지 시릴 지경이라고!',
        },
        {
          speaker: '빙결학 교수 세바스티안',
          role: '백야 서리 교실',
          portrait: { kind: 'professor', id: 'sebastian' },
          text: '천장을 태워 먹어서 위층 백야 교실 바닥을 달군 건 누구였더라? 금이 간 가문 인장에 그을음이 묻을 뻔해서 긴급 냉각을 걸었을 뿐이다.',
        },
        {
          speaker: '뇌전학 교수 볼타',
          role: '폭풍 첨탑 교실',
          portrait: { kind: 'professor', id: 'volta' },
          text: '다들 진정해. 두 분 싸움 때문에 아까 복도 전등이 두 번 깜빡였는데, 덕분에 내 코트 깃 정전기 실험 데이터는 공짜로 뽑았거든. {name}, 너도 이쪽 학파 구경할래?',
        },
        {
          speaker: '교장 베르나르',
          role: '아스트라 교장',
          portrait: { kind: 'professor', id: 'bernard' },
          text: '…이번 달 수리비 명세서도 ‘수정 광산 여진에 의한 자연 파손’으로 처리하겠네. 대신 자네들 셋 모두 {name}의 야전 훈련 지원비나 보태도록.',
        },
      ],
    },
  ],
  2: [
    {
      id: 'act2_side1',
      act: 2,
      order: 1,
      title: '연체료와 쇠사슬의 법칙',
      subtitle: '금서 도서관 입구 심야 점호',
      leadProfessor: 'martha',
      unlockHint: '제 2막 진입 시 개방',
      rewardStones: 500,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '사서장 마르타',
          role: '금서 도서관',
          portrait: { kind: 'professor', id: 'martha' },
          text: '자정 넘어 지하 대서고 문을 두드리는 분은 대개 둘 중 하나입니다. 수면 부족에 시달리는 연구자이거나, 이미 반쯤 책에 먹힌 망령이거나요.',
        },
        {
          speaker: '{name}',
          role: '아스트라 마법사',
          portrait: { kind: 'player' },
          text: '저는 그저 사서장님 목의 그 낡은 철제 열쇠가 서고 빗장과 공명하는 걸 보고 왔을 뿐인데요…',
        },
        {
          speaker: '사서장 마르타',
          role: '금서 도서관',
          portrait: { kind: 'professor', id: 'martha' },
          text: '눈썰미가 좋으시군요. 이 열쇠는 12년 전 실종되신 전임 사서장 크노스 님의 유일한 유품입니다. 스승님은 늘 “책장을 닫지 못하면 책장이 우릴 닫는다”고 말씀하셨죠.',
        },
        {
          speaker: '대지·사령학 교수 모르덴',
          role: '석비 지하 교실',
          portrait: { kind: 'professor', id: 'morden' },
          text: '서고 아래에선 땅속의 옛 학우들도 밤새 속삭이곤 하지. {name}, 너무 오래 귀 기울이지 마라. 네 이름이 적힌 나무 부적은 만들고 싶지 않으니까.',
        },
      ],
    },
    {
      id: 'act2_side2',
      act: 2,
      order: 2,
      title: '열쇠가 남긴 빈 페이지',
      subtitle: '크노스 사서장의 마지막 기록',
      leadProfessor: 'seraphina',
      unlockHint: '제 2막 4스테이지 도달 또는 2막 클리어 시 개방',
      rewardStones: 500,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '성광 교수 세라피나',
          role: '성당 치유실',
          portrait: { kind: 'professor', id: 'seraphina' },
          text: '크노스 님께서 지하 서고를 스스로 잠그기 전날 밤, 제 성당 황동 등불 앞에서 오래 기도를 올리셨어요. 손에 쥔 잉크가 식을 때까지 아무 말씀도 없으셨죠.',
        },
        {
          speaker: '사서장 마르타',
          role: '금서 도서관',
          portrait: { kind: 'professor', id: 'martha' },
          text: '그날 밤 스승님이 제게 열쇠 한 개만 남기신 이유를 이제야 알 것 같습니다. 문 너머에 남은 마지막 문장이 ‘학교 안의 그릇’을 가리키고 있었으니까요.',
        },
        {
          speaker: '담임 교수 루시아',
          role: '아스트라 본관 회랑',
          portrait: { kind: 'professor', id: 'lucia' },
          text: '…저 때문에 이렇게 많은 분들이 어둠 속에서 고생하고 계셨던 걸까요? 교장 선생님은 아무것도 모른 척하라고 하셨는데…',
        },
        {
          speaker: '사서장 마르타',
          role: '금서 도서관',
          portrait: { kind: 'professor', id: 'martha' },
          text: '죄책감은 도서 연체료만큼이나 쓸모없는 감정입니다, 루시아 선생님. 살아남은 자가 할 일은 페이지를 끝까지 넘기는 것뿐이에요. 그렇지 않습니까, {name} 씨?',
        },
      ],
    },
  ],
  3: [
    {
      id: 'act3_side1',
      act: 3,
      order: 1,
      title: '붉은 달 아래의 시든 장미',
      subtitle: '님펜 숲이 붉게 물들기 전날 밤',
      leadProfessor: 'irene',
      unlockHint: '제 3막 진입 시 개방',
      rewardStones: 750,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '결계·정령학 교수 아이린',
          role: '정령 결계 교실',
          portrait: { kind: 'professor', id: 'irene' },
          text: '이 시든 붉은 장미를 보세요, {name}. 12년 전 졸업식 날 모르가나가 “우리가 언젠가 각자의 숲으로 돌아가도 잊지 말자”며 직접 제 옷깃에 꽂아주었어요.',
        },
        {
          speaker: '대지·사령학 교수 모르덴',
          role: '석비 지하 교실',
          portrait: { kind: 'professor', id: 'morden' },
          text: '그 직후 흑식이 터져 북쪽 숲이 통째로 불탔지. 아스트라의 결계를 지키느라 누구도 님펜 숲 안쪽까지 구하러 가지 못했던 게 천추의 한이 된 거다.',
        },
        {
          speaker: '결계·정령학 교수 아이린',
          role: '정령 결계 교실',
          portrait: { kind: 'professor', id: 'irene' },
          text: '그래서 모르가나를 원망할 수가 없어요… 정령들이 요즘 밤마다 “언니가 울고 있어”라고 속삭이는데, 이번엔 제가 먼저 그 아이 앞에 서고 싶어요.',
        },
      ],
    },
    {
      id: 'act3_side2',
      act: 3,
      order: 2,
      title: '보존 처리된 꽃잎과 남은 결계',
      subtitle: '마녀의 탑이 가라앉은 뒤의 저녁',
      leadProfessor: 'irene',
      unlockHint: '제 3막 4스테이지 도달 또는 3막 클리어 시 개방',
      rewardStones: 750,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '결계·정령학 교수 아이린',
          role: '정령 결계 교실',
          portrait: { kind: 'professor', id: 'irene' },
          text: '모르가나의 탑이 무너진 자리에 들꽃이 다시 피기 시작했다고 정령들이 전해왔어요. 시든 장미의 가시도… 오늘은 예전처럼 아프지 않네요.',
        },
        {
          speaker: '빙결학 교수 세바스티안',
          role: '백야 서리 교실',
          portrait: { kind: 'professor', id: 'sebastian' },
          text: '그 시든 꽃이 더 이상 바스러지지 않게 얇은 영구 서리 결계로 코팅해 두었다. 감상적이라 비웃어도 좋지만, 기억까지 썩게 놔둘 필욘 없으니까.',
        },
        {
          speaker: '흑염학 교수 카렌',
          role: '흑염 화로 교실',
          portrait: { kind: 'professor', id: 'karen' },
          text: '세바스티안 녀석, 겉으론 차가운 척하면서 제일 꼼꼼하게 챙긴다니까. 자, {name}, 다음엔 왕도 쪽이 심상치 않대. 정신 바짝 차려!',
        },
      ],
    },
  ],
  4: [
    {
      id: 'act4_side1',
      act: 4,
      order: 1,
      title: '금 간 인장과 잿불 훈장의 옛 전선',
      subtitle: '데런 왕도 함락 소식이 닿던 밤',
      leadProfessor: 'sebastian',
      unlockHint: '제 4막 진입 시 개방',
      rewardStones: 1000,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '흑염학 교수 카렌',
          role: '흑염 화로 교실',
          portrait: { kind: 'professor', id: 'karen' },
          text: '알드리치 단장까지 쓰러졌다니… 12년 전 흑식 전선에서 우리 등을 지켜주던 양반이었어. 그때 내 팔 화상도 그 양반 대신 불길 막다가 생긴 거지.',
        },
        {
          speaker: '빙결학 교수 세바스티안',
          role: '백야 서리 교실',
          portrait: { kind: 'professor', id: 'sebastian' },
          text: '…내 백야 가문 인장이 반으로 갈라진 것도 같은 날 밤이었다. 왕도가 우리 지원군을 기다리며 성문을 닫았기에 지금의 아스트라가 버틸 시간을 벌었지.',
        },
        {
          speaker: '교장 베르나르',
          role: '아스트라 교장',
          portrait: { kind: 'professor', id: 'bernard' },
          text: '그 빚을 이제야 갚으러 가는군. {name}, 데런 왕도의 돌바닥은 차갑고 망령들은 집요하다. 부디 알드리치에게 부끄럽지 않은 싸움을 보여주고 오너라.',
        },
      ],
    },
    {
      id: 'act4_side2',
      act: 4,
      order: 2,
      title: '죽음의 기사가 남긴 마지막 경례',
      subtitle: '알드리치의 유언이 교장실에 닿은 날',
      leadProfessor: 'morden',
      unlockHint: '제 4막 4스테이지 도달 또는 4막 클리어 시 개방',
      rewardStones: 1000,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '대지·사령학 교수 모르덴',
          role: '석비 지하 교실',
          portrait: { kind: 'professor', id: 'morden' },
          text: '알드리치의 낡은 검집 조각을 나무 부적 옆에 묻어두었다. 망령이 된 뒤에도 피난민들을 피해 심연의 문 앞만 막고 있었다니… 끝까지 기사답군.',
        },
        {
          speaker: '교장 베르나르',
          role: '천문 교장실',
          portrait: { kind: 'professor', id: 'bernard' },
          text: '…“네가 그 아이를 살리기로 택한 결정을 원망하지 않았다”고 했나. 12년 동안 그 말을 얼마나 듣고 싶었는지 모른다, {name}.',
        },
        {
          speaker: '{name}',
          role: '아스트라 비술사',
          portrait: { kind: 'player' },
          text: '교장 선생님, 이제 루시아 교수님에 관한 진짜 이야기를 들려주실 때가 된 것 같습니다.',
        },
      ],
    },
  ],
  5: [
    {
      id: 'act5_side1',
      act: 5,
      order: 1,
      title: '폭풍 첨탑의 불 꺼지지 않는 밤',
      subtitle: '외벽 결계 최대 가동 야간 수비',
      leadProfessor: 'volta',
      unlockHint: '제 5막 진입 시 개방',
      rewardStones: 1250,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '뇌전학 교수 볼타',
          role: '폭풍 첨탑 교실',
          portrait: { kind: 'professor', id: 'volta' },
          text: '심연의 균열이 열리자마자 외벽 결계 부하가 평소의 열 배를 넘겼어. 내 코트 깃 그을음도 오늘따라 따갑네. 그래도 아직 정전은 안 났으니 내 승리야.',
        },
        {
          speaker: '성광 교수 세라피나',
          role: '성당 치유실',
          portrait: { kind: 'professor', id: 'seraphina' },
          text: '볼타 교수님, 왼손이 떨리고 계십니다. 이 황동 등불 옆에서 잠깐만 마력을 나누세요. 마왕군보다 교수님 과로사가 먼저 보고서로 올라오겠습니다.',
        },
        {
          speaker: '뇌전학 교수 볼타',
          role: '폭풍 첨탑 교실',
          portrait: { kind: 'professor', id: 'volta' },
          text: '하하, 성당 진료비 외상 장부만 안 쓰면 고맙지. {name}, 교사진이 본관을 지키는 동안 넌 맘 놓고 균열 한가운데를 뚫고 들어가.',
        },
      ],
    },
    {
      id: 'act5_side2',
      act: 5,
      order: 2,
      title: '풀려난 리본과 열두 해의 서약',
      subtitle: '진실이 밝혀진 뒤 회랑에서의 대화',
      leadProfessor: 'bernard',
      unlockHint: '제 5막 4스테이지 도달 또는 5막 클리어 시 개방',
      rewardStones: 1250,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '담임 교수 루시아',
          role: '아스트라 본관 회랑',
          portrait: { kind: 'professor', id: 'lucia' },
          text: '제 손목의 검은 봉인 리본이… 예전처럼 두렵지 않아요. 12년 동안 교장 선생님과 교수님들이 저를 사람으로 지켜주신 덕분에, 저도 싸울 용기가 났어요.',
        },
        {
          speaker: '교장 베르나르',
          role: '아스트라 교장',
          portrait: { kind: 'professor', id: 'bernard' },
          text: '스승 아스티엔께서 남기신 금이 간 지팡이가 오늘처럼 맑게 울린 적은 없었다. 원로들의 비난을 감수하고 금서 도서관을 연 보람이 있군.',
        },
        {
          speaker: '사서장 마르타',
          role: '금서 도서관',
          portrait: { kind: 'professor', id: 'martha' },
          text: '게다가 이번엔 연체료 청구할 틈도 없이 {name} 씨가 모든 페이지를 훌륭히 정리해 주셨죠. 이제 남은 건 최종장뿐입니다.',
        },
      ],
    },
  ],
  6: [
    {
      id: 'act6_side1',
      act: 6,
      order: 1,
      title: '검은 왕좌 직전의 야간 회식',
      subtitle: '아스트라 전 교수의 출정 전야',
      leadProfessor: 'karen',
      unlockHint: '제 6막 진입 시 개방',
      rewardStones: 1500,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '흑염학 교수 카렌',
          role: '본관 대강당',
          portrait: { kind: 'professor', id: 'karen' },
          text: '자, 오늘만큼은 교장 영감도 술병 압수 못 해! 마왕이랑 맞붙기 전에 밥은 먹고 들어가야지. 세바스티안이 얼려놓은 비상 건빵이라도 꺼내와!',
        },
        {
          speaker: '빙결학 교수 세바스티안',
          role: '본관 대강당',
          portrait: { kind: 'professor', id: 'sebastian' },
          text: '건빵이 아니라 백야산 순록 육포와 고급 홍차다. {name}, 살아서 돌아오면 내 찻잔 세트를 정식으로 내어주마. 만약 죽고 오면… 사망 보고서에 오타 천지로 적어줄 테다.',
        },
        {
          speaker: '대지·사령학 교수 모르덴',
          role: '본관 대강당',
          portrait: { kind: 'professor', id: 'morden' },
          text: '내 나무 부적에 여백은 아직 남기지 않았다. 반드시 네 두 발로 걸어서 이 식탁에 다시 앉거라, 아스트라의 대마도사여.',
        },
        {
          speaker: '담임 교수 루시아',
          role: '본관 대강당',
          portrait: { kind: 'professor', id: 'lucia' },
          text: '모두 이렇게 웃고 계시니… 흑식의 밤도 결코 이기지 못할 것 같아요. 다녀오세요, {name}. 가장 따뜻한 차를 끓이며 기다릴게요.',
        },
      ],
    },
    {
      id: 'act6_side2',
      act: 6,
      order: 2,
      title: '별이 돌아온 아스트라의 새벽',
      subtitle: '검은 안개가 걷힌 뒤의 졸업식 예고편',
      leadProfessor: 'lucia',
      unlockHint: '제 6막 4스테이지 도달 또는 6막 클리어 시 개방',
      rewardStones: 1500,
      rewardAffinity: 5,
      lines: [
        {
          speaker: '담임 교수 루시아',
          role: '아스트라 정문 언덕',
          portrait: { kind: 'professor', id: 'lucia' },
          text: '보세요, {name}! 결계 너머 풀밭을 맨발로 밟아도 손목이 아프지 않아요. 12년 만에 처음으로 아스트라의 밤하늘이 별빛으로 가득 찼어요.',
        },
        {
          speaker: '교장 베르나르',
          role: '아스트라 교장',
          portrait: { kind: 'professor', id: 'bernard' },
          text: '왕국 감사관들도 이제야 별빛 복구 확인서를 써주더군. 물론 지난 6개월 치 천장 수리비와 전신주 배상 청구서는 별도로 날아왔지만 말이다.',
        },
        {
          speaker: '뇌전학 교수 볼타',
          role: '폭풍 첨탑 교실',
          portrait: { kind: 'professor', id: 'volta' },
          text: '에이, 교장 선생님! 대륙을 구한 마법학교 졸업식에 수리비 정도는 왕실 특별 예산으로 퉁치면 되죠. 그렇죠, 대마도사 {name}?',
        },
        {
          speaker: '성광 교수 세라피나',
          role: '성당 치유실',
          portrait: { kind: 'professor', id: 'seraphina' },
          text: '황동 등불이 이제야 평화롭게 흔들리네요. 앞으로 어떤 시간의 윤회를 다시 걷더라도, 아스트라의 모든 인연은 언제나 당신 곁에 남을 것입니다.',
        },
      ],
    },
  ],
};

export const ALL_SIDE_STORIES: SideStoryDef[] = [1, 2, 3, 4, 5, 6].flatMap(
  (act) => ACT_SIDE_STORIES[act]
);

export const SIDE_STORY_MAP: Record<string, SideStoryDef> = Object.fromEntries(
  ALL_SIDE_STORIES.map((story) => [story.id, story])
);

export function getEscortProfile(profId: ProfessorId): EscortProfile {
  return ESCORT_PROFILES[profId];
}

export function getEscortStageMult(state: GameState, profId: ProfessorId): number {
  const aff = ensureAffinity(state.affinity);
  const pts = aff.points[profId] ?? 0;
  const stage = getAffinityStage(pts);
  switch (stage) {
    case 1:
      return 1.25;
    case 2:
      return 1.5;
    case 3:
      return 1.75;
    default:
      return 1;
  }
}

export function getEscortBonuses(state: GameState): EscortPassiveBonus {
  const profId = state.activeEscort;
  if (!profId || !PROFESSOR_ORDER.includes(profId)) {
    return { ...ZERO_ESCORT_BONUS, categoryBonus: null };
  }
  const profile = ESCORT_PROFILES[profId];
  const mult = getEscortStageMult(state, profId);
  const b = profile.baseBonus;
  const scale = (v: number): number => Math.round(v * mult * 10) / 10;

  return {
    magicPct: scale(b.magicPct),
    hpPct: scale(b.hpPct),
    defPct: scale(b.defPct),
    critRate: scale(b.critRate),
    critDmg: scale(b.critDmg),
    mpRegen: Math.round(b.mpRegen * mult),
    darkDamagePct: scale(b.darkDamagePct),
    expPct: scale(b.expPct),
    stonePct: scale(b.stonePct),
    starlightGainMult: 1 + (b.starlightGainBonusPct ? scale(b.starlightGainBonusPct) / 100 : 0),
    openingShieldPct: scale(b.openingShieldPct),
    bossDamagePct: scale(b.bossDamagePct),
    categoryBonus: b.categoryBonus
      ? {
          category: b.categoryBonus.category,
          pct: scale(b.categoryBonus.pct),
        }
      : null,
  };
}

export function getEscortEventForProfessor(
  profId: ProfessorId
): EscortProfile['fieldEvent'] {
  return ESCORT_PROFILES[profId].fieldEvent;
}

export function getSideStoriesForAct(act: number): [SideStoryDef, SideStoryDef] {
  const clamped = Math.min(6, Math.max(1, Math.floor(act)));
  return ACT_SIDE_STORIES[clamped];
}

export function getSideStoryById(id: string): SideStoryDef | null {
  return SIDE_STORY_MAP[id] ?? null;
}

export function isSideStoryUnlocked(state: GameState, def: SideStoryDef): boolean {
  if (def.order === 1) {
    return state.highestAct >= def.act;
  }
  return (
    state.clearedActs.includes(def.act) ||
    state.highestAct > def.act ||
    (state.highestAct === def.act && state.highestStageInAct >= 3)
  );
}

export function isSideStoryViewed(state: GameState, id: string): boolean {
  return Array.isArray(state.viewedSideStories) && state.viewedSideStories.includes(id);
}

export function getUnreadSideStoryCountForAct(state: GameState, act: number): number {
  const stories = ACT_SIDE_STORIES[act];
  if (!stories) return 0;
  return stories.filter(
    (s) => isSideStoryUnlocked(state, s) && !isSideStoryViewed(state, s.id)
  ).length;
}

export function getTotalUnreadSideStoryCount(state: GameState): number {
  return ALL_SIDE_STORIES.filter(
    (s) => isSideStoryUnlocked(state, s) && !isSideStoryViewed(state, s.id)
  ).length;
}
