import { ensureArchive } from '../data/archive';
import { GRIMOIRE_SEALS } from '../data/bossGimmicks';
import { ensureDailyQuestsCurrent } from '../data/dailyQuests';
import { PROFESSORS } from '../data/professors';
import { REBIRTH_VOWS } from '../data/rebirthVows';
import { ensureSanctum } from '../data/sanctum';
import type {
  GameSettings,
  GameState,
  GrimoireSealId,
  LearnedSkill,
  ProfessorAffinityState,
  ProfessorId,
  RebirthVowId,
  SkillRuneBranch,
} from '../types/game';
import { createDefaultPrestige, createEmptyUncreatedState, ensureStarterKit, SAVE_VERSION } from './stats';

const STORAGE_KEY = 'magic_academy_astra_save_v1';

export function saveGameToStorage(state: GameState): void {
  try {
    const payload: GameState = { ...state, lastSavedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 저장 공간 부족 시 무시
  }
}

export function loadGameFromStorage(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return hydrateState(parsed);
  } catch {
    return null;
  }
}

export function clearGameStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** P0-5: 기존 세이브가 '사용 안 함'이면 1회에 한해 '일반 자동 분해'로 전환 (이후 사용자 선택은 존중) */
function migrateGearSettings(settings: GameSettings, alreadyMigrated: boolean): GameSettings {
  if (alreadyMigrated) return settings;
  return {
    ...settings,
    autoDismantleBelow: settings.autoDismantleBelow === 'none' ? 'rare' : settings.autoDismantleBelow,
    gearDefaultsV2: true,
  };
}

function normalizeSkills(
  rawSkills?: Record<string, Partial<LearnedSkill>> | null
): Record<string, LearnedSkill> {
  if (!rawSkills || typeof rawSkills !== 'object') return {};
  const result: Record<string, LearnedSkill> = {};
  for (const [id, entry] of Object.entries(rawSkills)) {
    if (!entry || typeof entry !== 'object') continue;
    const runeVal: SkillRuneBranch | null =
      entry.rune === 'a' || entry.rune === 'b' ? entry.rune : null;
    const runeAwakened = Boolean(entry.runeAwakened || runeVal !== null);
    result[id] = {
      id: typeof entry.id === 'string' && entry.id ? entry.id : id,
      level: typeof entry.level === 'number' && Number.isFinite(entry.level) ? Math.max(0, entry.level) : 0,
      exp: typeof entry.exp === 'number' && Number.isFinite(entry.exp) ? Math.max(0, entry.exp) : 0,
      unlocked: Boolean(entry.unlocked),
      ...(runeAwakened ? { runeAwakened: true } : {}),
      ...(runeVal !== null ? { rune: runeVal } : runeAwakened ? { rune: null } : {}),
    };
  }
  return result;
}

function normalizeAffinity(
  rawAffinity?: Partial<ProfessorAffinityState> | null
): ProfessorAffinityState | undefined {
  if (!rawAffinity || typeof rawAffinity !== 'object') return undefined;
  const points: ProfessorAffinityState['points'] = {};
  if (rawAffinity.points && typeof rawAffinity.points === 'object') {
    for (const [profId, val] of Object.entries(rawAffinity.points)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        points[profId as keyof ProfessorAffinityState['points']] = Math.max(0, Math.min(100, val));
      }
    }
  }
  const claimedEvents = Array.isArray(rawAffinity.claimedEvents)
    ? rawAffinity.claimedEvents.filter((k): k is string => typeof k === 'string')
    : [];
  return { points, claimedEvents };
}

function normalizeGrimoireSeal(raw?: unknown): GrimoireSealId | null {
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(GRIMOIRE_SEALS, raw)) {
    return raw as GrimoireSealId;
  }
  return null;
}

function normalizeRebirthVow(raw?: unknown): RebirthVowId {
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(REBIRTH_VOWS, raw)) {
    return raw as RebirthVowId;
  }
  return 'none';
}

function normalizeActiveEscort(raw?: unknown): ProfessorId | null {
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(PROFESSORS, raw)) {
    return raw as ProfessorId;
  }
  return null;
}

function normalizeViewedSideStories(raw?: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string');
}

function normalizeClaimedTowerMilestones(raw?: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const val of raw) {
    if (
      typeof val === 'number' &&
      Number.isFinite(val) &&
      Number.isInteger(val) &&
      val > 0 &&
      !seen.has(val)
    ) {
      seen.add(val);
      result.push(val);
    }
  }
  return result;
}

function hydrateState(parsed: Partial<GameState>): GameState | null {
  if (!parsed || typeof parsed !== 'object' || !parsed.created) return null;
  const fallback = createEmptyUncreatedState();
  const normalizedAffinity = normalizeAffinity(parsed.affinity);
  // P0-4: 기존 세이브에도 시작 스킬 3종 지급 + 덱 빈칸 채움
  // P1-2: 기존 세이브에 dailyQuests 자동 생성 및 자정 경과 시 초기화
  return ensureStarterKit({
    ...fallback,
    ...parsed,
    version: SAVE_VERSION,
    skills: normalizeSkills(parsed.skills),
    prestige: {
      ...createDefaultPrestige(),
      ...(parsed.prestige ?? {}),
      upgrades: {
        ...createDefaultPrestige().upgrades,
        ...(parsed.prestige?.upgrades ?? {}),
      },
      activeVow: normalizeRebirthVow(parsed.prestige?.activeVow),
    },
    abyss: {
      ...fallback.abyss,
      ...(parsed.abyss ?? {}),
      boardPos:
        typeof parsed.abyss?.boardPos === 'number'
          ? ((parsed.abyss.boardPos % 16) + 16) % 16
          : (parsed.abyss?.depth ?? 0) % 16,
      laps:
        typeof parsed.abyss?.laps === 'number'
          ? parsed.abyss.laps
          : Math.floor((parsed.abyss?.depth ?? 0) / 16),
      lastRoll: parsed.abyss?.lastRoll ?? null,
    },
    settings: migrateGearSettings({
      ...fallback.settings,
      ...(parsed.settings ?? {}),
      bgmEnabled: parsed.settings?.bgmEnabled ?? true,
      bgmVolume:
        typeof parsed.settings?.bgmVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.settings.bgmVolume))
          : 0.55,
    }, parsed.settings?.gearDefaultsV2 === true),
    dailyQuests: ensureDailyQuestsCurrent(parsed.dailyQuests),
    sanctum: ensureSanctum(parsed.sanctum),
    archive: ensureArchive(parsed.archive),
    grimoireSeal: normalizeGrimoireSeal(parsed.grimoireSeal),
    activeEscort: normalizeActiveEscort(parsed.activeEscort),
    viewedSideStories: normalizeViewedSideStories(parsed.viewedSideStories),
    claimedTowerMilestones: normalizeClaimedTowerMilestones(parsed.claimedTowerMilestones),
    ...(normalizedAffinity ? { affinity: normalizedAffinity } : {}),
  });
}

export function exportSaveCode(state: GameState): string {
  const json = JSON.stringify({ ...state, lastSavedAt: Date.now() });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `ASTRA1:${btoa(binary)}`;
}

export function importSaveCode(code: string): GameState | null {
  try {
    const trimmed = code.trim();
    const body = trimmed.startsWith('ASTRA1:') ? trimmed.slice(7) : trimmed;
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<GameState>;
    return hydrateState(parsed);
  } catch {
    return null;
  }
}
