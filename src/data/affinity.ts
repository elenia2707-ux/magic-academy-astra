import type { GameState, ProfessorAffinityState, ProfessorId } from '../types/game';
import { PROFESSOR_ORDER } from './professors';

export const AFFINITY_THRESHOLDS = [20, 60, 100] as const;
export const AFFINITY_GIFT_POINTS = 20;
export const AFFINITY_MAX_POINTS = 100;

/**
 * 교수 친밀도 영구 보너스 합산 구조.
 * - `*Pct`: 퍼센트 포인트 단위 (예: `magicPct: 3` → 마력 +3%, 적용 시 `1 + magicPct / 100`)
 * - `critRate`: 치명타 확률 +%p (예: `1.5` → +1.5%)
 * - `mpRegen`: 턴당 MP 회복 +고정 수치
 */
export interface AffinityBonus {
  magicPct: number;
  hpPct: number;
  defPct: number;
  critRate: number;
  mpRegen: number;
  trainSpeedPct: number;
  stonePct: number;
  expPct: number;
}

export interface AffinityEventDef {
  stage: 1 | 2 | 3;
  threshold: (typeof AFFINITY_THRESHOLDS)[number];
  eventKey: string;
  title: string;
  /** `{name}` 플레이스홀더를 지원하는 교수 친밀도 이벤트 대사 */
  dialogue: string;
  bonusLabel: string;
  bonus: Partial<AffinityBonus>;
}

export interface ProfessorAffinityDef {
  id: ProfessorId;
  favoriteGiftName: string;
  giftCostStones: number;
  giftCostDust: number;
  events: [AffinityEventDef, AffinityEventDef, AffinityEventDef];
}

