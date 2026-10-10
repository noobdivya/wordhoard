import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The hook keeps an in-memory copy of each list, so every test loads a fresh module.
async function setup(key: 'saved' | 'recent' | 'known') {
  const { useStoredList } = await import('./useStoredList')
  return renderHook(() => useStoredList(key))
}

const stored = (key: string) => JSON.parse(localStorage.getItem(`wh-${key}`) ?? 'null')

describe('useStoredList', () => {
  beforeEach(() => vi.resetModules())

  it('starts from what the browser has stored', async () => {
    localStorage.setItem('wh-saved', '["quaint"]')
    const { result } = await setup('saved')
    expect(result.current.list).toEqual(['quaint'])
  })

  it('toggles a word and stores the result', async () => {
    const { result } = await setup('known')
    act(() => result.current.toggle('light'))
    expect(result.current.list).toEqual(['light'])
    expect(stored('known')).toEqual(['light'])
    act(() => result.current.toggle('light'))
    expect(result.current.list).toEqual([])
  })

  it('moves a repeated word to the front and keeps the newest', async () => {
    const { result } = await setup('recent')
    act(() => ['a', 'b', 'c', 'a'].forEach((w) => result.current.add(w, 3)))
    expect(result.current.list).toEqual(['a', 'c', 'b'])
    act(() => result.current.add('d', 3))
    expect(result.current.list).toEqual(['d', 'a', 'c'])
  })

  it('shares one list between components', async () => {
    const first = await setup('saved')
    const { useStoredList } = await import('./useStoredList')
    const second = renderHook(() => useStoredList('saved'))
    act(() => first.result.current.toggle('wander'))
    expect(second.result.current.list).toEqual(['wander'])
  })

  it('starts empty when the stored value is unreadable', async () => {
    localStorage.setItem('wh-saved', 'not json')
    const { result } = await setup('saved')
    expect(result.current.list).toEqual([])
  })

  it('keeps working when storage refuses writes', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = await setup('saved')
    act(() => result.current.toggle('wander'))
    expect(result.current.list).toEqual(['wander'])
    vi.restoreAllMocks()
  })
})
