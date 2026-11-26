import type { FamiliarId, Gender, SchoolId } from '../types/game';

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
};

export function getHeroArt(school: SchoolId, gender: Gender): HeroArtMeta {
  return HERO_ART[`${school}_${gender}`];
}

export function getFamiliarArt(id: FamiliarId): FamiliarArtMeta {
  return FAMILIAR_ART[id];
}

export function getMonsterArt(artKey: string): MonsterArtMeta | undefined {
  return MONSTER_ART[artKey];
}
