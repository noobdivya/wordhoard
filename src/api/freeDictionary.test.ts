import { describe, expect, it } from 'vitest'
import light from '../test/fixtures/light.json'
import quaint from '../test/fixtures/quaint.json'
import { mockFetch } from '../test/mockFetch'
import { fetchEntry } from './freeDictionary'

// The fixtures are responses recorded from freedictionaryapi.com.

describe('fetchEntry', () => {
  it('merges entries that share a part of speech', async () => {
    mockFetch(light)
    const entry = await fetchEntry('light')
    // The source lists noun, verb and adjective several times, once per etymology
    expect(light.entries.length).toBe(8)
    expect(entry?.entries.map((e) => e.pos)).toEqual(['noun', 'verb', 'adjective', 'adverb'])
  })

  it('attaches the CEFR level of each part of speech', async () => {
    mockFetch(light)
    const entry = await fetchEntry('light')
    expect(entry?.entries.map((e) => e.level)).toEqual(['A1', 'B1', 'A1', null])
  })

  it('splits the leading note off the definition', async () => {
    mockFetch(light)
    const sense = (await fetchEntry('light'))!.entries[0].senses[0]
    expect(sense.label).toBe('physics, uncountable')
    expect(sense.definition).toMatch(/^Electromagnetic radiation/)
  })

  it('prefers a broad transcription over a narrow one', async () => {
    mockFetch(light)
    // The source tags only the narrow [laɪt] as British; the untagged /laɪt/ is the better choice
    expect((await fetchEntry('light'))!.pronunciation).toEqual({ uk: '/laɪt/', us: '/laɪt/' })
  })

  it('drops obsolete spellings and repeated forms', async () => {
    mockFetch(light)
    const verb = (await fetchEntry('light'))!.entries[1]
    const forms = verb.forms.map((f) => f.word)
    expect(forms).toContain('lit')
    expect(forms).not.toContain('lyght')
    expect(new Set(verb.forms.map((f) => `${f.word}|${f.tags}`)).size).toBe(verb.forms.length)
  })

  it('moves obsolete and dialectal senses after the current ones', async () => {
    mockFetch(quaint)
    const senses = (await fetchEntry('quaint'))!.entries[0].senses
    expect(senses[0].definition).toMatch(/^Pleasingly unusual/)
    expect(senses.slice(1).every((s) => s.tags.some((t) => ['obsolete', 'dialectal'].includes(t)))).toBe(true)
  })

  it('returns null for a word with no entry', async () => {
    mockFetch({ word: 'serendipty', entries: [], source: {} })
    expect(await fetchEntry('serendipty')).toBeNull()
    mockFetch({}, 404)
    expect(await fetchEntry('serendipty')).toBeNull()
  })

  it('throws when the service fails', async () => {
    mockFetch({}, 500)
    await expect(fetchEntry('light')).rejects.toThrow('HTTP 500')
  })
})
