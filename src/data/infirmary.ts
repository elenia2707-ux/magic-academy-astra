import type { GameState, InfirmaryEffectId, InfirmaryState } from '../types/game';

export interface InfirmaryEffectDef {
  id: InfirmaryEffectId;
  name: string;
  badgeText: string;
  tone: 'buff' | 'tradeoff';
  durationBattles: number;
  hpMult: number;
  magicMult: number;
  defMult: number;
}

/**
 * P1-3 양호실 처방 효과 (패배 시 마르타가 1종 부여, 3전투 지속).
 * - tonic: 순수 생존 버프 (연쇄 패배 완화)
 * - suture: 고화력·저방어 양날 처방 (건조한 오컬트 풍미 + 보스/몹 돌파 변수)
 */
export const INFIRMARY_EFFECTS: Record<InfirmaryEffectId, InfirmaryEffectDef> = {
  tonic: {
    id: 'tonic',
    name: '마르타의 쓴 강장제',
    badgeText: '최대 HP +12% · 방어 +10%',
    tone: 'buff',
    durationBattles: 3,
    hpMult: 1.12,
    magicMult: 1.0,
    defMult: 1.1,
  },
  suture: {
    id: 'suture',
    name: '금서실 응급 봉합',
    badgeText: '마력 +15% · 방어 -8%',
    tone: 'tradeoff',
    durationBattles: 3,
    hpMult: 1.0,
    magicMult: 1.15,
    defMult: 0.92,
  },
};

export type DefeatContext = 'mob' | 'boss' | 'special';

const MARTHA_QUOTES: Record<DefeatContext, string[]> = {
  mob: [
    '또 실려 오셨군요, {name}. 양호실 시트는 피가 잘 안 빠지니 다음부턴 신발이라도 벗고 쓰러지세요.',
    '맥은 뛰는군요. 다행입니다. 사망 서류는 교장실 결재가 세 번이나 필요해서 귀찮거든요.',
    '세라피나 교수님은 피난민 구호에 나가셨습니다. 오늘은 제가 당직이니… 조금 따가워도 참으세요.',
    '붕대 값은 다음 마석 정산에서 떼겠습니다. …농담입니다. 아직은요.',
  ],
  boss: [
    '보스 방 바닥이 그렇게 마음에 드셨나요, {name}? 쓴 약이나 삼키고 숨 고른 뒤에 다시 올라가세요.',
    '붕대가 모자라 금서 봉인 테이프로 감아두었습니다. 따갑겠지만 보스 앞에서도 쉽게 뜯어지진 않을 겁니다.',
    '숨이 붙어 있는 것만으로도 합격점입니다, {name}. 다만 다음번엔 제 서고 앞 말고 양호실 문 앞에 쓰러져 주세요.',
  ],
  special: [
    '시험관에게 한 대 맞고 기절하시면 곤란합니다, {name}. 차트엔 ‘경미한 자존심 타박상’으로 적어두죠.',
    '심연에서 기어 나온 몰골치곤 멀쩡하군요. 이 강장제를 마시고 3전투 동안은 덜 무너지도록 하세요.',
  ],
};

export function getActiveInfirmaryEffect(
  state: Pick<GameState, 'infirmary'>
): InfirmaryEffectDef | null {
  const inf = state.infirmary;
  if (!inf || !inf.activeEffect || inf.battlesLeft <= 0) return null;
  return INFIRMARY_EFFECTS[inf.activeEffect] ?? null;
}

/** 패배 시 양호실 방문 기록 + 마르타 대사 & 처방 효과 1종 부여 */
export function triggerInfirmaryVisit(
  prev: InfirmaryState | null | undefined,
  playerName: string,
  context: DefeatContext
): InfirmaryState {
  const visits = (prev?.visits ?? 0) + 1;
  // 70% 강장제(생존 버프), 30% 금서실 봉합(고화력·저방어 양날 처방)
  const effectId: InfirmaryEffectId = Math.random() < 0.7 ? 'tonic' : 'suture';
  const def = INFIRMARY_EFFECTS[effectId];
  const pool = MARTHA_QUOTES[context];
  const raw = pool[(visits - 1) % pool.length];
  const quote = raw.replaceAll('{name}', playerName || '견습생');
  return {
    activeEffect: effectId,
    battlesLeft: def.durationBattles,
    quote,
    dismissed: false,
    visits,
  };
}

/** 전투 승리 시 남은 처방 전투 수 1 차감 (0이 되면 효과 해제, 방문 기록은 유지) */
export function consumeInfirmaryBattle(
  prev: InfirmaryState | null | undefined
): InfirmaryState | null | undefined {
  if (!prev || !prev.activeEffect || prev.battlesLeft <= 0) return prev;
  const nextLeft = prev.battlesLeft - 1;
  if (nextLeft <= 0) {
    return {
      ...prev,
      activeEffect: null,
      battlesLeft: 0,
    };
  }
  return {
    ...prev,
    battlesLeft: nextLeft,
  };
}
