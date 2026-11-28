import type { ArchiveState, GameState, MonsterDef } from '../types/game';
import { ACTS } from './acts';
import { RANK_EXAM_BOSSES, RANKS } from './schools';

export type BestiaryGroup = 'act1' | 'act2' | 'act3' | 'act4' | 'act5' | 'act6' | 'exam';

export interface BestiaryEntry {
  artKey: string;
  name: string;
  title: string;
  group: BestiaryGroup;
  actNumber: number;
  stageIndex: number;
  actLabel: string;
  isBoss: boolean;
  isExam: boolean;
  monster: MonsterDef;
  researchNote: string;
  reward: { stones?: number; arcaneDust?: number };
  passive: { magicPct?: number; hpPct?: number };
  passiveLabel: string;
}

export interface AchievementReward {
  stones?: number;
  arcaneDust?: number;
  tomeShards?: number;
  eggShards?: number;
  starRemnants?: number;
}

export interface AchievementPassive {
  magicPct?: number;
  hpPct?: number;
  defPct?: number;
  critRate?: number;
  critDmg?: number;
  mpRegen?: number;
  rewardPct?: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  titleName: string;
  category: 'combat' | 'story' | 'growth' | 'mastery';
  target: number;
  getProgress: (state: GameState) => number;
  reward: AchievementReward;
  passive: AchievementPassive;
  passiveLabel: string;
}

export interface ArchiveBonuses {
  magicPct: number;
  hpPct: number;
  defPct: number;
  critRate: number;
  critDmg: number;
  mpRegen: number;
  rewardPct: number;
}

