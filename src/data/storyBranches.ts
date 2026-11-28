import type {
  DialogueLine,
  GameState,
  ProfessorId,
  StoryPhase,
} from '../types/game';

export interface StoryChoiceOption {
  id: string;
  label: string;
  toneTag: string;
  affinityProf: ProfessorId;
  affinityGain: number;
  rewardStones?: number;
  rewardDust?: number;
  reactionLines: DialogueLine[];
}

export interface StoryChoiceNode {
  key: string;
  act: number;
  phase: 'mid' | 'clear';
  prompt: string;
  options: [StoryChoiceOption, StoryChoiceOption];
}

export interface ActEpilogueMemo {
  act: number;
  header: string;
  headline: string;
  summary: string;
  adminFootnote: string;
  nextHint: string;
}

/**
 * P5-2: 제1~6막 중반('mid') 및 후일담('clear') 분기 선택지 12종.
 * 다크 고딕 판타지 정사와 건조한 아카데미 블랙코미디 톤을 유지하며,
 * 선택 결과는 교수 친밀도·마석·마력 가루 보상과 2줄의 반응 대사로 이어진다.
 */
export const STORY_CHOICES: Record<string, StoryChoiceNode> = {
  '1_mid': {
    key: '1_mid',
    act: 1,
    phase: 'mid',
    prompt: '수정 파편에 반응해 뜨거워진 루시아의 손목을 보고 어떤 행동을 택할까?',
    options: [
      {
        id: '1_mid_care',
        label: '담임의 손목을 쥔 뒤 안전선까지 직접 호위한다',
        toneTag: '배려',
        affinityProf: 'lucia',
        affinityGain: 4,
        rewardStones: 200,
        reactionLines: [
          {
            speaker: '담임 교수 루시아',
            role: '수정 광산 경계선',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '고마워요, {name}… 학생에게 보호받는 담임이라니 입학식 첫날부터 체면이 안 서네요. 그래도 손목의 열기가 한결 가라앉았어요.',
          },
          {
            speaker: '{name}',
            role: '아스트라 신입생',
            portrait: { kind: 'player' },
            text: '담임 교수님이 쓰러지면 월요일 아침 조회를 대신할 사람이 없잖아요. 광산 최심부는 제가 끝내고 돌아올게요.',
          },
        ],
      },
      {
        id: '1_mid_probe',
        label: '타고 있는 붉은 수정 파편을 채집해 본관에 분석을 의뢰한다',
        toneTag: '탐구',
        affinityProf: 'bernard',
        affinityGain: 4,
        rewardStones: 160,
        rewardDust: 8,
        reactionLines: [
          {
            speaker: '교장 베르나르',
            role: '통신 수정구',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '눈썰미가 예리하군, {name}. 그 붉은 파편은 단순한 광맥 변이가 아니라 12년 전 흑식과 같은 파장을 띠고 있다. 감정에 휘둘리지 않고 증거를 챙긴 점은 높이 평가하지.',
          },
          {
            speaker: '사서장 마르타',
            role: '아스트라 기록실',
            portrait: { kind: 'professor', id: 'martha' },
            text: '채집한 파편의 마력 가루 일부는 정제해 두었습니다. 참고로 광산 산재 면책 각서에 ‘수정 파편 절취 시 압수 제외’ 조항은 없으니 마음껏 쓰시길.',
          },
        ],
      },
    ],
  },
  '1_clear': {
    key: '1_clear',
    act: 1,
    phase: 'clear',
    prompt: '락엘르가 남긴 “마왕의 심장 소리”라는 말을 어떻게 정리해 보고할까?',
    options: [
      {
        id: '1_clear_ask',
        label: '베르나르 교장에게 검은 봉인 리본의 정체를 정면으로 묻는다',
        toneTag: '결의',
        affinityProf: 'bernard',
        affinityGain: 4,
        rewardStones: 200,
        reactionLines: [
          {
            speaker: '교장 베르나르',
            role: '천문 교장실',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '…신입생 치곤 묻는 게 무겁군. 지금은 그 리본이 루시아를 결계 안에 붙들어 두는 유일한 안전장치라는 것만 알아두어라. 때가 되면 내 입으로 전부 말하지.',
          },
          {
            speaker: '{name}',
            role: '아스트라 신입생',
            portrait: { kind: 'player' },
            text: '알겠습니다, 교장 선생님. 대신 그날이 올 때까지 제가 [시전자]로서 더 강해져 있을게요.',
          },
        ],
      },
      {
        id: '1_clear_comfort',
        label: '“오염된 마수의 헛소리일 뿐”이라며 루시아의 불안을 달랜다',
        toneTag: '유머',
        affinityProf: 'lucia',
        affinityGain: 4,
        rewardStones: 160,
        rewardDust: 8,
        reactionLines: [
          {
            speaker: '담임 교수 루시아',
            role: '아스트라 본관 회랑',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '후후… 그 말이 맞겠죠. 덕분에 손목보다 마음이 먼저 놓였어요. 자, 이 비상 마석과 약초 가루는 입학 첫날 야근 수당이라고 생각해 주세요.',
          },
          {
            speaker: '성광 교수 세라피나',
            role: '성당 치유실',
            portrait: { kind: 'professor', id: 'seraphina' },
            text: '다친 곳 없이 복귀해서 다행입니다. 오늘 치유실 기록에는 ‘신입생 전원 생존, 단 돌멩이 공명 1건 제외’로 적어 두겠습니다.',
          },
        ],
      },
    ],
  },
  '2_mid': {
    key: '2_mid',
    act: 2,
    phase: 'mid',
    prompt: '유실된 서고 3열에서 크노스의 연구 일지 낱장을 발견했다. 어떻게 다룰까?',
    options: [
      {
        id: '2_mid_decode',
        label: '잉크가 번진 마지막 문장을 현장에서 바로 해독한다',
        toneTag: '탐구',
        affinityProf: 'martha',
        affinityGain: 4,
        rewardStones: 320,
        rewardDust: 16,
        reactionLines: [
          {
            speaker: '사서장 마르타',
            role: '지하 대서고 3열',
            portrait: { kind: 'professor', id: 'martha' },
            text: '…‘별빛 결계는 바깥이 아니라 안쪽의 심장을 가두는 쇠창살이기도 하다’라고 적혀 있군요. 냉정한 판단력입니다, {name}. 연체료 대신 잔여 가루를 정산해 드리죠.',
          },
          {
            speaker: '{name}',
            role: '아스트라 시전자',
            portrait: { kind: 'player' },
            text: '크노스 사서장님이 두려워했던 게 단순한 흑마법 폭주가 아니었군요. 이 기록, 끝까지 기억해 두겠습니다.',
          },
        ],
      },
      {
        id: '2_mid_seal',
        label: '세라피나의 성광 부적으로 일지를 감싸 훼손을 막는다',
        toneTag: '배려',
        affinityProf: 'seraphina',
        affinityGain: 4,
        rewardStones: 400,
        reactionLines: [
          {
            speaker: '성광 교수 세라피나',
            role: '성당 치유실',
            portrait: { kind: 'professor', id: 'seraphina' },
            text: '사라진 이의 마지막 기록마저 소중히 다뤄주셨군요. 크노스 님께서도 생전에 제 성당 등불 앞에서 늘 평온을 빌곤 하셨답니다.',
          },
          {
            speaker: '사서장 마르타',
            role: '지하 대서고 3열',
            portrait: { kind: 'professor', id: 'martha' },
            text: '성당 부적 덕에 양피지가 온전히 보존됐습니다. 덕분에 서고 복원 예산에서 양피지 접착제 비용은 아끼게 되었군요.',
          },
        ],
      },
    ],
  },
  '2_clear': {
    key: '2_clear',
    act: 2,
    phase: 'clear',
    prompt: '크노스를 안식에 들게 한 뒤, 마르타가 내민 낡은 철제 열쇠 앞에서 답하자.',
    options: [
      {
        id: '2_clear_vow',
        label: '“이성을 잃지 않고 금서의 끝까지 읽겠습니다”라 맹세한다',
        toneTag: '서약',
        affinityProf: 'martha',
        affinityGain: 4,
        rewardStones: 400,
        reactionLines: [
          {
            speaker: '사서장 마르타',
            role: '금서 도서관',
            portrait: { kind: 'professor', id: 'martha' },
            text: '스승님의 열쇠가 방금 아주 희미하게 울렸군요. 좋습니다. 3계급 승급과 함께 금서 도서관의 최상단 서가까지 열어드리겠습니다.',
          },
          {
            speaker: '교장 베르나르',
            role: '아스트라 교장',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '부디 크노스의 전철을 밟지 말거라. 어둠은 도구이지 주인이 되어선 안 된다, {name}.',
          },
        ],
      },
      {
        id: '2_clear_rule',
        label: '“300년 치 도서 연체료는 면제해 주시죠”라 묻는다',
        toneTag: '유머',
        affinityProf: 'martha',
        affinityGain: 4,
        rewardStones: 320,
        rewardDust: 16,
        reactionLines: [
          {
            speaker: '사서장 마르타',
            role: '금서 도서관',
            portrait: { kind: 'professor', id: 'martha' },
            text: '…망령 크노스 분의 12년 치 연체료는 ‘실종에 의한 특례 탕감’으로 결재해 두겠습니다. 물론 살아 돌아오신 {name} 씨의 반납 기한은 예외 없이 내일 자정입니다.',
          },
          {
            speaker: '{name}',
            role: '아스트라 시전자',
            portrait: { kind: 'player' },
            text: '망령이 되어도 연체료가 붙는 학교라니, 역시 아스트라에서 가장 무서운 건 마왕보다 사서장님이네요.',
          },
        ],
      },
    ],
  },
  '3_mid': {
    key: '3_mid',
    act: 3,
    phase: 'mid',
    prompt: '시든 붉은 장미를 쥔 채 멈춰 선 아이린에게 어떤 말을 건넬까?',
    options: [
      {
        id: '3_mid_flower',
        label: '“아직 지키는 결계가 남아 있으니 손을 잡자”고 권한다',
        toneTag: '배려',
        affinityProf: 'irene',
        affinityGain: 4,
        rewardStones: 600,
        reactionLines: [
          {
            speaker: '결계·정령 교수 아이린',
            role: '피로 물든 정령 성소',
            portrait: { kind: 'professor', id: 'irene' },
            text: '…고마워요, {name}. 12년 전엔 놓쳤지만, 이번엔 당신과 함께 정령들의 마지막 소원까지 반드시 전달할게요.',
          },
          {
            speaker: '대지·사령 교수 모르덴',
            role: '후방 엄호',
            portrait: { kind: 'professor', id: 'morden' },
            text: '좋은 호흡이다. 후방의 가시덩굴은 내가 묶어둘 테니, 둘 다 흔들리지 말고 탑 위로 올라가라.',
          },
        ],
      },
      {
        id: '3_mid_ritual',
        label: '혈월 의식의 마력 회로를 먼저 분석해 약점을 찾아낸다',
        toneTag: '냉정',
        affinityProf: 'morden',
        affinityGain: 4,
        rewardStones: 480,
        rewardDust: 24,
        reactionLines: [
          {
            speaker: '대지·사령 교수 모르덴',
            role: '후방 엄호',
            portrait: { kind: 'professor', id: 'morden' },
            text: '냉정하군, {name}. 맞다, 저 붉은 달의 의식은 숲의 지맥과 직결되어 있어. 감정에 휩쓸리기 전에 핵을 부수는 게 살아남는 길이지.',
          },
          {
            speaker: '결계·정령 교수 아이린',
            role: '피로 물든 정령 성소',
            portrait: { kind: 'professor', id: 'irene' },
            text: '당신 말이 맞아요. 정령들이 짚어준 약점 부근의 마력 가루를 모았으니, 마녀의 탑 결전을 앞두고 정비하세요.',
          },
        ],
      },
    ],
  },
  '3_clear': {
    key: '3_clear',
    act: 3,
    phase: 'clear',
    prompt: '모르가나가 남긴 마지막 말(“루시아 손목의 정체”)을 들은 뒤 어떻게 할까?',
    options: [
      {
        id: '3_clear_promise',
        label: '아이린의 시든 장미를 꺾지 않도록 보호 결계 보수를 돕는다',
        toneTag: '배려',
        affinityProf: 'irene',
        affinityGain: 4,
        rewardStones: 600,
        reactionLines: [
          {
            speaker: '결계·정령 교수 아이린',
            role: '정령 결계 교실',
            portrait: { kind: 'professor', id: 'irene' },
            text: '고마워요… 세바스티안 교수님이 얇은 서리로 감싸주신 덕분에 이제 바스러지지 않을 거예요. 베르나르 교장님께도 제가 직접 답을 청해볼게요.',
          },
          {
            speaker: '빙결학 교수 세바스티안',
            role: '백야 서리 교실',
            portrait: { kind: 'professor', id: 'sebastian' },
            text: '쓸데없는 오해 마라. 꽃잎 부스러기가 교실 복도에 날리면 청소 당번이 귀찮아져서 영구 서리 코팅을 해줬을 뿐이다.',
          },
        ],
      },
      {
        id: '3_clear_demand',
        label: '아스트라 복귀 직후 베르나르에게 진실을 추궁하기로 다짐한다',
        toneTag: '결의',
        affinityProf: 'bernard',
        affinityGain: 4,
        rewardStones: 480,
        rewardDust: 24,
        reactionLines: [
          {
            speaker: '교장 베르나르',
            role: '통신 수정구',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '모르가나가 그 비밀까지 꿰뚫고 있었을 줄이야… 좋다, {name}. 네가 [비술사]가 되어 데런 왕도에서 돌아오는 날, 더는 숨기지 않겠다.',
          },
          {
            speaker: '{name}',
            role: '아스트라 정규 마법사',
            portrait: { kind: 'player' },
            text: '크노스 님에 이어 모르가나까지 같은 이름을 불렀어요. 반드시 루시아 교수님을 지켜낼 힘을 먼저 손에 넣겠어요.',
          },
        ],
      },
    ],
  },
  '4_mid': {
    key: '4_mid',
    act: 4,
    phase: 'mid',
    prompt: '데런 왕도 외곽에서 왕실 근위 리치의 마지막 행정 서류 뭉치를 발견했다.',
    options: [
      {
        id: '4_mid_records',
        label: '왕실 리치가 죽은 뒤에도 쥐고 있던 구호 보급 명부를 수습한다',
        toneTag: '탐구',
        affinityProf: 'seraphina',
        affinityGain: 4,
        rewardStones: 640,
        rewardDust: 32,
        reactionLines: [
          {
            speaker: '성광 교수 세라피나',
            role: '왕도 외곽 피난민 구호',
            portrait: { kind: 'professor', id: 'seraphina' },
            text: '세상에… 저 리치는 저주에 잠식된 뒤에도 마지막까지 피난민 식량 배급 장부를 놓고 있지 않았군요. 남겨진 약품과 마력 가루로 많은 생명을 구할 수 있겠어요.',
          },
          {
            speaker: '{name}',
            role: '아스트라 비술사',
            portrait: { kind: 'player' },
            text: '죽어서까지 결재 서류를 붙잡고 있다니… 우리 학교 교장실과 어딘가 닮은 데가 있어서 더 마음이 쓰이네요.',
          },
        ],
      },
      {
        id: '4_mid_salute',
        label: '심연의 문 앞을 막아선 망자 기사들을 향해 묵례한 뒤 진군한다',
        toneTag: '결의',
        affinityProf: 'morden',
        affinityGain: 4,
        rewardStones: 800,
        reactionLines: [
          {
            speaker: '대지·사령 교수 모르덴',
            role: '석비 지하 교실',
            portrait: { kind: 'professor', id: 'morden' },
            text: '옳은 예우다, {name}. 알드리치의 부하들은 적에게 등을 보이지 않았고, 망령이 되어서도 민간인이 아닌 심연만을 겨누고 있었다.',
          },
          {
            speaker: '담임 교수 루시아',
            role: '통신 수정구',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '그분들의 숭고한 의지가 헛되지 않도록… 부디 무사히 단장님을 모시고 돌아와 주세요.',
          },
        ],
      },
    ],
  },
  '4_clear': {
    key: '4_clear',
    act: 4,
    phase: 'clear',
    prompt: '알드리치가 남긴 마지막 경례(“루시아를 지키라”) 앞에서 어떤 태도를 취할까?',
    options: [
      {
        id: '4_clear_sword',
        label: '부서진 기사단장의 검집 조각을 수습해 아스트라로 가져간다',
        toneTag: '서약',
        affinityProf: 'karen',
        affinityGain: 4,
        rewardStones: 800,
        reactionLines: [
          {
            speaker: '흑염학 교수 카렌',
            role: '흑염 화로 교실',
            portrait: { kind: 'professor', id: 'karen' },
            text: '…알드리치 단장님 유품이잖아. 12년 전 그 양반 대신 화상 입었던 내 암가드가 오늘따라 유난히 뜨겁네. 고맙다, {name}. 끝까지 등 뒤는 내가 맡을게.',
          },
          {
            speaker: '빙결학 교수 세바스티안',
            role: '백야 서리 교실',
            portrait: { kind: 'professor', id: 'sebastian' },
            text: '백야의 금이 간 인장도 이제야 체면이 서는군. 다음 심연 전선엔 나도 물러설 생각 없다.',
          },
        ],
      },
      {
        id: '4_clear_report',
        label: '“결정은 옳았지만 뒷감당은 우리 몫”이라며 냉정히 전선을 정리한다',
        toneTag: '냉정',
        affinityProf: 'sebastian',
        affinityGain: 4,
        rewardStones: 640,
        rewardDust: 32,
        reactionLines: [
          {
            speaker: '빙결학 교수 세바스티안',
            role: '백야 서리 교실',
            portrait: { kind: 'professor', id: 'sebastian' },
            text: '정확한 판단이다. 감상에 젖어 틈을 보이면 다음 심연 전선에서 똑같은 비극을 반복할 뿐이지. 전리품 정제 가루부터 챙겨 두도록.',
          },
          {
            speaker: '교장 베르나르',
            role: '아스트라 교장',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '자네 말대로 빚은 살아남은 우리가 갚아야지. 이제 심연의 균열 앞에서 12년 전의 진실 전부를 꺼내놓겠다.',
          },
        ],
      },
    ],
  },
  '5_mid': {
    key: '5_mid',
    act: 5,
    phase: 'mid',
    prompt: '자신이 마왕의 심장 조각을 봉인한 ‘그릇’임을 깨닫고 흔들리는 루시아에게 말하자.',
    options: [
      {
        id: '5_mid_hold',
        label: '“교수님은 누구의 그릇도 아닌 우리 아스트라의 스승님”이라 못 박는다',
        toneTag: '서약',
        affinityProf: 'lucia',
        affinityGain: 5,
        rewardStones: 1000,
        reactionLines: [
          {
            speaker: '담임 교수 루시아',
            role: '풀려가는 검은 봉인 리본',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '…{name}… 그 한마디가 지난 12년의 차가움을 한 번에 녹여주네요. 알겠어요. 도망치지 않고, 저도 제 자리에서 끝까지 함께 싸울게요.',
          },
          {
            speaker: '교장 베르나르',
            role: '아스트라 교장',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '훌륭하구나, 별의 계승자여! 내가 원로들의 반대를 꺾고 금서 도서관을 연 보람이 바로 여기에 있었다!',
          },
        ],
      },
      {
        id: '5_mid_tactical',
        label: '“자결하면 출석부 정리는 누가 하느냐”며 담임의 책임을 일깨운다',
        toneTag: '유머',
        affinityProf: 'volta',
        affinityGain: 5,
        rewardStones: 800,
        rewardDust: 40,
        reactionLines: [
          {
            speaker: '뇌전학 교수 볼타',
            role: '외벽 결계 지휘',
            portrait: { kind: 'professor', id: 'volta' },
            text: '크하하! 맞아, 루시아 선생님까지 빠지면 우리 반 학생들 무단 조퇴랑 정전 사고 경위서를 교장 영감 혼자 써야 한다고!',
          },
          {
            speaker: '담임 교수 루시아',
            role: '아스트라 본관 회랑',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '후후… 정말 못 말리는 사제지간이네요. 좋아요, 졸업식 출석부에 전원 이름을 적을 때까지 저도 절대 빠지지 않을게요.',
          },
        ],
      },
    ],
  },
  '5_clear': {
    key: '5_clear',
    act: 5,
    phase: 'clear',
    prompt: '말레고스를 쓰러뜨리고 [대마도사] 시험을 앞둔 지금, 마지막 각오를 다지자.',
    options: [
      {
        id: '5_clear_astien',
        label: '아스티엔의 환영 시험을 넘어 완전한 대마도사로 서겠다고 다짐한다',
        toneTag: '결의',
        affinityProf: 'bernard',
        affinityGain: 5,
        rewardStones: 1000,
        reactionLines: [
          {
            speaker: '교장 베르나르',
            role: '천문 교장실',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '초대 교장님의 금이 간 지팡이가 이토록 맑게 울린 건 12년 만이다. 천문 교장실에서 기다리마, 아스트라의 마지막 희망이여.',
          },
          {
            speaker: '뇌전학 교수 볼타',
            role: '폭풍 첨탑 교실',
            portrait: { kind: 'professor', id: 'volta' },
            text: '결계 부하도 이제 안정됐어! 첨탑에서 모은 고순도 마석 챙겨뒀으니 아스티엔 영감 테스트도 한 번에 통과해 버려.',
          },
        ],
      },
      {
        id: '5_clear_faculty',
        label: '부상당한 교사진과 양호실에 먼저 감사 인사를 전한다',
        toneTag: '배려',
        affinityProf: 'seraphina',
        affinityGain: 5,
        rewardStones: 800,
        rewardDust: 40,
        reactionLines: [
          {
            speaker: '성광 교수 세라피나',
            role: '성당 치유실',
            portrait: { kind: 'professor', id: 'seraphina' },
            text: '과로로 왼손을 떨던 볼타 교수님도, 화로 교실 천장을 또 태운 카렌 교수님도 모두 당신의 승전보를 듣고 기운을 차렸답니다.',
          },
          {
            speaker: '사서장 마르타',
            role: '금서 도서관',
            portrait: { kind: 'professor', id: 'martha' },
            text: '양호실 당직 교대도 무사히 마쳤습니다. 아, 마르타 특제 봉인 테이프를 챙기려던 학생은 도망쳤으니 걱정 마시길.',
          },
        ],
      },
    ],
  },
  '6_mid': {
    key: '6_mid',
    act: 6,
    phase: 'mid',
    prompt: '“별빛은 아무도 구원하지 못했다”는 발바르의 말에 어떤 대답을 돌려줄까?',
    options: [
      {
        id: '6_mid_bonds',
        label: '“우리의 별빛은 서로를 끝까지 붙든 인연 그 자체”라 외친다',
        toneTag: '결의',
        affinityProf: 'lucia',
        affinityGain: 6,
        rewardStones: 1200,
        reactionLines: [
          {
            speaker: '담임 교수 루시아',
            role: '아스트라 성좌 공명',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '들려요, {name}… 아스트라의 모든 교수님과 사역마, 그리고 제 손목의 빛이 지금 당신의 지팡이로 모이고 있어요!',
          },
          {
            speaker: '부활한 마왕 발바르',
            role: '첨탑 너머의 목소리',
            portrait: { kind: 'boss', artKey: 'demon_lord' },
            text: '호오… 천 년 전 아스티엔과 똑같은 눈빛으로 대답하는구나. 그렇다면 그 인연이 왕좌 앞에서도 꺾이지 않는지 직접 베어 시험해 보겠다!',
          },
        ],
      },
      {
        id: '6_mid_truth',
        label: '“최초의 현자라도 세상의 모든 밤을 혼자 짊어질 순 없다”고 반박한다',
        toneTag: '탐구',
        affinityProf: 'bernard',
        affinityGain: 6,
        rewardStones: 960,
        rewardDust: 48,
        reactionLines: [
          {
            speaker: '교장 베르나르',
            role: '통신 수정구',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '정확한 일갈이다, 대마도사여! 발바르가 저지른 오만은 인간을 믿지 못하고 홀로 별빛을 독점하려 했던 데 있었다!',
          },
          {
            speaker: '사서장 마르타',
            role: '금서 도서관',
            portrait: { kind: 'professor', id: 'martha' },
            text: '아스티엔의 기록에 따르면 최초 현자의 파멸은 고독에서 비롯되었습니다. 최상층까지 뚫고 올라갈 정제 가루를 전송합니다.',
          },
        ],
      },
    ],
  },
  '6_clear': {
    key: '6_clear',
    act: 6,
    phase: 'clear',
    prompt: '12년 만에 성좌가 돌아오고 봉인이 풀린 아스트라에서 첫 걸음을 내딛자.',
    options: [
      {
        id: '6_clear_walk',
        label: '봉인이 풀린 루시아와 함께 결계 밖 언덕을 가장 먼저 걷는다',
        toneTag: '서약',
        affinityProf: 'lucia',
        affinityGain: 6,
        rewardStones: 1200,
        reactionLines: [
          {
            speaker: '담임 교수 루시아',
            role: '아스트라 정문 언덕',
            portrait: { kind: 'professor', id: 'lucia' },
            text: '정말 꿈만 같아요, {name}… 바람이 차가운데도 손목이 전혀 아프지 않아요. 이제야 저도 아스트라의 졸업식에 당당히 설 수 있을 것 같아요.',
          },
          {
            speaker: '{name}',
            role: '아스트라 대마도사',
            portrait: { kind: 'player' },
            text: '그리고 언젠가 시간이 다시 돌아가더라도… 가장 먼저 교수님과 이 별빛을 되찾으러 올게요.',
          },
        ],
      },
      {
        id: '6_clear_audit',
        label: '교장실에 쌓인 감사 서류와 천장 수리비부터 정산하자고 제안한다',
        toneTag: '유머',
        affinityProf: 'bernard',
        affinityGain: 6,
        rewardStones: 960,
        rewardDust: 48,
        reactionLines: [
          {
            speaker: '교장 베르나르',
            role: '천문 교장실',
            portrait: { kind: 'professor', id: 'bernard' },
            text: '하하… 마왕을 쓰러뜨린 대마도사가 제일 먼저 꺼낸 말이 감사 서류 정산이라니. 좋다, 왕국 재무관에겐 ‘별빛 복구 공로’로 천장 수리비 전액을 특별 예산 처리하자고 써 보내지!',
          },
          {
            speaker: '흑염학 교수 카렌',
            role: '본관 대강당',
            portrait: { kind: 'professor', id: 'karen' },
            text: '오예! 그러면 화로 교실 천장 그을음도 공무상 영광의 흔적으로 인정되는 거지? 세바스티안, 너도 축하주 한 잔 받아!',
          },
        ],
      },
    ],
  },
};

