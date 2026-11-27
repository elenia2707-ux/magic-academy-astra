import type { FamiliarId, Gender, ProfessorId, SchoolId } from '../types/game';

export interface HeroArtMeta {
  url: string;
  cardPosition: string;
  avatarPosition: string;
  bgTint: string;
}

export interface FamiliarArtMeta {
  url: string;
  position: string;
  badgePosition: string;
  bgTint: string;
}

export const HERO_ART: Record<`${SchoolId}_${Gender}`, HeroArtMeta> = {
  flame_female: {
    url: './art/heroes/flame_female.webp',
    cardPosition: '50% 22%',
    avatarPosition: '52% 28%',
    bgTint: '#1f181c',
  },
  flame_male: {
    url: './art/heroes/flame_male.webp',
    cardPosition: '50% 20%',
    avatarPosition: '50% 25%',
    bgTint: '#1c181d',
  },
  frost_female: {
    url: './art/heroes/frost_female.webp',
    cardPosition: '48% 18%',
    avatarPosition: '47% 22%',
    bgTint: '#181e26',
  },
  frost_male: {
    url: './art/heroes/frost_male.webp',
    cardPosition: '52% 18%',
    avatarPosition: '54% 21%',
    bgTint: '#181e26',
  },
  thunder_female: {
    url: './art/heroes/thunder_female.webp',
    cardPosition: '46% 24%',
    avatarPosition: '45% 29%',
    bgTint: '#1a1d24',
  },
  thunder_male: {
    url: './art/heroes/thunder_male.webp',
    cardPosition: '50% 16%',
    avatarPosition: '50% 18%',
    bgTint: '#1a1d24',
  },
  earth_female: {
    url: './art/heroes/earth_female.webp',
    cardPosition: '48% 24%',
    avatarPosition: '48% 30%',
    bgTint: '#18201b',
  },
  earth_male: {
    url: './art/heroes/earth_male.webp',
    cardPosition: '50% 20%',
    avatarPosition: '50% 24%',
    bgTint: '#18201b',
  },
};

export const AWAKENED_HERO_ART: Record<`${SchoolId}_${Gender}`, HeroArtMeta> = {
  flame_female: {
    url: './art/heroes/aw_flame_female.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#1f161a',
  },
  thunder_female: {
    url: './art/heroes/aw_thunder_female.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#171b24',
  },
  frost_female: {
    url: './art/heroes/aw_frost_female.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#161e27',
  },
  earth_female: {
    url: './art/heroes/aw_earth_female.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#17201a',
  },
  flame_male: {
    url: './art/heroes/aw_flame_male.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 21%',
    bgTint: '#1f1619',
  },
  thunder_male: {
    url: './art/heroes/aw_thunder_male.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#171c26',
  },
  frost_male: {
    url: './art/heroes/aw_frost_male.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#161f29',
  },
  earth_male: {
    url: './art/heroes/aw_earth_male.webp',
    cardPosition: '50% 18%',
    avatarPosition: '50% 22%',
    bgTint: '#17211a',
  },
};

export const FAMILIAR_ART: Record<FamiliarId, FamiliarArtMeta> = {
  raven: {
    url: './art/familiars/raven.webp',
    position: '58% 35%',
    badgePosition: '64% 22%',
    bgTint: '#1b1a22',
  },
  golem: {
    url: './art/familiars/golem.webp',
    position: '50% 28%',
    badgePosition: '48% 18%',
    bgTint: '#1c1b20',
  },
  wisp: {
    url: './art/familiars/wisp.webp',
    position: '50% 45%',
    badgePosition: '48% 48%',
    bgTint: '#131d28',
  },
  wolf: {
    url: './art/familiars/wolf.webp',
    position: '42% 38%',
    badgePosition: '30% 34%',
    bgTint: '#161922',
  },
  owl: {
    url: './art/familiars/owl.webp',
    position: '46% 34%',
    badgePosition: '44% 26%',
    bgTint: '#182028',
  },
  bat: {
    url: './art/familiars/bat.webp',
    position: '50% 40%',
    badgePosition: '48% 36%',
    bgTint: '#1f161b',
  },
};

export interface MonsterArtMeta {
  url: string;
  position: string;
  bgTint: string;
}

