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

/** 몬스터 원본 마석 보상 → 실제 지급량 */
export function effectiveStoneReward(base: number): number {
  return Math.max(1, Math.round(ECON.stoneScale * Math.pow(Math.max(0, base), ECON.stoneExp)));
}
