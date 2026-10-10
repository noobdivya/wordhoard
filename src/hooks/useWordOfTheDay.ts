import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchEntry } from '../api/freeDictionary'
import { fetchWordOfTheDay } from '../api/wiktionary'

/** Wiktionary's word of the day with its full entry; `entry` is undefined until both have loaded. */
export function useWordOfTheDay() {
  const [today] = useState(() => new Date())
  const { data: wotd } = useQuery({
    queryKey: ['wotd', today.toDateString()],
    queryFn: ({ signal }) => fetchWordOfTheDay(today, signal),
  })
  const { data: entry } = useQuery({
    queryKey: ['entry', wotd?.word],
    queryFn: ({ signal }) => fetchEntry(wotd!.word, signal),
    enabled: !!wotd,
  })
  return { entry: entry ?? undefined, today }
}