const BESTIARY_NOTES: Record<string, string> = {
  // 제1막 수정 광산
  m1_1_slime:
    '하수구와 광산 입구를 겸용하던 시절의 부산물. 교직원 식당 수프를 몰래 버린 자리가 이 개체의 서식지라는 미확인 보고가 있다.',
  m1_2_bats:
    '야간 순찰 학생들의 모자를 우선적으로 낚아채 가는 습성이 있다. 분실물 센터에 접수된 모자 중 절반은 이 녀석들 둥지에서 회수된다.',
  m1_3_kobold:
    '붉은 수정 가루를 코로 들이마시고 야근 수당을 요구하기 시작했다. 광부 조합에선 이미 산재 보험 적용을 거부했다.',
  m1_4_guardian:
    '선대 광산 관리인이 퇴직금 대신 설치해 둔 자동 방범 장치. 암호를 잊어버린 지 백 년이 넘어 일단 움직이는 것부터 두들겨 팬다.',
  boss_golem:
    '광산 심층의 붉은 별 파편이 스스로 거대 결정갑주를 엮어낸 폭군. 루시아 교수의 손목 봉인을 감지하면 유독 거친 굉음을 내며 덤벼든다.',

  // 제2막 지하 대서고
  m2_1_parchment:
    '반납 기한이 300년 넘게 지난 연체 도서들이 원한을 품고 날아다닌다. 마르타 사서장은 여전히 일일 연체료를 칼같이 합산 중이다.',
  m2_2_candelabra:
    '양초 예산 삭감 이후 마력으로 대신 불을 붙였더니 자의식을 얻었다. 복도에서 뛰어다니는 학생의 머리카락만 골라 그을린다.',
  m2_3_apprentice:
    '졸업 논문 심사를 통과하지 못한 채 지하 서고에 남은 유령. 요즘도 신입생이 지나가면 각주 형식이 틀렸다며 시비를 건다.',
  m2_4_warden:
    '정숙을 강요하기 위해 고안된 철갑 경비 인형. 기침 한 번에도 장검을 뽑아 드는 바람에 서고 열람률이 0%에 수렴하고 있다.',
  boss_wraith:
    '12년 전 실종된 전임 사서장 크노스의 잔영. 스스로를 쇠사슬 금서에 묶어 두면서까지, 교내에 숨은 마왕의 그릇을 경고하려 했던 비운의 기록자.',

  // 제3막 붉은 달의 숲
  m3_1_thorn:
    '붉은 달의 마력에 취해 가시가 철사처럼 굳어진 숲의 추적자. 치료실의 세라피나 교수에 따르면 마취제보다 전지가위가 잘 듣는다.',
  m3_2_flame:
    '고향 숲을 태웠던 재앙의 불씨가 정령의 형상을 흉내 낸 것. 카렌 교수가 애완용으로 들이려다 교장실 결재에서 세 번 반려당했다.',
  m3_3_wolf:
    '달빛이 붉게 물든 밤이면 무리를 이끌고 성소를 배회하는 알파 개체. 사역마 사육실의 그림자 늑대가 이 녀석의 먼 사촌이라는 소문이 돈다.',
  m3_4_gargoyle:
    '마녀의 탑 외벽에서 천둥과 빗물을 견디던 석상. 최근엔 어깨 결림을 호소하며 침입자의 척추를 꺾는 것으로 스트레스를 푼다.',
  boss_witch:
    '아스트라 최연소 정령학 수석이었던 모르가나의 타락한 말로. 시든 장미 한 송이를 끝내 버리지 못한 채, 붉은 달 아래서 친구의 이름을 불렀다.',

  // 제4막 폐허가 된 왕도
  m4_1_infantry:
    '멸망한 데런 왕도의 보초병. 육신이 썩어 문드러진 뒤에도 교대 근무표가 갱신되지 않아, 여전히 성문 앞에서 검문 기록을 적고 있다.',
  m4_2_alchemist:
    '왕성 지하에서 불사약을 빚다 역병 가스통째 폭발한 궁정 연금술사. 본인은 지금 상태가 피부 보습에 더 유리하다고 주장한다.',
  m4_3_knight:
    '왕실 근위대 특유의 과도한 중갑 덕분에 쓰러진 뒤에도 혼자 못 일어나고 서서 죽었다. 갑옷 틈새의 이끼만은 12년째 싱싱하다.',
  m4_4_lich:
    '야근 중 사망한 뒤에도 마력 회로가 살아 있어 계속 결재 서류를 작성 중인 궁정 마법사. 생전보다 오히려 문서 처리 속도가 빨라졌다.',
  boss_knight:
    '베르나르의 옛 전우이자 데런 기사단장 알드리치. 저주에 잠식된 몸으로 끝까지 심연의 문 앞을 막아선 채, 다음 세대가 자신을 베어주길 기다렸다.',

  // 제5막 심연의 균열
  m5_1_hound:
    '검은 안개 협곡의 최전선에서 마력 냄새를 추적하는 공허의 맹수. 어쩐지 마석보다 수련용 목검을 씹어 먹는 버릇이 있다.',
  m5_2_eye:
    '협곡 상공을 떠돌며 침입자의 흑역사까지 낱낱이 스캔하는 감시체. 눈이 마주친 학생 대부분이 전투보다 수치심에 먼저 쓰러진다.',
  m5_3_giant:
    '균열의 틈새에서 쏟아진 재앙의 잿더미가 뭉쳐 거인이 되었다. 발걸음 한 번에 볼타 교수의 외벽 결계 유지비가 반 년 치씩 날아간다.',
  m5_4_apostle:
    '꺼진 별빛을 숭배하며 인간성을 반납한 심연의 사도. 교내 교복과 묘하게 비슷한 로브를 입고 있어 동문회 명부가 한동안 술렁였다.',
  boss_demon:
    '마왕군 선봉장 말레고스. 루시아를 ‘그릇’이라 부르며 학교 결계를 정면으로 찢어발겼으나, 정작 인간들의 고집 앞에서는 번번이 계산이 어긋났다.',

  // 제6막 별이 잠든 왕좌
  m6_1_obsidian_knight:
    '왕좌의 계단을 지키는 침묵의 근위병. 말수가 적은 것이 아니라 투구 안쪽에 입 자체가 없다는 해부 기록이 남아 있다.',
  m6_2_wyrm:
    '밤하늘의 흩어진 별 부스러기를 집어삼키고 자란 고대 용의 원혼. 비늘 사이로 가끔 아스트라 천문대의 오래된 관측 렌즈가 박혀 나온다.',
  m6_3_priest:
    '마왕의 그림자를 모시며 영겁의 기도문을 외는 대사제. 세라피나 교수의 성당 종소리가 들릴 때마다 신경질적으로 귀를 틀어막는다.',
  m6_4_orthrus:
    '머리 둘이 서로 다른 방향을 경계하느라 가끔 제 꼬리에 걸려 넘어진다. 그래도 물리는 쪽은 언제나 침입자라서 웃을 일이 못 된다.',
  demon_lord:
    '최초의 대현자이자 별빛을 삼킨 마왕 발바르. 영겁의 절망 끝에 모든 빛을 가두었으나, 몇 번이고 시간을 거슬러 돌아오는 제자 앞에서는 끝내 옛 스승의 표정을 숨기지 못한다.',

  // 승급 시험관 보스 5종
  exam_1:
    '시전자 승급 시험을 담당하는 화강암 골렘. 300년 전 예산으로 제작된 구형 모델이라 관절 소음이 크지만, 펀치력만큼은 현역 교수진도 인정한다.',
  exam_2:
    '정규 마법사 시험관이자 금서 서고의 문지기. 응시자가 시험 도중 쪽지 시험 요령을 부리면 쇠사슬로 책상째 묶어버리는 것으로 악명 높다.',
  exam_3:
    '비술사 시험을 주관하는 백야의 거울 마녀. 전투 중 거울에 비친 응시자의 안색을 보고 야식 섭취 여부까지 지적하는 나쁜 습관이 있다.',
  exam_4:
    '심연 마도사 승급 시험의 심판관. 시험 합격률이 하도 낮아 양호실 세라피나 교수가 매 분기 정식으로 항의 서한을 보낸다는 소문이 있다.',
  exam_5:
    '아스트라 초대 교장 아스티엔의 마력 환영. 천 년 전 남겨둔 시험 문제집을 아직도 한 번도 개정하지 않아, 역대 대마도사들이 똑같은 별의 심판에 두들겨 맞았다.',
};

