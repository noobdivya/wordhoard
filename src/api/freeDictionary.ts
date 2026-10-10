// freedictionaryapi.com - Wiktionary data as JSON (CC BY-SA 4.0). No key, CORS enabled.
import { levelFor } from '../data/cefr'
import type { PosEntry, Pronunciation, Sense, WordEntry, WordForm } from '../types/entry'
import { getJson, HttpError } from './http'

const BASE = 'https://freedictionaryapi.com/api/v1/entries/en/'

interface RawSense {
  definition: string
  tags: string[]
  examples: string[]
  synonyms: string[]
}
interface RawPronunciation {
  type: string
  text: string
  tags: string[]
}
interface RawEntry {
  partOfSpeech: string
  pronunciations: RawPronunciation[]
  forms: WordForm[]
  senses: RawSense[]
  synonyms: string[]
}
interface RawResponse {
  word: string
  entries: RawEntry[]
  source: { url: string; license: { name: string } }
}

const UK_TAGS = ['Received Pronunciation', 'UK', 'British']
const US_TAGS = ['General American', 'US']
const DROPPED_FORMS = ['alternative', 'obsolete', 'archaic']
/** Senses a learner is unlikely to need first; they move to the end of the list. */
const DEMOTED_SENSES = ['obsolete', 'archaic', 'historical', 'dated', 'rare', 'dialectal']

const unique = <T,>(items: T[], key: (item: T) => string = String) => [
  ...new Map(items.map((i) => [key(i), i])).values(),
]

function pronunciation(entries: RawEntry[]): Pronunciation {
  const ipa = entries.flatMap((e) => e.pronunciations).filter((p) => p.type === 'ipa')
  const phonemic = (p: RawPronunciation) => p.text.startsWith('/')
  const tagged = (p: RawPronunciation, tags: string[]) => p.tags.some((t) => tags.includes(t))
  // Prefer a broad /.../ transcription for the region, then an untagged one,
  // and only then a narrow [...] one
  const pick = (tags: string[]) =>
    (
      ipa.find((p) => phonemic(p) && tagged(p, tags)) ??
      ipa.find((p) => phonemic(p) && p.tags.length === 0) ??
      ipa.find((p) => tagged(p, tags)) ??
      ipa[0]
    )?.text
  return { uk: pick(UK_TAGS), us: pick(US_TAGS) }
}

function sense(raw: RawSense): Sense {
  // "(physics, uncountable) Electromagnetic radiation..." -> label + definition
  const lead = raw.definition.match(/^\(([^()]+)\)\s*(\S[\s\S]*)$/)
  return {
    definition: lead ? lead[2] : raw.definition,
    label: lead?.[1],
    tags: raw.tags,
    examples: raw.examples,
    synonyms: unique(raw.synonyms),
  }
}

const demoted = (s: Sense) => s.tags.some((t) => DEMOTED_SENSES.includes(t))

/** Returns null when the word has no English entry. */
export async function fetchEntry(word: string, signal?: AbortSignal): Promise<WordEntry | null> {
  let raw: RawResponse
  try {
    raw = await getJson<RawResponse>(BASE + encodeURIComponent(word), signal)
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null
    throw err
  }
  if (!raw.entries?.length) return null

  // Wiktionary splits a word by etymology, so one part of speech can appear
  // several times. A learner's dictionary shows each part of speech once.
  const byPos = new Map<string, RawEntry[]>()
  for (const e of raw.entries) byPos.set(e.partOfSpeech, [...(byPos.get(e.partOfSpeech) ?? []), e])

  const entries: PosEntry[] = await Promise.all(
    [...byPos].map(async ([pos, group]) => {
      const senses = group.flatMap((e) => e.senses).map(sense)
      return {
        pos,
        level: await levelFor(raw.word, pos),
        forms: unique(
          group.flatMap((e) => e.forms).filter((f) => !f.tags.some((t) => DROPPED_FORMS.includes(t))),
          (f) => `${f.word}|${f.tags.join()}`,
        ),
        senses: [...senses.filter((s) => !demoted(s)), ...senses.filter(demoted)],
        synonyms: unique(group.flatMap((e) => e.synonyms)),
      }
    }),
  )

  return {
    word: raw.word,
    pronunciation: pronunciation(raw.entries),
    entries,
    source: { url: raw.source.url, license: raw.source.license.name },
  }
}
