import type { Gender, SchoolId } from '../types/game';

export interface HeroArtMeta {
  url: string;
  cardPosition: string;
  avatarPosition: string;
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

export function getHeroArt(school: SchoolId, gender: Gender): HeroArtMeta {
  return HERO_ART[`${school}_${gender}`];
}