const ACT_GROUP_MAP: Record<number, BestiaryGroup> = {
  1: 'act1',
  2: 'act2',
  3: 'act3',
  4: 'act4',
  5: 'act5',
  6: 'act6',
};

const ACT_SHORT_TITLES: Record<number, string> = {
  1: '제1막 · 수정 광산',
  2: '제2막 · 지하 대서고',
  3: '제3막 · 붉은 달의 숲',
  4: '제4막 · 폐허 왕도',
  5: '제5막 · 심연의 균열',
  6: '제6막 · 별이 잠든 왕좌',
};

function buildBestiaryEntries(): BestiaryEntry[] {
  const entries: BestiaryEntry[] = [];

  for (const act of ACTS) {
    const group = ACT_GROUP_MAP[act.act] ?? 'act1';
    const actLabel = ACT_SHORT_TITLES[act.act] ?? `제${act.act}막`;

    act.stages.forEach((monster, stageIndex) => {
      const isBoss = Boolean(monster.isBoss);
      const reward = isBoss
        ? { stones: 400 * act.act, arcaneDust: 6 + act.act * 2 }
        : { stones: 120 * act.act };
      const passive = isBoss
        ? { magicPct: 0.8, hpPct: 0.8 }
        : stageIndex % 2 === 0
          ? { magicPct: 0.3 }
          : { hpPct: 0.3 };
      const passiveLabel = isBoss
        ? '영구 마력·체력 +0.8%'
        : stageIndex % 2 === 0
          ? '영구 마력 +0.3%'
          : '영구 체력 +0.3%';

      entries.push({
        artKey: monster.artKey,
        name: monster.name,
        title: monster.title,
        group,
        actNumber: act.act,
        stageIndex,
        actLabel,
        isBoss,
        isExam: false,
        monster,
        researchNote: BESTIARY_NOTES[monster.artKey] ?? `${monster.title} 개체 기록.`,
        reward,
        passive,
        passiveLabel,
      });
    });
  }

  for (let examRank = 1; examRank <= 5; examRank += 1) {
    const monster = RANK_EXAM_BOSSES[examRank];
    if (!monster) continue;
    const rankInfo = RANKS[examRank];
    entries.push({
      artKey: monster.artKey,
      name: monster.name,
      title: monster.title,
      group: 'exam',
      actNumber: examRank,
      stageIndex: examRank - 1,
      actLabel: `승급 시험 · ${rankInfo?.name ?? `${examRank}계급`}`,
      isBoss: true,
      isExam: true,
      monster,
      researchNote: BESTIARY_NOTES[monster.artKey] ?? `${monster.title} 시험 기록.`,
      reward: { stones: 300 * examRank, arcaneDust: 5 + examRank * 2 },
      passive: { magicPct: 0.7, hpPct: 0.7 },
      passiveLabel: '영구 마력·체력 +0.7%',
    });
  }

  return entries;
}

export const BESTIARY_ENTRIES: BestiaryEntry[] = buildBestiaryEntries();

export const BESTIARY_MAP: Record<string, BestiaryEntry> = Object.fromEntries(
  BESTIARY_ENTRIES.map((entry) => [entry.artKey, entry])
);