/**
 * P5-2: 제1~6막 완결('clear') 시 표시되는 공식 [아스트라 학사 공보 · 제N막 사후 기록].
 */
export const ACT_EPILOGUE_MEMOS: Record<number, ActEpilogueMemo> = {
  1: {
    act: 1,
    header: '아스트라 학사 공보 · 제1막 사후 기록',
    headline: '수정 광산 심층 변이 진압 및 붉은 수정 군주 락엘르 토벌',
    summary:
      '입학식 당일 발생한 수정 광산 마력 폭주는 신입생의 활약으로 진정되었다. 다만 락엘르가 루시아 교수의 손목 봉인을 보고 ‘마왕의 심장’이라 지목한 공명 현상은 교장실 기밀 사항으로 분류되었다.',
    adminFootnote:
      '행정 비고: 입학 서약서 배상 면책 조항에 따라 화로 교실·서리 교실 간 냉온 바닥 충돌 수리비는 ‘광산 여진 자연 파손’으로 처리됨. 성당 치유실 야근 0건 기록.',
    nextHint:
      '다음 단서: 12년 전 실종된 전임 사서장 크노스의 서고가 지하에서 떨고 있다 — [시전자] 승급 후 제2막으로.',
  },
  2: {
    act: 2,
    header: '아스트라 학사 공보 · 제2막 사후 기록',
    headline: '지하 대서고 철문 봉쇄 해제 및 망령 대사서 크노스 해방',
    summary:
      '12년간 쇠사슬 금서에 묶여 있던 전임 사서장 크노스의 영혼이 안식에 들었다. 그가 남긴 마지막 연구 일지와 유언은 학교 내부에 마왕의 파편이 살아 숨 쉬고 있음을 가리켰다.',
    adminFootnote:
      '행정 비고: 마르타 사서장의 재량으로 12년 치 복리 도서 연체료는 ‘사망·실종 특례’로 탕감되었으나, 양초 예산 삭감으로 인한 서고 복도 조도 불량은 다음 분기에도 유지됨.',
    nextHint:
      '다음 단서: [정규 마법사] 승급으로 금서 도서관이 열렸으며, 북쪽 님펜 숲에 불길한 붉은 달이 떠오르기 시작했다.',
  },
  3: {
    act: 3,
    header: '아스트라 학사 공보 · 제3막 사후 기록',
    headline: '님펜 타락 숲 혈월 의식 저지 및 마녀 모르가나의 최후',
    summary:
      '옛 정령학 수석 모르가나가 쓰러지며 숲의 붉은 달이 가라앉았다. 그녀는 아이린 교수의 시든 장미를 기억한 채 떠났고, 루시아가 결계 밖으로 나가지 못하는 진짜 이유를 추적하라는 경고를 남겼다.',
    adminFootnote:
      '행정 비고: 세바스티안 교수가 아이린 교수의 시든 장미에 비공식 영구 서리 코팅을 시술함(교내 동결 물질 무단 사용 시말서 1건은 교장 직권으로 폐기).',
    nextHint:
      '다음 단서: [비술사] 자격을 얻어 성문을 닫고 버티던 마지막 인간 동맹지, 함락된 데런 왕도로 출격할 차례다.',
  },
  4: {
    act: 4,
    header: '아스트라 학사 공보 · 제4막 사후 기록',
    headline: '함락된 데런 왕도 진혼 및 데스나이트 단장 알드리치의 유언',
    summary:
      '12년간 저주 속에서도 심연의 문 앞만 막아섰던 알드리치 단장이 마침내 명예로운 안식에 들었다. 그의 마지막 전언은 루시아를 살리기로 택했던 베르나르의 결단에 12년 만의 면죄부를 주었다.',
    adminFootnote:
      '행정 비고: 왕도 지하에서 수습된 궁정 리치의 마지막 배급 서류는 아스트라 행정실에 이관됨. 죽어서도 결재 서류를 놓지 않는 모범 사례로 야근 지침서에 등재 예정.',
    nextHint:
      '다음 단서: 북쪽 하늘에 [심연의 균열]이 열렸다. [심연 마도사] 승급 후 마왕군 선봉장 말레고스와의 정면 승부가 기다린다.',
  },
  5: {
    act: 5,
    header: '아스트라 학사 공보 · 제5막 사후 기록',
    headline: '심연 군단장 말레고스 격파 및 ‘그릇’ 루시아의 진실 공표',
    summary:
      '아스트라 외벽 결계를 찢고 들어온 말레고스의 공세가 전 교사진과 심연 마도사의 협공으로 좌절되었다. 루시아가 마왕 심장의 봉인 그릇임이 밝혀졌으나, 그녀는 자결 대신 동료들과 함께 싸우기를 택했다.',
    adminFootnote:
      '행정 비고: 볼타 교수가 외벽 결계 부하 10배를 견디다 왼손 경련을 호소했으나 본인은 ‘신형 회로 과부하 테스트 성공’으로 주장함. 성당 치유실 외상 장부 1건 추가.',
    nextHint:
      '다음 단서: 천문 교장실에서 초대 교장 아스티엔의 환영 시험을 넘어 [대마도사]가 되어, 검은 왕좌의 첨탑으로 진군하라.',
  },
  6: {
    act: 6,
    header: '아스트라 학사 공보 · 제6막 사후 기록',
    headline: '부활한 마왕 발바르 토벌 및 12년 만의 아스트라 성좌 복구',
    summary:
      '검은 왕좌의 첨탑에서 최초의 대현자이자 타락한 마왕 발바르가 쓰러지며 대륙의 검은 안개가 걷혔다. 12년 만에 밤하늘의 별빛이 되돌아왔고, 루시아 손목의 검은 봉인 리본은 조용히 빛이 되어 소멸했다.',
    adminFootnote:
      '행정 비고: 왕국 감사관이 별빛 복구 확인서와 함께 지난 6개월 치 교실 천장 수리비 및 예비 지팡이 피뢰침 변상 청구서를 동봉했으나, 졸업식 특별 예산으로 일괄 처리하기로 잠정 합의됨.',
    nextHint:
      '새로운 여정: [무한 심연 탑 4심층]의 초월 군주들에 도전하고, [별의 잔재]를 품은 선택형 [시간 회귀]로 숨겨진 윤회의 진실을 탐구하세요.',
  },
};

