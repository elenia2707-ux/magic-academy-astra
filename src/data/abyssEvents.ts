import type { AbyssNode, AbyssTileKind } from '../types/game';

export interface AbyssBoardTile {
  index: number;
  row: number; // 1..5 (CSS Grid)
  col: number; // 1..5 (CSS Grid)
  kind: AbyssTileKind;
  shortLabel: string;
  title: string;
  glyph: string;
}

export const ABYSS_BOARD_SIZE = 16;

/**
 * P1-5: 5×5 외곽 16칸 시계 방향 순환 심연 보드.
 * 0번(출발 성소)을 통과/도착할 때마다 완주 보너스 지급.
 */
export const ABYSS_BOARD_TILES: AbyssBoardTile[] = [
  { index: 0, row: 1, col: 1, kind: 'start', shortLabel: '성소', title: '심연 입구 성소', glyph: '✦' },
  { index: 1, row: 1, col: 2, kind: 'shrine', shortLabel: '별빛', title: '꺼져가는 별빛 제단', glyph: '✧' },
  { index: 2, row: 1, col: 3, kind: 'chest', shortLabel: '보물', title: '봉인된 마도구함', glyph: '❖' },
  { index: 3, row: 1, col: 4, kind: 'trap', shortLabel: '함정', title: '검은 안개 균열', glyph: '▲' },
  { index: 4, row: 1, col: 5, kind: 'altar', shortLabel: '제단', title: '피 묻은 고대 제단', glyph: '☽' },
  { index: 5, row: 2, col: 5, kind: 'mystery', shortLabel: '둥지', title: '안개 속 버려진 둥지', glyph: '◎' },
  { index: 6, row: 3, col: 5, kind: 'merchant', shortLabel: '상인', title: '얼굴 없는 망토 상인', glyph: '⚖' },
  { index: 7, row: 4, col: 5, kind: 'chest', shortLabel: '보물', title: '잊힌 유물 보관함', glyph: '❖' },
  { index: 8, row: 5, col: 5, kind: 'elite', shortLabel: '정예', title: '등불 사냥꾼의 매복', glyph: '⚔' },
  { index: 9, row: 5, col: 4, kind: 'shrine', shortLabel: '별빛', title: '고요한 마력 샘', glyph: '✧' },
  { index: 10, row: 5, col: 3, kind: 'elite', shortLabel: '정예', title: '심연 파수꾼의 회랑', glyph: '⚔' },
  { index: 11, row: 5, col: 2, kind: 'altar', shortLabel: '제단', title: '금서 서약의 제단', glyph: '☽' },
  { index: 12, row: 5, col: 1, kind: 'mystery', shortLabel: '둥지', title: '온기가 남은 사역마 둥지', glyph: '◎' },
  { index: 13, row: 4, col: 1, kind: 'chest', shortLabel: '보물', title: '선배의 비밀 보관함', glyph: '❖' },
  { index: 14, row: 3, col: 1, kind: 'merchant', shortLabel: '상인', title: '심야 암시장 행상', glyph: '⚖' },
  { index: 15, row: 2, col: 1, kind: 'trap', shortLabel: '함정', title: '무너진 석판 통로', glyph: '▲' },
];

export function generateAbyssNodeForTile(tile: AbyssBoardTile, depth: number): AbyssNode | null {
  if (tile.kind === 'start') return null;

  if (tile.kind === 'altar') {
    return {
      step: depth,
      kind: 'altar',
      title: tile.title,
      description:
        '어두운 돌방 중앙에 검은 촛불이 꺼지지 않는 제단이 놓여 있습니다. 금단의 기운이 손끝을 간지럽힙니다.',
      choices: [
        {
          label: '마력을 바쳐 금서를 찾는다',
          hint: '높은 확률로 금서 조각 +2와 마석 획득',
          outcomeType: 'tome',
        },
        {
          label: '조용히 제단의 공물만 챙긴다',
          hint: '안전하게 마석과 마력 가루 획득',
          outcomeType: 'treasure',
        },
        {
          label: '위험을 피해 지나친다',
          hint: '소량 경험치 획득 후 이동',
          outcomeType: 'leave',
        },
      ],
    };
  }

  if (tile.kind === 'chest') {
    return {
      step: depth,
      kind: 'chest',
      title: tile.title,
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
          hint: '안정적인 마석과 마력 가루 획득',
          outcomeType: 'treasure',
        },
      ],
    };
  }

  if (tile.kind === 'shrine') {
    return {
      step: depth,
      kind: 'shrine',
      title: tile.title,
      description:
        '부서진 별빛 석판 사이로 희미한 마력 안개가 피어오릅니다. 등불 불꽃이 미세하게 살아납니다.',
      choices: [
        {
          label: '별빛 잔재를 흡수한다',
          hint: '경험치 + 마력 가루 (25% 확률로 등불 +1 페이백!)',
          outcomeType: 'heal',
        },
        {
          label: '석판 아래의 마석을 수거한다',
          hint: '안정적인 마석 획득',
          outcomeType: 'treasure',
        },
      ],
    };
  }

  if (tile.kind === 'mystery') {
    return {
      step: depth,
      kind: 'mystery',
      title: tile.title,
      description:
        '차가운 미궁 구석에서 희미한 온기를 품은 알 조각과 수상한 그림자가 발견되었습니다.',
      choices: [
        {
          label: '온기를 따라 알 조각을 수거한다',
          hint: '사역마 알 조각 +2 획득',
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

  if (tile.kind === 'merchant') {
    return {
      step: depth,
      kind: 'merchant',
      title: tile.title,
      description:
        '“학생… 아스트라의 교복을 입고 있군. 마석 조금이면 금서 조각이나 진귀한 물건과 바꿔주지.”',
      choices: [
        {
          label: '수상한 상자와 거래한다',
          hint: '금서 조각 +2 또는 알 조각 획득',
          outcomeType: 'tome',
        },
        {
          label: '마도구 주머니를 열어본다',
          hint: '랜덤 마도구 1종 획득',
          outcomeType: 'gamble',
        },
        {
          label: '정중히 거절한다',
          hint: '안전하게 경험치 소량 획득',
          outcomeType: 'leave',
        },
      ],
    };
  }

  if (tile.kind === 'trap') {
    return {
      step: depth,
      kind: 'trap',
      title: tile.title,
      description:
        '발밑 석판이 삐걱거리며 검은 안개가 솟구칩니다. 교칙대로라면 여기서 돌아서야 하지만…',
      choices: [
        {
          label: '뒤로 1칸 물러나며 잔해를 줍는다',
          hint: '보드 1칸 후퇴 · 대신 마력 가루 넉넉히 획득',
          outcomeType: 'trapBack',
        },
        {
          label: '몸을 굴려 정면으로 통과한다',
          hint: '위치 유지 · 소량 경험치 획득',
          outcomeType: 'leave',
        },
      ],
    };
  }

  return {
    step: depth,
    kind: 'elite',
    title: tile.title,
    description:
      '안개 너머에서 붉은 안광이 번뜩입니다! 쓰러뜨리면 풍성한 금서 조각과 희귀 전리품을 얻을 수 있습니다.',
    choices: [
      {
        label: '맞서 싸워 토벌한다',
        hint: '정예 전투 돌입 (승리 시 금서 조각 +2 · 알 조각 +2 · 희귀 마도구)',
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

export function generateAbyssNode(depth: number): AbyssNode {
  const tile = ABYSS_BOARD_TILES[(depth % (ABYSS_BOARD_SIZE - 1)) + 1];
  return generateAbyssNodeForTile(tile, depth + 1)!;
}
