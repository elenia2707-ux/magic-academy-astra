export type SchoolId = 'flame' | 'frost' | 'thunder' | 'earth';
export type Gender = 'male' | 'female';
export type MagicCategory = SchoolId | 'ward' | 'holy' | 'dark';
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type EquipSlot = 'staff' | 'robe' | 'grimoire' | 'relic';
export type Rarity = 'common' | 'rare' | 'epic' | 'ancient' | 'mythic';
export type GearSetId =
  | 'ember_covenant'
  | 'glacier_mirror'
  | 'storm_spire'
  | 'basalt_oath'
  | 'astral_abyss';

export type StatusType =
  | 'burn'
  | 'freeze'
  | 'shock'
  | 'poison'
  | 'curse'
  | 'shield'
  | 'atkUp'
  | 'reflect'
  | 'regen';

export interface StatusEffect {
  type: StatusType;
  turns: number;
  value: number;
}

export interface SkillDef {
  id: string;
  name: string;
  category: MagicCategory;
  requiredRank: RankIndex;
  mpCost: number;
  hpCostPct?: number; // 흑마법 체력 소모 비율
  cooldown: number;
  trainCostSec: number; // 수련 완료까지 필요한 초
  tomeCost?: number; // 흑마법 해독 시 필요한 금서 조각
  description: string;
  powerPct: number; // 마력 대비 피해/회복 계수 (%)
  hits?: number;
  bonusCrit?: number;
  lifestealPct?: number;
  burnBonusPct?: number; // 화상 상태 적에게 추가 피해
  isHeal?: boolean;
  isCleanse?: boolean;
  isShield?: boolean;
  isBuff?: boolean;
  applyStatus?: {
    target: 'enemy' | 'self';
    type: StatusType;
    turns: number;
    value: number; // 배율 또는 수치
    chance?: number;
  };
  secondaryStatus?: {
    target: 'enemy' | 'self';
    type: StatusType;
    turns: number;
    value: number;
  };
}

export type SkillRuneBranch = 'a' | 'b';

export interface LearnedSkill {
  id: string;
  level: number;
  exp: number; // 수련 누적치 (0 ~ trainCostSec for unlock; 이후 레벨업 누적)
  unlocked: boolean;
  /** P3-2: Lv10 각성 룬 갈래 ('a' | 'b') */
  rune?: SkillRuneBranch | null;
  runeAwakened?: boolean;
}

export interface EquipmentStats {
  magic: number;
  maxHp: number;
  maxMp: number;
  def: number;
  critRate: number; // %
  critDmg: number; // %
  mpRegen: number;
  elementBonus?: {
    category: MagicCategory;
    pct: number;
  };
}

export interface EquipmentItem {
  uid: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  tier: number; // 1~7
  enhance: number;
  setId?: GearSetId;
  stats: EquipmentStats;
}

export type FamiliarId = 'raven' | 'golem' | 'wisp' | 'wolf' | 'owl' | 'bat';

export interface FamiliarDef {
  id: FamiliarId;
  name: string;
  evolvedNames: [string, string, string]; // 유체, 성체, 각성체
  role: string;
  hatchCost: number; // 마석
  eggFragmentCost?: number;
  intervalTurns: number;
  description: string;
  passiveLabel: string;
  passiveMagicPct?: number;
  passiveHpPct?: number;
  passiveCritRate?: number;
  passiveMpRegen?: number;
  passiveDefPct?: number;
}

export interface OwnedFamiliar {
  id: FamiliarId;
  level: number;
  evolution: 0 | 1 | 2; // 0: 유체, 1: 성체, 2: 각성체
}

export type ProfessorId =
  | 'bernard'
  | 'lucia'
  | 'karen'
  | 'sebastian'
  | 'volta'
  | 'morden'
  | 'irene'
  | 'seraphina'
  | 'martha';

export type StoryPhase = 'intro' | 'mid' | 'boss' | 'clear';

export type DialogueSpeakerKey =
  | { kind: 'professor'; id: ProfessorId }
  | { kind: 'boss'; artKey: string }
  | { kind: 'player' }
  | { kind: 'system' };

