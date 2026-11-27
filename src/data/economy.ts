/**
 * P0-6: 재화(마석) 싱크 튜닝값. 런타임에서 변경 가능하도록 객체로 둔다 (시뮬레이터가 덮어써서 탐색).
 * - 스킬 강화: skillBase × skillGrowth^(Lv-1) × skillRankMult^(스킬 요구 계급)
 * - 마도구 강화: enhBase × enhTierGrowth^(tier-1) × 등급배율 × enhGrowth^(+강화)
 * - 마석 보상: stoneScale × (원본 보상)^stoneExp — 막이 오를수록 보상이 ×3.5씩 폭증하던 곡선을 완만하게 압축
 */
export const ECON = {
  skillBase: 80,
  skillGrowth: 1.65,
  skillRankMult: 2.0,
  enhBase: 35,
  enhTierGrowth: 2.8,
  enhGrowth: 1.4,
  stoneScale: 1.8,
  stoneExp: 0.75,
};

/**
 * P1-1: 경험치 곡선 튜닝값 (1막 튜토리얼은 경쾌하게 유지하고, 2~4막 페이싱을 25~40분으로 조정).
 * 공식: base × growth^(L-1) + linear × L + midQuad × max(0, L - midStart)^2
 * - L <= 7 (1막): 기존과 동일한 경쾌한 레벨업 (시전자 승급 ~1~2분)
 * - L = 8~44 (2~4막): midQuad 항이 2~4막 구간을 묵직하게 늘려 4막 도달 25~40분 형성
 * - L >= 45 (5~6막): 지수(1.22 → 1.20) 완화로 5막 후반 폭증을 막고 계단식 엔딩 페이싱 유지
 */
export const EXP_CURVE = {
  base: 65,
  growth: 1.2,
  linear: 20,
  midStart: 7,
  midQuad: 260,
};

/** 몬스터 원본 마석 보상 → 실제 지급량 */
export function effectiveStoneReward(base: number): number {
  return Math.max(1, Math.round(ECON.stoneScale * Math.pow(Math.max(0, base), ECON.stoneExp)));
}
