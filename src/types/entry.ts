export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type Level = (typeof LEVELS)[number]

export const LEVEL_NAMES: Record<Level, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper intermediate',
  C1: 'Advanced',
  C2: 'Mastery',
}

export interface Sense {
  definition: string
  /** Grammar, register or subject note that led the definition, e.g. "physics, uncountable" */
  label?: string
  /** Machine-readable tags from the source, e.g. "transitive", "obsolete" */
  tags: string[]
  examples: string[]
  synonyms: string[]
}

export interface WordForm {
  word: string
  tags: string[]
}

/** One part of speech of a headword: "light (noun)", "light (verb)". */
export interface PosEntry {
  pos: string
  /** null when the word is not on the CEFR lists */
  level: Level | null
  forms: WordForm[]
  senses: Sense[]
  synonyms: string[]
}

export interface Pronunciation {
  uk?: string
  us?: string
}

/** The normalised shape every view renders from, whatever the upstream API. */
export interface WordEntry {
  word: string
  pronunciation: Pronunciation
  entries: PosEntry[]
  source: { url: string; license: string }
}
