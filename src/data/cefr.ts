import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { LEVELS, type Level } from '../types/entry'

/** word -> { part of speech: level } */
export type CefrIndex = Record<string, Record<string, Level>>

let index: Promise<CefrIndex> | undefined

/** The word list is ~10,000 headwords, so it loads as its own chunk on first use. */
export function loadCefr(): Promise<CefrIndex> {
  index ??= import('./cefr.json').then(
    (m) => m.default as CefrIndex,
    (err) => {
      // Do not remember a failed download, so a retry can succeed
      index = undefined
      throw err
    },
  )
  return index
}

export async function levelFor(word: string, pos: string): Promise<Level | null> {
  const levels = (await loadCefr())[word.toLowerCase()]
  return levels?.[pos] ?? null
}

export function useCefrQuery() {
  return useQuery({ queryKey: ['cefr'], queryFn: loadCefr })
}

/** The index for components; undefined until the chunk has loaded. */
export function useCefr(): CefrIndex | undefined {
  return useCefrQuery().data
}

const sorted = new WeakMap<CefrIndex, string[]>()

/**
 * Every headword on the lists, in alphabetical order. The three contractions
 * ("'m", "'re", "'s") have a level but are not words to browse or study.
 */
export function headwords(index: CefrIndex): string[] {
  let words = sorted.get(index)
  if (!words) {
    words = Object.keys(index)
      .filter((w) => /^[a-z]/.test(w))
      .sort()
    sorted.set(index, words)
  }
  return words
}

/**
 * The alphabetical neighbourhood of a word. Works for words that are not on
 * the lists too: they are placed where they would sort.
 */
export function neighbours(index: CefrIndex, word: string, span = 3) {
  const words = headwords(index)
  const target = word.toLowerCase()
  let lo = 0
  let hi = words.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (words[mid] < target) lo = mid + 1
    else hi = mid
  }
  const after = words[lo] === target ? lo + 1 : lo
  return {
    previous: words[lo - 1] as string | undefined,
    next: words[after] as string | undefined,
    before: words.slice(Math.max(0, lo - span), lo),
    after: words.slice(after, after + span),
  }
}

/** How many headwords begin with each letter. */
export function useLetterCounts(cefr: CefrIndex | undefined) {
  return useMemo(() => {
    const counts: Record<string, number> = {}
    if (cefr) for (const w of headwords(cefr)) counts[w[0]] = (counts[w[0]] ?? 0) + 1
    return counts
  }, [cefr])
}

const byLevel = new WeakMap<CefrIndex, Map<string, string[]>>()

/** Headwords listed at a level under any part of speech, or every headword for "all". */
export function wordsAt(index: CefrIndex, level: Level | 'all'): string[] {
  if (level === 'all') return headwords(index)
  let cache = byLevel.get(index)
  if (!cache) byLevel.set(index, (cache = new Map()))
  let words = cache.get(level)
  if (!words) {
    words = headwords(index).filter((w) => Object.values(index[w]).includes(level))
    cache.set(level, words)
  }
  return words
}

export const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

/** Headwords beginning with a letter, alphabetical. */
export function wordsStarting(index: CefrIndex, letter: string): string[] {
  return headwords(index).filter((w) => w[0] === letter)
}

/** Parts of speech a word is listed under and the lowest level among them. */
export function cefrSummary(index: CefrIndex | undefined, word: string): { pos: string[]; level: Level | null } {
  const levels = index?.[word.toLowerCase()]
  if (!levels) return { pos: [], level: null }
  const lowest = LEVELS.find((l) => Object.values(levels).includes(l)) ?? null
  return { pos: Object.keys(levels), level: lowest }
}