export function getStoryChoiceKey(act: number, phase: StoryPhase): string {
  return `${act}_${phase}`;
}

export function getStoryChoiceNode(act: number, phase: StoryPhase): StoryChoiceNode | null {
  if (phase !== 'mid' && phase !== 'clear') return null;
  const key = getStoryChoiceKey(act, phase);
  return STORY_CHOICES[key] ?? null;
}

export function getSelectedChoiceId(state: GameState, key: string): string | null {
  const chosen = state.storyChoices?.[key];
  if (typeof chosen !== 'string' || !chosen) return null;
  const node = STORY_CHOICES[key];
  if (!node) return null;
  return node.options.some((opt) => opt.id === chosen) ? chosen : null;
}

export function getActChoiceProgress(
  state: GameState,
  act: number
): { chosen: number; total: number } {
  const keys = [getStoryChoiceKey(act, 'mid'), getStoryChoiceKey(act, 'clear')].filter((k) =>
    Boolean(STORY_CHOICES[k])
  );
  let chosen = 0;
  for (const key of keys) {
    if (getSelectedChoiceId(state, key)) {
      chosen += 1;
    }
  }
  return { chosen, total: keys.length };
}

export function getActEpilogueMemo(act: number): ActEpilogueMemo | null {
  return ACT_EPILOGUE_MEMOS[act] ?? null;
}
