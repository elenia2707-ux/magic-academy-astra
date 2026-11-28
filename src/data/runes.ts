import type { SkillDef, SkillRuneBranch } from '../types/game';

export const RUNE_UNLOCK_LEVEL = 10;

export interface SkillRuneMods {
  powerPctDelta?: number;
  hitsDelta?: number;
  bonusCritDelta?: number;
  cooldownDelta?: number;
  mpCostDelta?: number;
  lifestealPctDelta?: number;
  burnBonusPctDelta?: number;
  statusTurnsDelta?: number;
  statusValueDelta?: number;
  statusChanceDelta?: number;
  extraStatus?: SkillDef['secondaryStatus'];
}

export interface SkillRuneDef {
  branch: SkillRuneBranch;
  name: string;
  summary: string;
  mods: SkillRuneMods;
}

export interface SkillRunePair {
  a: SkillRuneDef;
  b: SkillRuneDef;
}

/**
 * 32개 모든 스킬의 Lv.10 룬 각성 데이터.
 * - 갈래 A: 화력 · 연타 · 치명타 · 폭발적 딜링 특화
 * - 갈래 B: 제어 · 상태이상 · 생존 · 쿨타임/마나 순환 특화
 */
export const SKILL_RUNES: Record<string, SkillRunePair> = {
  // ===================== 흑염 학파 (5) =====================
  flame_1: {
    a: {
      branch: 'a',
      name: '잿불 폭주',
      summary: '위력 +28% · 치명 +10%',
      mods: { powerPctDelta: 28, bonusCritDelta: 10 },
    },
    b: {
      branch: 'b',
      name: '꺼지지 않는 불씨',
      summary: '화상 +25%확률 · 지속 +1턴 · MP -2',
      mods: { statusChanceDelta: 0.25, statusTurnsDelta: 1, mpCostDelta: -2 },
    },
  },
  flame_2: {
    a: {
      branch: 'a',
      name: '이중 흑염구',
      summary: '2연타 · 타당 계수 132% · 치명 +8%',
      mods: { hitsDelta: 1, powerPctDelta: -83, bonusCritDelta: 8 },
    },
    b: {
      branch: 'b',
      name: '유황의 심화',
      summary: '화상 +1턴 · 화상계수 +0.18 · 쿨 -1턴',
      mods: { statusTurnsDelta: 1, statusValueDelta: 0.18, cooldownDelta: -1 },
    },
  },
  flame_3: {
    a: {
      branch: 'a',
      name: '폭염의 장막',
      summary: '위력 +45% · 마력증폭 +10%',
      mods: { powerPctDelta: 45, statusValueDelta: 0.1 },
    },
    b: {
      branch: 'b',
      name: '잿빛 수호막',
      summary: '증폭 +1턴 · 쿨 -1턴 · MP -6',
      mods: { statusTurnsDelta: 1, cooldownDelta: -1, mpCostDelta: -6 },
    },
  },
  flame_4: {
    a: {
      branch: 'a',
      name: '핵열 연옥',
      summary: '위력 +55% · 화상특공 +30%',
      mods: { powerPctDelta: 55, burnBonusPctDelta: 30 },
    },
    b: {
      branch: 'b',
      name: '잔화 점화',
      summary: '화상 부여(3턴) · 쿨 -1턴 · MP -8',
      mods: {
        cooldownDelta: -1,
        mpCostDelta: -8,
        extraStatus: { target: 'enemy', type: 'burn', turns: 3, value: 0.45 },
      },
    },
  },
  flame_5: {
    a: {
      branch: 'a',
      name: '초신성 낙하',
      summary: '위력 +105% · 화상특공 +25% · 치명 +15%',
      mods: { powerPctDelta: 105, burnBonusPctDelta: 25, bonusCritDelta: 15 },
    },
    b: {
      branch: 'b',
      name: '영겁의 일식',
      summary: '저주 3턴(피해+22%) · 화상 +1턴 · 쿨 -1턴',
      mods: {
        statusTurnsDelta: 1,
        cooldownDelta: -1,
        extraStatus: { target: 'enemy', type: 'curse', turns: 3, value: 0.22 },
      },
    },
  },

  // ===================== 영원한 서리 학파 (5) =====================
  frost_1: {
    a: {
      branch: 'a',
      name: '만년설 송곳',
      summary: '2연타 · 타당 계수 76% · 치명 +12%',
      mods: { hitsDelta: 1, powerPctDelta: -49, bonusCritDelta: 12 },
    },
    b: {
      branch: 'b',
      name: '한기 침식',
      summary: '빙결 +18%확률 · MP -2',
      mods: { statusChanceDelta: 0.18, mpCostDelta: -2 },
    },
  },
  frost_2: {
    a: {
      branch: 'a',
      name: '파쇄의 얼음창',
      summary: '위력 +55% · 치명 +16%',
      mods: { powerPctDelta: 55, bonusCritDelta: 16 },
    },
    b: {
      branch: 'b',
      name: '영하의 포박',
      summary: '빙결 +22%확률 · 쿨 -1턴',
      mods: { statusChanceDelta: 0.22, cooldownDelta: -1 },
    },
  },
  frost_3: {
    a: {
      branch: 'a',
      name: '칼날 눈보라',
      summary: '위력 +55% · 치명 +15%',
      mods: { powerPctDelta: 55, bonusCritDelta: 15 },
    },
    b: {
      branch: 'b',
      name: '빙정 요새',
      summary: '보호막 +45% · 빙결 부여(1턴) · 쿨 -1턴',
      mods: {
        statusValueDelta: 0.45,
        cooldownDelta: -1,
        extraStatus: { target: 'enemy', type: 'freeze', turns: 1, value: 0 },
      },
    },
  },
  frost_4: {
    a: {
      branch: 'a',
      name: '동토 붕괴',
      summary: '위력 +70% · 치명 +20%',
      mods: { powerPctDelta: 70, bonusCritDelta: 20 },
    },
    b: {
      branch: 'b',
      name: '빙하 봉인',
      summary: '빙결 +25%확률 · 쿨 -1턴 · MP -8',
      mods: { statusChanceDelta: 0.25, cooldownDelta: -1, mpCostDelta: -8 },
    },
  },
  frost_5: {
    a: {
      branch: 'a',
      name: '천년 빙벽 붕괴',
      summary: '위력 +105% · 치명 +22%',
      mods: { powerPctDelta: 105, bonusCritDelta: 22 },
    },
    b: {
      branch: 'b',
      name: '백야의 성역',
      summary: '빙결 2턴 · 마나 -14 · 쿨 -1턴',
      mods: { statusTurnsDelta: 1, mpCostDelta: -14, cooldownDelta: -1 },
    },
  },

  // ===================== 뇌전 학파 (5) =====================
  thunder_1: {
    a: {
      branch: 'a',
      name: '이중 방전',
      summary: '2연타 · 타당 계수 76% · 치명 +6%',
      mods: { hitsDelta: 1, powerPctDelta: -50, bonusCritDelta: 6 },
    },
    b: {
      branch: 'b',
      name: '정전기 연쇄',
      summary: '감전 +30%확률 · 감전 +1턴 · MP -3',
      mods: { statusChanceDelta: 0.3, statusTurnsDelta: 1, mpCostDelta: -3 },
    },
  },
  thunder_2: {
    a: {
      branch: 'a',
      name: '삼중 낙뢰',
      summary: '3연타 · 타당 계수 92% · 치명 +8%',
      mods: { hitsDelta: 1, powerPctDelta: -23, bonusCritDelta: 8 },
    },
    b: {
      branch: 'b',
      name: '과전압 마비',
      summary: '감전 확정 · 감전 4턴(+26%) · 쿨 -1턴',
      mods: { statusChanceDelta: 0.2, statusTurnsDelta: 1, statusValueDelta: 0.08, cooldownDelta: -1 },
    },
  },
  thunder_3: {
    a: {
      branch: 'a',
      name: '뇌전 폭우',
      summary: '4연타 · 타당 계수 88% · 치명 +10%',
      mods: { hitsDelta: 1, powerPctDelta: -8, bonusCritDelta: 10 },
    },
    b: {
      branch: 'b',
      name: '잔류 뇌운',
      summary: '감전 +1턴(+32%) · 쿨 -1턴 · MP -6',
      mods: { statusTurnsDelta: 1, statusValueDelta: 0.08, cooldownDelta: -1, mpCostDelta: -6 },
    },
  },
  thunder_4: {
    a: {
      branch: 'a',
      name: '섬광 일섬',
      summary: '위력 +65% · 치명 +22%',
      mods: { powerPctDelta: 65, bonusCritDelta: 22 },
    },
    b: {
      branch: 'b',
      name: '신속 뇌창',
      summary: '감전 부여(3턴) · 쿨 -1턴 · MP -8',
      mods: {
        cooldownDelta: -1,
        mpCostDelta: -8,
        extraStatus: { target: 'enemy', type: 'shock', turns: 3, value: 0.22 },
      },
    },
  },
  thunder_5: {
    a: {
      branch: 'a',
      name: '오연 천벌',
      summary: '5연타 · 타당 계수 124% · 치명 +12%',
      mods: { hitsDelta: 1, powerPctDelta: -6, bonusCritDelta: 12 },
    },
    b: {
      branch: 'b',
      name: '영원 폭풍핵',
      summary: '감전 4턴(+40%) · 쿨 -1턴 · 마력증폭 2턴',
      mods: {
        statusTurnsDelta: 1,
        statusValueDelta: 0.1,
        cooldownDelta: -1,
        extraStatus: { target: 'self', type: 'atkUp', turns: 2, value: 0.25 },
      },
    },
  },

  // ===================== 침묵의 대지 학파 (5) =====================
  earth_1: {
    a: {
      branch: 'a',
      name: '철갑 파편',
      summary: '위력 +34% · 치명 +10%',
      mods: { powerPctDelta: 34, bonusCritDelta: 10 },
    },
    b: {
      branch: 'b',
      name: '고대 맹독',
      summary: '독 +25%확률 · 독 +1턴 · 독계수 +0.12',
      mods: { statusChanceDelta: 0.25, statusTurnsDelta: 1, statusValueDelta: 0.12 },
    },
  },
  earth_2: {
    a: {
      branch: 'a',
      name: '역습의 철벽',
      summary: '보호막 +45% · 쿨 -1턴',
      mods: { powerPctDelta: 45, statusValueDelta: 0.45, cooldownDelta: -1 },
    },
    b: {
      branch: 'b',
      name: '가시 군체',
      summary: '보호막 +1턴 · 재생 2턴(6%) · MP -4',
      mods: {
        statusTurnsDelta: 1,
        mpCostDelta: -4,
        extraStatus: { target: 'self', type: 'regen', turns: 2, value: 0.06 },
      },
    },
  },
  earth_3: {
    a: {
      branch: 'a',
      name: '대지 붕괴',
      summary: '위력 +60% · 치명 +14%',
      mods: { powerPctDelta: 60, bonusCritDelta: 14 },
    },
    b: {
      branch: 'b',
      name: '뿌리 잠식',
      summary: '독 +1턴(+0.18) · 쿨 -1턴 · MP -6',
      mods: { statusTurnsDelta: 1, statusValueDelta: 0.18, cooldownDelta: -1, mpCostDelta: -6 },
    },
  },
  earth_4: {
    a: {
      branch: 'a',
      name: '화강암 심판',
      summary: '위력 +65% · 치명 +18%',
      mods: { powerPctDelta: 65, bonusCritDelta: 18 },
    },
    b: {
      branch: 'b',
      name: '영원한 석화',
      summary: '저주 4턴(+33%) · 쿨 -1턴 · MP -8',
      mods: { statusTurnsDelta: 1, statusValueDelta: 0.08, cooldownDelta: -1, mpCostDelta: -8 },
    },
  },
  earth_5: {
    a: {
      branch: 'a',
      name: '철성 붕괴파',
      summary: '위력 +95% · 치명 +15%',
      mods: { powerPctDelta: 95, bonusCritDelta: 15 },
    },
    b: {
      branch: 'b',
      name: '불멸의 보루',
      summary: '보호막 +60% · 재생 3턴(10%) · 쿨 -1턴',
      mods: {
        statusValueDelta: 0.6,
        cooldownDelta: -1,
        extraStatus: { target: 'self', type: 'regen', turns: 3, value: 0.1 },
      },
    },
  },

  // ===================== 공용: 결계·정령학 (4) =====================
  ward_1: {
    a: {
      branch: 'a',
      name: '강철 정령의 가호',
      summary: '보호막 +55% · 마력증폭 2턴(+15%)',
      mods: {
        powerPctDelta: 55,
        statusValueDelta: 0.5,
        extraStatus: { target: 'self', type: 'atkUp', turns: 2, value: 0.15 },
      },
    },
    b: {
      branch: 'b',
      name: '민첩한 정령결계',
      summary: '보호막 +1턴 · 쿨 -1턴 · MP -4',
      mods: { statusTurnsDelta: 1, cooldownDelta: -1, mpCostDelta: -4 },
    },
  },
  ward_2: {
    a: {
      branch: 'a',
      name: '마력 과폭주',
      summary: '증폭 +16%(총 48%)',
      mods: { statusValueDelta: 0.16 },
    },
    b: {
      branch: 'b',
      name: '상시 공명',
      summary: '증폭 +1턴 · 쿨 -1턴 · MP -4',
      mods: { statusTurnsDelta: 1, cooldownDelta: -1, mpCostDelta: -4 },
    },
  },
  ward_3: {
    a: {
      branch: 'a',
      name: '원한의 칼날 거울',
      summary: '반사 +25%(총 90%) · 마력증폭 2턴(+18%)',
      mods: {
        statusValueDelta: 0.25,
        extraStatus: { target: 'self', type: 'atkUp', turns: 2, value: 0.18 },
      },
    },
    b: {
      branch: 'b',
      name: '견고한 영혼막',
      summary: '반사·보호막 +1턴 · 쿨 -1턴 · MP -5',
      mods: { statusTurnsDelta: 1, powerPctDelta: 40, cooldownDelta: -1, mpCostDelta: -5 },
    },
  },
  ward_4: {
    a: {
      branch: 'a',
      name: '성좌 폭발 결계',
      summary: '보호막 +65% · 보호막값 +0.7',
      mods: { powerPctDelta: 65, statusValueDelta: 0.7 },
    },
    b: {
      branch: 'b',
      name: '무한 성좌 결계',
      summary: '버프 +1턴 · 쿨 -1턴 · MP -8',
      mods: { statusTurnsDelta: 1, cooldownDelta: -1, mpCostDelta: -8 },
    },
  },

  // ===================== 공용: 성광·치유학 (4) =====================
  holy_1: {
    a: {
      branch: 'a',
      name: '빛의 역류',
      summary: '회복량 +60% · 마력증폭 2턴(+15%)',
      mods: {
        powerPctDelta: 60,
        extraStatus: { target: 'self', type: 'atkUp', turns: 2, value: 0.15 },
      },
    },
    b: {
      branch: 'b',
      name: '신속 치유진',
      summary: '쿨 -1턴 · MP -5 · 재생 2턴(6%)',
      mods: {
        cooldownDelta: -1,
        mpCostDelta: -5,
        extraStatus: { target: 'self', type: 'regen', turns: 2, value: 0.06 },
      },
    },
  },
  holy_2: {
    a: {
      branch: 'a',
      name: '고농도 성수',
      summary: '회복량 +75% · 마력증폭 2턴(+18%)',
      mods: {
        powerPctDelta: 75,
        extraStatus: { target: 'self', type: 'atkUp', turns: 2, value: 0.18 },
      },
    },
    b: {
      branch: 'b',
      name: '정화의 여운',
      summary: '쿨 -1턴 · MP -6 · 재생 3턴(8%)',
      mods: {
        cooldownDelta: -1,
        mpCostDelta: -6,
        extraStatus: { target: 'self', type: 'regen', turns: 3, value: 0.08 },
      },
    },
  },
  holy_3: {
    a: {
      branch: 'a',
      name: '생명의 섬광',
      summary: '즉시회복 +65% · 재생 +4%(턴당 18%)',
      mods: { powerPctDelta: 65, statusValueDelta: 0.04 },
    },
    b: {
      branch: 'b',
      name: '영원한 여신 가호',
      summary: '재생 5턴 · 쿨 -1턴 · MP -6',
      mods: { statusTurnsDelta: 1, cooldownDelta: -1, mpCostDelta: -6 },
    },
  },
  holy_4: {
    a: {
      branch: 'a',
      name: '성자의 기적',
      summary: '즉시회복 +110% · 재생 +6%(턴당 24%)',
      mods: { powerPctDelta: 110, statusValueDelta: 0.06 },
    },
    b: {
      branch: 'b',
      name: '불멸의 성광',
      summary: '재생 4턴 · 쿨 -1턴 · MP -10',
      mods: { statusTurnsDelta: 1, cooldownDelta: -1, mpCostDelta: -10 },
    },
  },

  // ===================== 히든 금제 학문: 흑마법 (4) =====================
  dark_1: {
    a: {
      branch: 'a',
      name: '영혼 학살',
      summary: '위력 +55% · 치명 +15%',
      mods: { powerPctDelta: 55, bonusCritDelta: 15 },
    },
    b: {
      branch: 'b',
      name: '심연 흡혈',
      summary: '흡혈 +20%(총 62%) · 쿨 -1턴 · MP -6',
      mods: { lifestealPctDelta: 20, cooldownDelta: -1, mpCostDelta: -6 },
    },
  },
  dark_2: {
    a: {
      branch: 'a',
      name: '광기의 혈맹',
      summary: '위력 +65% · 마력폭주 +20%(총 +75%)',
      mods: { powerPctDelta: 65, statusValueDelta: 0.2 },
    },
    b: {
      branch: 'b',
      name: '혈액 순환',
      summary: '흡혈 +25% · 쿨 -1턴 · 폭주 +1턴',
      mods: { lifestealPctDelta: 25, cooldownDelta: -1, statusTurnsDelta: 1 },
    },
  },
  dark_3: {
    a: {
      branch: 'a',
      name: '파멸의 낙인',
      summary: '위력 +75% · 저주 +10%(총 +45%) · 치명 +12%',
      mods: { powerPctDelta: 75, statusValueDelta: 0.1, bonusCritDelta: 12 },
    },
    b: {
      branch: 'b',
      name: '영속의 저주',
      summary: '흡혈 +16% · 저주 5턴 · 쿨 -1턴',
      mods: { lifestealPctDelta: 16, statusTurnsDelta: 1, cooldownDelta: -1 },
    },
  },
  dark_4: {
    a: {
      branch: 'a',
      name: '종말의 파열',
      summary: '2연타 · 타당 계수 355% · 치명 +15%',
      mods: { hitsDelta: 1, powerPctDelta: -265, bonusCritDelta: 15 },
    },
    b: {
      branch: 'b',
      name: '만물 흡수',
      summary: '흡혈 +22%(총 52%) · 쿨 -1턴 · MP -15',
      mods: { lifestealPctDelta: 22, cooldownDelta: -1, mpCostDelta: -15 },
    },
  },
};

