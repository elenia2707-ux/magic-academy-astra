export type SchoolId = 'flame' | 'frost' | 'thunder' | 'earth';
export type Gender = 'male' | 'female';
export type MagicCategory = SchoolId | 'ward' | 'holy' | 'dark';
export type RankIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type EquipSlot = 'staff' | 'robe' | 'grimoire' | 'relic';
export type Rarity = 'common' | 'rare' | 'epic' | 'ancient' | 'mythic';

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

export interface LearnedSkill {
  id: string;
  level: number;
  exp: number; // 수련 누적치 (0 ~ trainCostSec for unlock; 이후 레벨업 누적)
  unlocked: boolean;
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
  tone: 'player' | 'enemy' | 'familiar' | 'status' | 'system' | 'crit' | 'heal' | 'dark';
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

export interface PrestigeState {
  rebirthCount: number;
  starRemnants: number;
  totalRemnantsEarned: number;
  upgrades: Record<PrestigeUpgradeId, number>;
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