export const MONSTER_ART: Record<string, MonsterArtMeta> = {
  // 1~6막 챕터 보스
  boss_golem: {
    url: './art/bosses/boss_golem.webp',
    position: '50% 30%',
    bgTint: '#1c1518',
  },
  boss_wraith: {
    url: './art/bosses/boss_wraith.webp',
    position: '50% 28%',
    bgTint: '#17161e',
  },
  boss_witch: {
    url: './art/bosses/boss_witch.webp',
    position: '52% 28%',
    bgTint: '#1f1419',
  },
  boss_knight: {
    url: './art/bosses/boss_knight.webp',
    position: '50% 24%',
    bgTint: '#1a1518',
  },
  boss_demon: {
    url: './art/bosses/boss_demon.webp',
    position: '50% 34%',
    bgTint: '#17151c',
  },
  demon_lord: {
    url: './art/bosses/demon_lord.webp',
    position: '50% 26%',
    bgTint: '#14121b',
  },
  // 1막 수정 광산 일반 몬스터
  m1_1_slime: {
    url: './art/monsters/m1_1_slime.webp',
    position: '50% 50%',
    bgTint: '#1b1d20',
  },
  m1_2_bats: {
    url: './art/monsters/m1_2_bats.webp',
    position: '50% 45%',
    bgTint: '#1a1920',
  },
  m1_3_kobold: {
    url: './art/monsters/m1_3_kobold.webp',
    position: '50% 40%',
    bgTint: '#1e1918',
  },
  m1_4_guardian: {
    url: './art/monsters/m1_4_guardian.webp',
    position: '50% 36%',
    bgTint: '#1d181a',
  },
  // 2막 지하 대서고 일반 몬스터
  m2_1_parchment: {
    url: './art/monsters/m2_1_parchment.webp',
    position: '50% 34%',
    bgTint: '#1b191d',
  },
  m2_2_candelabra: {
    url: './art/monsters/m2_2_candelabra.webp',
    position: '50% 42%',
    bgTint: '#171b22',
  },
  m2_3_apprentice: {
    url: './art/monsters/m2_3_apprentice.webp',
    position: '50% 36%',
    bgTint: '#181922',
  },
  m2_4_warden: {
    url: './art/monsters/m2_4_warden.webp',
    position: '50% 32%',
    bgTint: '#171a22',
  },
  // 3막 붉은 달의 숲 일반 몬스터
  m3_1_thorn: {
    url: './art/monsters/m3_1_thorn.webp',
    position: '50% 38%',
    bgTint: '#191e1a',
  },
  m3_2_flame: {
    url: './art/monsters/m3_2_flame.webp',
    position: '50% 44%',
    bgTint: '#201817',
  },
  m3_3_wolf: {
    url: './art/monsters/m3_3_wolf.webp',
    position: '52% 40%',
    bgTint: '#1a1b20',
  },
  m3_4_gargoyle: {
    url: './art/monsters/m3_4_gargoyle.webp',
    position: '50% 42%',
    bgTint: '#1c181d',
  },
  // 4막 폐허 왕도
  m4_1_infantry: {
    url: './art/monsters/m4_1_infantry.webp',
    position: '50% 32%',
    bgTint: '#1b191a',
  },
  m4_2_alchemist: {
    url: './art/monsters/m4_2_alchemist.webp',
    position: '50% 34%',
    bgTint: '#191d19',
  },
  m4_3_knight: {
    url: './art/monsters/m4_3_knight.webp',
    position: '50% 30%',
    bgTint: '#1c181a',
  },
  m4_4_lich: {
    url: './art/monsters/m4_4_lich.webp',
    position: '50% 26%',
    bgTint: '#1a1621',
  },
  // 5막 심연의 균열
  m5_1_hound: {
    url: './art/monsters/m5_1_hound.webp',
    position: '50% 42%',
    bgTint: '#171922',
  },
  m5_2_eye: {
    url: './art/monsters/m5_2_eye.webp',
    position: '50% 48%',
    bgTint: '#181622',
  },
  m5_3_giant: {
    url: './art/monsters/m5_3_giant.webp',
    position: '50% 28%',
    bgTint: '#1f1817',
  },
  m5_4_apostle: {
    url: './art/monsters/m5_4_apostle.webp',
    position: '50% 28%',
    bgTint: '#171622',
  },
  // 6막 별이 잠든 왕좌
  m6_1_obsidian_knight: {
    url: './art/monsters/m6_1_obsidian_knight.webp',
    position: '50% 28%',
    bgTint: '#161820',
  },
  m6_2_wyrm: {
    url: './art/monsters/m6_2_wyrm.webp',
    position: '50% 40%',
    bgTint: '#151824',
  },
  m6_3_priest: {
    url: './art/monsters/m6_3_priest.webp',
    position: '50% 26%',
    bgTint: '#1c171b',
  },
  m6_4_orthrus: {
    url: './art/monsters/m6_4_orthrus.webp',
    position: '50% 38%',
    bgTint: '#19171e',
  },
  // 6계급 승급 시험관 보스 5종
  exam_1: {
    url: './art/bosses/exam_1_kalion.webp',
    position: '50% 28%',
    bgTint: '#1c1b1f',
  },
  exam_2: {
    url: './art/bosses/exam_2_malaki.webp',
    position: '50% 24%',
    bgTint: '#181722',
  },
  exam_3: {
    url: './art/bosses/exam_3_isolde.webp',
    position: '50% 24%',
    bgTint: '#161d26',
  },
  exam_4: {
    url: './art/bosses/exam_4_vesper.webp',
    position: '50% 24%',
    bgTint: '#1b161b',
  },
  exam_5: {
    url: './art/bosses/exam_5_astien.webp',
    position: '50% 24%',
    bgTint: '#151925',
  },
};

