import type { AbyssNode } from '../types/game';

export function generateAbyssNode(depth: number): AbyssNode {
  const roll = Math.random();
  if (roll < 0.22) {
    return {
      step: depth + 1,
      kind: 'altar',
      title: '피 묻은 고대 제단',
      description:
        '어두운 돌방 중앙에 검은 촛불이 꺼지지 않는 제단이 놓여 있습니다. 금단의 기운이 손끝을 간지럽힙니다.',
      choices: [
        {
          label: '마력을 바쳐 금서를 찾는다',
          hint: '높은 확률로 금서 조각과 대량 마석 획득 (실패 시 소량 손실)',
          outcomeType: 'tome',
        },
        {
          label: '조용히 제단의 공물만 챙긴다',
          hint: '안전하게 마석과 마력 가루 획득',
          outcomeType: 'treasure',
        },
        {
          label: '위험을 피해 지나친다',
          hint: '아무 일도 없이 다음 구역으로 이동',
          outcomeType: 'leave',
        },
      ],
    };
  }
  if (roll < 0.44) {
    return {
      step: depth + 1,
      kind: 'chest',
      title: '봉인된 은빛 마도구함',
      description:
        '오래전 실종된 선배 마법사의 유품으로 보이는 함이 자물쇠에 잠겨 있습니다.',
      choices: [
        {
          label: '봉인을 억지로 뜯어낸다',
          hint: '희귀 이상 마도구 획득 가능',
          outcomeType: 'gamble',
        },
        {
          label: '주변에 떨어진 마석만 줍는다',
          hint: '안정적인 마석 획득',
          outcomeType: 'treasure',
        },
      ],
    };
  }
  if (roll < 0.64) {
    return {
      step: depth + 1,
      kind: 'mystery',
      title: '안개 속 버려진 둥지',
      description:
        '차가운 미궁 구석에서 희미한 온기를 품은 알 조각과 수상한 그림자가 발견되었습니다.',
      choices: [
        {
          label: '온기를 따라 알 조각을 수거한다',
          hint: '사역마 알 조각 획득',
          outcomeType: 'egg',
        },
        {
          label: '마력 잔해를 흡수해 수련에 보탠다',
          hint: '경험치와 마력 가루 획득',
          outcomeType: 'heal',
        },
      ],
    };
  }
  if (roll < 0.82) {
    return {
      step: depth + 1,
      kind: 'merchant',
      title: '얼굴 없는 망토 상인',
      description:
        '"학생… 아스트라의 교복을 입고 있군. 마석 조금이면 금서 조각이나 진귀한 물건과 바꿔주지."',
      choices: [
        {
          label: '수상한 상자와 거래한다 (소량 마석)',
          hint: '금서 조각 또는 사역마 알 조각 획득',
          outcomeType: 'tome',
        },
        {
          label: '마도구 주머니를 열어본다',
          hint: '랜덤 마도구 1종 획득',
          outcomeType: 'gamble',
        },
        {
          label: '정중히 거절한다',
          hint: '안전하게 이동',
          outcomeType: 'leave',
        },
      ],
    };
  }
  return {
    step: depth + 1,
    kind: 'elite',
    title: '미궁의 등불 사냥꾼 출현',
    description:
      '안개 너머에서 붉은 안광이 번뜩입니다! 쓰러뜨리면 풍성한 금서 조각과 희귀 전리품을 얻을 수 있습니다.',
    choices: [
      {
        label: '맞서 싸워 토벌한다',
        hint: '정예 전투 돌입 (승리 시 금서 조각 + 희귀 마도구 + 대량 마석)',
        outcomeType: 'fight',
      },
      {
        label: '연막을 피우고 우회한다',
        hint: '전투 없이 소량 경험치 획득',
        outcomeType: 'leave',
      },
    ],
  };
}
