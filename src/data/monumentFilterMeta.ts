/**
 * Tags and popularity for monument list filters (source of truth for DB sync).
 */

export const MONUMENT_TAG_IDS = [
  'top',
  'museums',
  'memorials',
  'nature',
  'architecture',
  'parks',
  'history',
] as const;

export type MonumentTagId = (typeof MONUMENT_TAG_IDS)[number];

export type MonumentFilterEntry = {
  tags: MonumentTagId[];
  popularity: number;
};

/** Seeded monument ids — keep in sync with seed.ts */
export const monumentFilterMeta: Record<string, MonumentFilterEntry> = {
  '1': { tags: ['top', 'memorials', 'architecture', 'history'], popularity: 100 },
  '2': { tags: ['memorials', 'nature', 'history'], popularity: 72 },
  '3': { tags: ['memorials', 'history', 'museums'], popularity: 68 },
  '4': { tags: ['history', 'museums'], popularity: 45 },
  '5': { tags: ['architecture', 'nature', 'top'], popularity: 78 },
  '6': { tags: ['museums', 'parks', 'top'], popularity: 85 },
};