export function getSkillRunes(skillId: string): SkillRunePair | null {
  return SKILL_RUNES[skillId] ?? null;
}

export function getRuneAwakenCost(skill: SkillDef): { stones: number; dust: number } {
  return {
    stones: 2500 + skill.requiredRank * 1800,
    dust: 120 + skill.requiredRank * 90,
  };
}

export function applyRuneToSkill(
  def: SkillDef,
  rune?: SkillRuneBranch | null
): { effective: SkillDef; runeDef: SkillRuneDef | null } {
  if (!rune) return { effective: def, runeDef: null };
  const pair = SKILL_RUNES[def.id];
  if (!pair) return { effective: def, runeDef: null };
  const runeDef = pair[rune];
  const m = runeDef.mods;

  const effective: SkillDef = {
    ...def,
    mpCost: Math.max(0, def.mpCost + (m.mpCostDelta ?? 0)),
    cooldown: Math.max(0, def.cooldown + (m.cooldownDelta ?? 0)),
    powerPct: Math.max(0, def.powerPct + (m.powerPctDelta ?? 0)),
  };

  if (m.hitsDelta !== undefined || def.hits !== undefined) {
    effective.hits = Math.max(1, (def.hits ?? 1) + (m.hitsDelta ?? 0));
  }
  if (m.bonusCritDelta !== undefined || def.bonusCrit !== undefined) {
    effective.bonusCrit = Math.max(0, (def.bonusCrit ?? 0) + (m.bonusCritDelta ?? 0));
  }
  if (m.lifestealPctDelta !== undefined || def.lifestealPct !== undefined) {
    effective.lifestealPct = Math.max(0, (def.lifestealPct ?? 0) + (m.lifestealPctDelta ?? 0));
  }
  if (m.burnBonusPctDelta !== undefined || def.burnBonusPct !== undefined) {
    effective.burnBonusPct = Math.max(0, (def.burnBonusPct ?? 0) + (m.burnBonusPctDelta ?? 0));
  }

  if (def.applyStatus) {
    const nextApply = {
      ...def.applyStatus,
      turns: Math.max(1, def.applyStatus.turns + (m.statusTurnsDelta ?? 0)),
      value: Math.max(0, def.applyStatus.value + (m.statusValueDelta ?? 0)),
    };
    if (def.applyStatus.chance !== undefined || m.statusChanceDelta !== undefined) {
      nextApply.chance = Math.min(1, Math.max(0, (def.applyStatus.chance ?? 1) + (m.statusChanceDelta ?? 0)));
    }
    effective.applyStatus = nextApply;
  }

  if (def.secondaryStatus) {
    effective.secondaryStatus = { ...def.secondaryStatus };
  } else if (m.extraStatus) {
    effective.secondaryStatus = { ...m.extraStatus };
  }

  return { effective, runeDef };
}
