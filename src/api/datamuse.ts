// Datamuse - word-finding queries. No key, CORS enabled, 100,000 requests/day.
import { getJson } from './http'

const BASE = 'https://api.datamuse.com'

export interface DatamuseWord {
  word: string
  score: number
  /** Part-of-speech codes ("n", "v", "adj", "adv") when requested with md=p */
  tags?: string[]
  /** "pos\tdefinition" strings when requested with md=d */
  defs?: string[]
}

const POS_NAMES: Record<string, string> = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' }

/** Datamuse part-of-speech codes as dictionary names, dropping its other tags. */
export function posNames(tags: string[] = []): string[] {
  return tags.flatMap((t) => POS_NAMES[t] ?? [])
}

/** Autocomplete for the search box. */
export function suggest(prefix: string, signal?: AbortSignal) {
  return getJson<DatamuseWord[]>(`${BASE}/sug?s=${encodeURIComponent(prefix)}&max=8`, signal)
}

export interface SimilarWord {
  word: string
  pos: string[]
  definition?: string
}

/** Close spellings of a word that has no entry, each with a short definition. */
export async function similarWords(query: string, max = 4, signal?: AbortSignal): Promise<SimilarWord[]> {
  // One extra, since Datamuse can return the misspelling itself
  const words = await getJson<DatamuseWord[]>(
    `${BASE}/words?sp=${encodeURIComponent(query)}&md=dp&max=${max + 1}`,
    signal,
  )
  return words
    // Proper nouns ("Serendip") rarely have a lower-case entry to open
    .filter((w) => w.word !== query && !w.tags?.includes('prop'))
    .slice(0, max)
    .map((w) => ({
      word: w.word,
      pos: posNames(w.tags),
      definition: w.defs?.[0]?.split('\t')[1]?.trim(),
    }))
}

export interface WordSummary {
  definition?: string
}

// Datamuse can also return IPA, but it is machine-converted from ARPABET
// ("/kwɑɫʌfʌkˈeɪʃʌn/") and disagrees with the entry page, so it is not used.
/**
 * A one-line definition for word cards and the index. When the parts of speech
 * are known, the definition must be for one of them: "a" (determiner) should
 * not be explained as "Adult; as used in film rating".
 */
export async function wordSummary(word: string, pos: string[] = [], signal?: AbortSignal): Promise<WordSummary> {
  const [hit] = await getJson<DatamuseWord[]>(
    `${BASE}/words?sp=${encodeURIComponent(word)}&md=d&max=1`,
    signal,
  )
  if (hit?.word !== word) return {}
  const defs = (hit.defs ?? []).map((d) => d.split('\t'))
  const match = pos.length ? defs.find(([code]) => pos.includes(POS_NAMES[code])) : defs[0]
  // Drop the leading "(transitive)" style note, as the entry page does
  return { definition: match?.[1]?.trim().replace(/^\([^()]+\)\s*/, '') }
}

// Which Datamuse relation gives useful partners for each part of speech, and
// which side of the headword the partner goes on.
const COLLOCATION: Record<string, { rel: string; phrase: (word: string, partner: string) => string }> = {
  noun: { rel: 'jjb', phrase: (w, p) => `${p} ${w}` }, // adjectives used with the noun
  adjective: { rel: 'jja', phrase: (w, p) => `${w} ${p}` }, // nouns the adjective describes
  verb: { rel: 'bga', phrase: (w, p) => `${w} ${p}` }, // words that often follow the verb
}
const WEAK_PARTNERS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'is', 'was', 'it', 'that', 'his', 'her', 'their',
  'more', 'most', 'such', 'other', 'same', 'own', 'many', 'much', 'which', 'who', 'what', 'as',
  'this', 'these', 'those', 'he', 'she', 'they', 'we', 'you', 'i', 'be', 'are', 'were', 'been',
  'not', 'but', 'if', 'when', 'than', 'then', 'so',
])

/** Common word partners as short phrases, e.g. "pure serendipity". Empty for other parts of speech. */
export async function collocations(word: string, pos: string, signal?: AbortSignal): Promise<string[]> {
  const relation = COLLOCATION[pos]
  if (!relation) return []
  const partners = await getJson<DatamuseWord[]>(
    `${BASE}/words?rel_${relation.rel}=${encodeURIComponent(word)}&max=20`,
    signal,
  )
  return partners
    .map((p) => p.word)
    .filter((p) => /^[a-z]+$/.test(p) && !WEAK_PARTNERS.has(p))
    .slice(0, 8)
    .map((p) => relation.phrase(word, p))
}
