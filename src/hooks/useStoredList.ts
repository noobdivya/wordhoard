import { useCallback, useSyncExternalStore } from 'react'

// Saved, recent and learned words live in this browser only.
// Storage can be unavailable (private windows), so every access is guarded.
const listeners = new Set<() => void>()
const cache = new Map<string, string[]>()

function read(key: string): string[] {
  if (!cache.has(key)) {
    let value: string[] = []
    try {
      value = JSON.parse(localStorage.getItem('wh-' + key) ?? '[]')
    } catch {
      /* fall back to empty */
    }
    cache.set(key, value)
  }
  return cache.get(key)!
}

function write(key: string, value: string[]) {
  cache.set(key, value)
  try {
    localStorage.setItem('wh-' + key, JSON.stringify(value))
  } catch {
    /* kept in memory for this session */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export type StoredListKey = 'saved' | 'recent' | 'known'

export function useStoredList(key: StoredListKey) {
  const list = useSyncExternalStore(subscribe, () => read(key))
  const set = useCallback((next: string[]) => write(key, next), [key])
  const toggle = useCallback(
    (word: string) => {
      const current = read(key)
      write(key, current.includes(word) ? current.filter((w) => w !== word) : [word, ...current])
    },
    [key],
  )
  /** Moves the word to the front, keeping at most `max` words. */
  const add = useCallback(
    (word: string, max: number) => {
      const current = read(key)
      if (current[0] === word) return
      write(key, [word, ...current.filter((w) => w !== word)].slice(0, max))
    },
    [key],
  )
  return { list, set, toggle, add }
}