export const PROFESSOR_AFFINITY: Record<ProfessorId, ProfessorAffinityDef> = {
  bernard: {
    id: 'bernard',
    favoriteGiftName: '오래된 성좌 잉크병',
    giftCostStones: 1400,
    giftCostDust: 50,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'bernard_1',
        title: '결재 서류 속의 흉터',
        dialogue:
          '…오래된 잉크병이군. 고맙다, {name}. 교장직이란 마왕보다 왕국 감사단의 지출 증빙서를 상대하는 일이 더 잦은 법이지. 자, 이 오래된 수련 기록지를 가져가거라. 네 성장에 보탬이 될 것이다.',
        bonusLabel: '경험치 +3%',
        bonus: { expPct: 3 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'bernard_2',
        title: '금이 간 지팡이의 속사정',
        dialogue:
          '눈가의 흉터가 시린 밤이면 초대 교장님의 지팡이가 낮게 운다네, {name}. 사실 절반은 흑식 저주 때문이고, 나머지 절반은 카렌과 볼타가 또 교실 천장을 날려먹었을 때지. …이 늙은이의 마력 조율법을 전수해 주마.',
        bonusLabel: '마력 +3% · 경험치 +4%',
        bonus: { magicPct: 3, expPct: 4 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'bernard_3',
        title: '초대 교장이 남긴 서랍',
        dialogue:
          '{name}, 내 책상 맨 아래 서랍엔 비상금… 아니, 아스트라 최후의 비상 기금과 천문 비술서가 잠들어 있다. 네가 끝까지 별빛을 놓지 않는다면, 교장의 권한으로 아낌없이 내어주지.',
        bonusLabel: '마력 +4% · 마석 +5%',
        bonus: { magicPct: 4, stonePct: 5 },
      },
    ],
  },
  lucia: {
    id: 'lucia',
    favoriteGiftName: '말린 별꽃 책갈피',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'lucia_1',
        title: '출석부의 붉은 밑줄',
        dialogue:
          '어머, 별꽃 책갈피네요! 고마워요, {name}. 사실 신입생 출석부엔 결석 대신 ‘실종’과 ‘양호실 직행’ 칸이 따로 있답니다… 다행히 {name} 이름 옆엔 아직 깨끗하네요. 효율적인 예습 노트를 빌려드릴게요.',
        bonusLabel: '수련 속도 +4%',
        bonus: { trainSpeedPct: 4 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'lucia_2',
        title: '검은 리본의 매듭',
        dialogue:
          '손목의 이 검은 리본 말인가요…? 가끔 밤마다 너무 차가워서 잠이 깨곤 해요. 그래도 {name}이(가) 무사히 돌아오는 발소리를 들으면 금세 따뜻해져요. 다치지 않게 제 작은 수호 매듭을 나눠 드릴게요.',
        bonusLabel: '최대 HP +4% · 수련 속도 +5%',
        bonus: { hpPct: 4, trainSpeedPct: 5 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'lucia_3',
        title: '결계 밖을 꿈꾸는 오후',
        dialogue:
          '모든 검은 안개가 걷히는 날이 온다면, {name}과(와) 함께 교문 밖 언덕에서 차를 마시고 싶어요. 그날까지는… 제가 이 회랑에서 가장 먼저 당신의 이름을 부르며 기다릴게요.',
        bonusLabel: '경험치 +6% · 최대 HP +4%',
        bonus: { expPct: 6, hpPct: 4 },
      },
    ],
  },
  karen: {
    id: 'karen',
    favoriteGiftName: '그을린 화로 부싯돌',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'karen_1',
        title: '소화기 없는 화로 교실',
        dialogue:
          '오, 제대로 된 부싯돌을 구해왔잖아, {name}! 교장 영감이 화로 교실에 방화 결계를 덧씌워 달라고 잔소리하지만, 불이 안 번지면 흑염학이 아니지. 자, 화력을 한 단계 더 끌어올리는 호흡법이다!',
        bonusLabel: '마력 +3%',
        bonus: { magicPct: 3 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'karen_2',
        title: '가죽 암가드 아래의 훈장',
        dialogue:
          '이 팔의 화상 흉터 말이야… 12년 전 흑식 전선에서 세바스티안 녀석 등짝을 감싸주다 얻은 거지. 본인 앞에서는 절대 말하지 마, 또 잔소리할 테니까. 대신 {name}에게 급소를 태우는 감각을 가르쳐 주마.',
        bonusLabel: '치명타 확률 +1.5% · 마력 +3%',
        bonus: { critRate: 1.5, magicPct: 3 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'karen_3',
        title: '잿빛 영지의 마지막 술잔',
        dialogue:
          '하하, {name}! 이제 넌 내 제자가 아니라 등을 맡길 전우야. 이 잿불 훈장의 기세를 그대로 넘겨주지. 앞을 가로막는 놈이 마왕이든 심연 군주든, 잿더미로 만들고 살아 돌아와라!',
        bonusLabel: '마력 +5% · 치명타 확률 +2%',
        bonus: { magicPct: 5, critRate: 2 },
      },
    ],
  },
  sebastian: {
    id: 'sebastian',
    favoriteGiftName: '백야 잿빛 홍차 잎',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'sebastian_1',
        title: '온도계가 놓인 찻잔',
        dialogue:
          '…잿빛 홍차 잎이라니, 제법 안목이 있군, {name}. 끓는 물에 대충 우리는 야만적인 짓만 안 한다면 봐주지. 마나 순환도 차를 우리는 것과 같다. 쓸데없는 누수를 줄이는 법을 적어두었으니 외워둬라.',
        bonusLabel: 'MP 회복 +2',
        bonus: { mpRegen: 2 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'sebastian_2',
        title: '금이 간 백야의 은빛 인장',
        dialogue:
          '몰락한 가문의 인장을 아직 달고 있는 이유? …잃어버린 걸 잊지 않기 위해서다. 그리고 눈앞의 제자까지 또 잃을 생각은 없거든. 착각하지 마라, {name}. 사망 보고서 쓰기가 귀찮아서 방어술을 가르쳐 주는 것뿐이다.',
        bonusLabel: '방어 +4% · MP 회복 +3',
        bonus: { defPct: 4, mpRegen: 3 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'sebastian_3',
        title: '몰락 귀족의 야간 보충',
        dialogue:
          '…이 시간까지 남아 있다니, {name}도 참 지독하군. 좋다. 백야 가문 비전의 냉각 술식을 전부 허락하지. 전장에서 절대 마나가 마르지 않도록… 반드시 살아서 다음 찻자리에 앉도록 해라.',
        bonusLabel: '수련 속도 +6% · MP 회복 +4',
        bonus: { trainSpeedPct: 6, mpRegen: 4 },
      },
    ],
  },
  volta: {
    id: 'volta',
    favoriteGiftName: '구리 피뢰 코일 편',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'volta_1',
        title: '합법적 정전 사고',
        dialogue:
          '오, 순도 높은 구리 코일이잖아! 센스 있는데, {name}? 어젯밤 기숙사 전체가 정전된 건 실험 실패가 아니라 ‘결계 과부하 테스트’였거든. 입 다물어 주는 대가로 치명타 각도 계산법을 넘겨주지.',
        bonusLabel: '치명타 확률 +1.5%',
        bonus: { critRate: 1.5 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'volta_2',
        title: '코트 깃의 번개 그을음',
        dialogue:
          '천재라고 떠들어도 결국 외벽 결계를 혼자 지탱하다 보면 손끝이 저릴 때가 있어. 근데 {name}, 네가 성장하는 속도를 보면 슬슬 나도 숨을 돌릴 수 있겠더군. 내 단축 수련 회로를 빌려줄게.',
        bonusLabel: '수련 속도 +5% · 치명타 확률 +2%',
        bonus: { trainSpeedPct: 5, critRate: 2 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'volta_3',
        title: '폭풍 첨탑의 비밀 회로',
        dialogue:
          '축하해, {name}. 폭풍 첨탑 최상층 연구실 열쇠를 복사해 줬어. 마석 회수 효율을 끌어올리는 증폭기도 함께 달아뒀으니, 이젠 천둥이 떨어지기도 전에 전리품까지 싹 쓸어오라고!',
        bonusLabel: '마력 +4% · 마석 +5%',
        bonus: { magicPct: 4, stonePct: 5 },
      },
    ],
  },
  morden: {
    id: 'morden',
    favoriteGiftName: '이끼 낀 석비 탁본지',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'morden_1',
        title: '지하 교실의 조용한 청강생',
        dialogue:
          '…오래된 탁본지로군. 고맙다, {name}. 석비 지하 교실은 늘 서늘해서 학생들이 꺼리지만, 땅속에 잠든 선배들은 누구보다 조용한 청강생이지. 네 몸이 쉽게 꺾이지 않도록 대지의 호흡을 일러두마.',
        bonusLabel: '최대 HP +4%',
        bonus: { hpPct: 4 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'morden_2',
        title: '나무 룬 부적의 이름들',
        dialogue:
          '이 낡은 나무 부적에 새긴 이름은 전부 흑식의 밤에 먼저 간 전우들이다. {name}, 네 이름만큼은 절대 여기 새기고 싶지 않구나. 두꺼운 석벽처럼 버티는 법을 몸에 익혀 두거라.',
        bonusLabel: '방어 +5% · 최대 HP +4%',
        bonus: { defPct: 5, hpPct: 4 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'morden_3',
        title: '무너지지 않는 대지의 서약',
        dialogue:
          '네 발걸음에서 이제 흔들림이 느껴지지 않는구나, {name}. 폭풍이 지나간 뒤 끝까지 서 있는 자가 승자다. 내 오래된 전투의 몫까지 보태어, 대지가 네 생명을 굳건히 붙들어 줄 것이다.',
        bonusLabel: '최대 HP +6% · 방어 +5%',
        bonus: { hpPct: 6, defPct: 5 },
      },
    ],
  },
  irene: {
    id: 'irene',
    favoriteGiftName: '서리 이슬 유리병',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'irene_1',
        title: '정령들의 야간 순찰',
        dialogue:
          '맑은 서리 이슬이네요, {name}. 정령들이 벌써 유리병 주변에서 춤추고 있어요. 사실 밤마다 기숙사 복도를 맴도는 정령들은… 야식을 숨겨 먹는 학생들 위치도 전부 보고한답니다. 비밀로 해드릴 테니, 이 결계 매듭을 받으세요.',
        bonusLabel: '방어 +4%',
        bonus: { defPct: 4 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'irene_2',
        title: '시든 붉은 장미의 가시',
        dialogue:
          '이 시든 장미는 북쪽 숲의 옛 친구가 건넨 선물이에요. 붉은 달이 뜨면 가시가 유독 아리지만, 그래도 버릴 수가 없네요… {name}, 소중한 이를 지키고 싶다는 마음이 결계를 단단하게 만든답니다.',
        bonusLabel: 'MP 회복 +3 · 방어 +4%',
        bonus: { mpRegen: 3, defPct: 4 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'irene_3',
        title: '님펜 숲의 오래된 자장가',
        dialogue:
          '{name}이(가) 어떤 어둠 속으로 걸어 들어가더라도, 제 정령들이 발치의 안개를 걷어낼 거예요. 님펜 숲의 가장 오래된 축복을 당신의 망토에 엮어 두었습니다.',
        bonusLabel: '최대 HP +5% · MP 회복 +4',
        bonus: { hpPct: 5, mpRegen: 4 },
      },
    ],
  },
  seraphina: {
    id: 'seraphina',
    favoriteGiftName: '밀랍 성광 등불 심지',
    giftCostStones: 1200,
    giftCostDust: 45,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'seraphina_1',
        title: '치유실의 쓴 허브차',
        dialogue:
          '등불 심지를 챙겨 오시다니, 마음이 깊으시네요, {name}. 마르타 사서장님이 양호실 당직을 설 때마다 환자들이 오히려 기어서 도망친다고 하더군요… 부디 다치면 제 성당으로 오세요. 먼저 생명력의 축복을 드리겠습니다.',
        bonusLabel: '최대 HP +4%',
        bonus: { hpPct: 4 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'seraphina_2',
        title: '꺼지지 않는 황동 등불',
        dialogue:
          '이 황동 등불은 흑식 이후 단 한 번도 꺼진 적이 없습니다. 사실 기름보다 제 마력으로 태우는 편이 훨씬 많지만요. {name}, 당신이 금기를 만지더라도 저는 빛을 끄지 않겠습니다.',
        bonusLabel: 'MP 회복 +3 · 경험치 +4%',
        bonus: { mpRegen: 3, expPct: 4 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'seraphina_3',
        title: '새벽 성당의 기도문',
        dialogue:
          '오늘 새벽 기도문의 첫 번째 이름은 당신이었습니다, {name}. 살아남으세요. 그리고 돌아오세요. 성광과 아스트라의 은총이 당신의 여정 끝에 풍성히 머물기를 빕니다.',
        bonusLabel: '최대 HP +5% · 마석 +5%',
        bonus: { hpPct: 5, stonePct: 5 },
      },
    ],
  },
  martha: {
    id: 'martha',
    favoriteGiftName: '금서 봉인 붉은 왁스',
    giftCostStones: 1400,
    giftCostDust: 50,
    events: [
      {
        stage: 1,
        threshold: 20,
        eventKey: 'martha_1',
        title: '연체료는 영혼으로 받습니다',
        dialogue:
          '붉은 봉인 왁스라니, 꽤 눈치가 빠르시군요, {name}. 금서를 하루 연체하면 마석으로, 사흘 연체하면 영혼 일부로 정산합니다. …농담이라고 생각하시는 편이 정신 건강에 좋겠지요. 대신 전리품 감정 요령을 알려드리죠.',
        bonusLabel: '마석 +4%',
        bonus: { stonePct: 4 },
      },
      {
        stage: 2,
        threshold: 60,
        eventKey: 'martha_2',
        title: '전임 사서장 크노스의 열쇠',
        dialogue:
          '목에 건 이 낡은 철제 열쇠는 12년 전 사라진 크노스 선배의 유품입니다. 그분은 진실에 너무 가까이 다가갔죠. {name}, 당신은 어둠을 들여다보되 삼켜지지 않는 쪽이군요. 서고 최심부의 주석을 허가합니다.',
        bonusLabel: '마력 +4% · 치명타 확률 +1.5%',
        bonus: { magicPct: 4, critRate: 1.5 },
      },
      {
        stage: 3,
        threshold: 100,
        eventKey: 'martha_3',
        title: '금서 열람자 명단 최상단',
        dialogue:
          '후후… {name}, 이제 금서 도서관에 당신이 열어보지 못할 쇠사슬은 없습니다. 만약 언젠가 이성을 잃더라도 걱정 마세요. 가장 깔끔한 봉인 왁스로 직접 포장해 드릴 테니까요.',
        bonusLabel: '마력 +5% · 마석 +6%',
        bonus: { magicPct: 5, stonePct: 6 },
      },
    ],
  },
};