export interface DialogueLine {
  speaker: string;
  role?: string;
  portrait?: DialogueSpeakerKey;
  text: string;
  schoolVariants?: Partial<Record<SchoolId, string>>;
  ngPlusText?: string;
}

export type BossGimmickId =
  | 'crystal_shell'
  | 'silence_ink'
  | 'blood_thorns'
  | 'unyielding_oath'
  | 'abyss_siphon'
  | 'eclipse_doom';

export type GrimoireSealId =
  | 'seal_shatter'
  | 'seal_ward'
  | 'seal_flame'
  | 'seal_pierce'
  | 'seal_anchor'
  | 'seal_dawn';

export interface MonsterDef {
  id: string;
  name: string;
  title: string;
  artKey: string;
  element?: MagicCategory;
  hp: number;
  atk: number;
  def: number;
  expReward: number;
  stoneReward: number;
  isBoss?: boolean;
  isRankBoss?: boolean;
  gimmick?: BossGimmickId;
  heavyInterval?: number; // N턴마다 강공격
  heavyName?: string;
  heavyMult?: number;
  encounterQuote?: string;
  ngPlusQuote?: string;
  statusOnHit?: {
    type: StatusType;
    turns: number;
    value: number;
    chance: number;
  };
}

export interface ActDef {
  act: number; // 1~6
  title: string;
  subtitle: string;
  location: string;
  requiredRank: RankIndex;
  introLines: DialogueLine[];
  midLines: DialogueLine[];
  bossLines: DialogueLine[];
  clearLines: DialogueLine[];
  bossQuote: string;
  bossNgPlusQuote?: string;
  stages: MonsterDef[]; // 5 stages (4 regular + 1 chapter boss)
}

export interface CombatLogEntry {
  id: number;
  turn: number;
  text: string;
  tone: 'player' | 'enemy' | 'familiar' | 'status' | 'system' | 'crit' | 'heal' | 'dark' | 'starlight';
}

export type CombatMode = 'stage' | 'rankBoss' | 'tower' | 'abyssElite';

export interface SpellVfxEvent {
  id: number;
  target: 'enemy' | 'player';
  category: MagicCategory | 'basic' | 'enemy';
  amountText: string;
  isCrit?: boolean;
  isHeal?: boolean;
  label: string;
}

export interface FamiliarActionEvent {
  id: number;
  familiarId: FamiliarId;
  name: string;
  actionLabel: string;
  effectText: string;
  synergyTriggered: boolean;
}

export interface EscortActionEvent {
  id: number;
  professorId: ProfessorId;
  professorName: string;
  actionLabel: string;
  effectText: string;
}

export interface CombatRuntime {
  mode: CombatMode;
  act: number;
  stageIndex: number; // 0..4 (4 is act boss)
  towerFloor: number;
  turn: number;
  playerHp: number;
  playerMaxHp: number;
  playerMp: number;
  playerMaxMp: number;
  playerShield: number;
  playerStatuses: StatusEffect[];
  cooldowns: Record<string, number>;
  enemy: MonsterDef;
  enemyHp: number;
  enemyMaxHp: number;
  enemyStatuses: StatusEffect[];
  enemyTelegraph: boolean; // 다음 턴 강공격 예고
  familiarCounter: number;
  starlightGauge: number; // 0..100 별빛 개입 공명 게이지
  starlightFlash?: { id: number; perfect: boolean; label: string } | null;
  lastFamiliarAction?: FamiliarActionEvent | null; // P4-1 사역마 전투 컷인 연출
  lastEscortAction?: EscortActionEvent | null; // P4-3 동행 교수 전투 지원 컷인
  enemyShield?: number; // P3-3 보스 기믹 외피/흑갑 보호막
  bossGimmickTriggered?: boolean; // P3-3 체력 임계 1회 기믹 발동 여부
  gimmickSuppressedTurns?: number; // P3-3 별빛 완벽 개입으로 기믹 억제 턴
  logs: CombatLogEntry[];
  lastVfx: SpellVfxEvent | null;
  victoryBanner?: string | null;
}

