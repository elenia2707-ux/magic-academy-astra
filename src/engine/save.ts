import type { GameState } from '../types/game';
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

function hydrateState(parsed: Partial<GameState>): GameState | null {
  if (!parsed || typeof parsed !== 'object' || !parsed.created) return null;
  const fallback = createEmptyUncreatedState();
  // P0-4: 기존 세이브에도 시작 스킬 3종 지급 + 덱 빈칸 채움
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
    },
    settings: {
      ...fallback.settings,
      ...(parsed.settings ?? {}),
    },
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
