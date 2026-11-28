import type { BossGimmickId, GrimoireSealId } from '../types/game';

export interface BossGimmickDef {
  id: BossGimmickId;
  act: number;
  name: string;
  shortDesc: string;
  counterSealId: GrimoireSealId;
  counterEffectDesc: string;
}

export interface GrimoireSealDef {
  id: GrimoireSealId;
  targetAct: number;
  name: string;
  shortDesc: string;
  countersGimmick: BossGimmickId;
  passiveDesc: string;
}

export const BOSS_GIMMICKS: Record<BossGimmickId, BossGimmickDef> = {
  crystal_shell: {
    id: 'crystal_shell',
    act: 1,
    name: '붉은 수정 외피',
    shortDesc: '4턴마다 수정 갑각(최대 HP 4% 보호막)을 전개합니다.',
    counterSealId: 'seal_shatter',
    counterEffectDesc: '파쇄의 서표로 수정 갑각을 즉각 분쇄해 보호막 전개를 무효화합니다.',
  },
  silence_ink: {
    id: 'silence_ink',
    act: 2,
    name: '침묵의 금서 잉크',
    shortDesc: '3턴마다 플레이어 마나 18%를 흡수하고 보스 공격력을 소폭 강화합니다.',
    counterSealId: 'seal_ward',
    counterEffectDesc: '정화의 서표로 잉크 침식을 차단하고 전투 중 턴당 MP +6을 재생합니다.',
  },
  blood_thorns: {
    id: 'blood_thorns',
    act: 3,
    name: '혈월의 가시 재생',
    shortDesc: '2턴마다 보스 체력을 3.5% 재생하고 플레이어에게 최대 HP 5% 가시 피해를 줍니다.',
    counterSealId: 'seal_flame',
    counterEffectDesc: '성염의 서표로 혈월의 가시와 재생을 소작하여 완전히 봉쇄합니다.',
  },
  unyielding_oath: {
    id: 'unyielding_oath',
    act: 4,
    name: '불사의 흑갑 서약',
    shortDesc: '체력 50% 이하 최초 진입 시 최대 HP 18% 규모의 흑갑 결계 보호막을 전개합니다.',
    counterSealId: 'seal_pierce',
    counterEffectDesc: '파갑의 서표로 흑갑을 관통해 결계 보호막을 5% 수준으로 대폭 약화합니다.',
  },
  abyss_siphon: {
    id: 'abyss_siphon',
    act: 5,
    name: '공허 마력 침식',
    shortDesc: '3턴마다 플레이어 보호막 45%를 흡수하고 모든 스킬 쿨타임을 +1턴 지연합니다.',
    counterSealId: 'seal_anchor',
    counterEffectDesc: '성좌 고정 서표로 쿨타임 지연을 차단하고 보호막 침식을 15%로 경감합니다.',
  },
  eclipse_doom: {
    id: 'eclipse_doom',
    act: 6,
    name: '흑식의 종언장',
    shortDesc: '체력 45% 이하 시 흑식 결계(최대 HP 16% 보호막) 전개 + 매 3턴 최대 HP 7% 관통 파동.',
    counterSealId: 'seal_dawn',
    counterEffectDesc: '여명의 별빛 서표로 결계·파동을 크게 약화하고 별빛 충전 +35% 가속을 얻습니다.',
  },
};

export const GRIMOIRE_SEALS: Record<GrimoireSealId, GrimoireSealDef> = {
  seal_shatter: {
    id: 'seal_shatter',
    targetAct: 1,
    name: '파쇄의 서표',
    shortDesc: '1막 대응 · 수정 외피 분쇄',
    countersGimmick: 'crystal_shell',
    passiveDesc: '보스 피해 +12%(마도서 장착 시 +22%) · 붉은 수정 외피 보호막 완전 봉쇄',
  },
  seal_ward: {
    id: 'seal_ward',
    targetAct: 2,
    name: '정화의 서표',
    shortDesc: '2막 대응 · 침묵 잉크 차단',
    countersGimmick: 'silence_ink',
    passiveDesc: '보스 피해 +12%(마도서 장착 시 +22%) · 침묵의 잉크 봉쇄 & 턴당 MP +6',
  },
  seal_flame: {
    id: 'seal_flame',
    targetAct: 3,
    name: '성염의 서표',
    shortDesc: '3막 대응 · 혈월 가시 소작',
    countersGimmick: 'blood_thorns',
    passiveDesc: '보스 피해 +12%(마도서 장착 시 +22%) · 혈월의 가시 재생 완전 소작',
  },
  seal_pierce: {
    id: 'seal_pierce',
    targetAct: 4,
    name: '파갑의 서표',
    shortDesc: '4막 대응 · 흑갑 결계 관통',
    countersGimmick: 'unyielding_oath',
    passiveDesc: '보스 피해 +12%(마도서 장착 시 +22%) · 불사의 흑갑 결계 보호막 대폭 약화',
  },
  seal_anchor: {
    id: 'seal_anchor',
    targetAct: 5,
    name: '성좌 고정 서표',
    shortDesc: '5막 대응 · 공허 침식 고정',
    countersGimmick: 'abyss_siphon',
    passiveDesc: '보스 피해 +12%(마도서 장착 시 +22%) · 쿨타임 지연 차단 & 보호막 흡수 경감',
  },
  seal_dawn: {
    id: 'seal_dawn',
    targetAct: 6,
    name: '여명의 별빛 서표',
    shortDesc: '6막 대응 · 흑식 종언 파훼',
    countersGimmick: 'eclipse_doom',
    passiveDesc: '보스 피해 +12%(마도서 장착 시 +22%) · 흑식 결계·파동 약화 & 별빛 충전 +35%',
  },
};

export const GRIMOIRE_SEAL_ORDER: readonly GrimoireSealId[] = [
  'seal_shatter',
  'seal_ward',
  'seal_flame',
  'seal_pierce',
  'seal_anchor',
  'seal_dawn',
];

export function getBossGimmick(id?: BossGimmickId | null): BossGimmickDef | null {
  if (!id) return null;
  return BOSS_GIMMICKS[id] ?? null;
}

export function isGimmickCountered(
  gimmickId?: BossGimmickId | null,
  activeSeal?: GrimoireSealId | null
): boolean {
  if (!gimmickId || !activeSeal) return false;
  const gimmick = BOSS_GIMMICKS[gimmickId];
  return Boolean(gimmick && gimmick.counterSealId === activeSeal);
}

export function getSealBossDamageBonusPct(
  hasEquippedGrimoire: boolean,
  isCounterMatch: boolean
): number {
  if (isCounterMatch) return hasEquippedGrimoire ? 22 : 12;
  return hasEquippedGrimoire ? 4 : 0;
}