export type AbyssTileKind =
  | 'start'
  | 'altar'
  | 'merchant'
  | 'chest'
  | 'shrine'
  | 'elite'
  | 'mystery'
  | 'trap';

export interface AbyssChoice {
  label: string;
  hint: string;
  outcomeType: 'treasure' | 'gamble' | 'heal' | 'tome' | 'egg' | 'fight' | 'leave' | 'trapBack';
}

export interface AbyssNode {
  step: number;
  kind: 'altar' | 'merchant' | 'chest' | 'shrine' | 'elite' | 'mystery' | 'trap';
  title: string;
  description: string;
  choices: AbyssChoice[];
}

export interface AbyssState {
  lanterns: number;
  maxLanterns: number;
  lastLanternTick: number;
  depth: number;
  boardPos?: number; // 0..15 순환 보드 현재 칸
  laps?: number; // 보드 완주 바퀴 수
  lastRoll?: number | null; // 마지막 주사위 눈 (1..6)
  activeNode: AbyssNode | null;
  lastResult: string | null;
}

export type PrestigeUpgradeId =
  | 'starPower'
  | 'starVitality'
  | 'trainAccel'
  | 'extraTrainSlot'
  | 'sixthDeckSlot'
  | 'skillCapBreak'
  | 'darkMastery'
  | 'startingWealth';

export type RebirthVowId =
  | 'none'
  | 'crimson_moon'
  | 'abyss_tide'
  | 'silent_hourglass';

export interface PrestigeState {
  rebirthCount: number;
  starRemnants: number;
  totalRemnantsEarned: number;
  upgrades: Record<PrestigeUpgradeId, number>;
  /** P3-4: 현재 회차의 성좌 서약 (변형 규칙) */
  activeVow?: RebirthVowId;
}

export interface OfflineSummary {
  elapsedSec: number;
  expGained: number;
  stonesGained: number;
  kills: number;
  trainedSkills: string[];
  itemsFound: number;
  lanternsRecovered: number;
}

export interface GameSettings {
  speed: 1 | 2 | 3;
  sfxEnabled: boolean;
  bgmEnabled?: boolean;
  bgmVolume?: number; // 0..1 (기본 0.55)
  autoAdvance: boolean;
  autoDismantleBelow: Rarity | 'none';
  /** P0-5: 자동분해 기본값(일반 이하) 마이그레이션 1회 적용 여부 */
  gearDefaultsV2?: boolean;
}

export type DailyQuestId = 'kills' | 'skillUpgrade' | 'boss';

export interface DailyQuestState {
  /** 로컬 자정(00:00) 기준 YYYY-MM-DD */
  dateKey: string;
  progress: Record<DailyQuestId, number>;
  claimed: Record<DailyQuestId, boolean>;
  /** 3개 과제 모두 수령 후 루시아 개근 도장 보너스 수령 여부 */
  bonusClaimed: boolean;
}

export type InfirmaryEffectId = 'tonic' | 'suture';

export interface InfirmaryState {
  activeEffect: InfirmaryEffectId | null;
  battlesLeft: number;
  quote: string;
  dismissed: boolean;
  visits: number;
}

export type ArcaneImprintId = 'overdrive' | 'aegis' | 'insight';
export type ArcaneTransmuteId = 'lantern' | 'tome' | 'egg';

export interface ArcaneSanctumState {
  imprints: Record<ArcaneImprintId, number>;
  totalStonesSpent: number;
}

export interface ProfessorAffinityState {
  /** 교수별 친밀도 점수 (0 ~ 100) */
  points: Partial<Record<ProfessorId, number>>;
  /** 수령 완료한 친밀도 이벤트 키 (예: "lucia_1", "karen_2") */
  claimedEvents: string[];
}

export interface ArchiveState {
  /** 몬스터/보스 artKey별 누적 처치 수 */
  killCounts: Record<string, number>;
  /** 도감 연구 보상을 수령한 artKey 목록 */
  claimedBestiary: string[];
  /** 보상을 수령한 업적 ID 목록 */
  claimedAchievements: string[];
  /** 상단 헤더에 장착한 칭호의 업적 ID (null이면 미장착) */
  equippedTitle: string | null;
  /** 별빛 완벽 개입 누적 횟수 */
  perfectInterventions: number;
  /** P5-1: 열람 보상 수령 완료한 연대기·사전 문서 ID 목록 */
  claimedCodex?: string[];
}

