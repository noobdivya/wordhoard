import { describe, expect, it } from 'vitest'
import { mockFetch } from '../test/mockFetch'
import { collocations, similarWords, wordSummary } from './datamuse'

describe('wordSummary', () => {
  const a = [{ word: 'a', score: 1, defs: ['n\tAdult; as used in film rating. ', 'adv\t(obsolete) To do with position. '] }]

  it('uses a definition for one of the listed parts of speech', async () => {
    mockFetch(a)
    expect(await wordSummary('a', ['adverb'])).toEqual({ definition: 'To do with position.' })
  })

  it('gives no definition when none matches the listed part of speech', async () => {
    mockFetch(a)
    expect(await wordSummary('a', ['determiner'])).toEqual({ definition: undefined })
  })

  it('uses the first definition when the part of speech is unknown', async () => {
    mockFetch(a)
    expect(await wordSummary('a')).toEqual({ definition: 'Adult; as used in film rating.' })
  })

  it('ignores a result for a different word', async () => {
    mockFetch([{ word: 'serendipity', score: 1, defs: ['n\tLuck. '] }])
    expect(await wordSummary('serendipty')).toEqual({})
  })
})

describe('similarWords', () => {
  it('leaves out the query itself and proper nouns', async () => {
    mockFetch([
      { word: 'recieve', score: 3, tags: ['v'], defs: ['v\tMisspelling of receive. '] },
      { word: 'relieve', score: 2, tags: ['v'], defs: ['v\tTo ease. '] },
      { word: 'serendip', score: 1, tags: ['n', 'prop'] },
    ])
    expect(await similarWords('recieve')).toEqual([{ word: 'relieve', pos: ['verb'], definition: 'To ease.' }])
  })
})

describe('collocations', () => {
  const partners = [{ word: 'pure' }, { word: 'more' }, { word: '.' }, { word: 'sheer' }]

  it('puts the partner before a noun and after an adjective or verb', async () => {
    mockFetch(partners)
    expect(await collocations('serendipity', 'noun')).toEqual(['pure serendipity', 'sheer serendipity'])
    mockFetch([{ word: 'village' }])
    expect(await collocations('quaint', 'adjective')).toEqual(['quaint village'])
  })

  it('asks for nothing for other parts of speech', async () => {
    const fetchMock = mockFetch(partners)
    expect(await collocations('the', 'determiner')).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