const VALID_BESTIARY_KEYS = new Set(BESTIARY_ENTRIES.map((entry) => entry.artKey));

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    name: '첫 토벌',
    description: '사냥터와 심연에서 마수 누적 10체 토벌',
    titleName: '신입 토벌자',
    category: 'combat',
    target: 10,
    getProgress: (state) => state.totalKills,
    reward: { stones: 300 },
    passive: { magicPct: 2 },
    passiveLabel: '영구 마력 +2%',
  },
  {
    id: 'slayer_100',
    name: '야간 당직',
    description: '마수 누적 100체 토벌 달성',
    titleName: '어둠의 청소부',
    category: 'combat',
    target: 100,
    getProgress: (state) => state.totalKills,
    reward: { stones: 900 },
    passive: { hpPct: 3 },
    passiveLabel: '영구 체력 +3%',
  },
  {
    id: 'slayer_1000',
    name: '교내 소탕 기록',
    description: '마수 누적 1,000체 토벌 달성',
    titleName: '검은 탑의 사신',
    category: 'combat',
    target: 1000,
    getProgress: (state) => state.totalKills,
    reward: { arcaneDust: 20 },
    passive: { magicPct: 4, critRate: 1 },
    passiveLabel: '영구 마력 +4% · 치확 +1%',
  },
  {
    id: 'act1_clear',
    name: '수정 광산 정화',
    description: '제 1막 [붉은 수정 군주 락엘르] 격파',
    titleName: '광산의 파쇄자',
    category: 'story',
    target: 1,
    getProgress: (state) => (state.clearedActs.includes(1) ? 1 : 0),
    reward: { stones: 600 },
    passive: { defPct: 3 },
    passiveLabel: '영구 방어 +3%',
  },
  {
    id: 'act3_clear',
    name: '님펜 숲의 생존자',
    description: '제 3막 [붉은 달의 마녀 모르가나] 격파',
    titleName: '저주 숲의 돌파자',
    category: 'story',
    target: 1,
    getProgress: (state) => (state.clearedActs.includes(3) ? 1 : 0),
    reward: { stones: 2000 },
    passive: { magicPct: 3, critDmg: 5 },
    passiveLabel: '영구 마력 +3% · 치피 +5%',
  },
  {
    id: 'act6_clear',
    name: '검은 왕좌의 종결자',
    description: '제 6막 [부활한 마왕 발바르] 격파',
    titleName: '아스트라의 구원자',
    category: 'story',
    target: 1,
    getProgress: (state) => (state.clearedActs.includes(6) ? 1 : 0),
    reward: { tomeShards: 3 },
    passive: { magicPct: 5, hpPct: 5 },
    passiveLabel: '영구 마력·체력 +5%',
  },
  {
    id: 'rank_3',
    name: '비술사 서임',
    description: '아스트라 계급 [비술사] 이상 달성',
    titleName: '탑의 비술사',
    category: 'growth',
    target: 3,
    getProgress: (state) => state.rank,
    reward: { stones: 1500 },
    passive: { mpRegen: 2 },
    passiveLabel: '턴당 MP 회복 +2',
  },
  {
    id: 'rank_5',
    name: '대마도사 등극',
    description: '최고 계급 [대마도사] 달성',
    titleName: '별빛의 대마도사',
    category: 'growth',
    target: 5,
    getProgress: (state) => state.rank,
    reward: { eggShards: 3 },
    passive: { magicPct: 4, critRate: 2 },
    passiveLabel: '영구 마력 +4% · 치확 +2%',
  },
  {
    id: 'rune_master',
    name: '비전 룬 개안',
    description: '스킬 룬 각성 1회 이상 달성',
    titleName: '룬의 해독자',
    category: 'growth',
    target: 1,
    getProgress: (state) =>
      Object.values(state.skills).filter((sk) => Boolean(sk?.runeAwakened)).length,
    reward: { arcaneDust: 25 },
    passive: { critDmg: 8 },
    passiveLabel: '영구 치명타 피해 +8%',
  },
  {
    id: 'familiar_bond',
    name: '계약의 증표',
    description: '사역마 2종 이상 부화·소유',
    titleName: '사역마 계약자',
    category: 'growth',
    target: 2,
    getProgress: (state) =>
      Object.values(state.familiars).filter((fam) => Boolean(fam)).length,
    reward: { eggShards: 2 },
    passive: { hpPct: 4 },
    passiveLabel: '영구 체력 +4%',
  },
  {
    id: 'starlight_counter',
    name: '완벽한 별빛',
    description: '전투 중 별빛 완벽 개입 1회 이상 성공',
    titleName: '별빛의 간섭자',
    category: 'mastery',
    target: 1,
    getProgress: (state) => state.archive?.perfectInterventions ?? 0,
    reward: { stones: 1200 },
    passive: { critRate: 2 },
    passiveLabel: '영구 치명타 확률 +2%',
  },
  {
    id: 'tower_10',
    name: '무한 탑 등반가',
    description: '무한 심연 탑 10층 이상 돌파',
    titleName: '군주의 대적자',
    category: 'mastery',
    target: 10,
    getProgress: (state) => state.highestTowerFloor,
    reward: { arcaneDust: 30 },
    passive: { magicPct: 3, defPct: 3 },
    passiveLabel: '영구 마력·방어 +3%',
  },
  {
    id: 'bestiary_15',
    name: '아스트라 박물학자',
    description: '도감 표본 15종 이상 해금·기록',
    titleName: '기록실의 학자',
    category: 'mastery',
    target: 15,
    getProgress: (state) => getDiscoveredBestiaryCount(state),
    reward: { stones: 2500 },
    passive: { rewardPct: 5 },
    passiveLabel: '보상 마석·EXP +5%',
  },
  {
    id: 'rebirth_1',
    name: '시간의 회귀자',
    description: '성좌 회귀(환생) 1회 이상 완료',
    titleName: '시간을 거스른 자',
    category: 'mastery',
    target: 1,
    getProgress: (state) => state.prestige.rebirthCount,
    reward: { starRemnants: 5 },
    passive: { magicPct: 4, rewardPct: 6 },
    passiveLabel: '영구 마력 +4% · 보상 +6%',
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((def) => [def.id, def])
);

