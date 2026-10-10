import { describe, expect, it } from 'vitest'
import type { PosEntry } from '../types/entry'
import { otherForms, verbForms } from './forms'

const entry = (pos: string, forms: [string, string[]][]): PosEntry => ({
  pos,
  level: null,
  senses: [],
  synonyms: [],
  forms: forms.map(([word, tags]) => ({ word, tags })),
})

describe('verbForms', () => {
  it('builds the table rows, joining alternatives', () => {
    const rows = verbForms('light', [
      { word: 'lights', tags: ['present', 'singular', 'third-person'] },
      { word: 'lighting', tags: ['participle', 'present'] },
      { word: 'lit', tags: ['participle', 'past'] },
      { word: 'lit', tags: ['past'] },
      { word: 'lighted', tags: ['participle', 'past'] },
      { word: 'lighted', tags: ['past'] },
    ])
    expect(Object.fromEntries(rows)).toEqual({
      'present simple I / you / we / they': 'light',
      'he / she / it': 'lights',
      'past simple': 'lit, lighted',
      'past participle': 'lit, lighted',
      '-ing form': 'lighting',
    })
  })

  it('leaves out rows the source has no form for', () => {
    expect(verbForms('must', [])).toEqual([['present simple I / you / we / they', 'must']])
  })
})

describe('otherForms', () => {
  it('lists the plural or the comparative forms', () => {
    expect(otherForms(entry('noun', [['lights', ['plural']]]))).toBe('lights')
    expect(otherForms(entry('adjective', [['lighter', ['comparative']], ['lightest', ['superlative']]]))).toBe('lighter, lightest')
  })

  it('is empty for verbs, which get the table instead', () => {
    expect(otherForms(entry('verb', [['lights', ['third-person']]]))).toBe('')
  })
})