export function createDefaultAffinity(): ProfessorAffinityState {
  return {
    points: {},
    claimedEvents: [],
  };
}

export function ensureAffinity(
  raw?: Partial<ProfessorAffinityState> | null
): ProfessorAffinityState {
  const base = createDefaultAffinity();
  if (!raw || typeof raw !== 'object') return base;

  const points: Partial<Record<ProfessorId, number>> = {};
  if (raw.points && typeof raw.points === 'object') {
    for (const id of PROFESSOR_ORDER) {
      const val = raw.points[id];
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
        points[id] = Math.min(AFFINITY_MAX_POINTS, Math.max(0, Math.floor(val)));
      }
    }
  }

  const claimedSet = new Set<string>();
  if (Array.isArray(raw.claimedEvents)) {
    for (const key of raw.claimedEvents) {
      if (typeof key === 'string' && key.length > 0) {
        claimedSet.add(key);
      }
    }
  }

  return {
    points,
    claimedEvents: Array.from(claimedSet),
  };
}

export function getAffinityStage(points: number): 0 | 1 | 2 | 3 {
  const safe = Number.isFinite(points) ? points : 0;
  if (safe >= AFFINITY_THRESHOLDS[2]) return 3;
  if (safe >= AFFINITY_THRESHOLDS[1]) return 2;
  if (safe >= AFFINITY_THRESHOLDS[0]) return 1;
  return 0;
}