const VALID_ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((def) => def.id));

export function createDefaultArchive(): ArchiveState {
  return {
    killCounts: {},
    claimedBestiary: [],
    claimedAchievements: [],
    equippedTitle: null,
    perfectInterventions: 0,
  };
}

export function ensureArchive(raw?: Partial<ArchiveState> | null): ArchiveState {
  const base = createDefaultArchive();
  if (!raw || typeof raw !== 'object') return base;

  const killCounts: Record<string, number> = {};
  if (raw.killCounts && typeof raw.killCounts === 'object') {
    for (const [key, val] of Object.entries(raw.killCounts)) {
      if (typeof key === 'string' && key.length > 0 && typeof val === 'number' && Number.isFinite(val) && val > 0) {
        killCounts[key] = Math.floor(val);
      }
    }
  }

  const bestiarySet = new Set<string>();
  if (Array.isArray(raw.claimedBestiary)) {
    for (const key of raw.claimedBestiary) {
      if (typeof key === 'string' && VALID_BESTIARY_KEYS.has(key)) {
        bestiarySet.add(key);
      }
    }
  }

  const achievementSet = new Set<string>();
  if (Array.isArray(raw.claimedAchievements)) {
    for (const id of raw.claimedAchievements) {
      if (typeof id === 'string' && VALID_ACHIEVEMENT_IDS.has(id)) {
        achievementSet.add(id);
      }
    }
  }

  const claimedAchievements = Array.from(achievementSet);
  const equippedTitle =
    typeof raw.equippedTitle === 'string' && achievementSet.has(raw.equippedTitle)
      ? raw.equippedTitle
      : null;

  const perfectInterventions =
    typeof raw.perfectInterventions === 'number' &&
    Number.isFinite(raw.perfectInterventions) &&
    raw.perfectInterventions > 0
      ? Math.floor(raw.perfectInterventions)
      : 0;

  return {
    killCounts,
    claimedBestiary: Array.from(bestiarySet),
    claimedAchievements,
    equippedTitle,
    perfectInterventions,
  };
}

export function getEffectiveBestiaryKills(state: GameState, entry: BestiaryEntry): number {
  const recorded = Math.max(0, Math.floor(state.archive?.killCounts?.[entry.artKey] ?? 0));
  let inferred = 0;

  if (entry.isExam) {
    if (state.rank >= entry.actNumber) {
      inferred = 1;
    }
  } else if (entry.isBoss) {
    if (state.clearedActs.includes(entry.actNumber) || state.highestAct > entry.actNumber) {
      inferred = 1;
    }
  } else if (
    state.clearedActs.includes(entry.actNumber) ||
    state.highestAct > entry.actNumber ||
    (state.highestAct === entry.actNumber && state.highestStageInAct > entry.stageIndex)
  ) {
    inferred = 1;
  }

  return Math.max(recorded, inferred);
}