export interface NpcArtMeta {
  url: string;
  position: string;
  avatarPosition: string;
  bgTint: string;
}

export const NPC_ART: Record<ProfessorId, NpcArtMeta> = {
  bernard: {
    url: './art/npcs/bernard.webp',
    position: '50% 18%',
    avatarPosition: '52% 20%',
    bgTint: '#171a22',
  },
  lucia: {
    url: './art/npcs/lucia.webp',
    position: '50% 16%',
    avatarPosition: '48% 18%',
    bgTint: '#1b1721',
  },
  karen: {
    url: './art/npcs/karen.webp',
    position: '50% 18%',
    avatarPosition: '52% 20%',
    bgTint: '#211718',
  },
  sebastian: {
    url: './art/npcs/sebastian.webp',
    position: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#171e26',
  },
  volta: {
    url: './art/npcs/volta.webp',
    position: '50% 18%',
    avatarPosition: '50% 21%',
    bgTint: '#171a24',
  },
  morden: {
    url: './art/npcs/morden.webp',
    position: '50% 18%',
    avatarPosition: '50% 20%',
    bgTint: '#19201a',
  },
  irene: {
    url: './art/npcs/irene.webp',
    position: '50% 16%',
    avatarPosition: '50% 18%',
    bgTint: '#17211d',
  },
  seraphina: {
    url: './art/npcs/seraphina.webp',
    position: '50% 16%',
    avatarPosition: '50% 18%',
    bgTint: '#1a1b20',
  },
  martha: {
    url: './art/npcs/martha.webp',
    position: '50% 16%',
    avatarPosition: '49% 19%',
    bgTint: '#1b161f',
  },
};

export function hasAwakenedHeroArt(school: SchoolId, gender: Gender): boolean {
  return Boolean(AWAKENED_HERO_ART[`${school}_${gender}`]);
}

export function getHeroArt(school: SchoolId, gender: Gender, awakened = false): HeroArtMeta {
  const key = `${school}_${gender}` as const;
  if (awakened && AWAKENED_HERO_ART[key]) {
    return AWAKENED_HERO_ART[key]!;
  }
  return HERO_ART[key];
}

export function getFamiliarArt(id: FamiliarId): FamiliarArtMeta {
  return FAMILIAR_ART[id];
}

export function getMonsterArt(artKey: string): MonsterArtMeta | undefined {
  return MONSTER_ART[artKey];
}

export function getNpcArt(id: ProfessorId): NpcArtMeta {
  return NPC_ART[id];
}