/**
 * 현재 친밀도 점수 기준 선물 1회(+20점) 비용을 계산한다.
 * 선물 누적 단계(0..4)에 따라 마석과 마력 가루 요구량이 완만하게 상승한다.
 */
export function getGiftCost(
  currentPoints: number,
  profId?: ProfessorId
): { stones: number; dust: number } {
  const def = profId ? PROFESSOR_AFFINITY[profId] : undefined;
  const baseStones = def?.giftCostStones ?? 1200;
  const baseDust = def?.giftCostDust ?? 45;
  const tier = Math.min(4, Math.floor(Math.max(0, currentPoints) / AFFINITY_GIFT_POINTS));
  return {
    stones: Math.round(baseStones * (1 + tier * 0.45)),
    dust: Math.round(baseDust * (1 + tier * 0.35)),
  };
}

/**
 * 수령 완료(`claimedEvents`)된 모든 교수 친밀도 이벤트의 영구 스탯 보너스를 합산한다.
 */
export function getAffinityBonuses(state: Pick<GameState, 'affinity'>): AffinityBonus {
  const totals: AffinityBonus = {
    magicPct: 0,
    hpPct: 0,
    defPct: 0,
    critRate: 0,
    mpRegen: 0,
    trainSpeedPct: 0,
    stonePct: 0,
    expPct: 0,
  };

  const aff = ensureAffinity(state.affinity);
  if (aff.claimedEvents.length === 0) return totals;

  const claimed = new Set(aff.claimedEvents);
  for (const profId of PROFESSOR_ORDER) {
    const def = PROFESSOR_AFFINITY[profId];
    for (const ev of def.events) {
      if (!claimed.has(ev.eventKey)) continue;
      if (ev.bonus.magicPct) totals.magicPct += ev.bonus.magicPct;
      if (ev.bonus.hpPct) totals.hpPct += ev.bonus.hpPct;
      if (ev.bonus.defPct) totals.defPct += ev.bonus.defPct;
      if (ev.bonus.critRate) totals.critRate += ev.bonus.critRate;
      if (ev.bonus.mpRegen) totals.mpRegen += ev.bonus.mpRegen;
      if (ev.bonus.trainSpeedPct) totals.trainSpeedPct += ev.bonus.trainSpeedPct;
      if (ev.bonus.stonePct) totals.stonePct += ev.bonus.stonePct;
      if (ev.bonus.expPct) totals.expPct += ev.bonus.expPct;
    }
  }

  return totals;
}

export function resolveAffinityDialogue(dialogue: string, playerName?: string): string {
  const name = playerName?.trim() || '견습생';
  return dialogue.replaceAll('{name}', name);
}
