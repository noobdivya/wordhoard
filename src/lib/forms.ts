import type { PosEntry, WordForm } from '../types/entry'

const unique = (words: string[]) => [...new Set(words)]

export function verbForms(word: string, forms: WordForm[]): [string, string][] {
  const pick = (test: (tags: string[]) => boolean) =>
    unique(forms.filter((f) => test(f.tags)).map((f) => f.word)).join(', ')
  const rows: [string, string][] = [
    ['present simple I / you / we / they', word],
    ['he / she / it', pick((t) => t.includes('third-person'))],
    ['past simple', pick((t) => t.includes('past') && !t.includes('participle'))],
    ['past participle', pick((t) => t.includes('past') && t.includes('participle'))],
    ['-ing form', pick((t) => t.includes('present') && t.includes('participle'))],
  ]
  return rows.filter(([, value]) => value)
}

/** "lighter, lightest" for adjectives, the plural for nouns. Verbs get the table instead. */
export function otherForms(entry: PosEntry): string {
  if (entry.pos === 'verb') return ''
  const shown = ['plural', 'comparative', 'superlative']
  return unique(entry.forms.filter((f) => f.tags.some((t) => shown.includes(t))).map((f) => f.word)).join(', ')
}
