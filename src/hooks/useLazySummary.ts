import { useQuery } from '@tanstack/react-query'
import { wordSummary } from '../api/datamuse'
import { useInView } from './useInView'

/** A word's short definition and IPA, requested only once the element is on screen. */
export function useLazySummary<T extends Element>(word: string, pos: string[], skip = false) {
  const [ref, seen] = useInView<T>()
  const { data } = useQuery({
    queryKey: ['summary', word],
    queryFn: ({ signal }) => wordSummary(word, pos, signal),
    enabled: seen && !skip,
  })
  return [ref, data] as const
}