export function getDiscoveredBestiaryCount(state: GameState): number {
  let count = 0;
  for (const entry of BESTIARY_ENTRIES) {
    if (getEffectiveBestiaryKills(state, entry) > 0) {
      count += 1;
    }
  }
  return count;
}

export function isBestiaryClaimable(state: GameState, entry: BestiaryEntry): boolean {
  const claimed = state.archive?.claimedBestiary ?? [];
  if (claimed.includes(entry.artKey)) return false;
  return getEffectiveBestiaryKills(state, entry) >= 1;
}

export function isAchievementClaimable(state: GameState, def: AchievementDef): boolean {
  const claimed = state.archive?.claimedAchievements ?? [];
  if (claimed.includes(def.id)) return false;
  return def.getProgress(state) >= def.target;
}

export function getClaimableBestiaryCount(state: GameState): number {
  let count = 0;
  for (const entry of BESTIARY_ENTRIES) {
    if (isBestiaryClaimable(state, entry)) count += 1;
  }
  return count;
}

export function getClaimableAchievementCount(state: GameState): number {
  let count = 0;
  for (const def of ACHIEVEMENTS) {
    if (isAchievementClaimable(state, def)) count += 1;
  }
  return count;
}

export function getClaimableArchiveCount(state: GameState): number {
  return getClaimableBestiaryCount(state) + getClaimableAchievementCount(state);
}

export function recordBestiaryKill(archive: ArchiveState | undefined, artKey: string): ArchiveState {
  const cur = ensureArchive(archive);
  if (!artKey) return cur;
  return {
    ...cur,
    killCounts: {
      ...cur.killCounts,
      [artKey]: (cur.killCounts[artKey] ?? 0) + 1,
    },
  };
}

export function recordPerfectIntervention(archive: ArchiveState | undefined): ArchiveState {
  const cur = ensureArchive(archive);
  return {
    ...cur,
    perfectInterventions: cur.perfectInterventions + 1,
  };
}

export function getArchiveBonuses(state: GameState): ArchiveBonuses {
  const totals: ArchiveBonuses = {
    magicPct: 0,
    hpPct: 0,
    defPct: 0,
    critRate: 0,
    critDmg: 0,
    mpRegen: 0,
    rewardPct: 0,
  };

  const archive = ensureArchive(state.archive);

  for (const artKey of archive.claimedBestiary) {
    const entry = BESTIARY_MAP[artKey];
    if (!entry) continue;
    if (entry.passive.magicPct) totals.magicPct += entry.passive.magicPct;
    if (entry.passive.hpPct) totals.hpPct += entry.passive.hpPct;
  }

  for (const id of archive.claimedAchievements) {
    const def = ACHIEVEMENT_MAP[id];
    if (!def) continue;
    if (def.passive.magicPct) totals.magicPct += def.passive.magicPct;
    if (def.passive.hpPct) totals.hpPct += def.passive.hpPct;
    if (def.passive.defPct) totals.defPct += def.passive.defPct;
    if (def.passive.critRate) totals.critRate += def.passive.critRate;
    if (def.passive.critDmg) totals.critDmg += def.passive.critDmg;
    if (def.passive.mpRegen) totals.mpRegen += def.passive.mpRegen;
    if (def.passive.rewardPct) totals.rewardPct += def.passive.rewardPct;
  }

  totals.magicPct = Math.round(totals.magicPct * 10) / 10;
  totals.hpPct = Math.round(totals.hpPct * 10) / 10;

  return totals;
}

export function getEquippedTitleDef(state: GameState): AchievementDef | null {
  const archive = ensureArchive(state.archive);
  if (!archive.equippedTitle) return null;
  if (!archive.claimedAchievements.includes(archive.equippedTitle)) return null;
  return ACHIEVEMENT_MAP[archive.equippedTitle] ?? null;
}

export function formatArchiveReward(reward: AchievementReward): string {
  const parts: string[] = [];
  if (reward.stones) parts.push(`마석 +${reward.stones.toLocaleString()}`);
  if (reward.arcaneDust) parts.push(`가루 +${reward.arcaneDust.toLocaleString()}`);
  if (reward.tomeShards) parts.push(`금서 +${reward.tomeShards.toLocaleString()}`);
  if (reward.eggShards) parts.push(`알 조각 +${reward.eggShards.toLocaleString()}`);
  if (reward.starRemnants) parts.push(`별의 잔재 +${reward.starRemnants.toLocaleString()}`);
  return parts.join(' · ');
}