export interface TruthRouteState {
  /** 개봉(열람 보상 수령) 완료한 진실 서신 ID 목록 */
  openedLetters: string[];
  /** 히든 진엔딩 에필로그 열람 완료 여부 */
  epilogueClaimed: boolean;
}

export interface SchoolJournalState {
  /** 완료 보상을 수령한 학파 전승 퀘스트 ID 목록 (회귀 시 유지, 타 학파 누적 가능) */
  claimedQuests: string[];
  /** 확인 완료한 교내 게시판 공고 ID 목록 (회귀 시 유지) */
  readNotices: string[];
}

export interface GameState {
  version: number;
  created: boolean;
  playerName: string;
  gender: Gender;
  school: SchoolId;
  level: number;
  exp: number;
  rank: RankIndex;
  stones: number; // 마석 (주 재화)
  tomeShards: number; // 금서 조각 (흑마법 해독)
  eggShards: number; // 사역마 알 조각
  arcaneDust: number; // 마력 가루 (분해/연금)
  highestAct: number; // 1~6
  highestStageInAct: number; // 0~4
  clearedActs: number[]; // 클리어한 막 번호
  viewedStoryActs: number[];
  viewedStoryKeys?: string[]; // 중반·보스·흑마법 해금 등 세부 스토리 1회 시청 기록
  selectedAct: number;
  selectedStage: number; // 0~4
  towerFloor: number;
  highestTowerFloor: number;
  skills: Record<string, LearnedSkill>;
  deck: string[]; // 심플 로테이션 스킬 ID 목록
  trainingSlots: (string | null)[];
  equipped: Record<EquipSlot, EquipmentItem | null>;
  inventory: EquipmentItem[];
  familiars: Record<FamiliarId, OwnedFamiliar | undefined>;
  activeFamiliar: FamiliarId | null;
  abyss: AbyssState;
  prestige: PrestigeState;
  settings: GameSettings;
  dailyQuests: DailyQuestState;
  infirmary?: InfirmaryState | null;
  sanctum?: ArcaneSanctumState;
  affinity?: ProfessorAffinityState;
  /** P3-3: 전술 마도서 인장 (막 보스 고유 기믹 대응) */
  grimoireSeal?: GrimoireSealId | null;
  /** P4-2: 아스트라 기록실 (몬스터·보스 도감 & 업적·칭호, 회귀 시 유지) */
  archive?: ArchiveState;
  /** P4-3: 현재 현장 동행 중인 교수 ID (null이면 단독 출격, 회귀 시 유지) */
  activeEscort?: ProfessorId | null;
  /** P4-3: 최초 열람 완료한 막별 외전 미니 스토리 ID 목록 (회귀 시 유지) */
  viewedSideStories?: string[];
  /** P4-4: 수령 완료한 무한 탑 마일스톤 층수 목록 (회귀 유지) */
  claimedTowerMilestones?: number[];
  /** P5-2: 막별 스토리 선택지 분기 기록 (예: "1_mid" -> optionId, 회귀 유지) */
  storyChoices?: Record<string, string>;
  /** P5-3: 회귀(NG+) 진실 루트 서신 & 히든 에필로그 진행도 (회귀 유지) */
  truthRoute?: TruthRouteState;
  /** P5-4: 학파 전승 퀘스트 & 교내 게시판 열람 기록 (회귀 유지) */
  schoolJournal?: SchoolJournalState;
  lastSavedAt: number;
  totalKills: number;
}

export interface ComputedStats {
  maxHp: number;
  maxMp: number;
  magic: number;
  def: number;
  critRate: number;
  critDmg: number;
  mpRegen: number;
  trainSpeedMult: number;
  maxDeckSlots: number;
  maxTrainSlots: number;
  maxSkillLevel: number;
  darkDamageMult: number;
  categoryBonus: Record<MagicCategory, number>;
}
