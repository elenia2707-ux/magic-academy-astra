import { ensureDailyQuestsCurrent } from '../data/dailyQuests';
import { ensureSanctum } from '../data/sanctum';
import type { GameSettings, GameState } from '../types/game';
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

function hydrateState(parsed: Partial<GameState>): GameState | null {
  if (!parsed || typeof parsed !== 'object' || !parsed.created) return null;
  const fallback = createEmptyUncreatedState();
  // P0-4: 기존 세이브에도 시작 스킬 3종 지급 + 덱 빈칸 채움
  // P1-2: 기존 세이브에 dailyQuests 자동 생성 및 자정 경과 시 초기화
  return ensureStarterKit({
    ...fallback,
    ...parsed,
    version: SAVE_VERSION,
    prestige: {
      ...createDefaultPrestige(),
      ...(parsed.prestige ?? {}),
      upgrades: {
        ...createDefaultPrestige().upgrades,
        ...(parsed.prestige?.upgrades ?? {}),
      },
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
