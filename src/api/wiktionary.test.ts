import { describe, expect, it } from 'vitest'
import { mockFetch } from '../test/mockFetch'
import { fetchAudio, fetchOrigin, fetchWordOfTheDay } from './wiktionary'

const revision = (wikitext: string) => ({
  query: { pages: { 1: { revisions: [{ slots: { main: { '*': wikitext } } }] } } },
})
const extract = (text: string) => ({ query: { pages: { 1: { extract: text } } } })

describe('fetchWordOfTheDay', () => {
  it('reads the word and part of speech from the template', async () => {
    const fetchMock = mockFetch(revision('{{WOTD|Orwellian|adj|Of or [[relate|relating]] to George Orwell.}}'))
    expect(await fetchWordOfTheDay(new Date(2026, 9, 4))).toEqual({ word: 'Orwellian', pos: 'adj' })
    expect(fetchMock.mock.calls[0][0]).toContain('Wiktionary:Word_of_the_day/2026/October_4')
  })

  it('returns null when no word is set for the date', async () => {
    mockFetch({ query: { pages: { '-1': { missing: '' } } } })
    expect(await fetchWordOfTheDay(new Date(2026, 9, 4))).toBeNull()
  })
})

describe('fetchOrigin', () => {
  it('takes the etymology from the English section only', async () => {
    mockFetch(
      extract(
        '\n== English ==\n\n\n=== Etymology ===\n\nFrom Serendip + -ity.\nCoined by Horace Walpole.\n\n\n=== Noun ===\nserendipity\n\n== French ==\n\n=== Etymology ===\nBorrowed from English.\n',
      ),
    )
    expect(await fetchOrigin('serendipity')).toBe('From Serendip + -ity. Coined by Horace Walpole.')
  })

  it('uses the first etymology of a word that has several', async () => {
    mockFetch(
      extract(
        '\n== English ==\n\n=== Pronunciation ===\nIPA: /laɪt/\n\n=== Etymology 1 ===\n\nFrom Old English lēoht.\n\n==== Noun ====\nlight\n\n=== Etymology 2 ===\nFrom Old English līht.\n',
      ),
    )
    expect(await fetchOrigin('light')).toBe('From Old English lēoht.')
  })

  it('shortens a long etymology at a sentence end', async () => {
    const sentence = 'From a very long chain of older words and cognates in many languages. '
    mockFetch(extract(`\n== English ==\n\n=== Etymology ===\n${sentence.repeat(20)}\n\n=== Noun ===\n`))
    const origin = (await fetchOrigin('word'))!
    expect(origin.length).toBeLessThanOrEqual(600)
    expect(origin.endsWith('languages.')).toBe(true)
  })

  it('returns null when there is no etymology', async () => {
    mockFetch(extract('\n== English ==\n\n=== Noun ===\nthing\n'))
    expect(await fetchOrigin('thing')).toBeNull()
    mockFetch({ query: { pages: { '-1': {} } } })
    expect(await fetchOrigin('nothing')).toBeNull()
  })
})

describe('fetchAudio', () => {
  it('returns only the recordings that exist', async () => {
    mockFetch({
      query: {
        pages: {
          '-1': { title: 'File:En-uk-quaint.ogg' },
          7: { title: 'File:En-us-quaint.ogg', imageinfo: [{ url: 'https://upload.example/En-us-quaint.ogg' }] },
        },
      },
    })
    expect(await fetchAudio('quaint')).toEqual({ uk: undefined, us: 'https://upload.example/En-us-quaint.ogg' })
  })
})
