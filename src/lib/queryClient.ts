import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { removeOldestQuery, type PersistQueryClientOptions } from '@tanstack/react-query-persist-client'

const WEEK = 7 * 24 * 60 * 60 * 1000

// Dictionary data rarely changes, so a result is reused for a week, both in
// memory and (below) across visits.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, gcTime: WEEK, retry: 1, refetchOnWindowFocus: false },
  },
})

/** Storage can be blocked (private windows, strict settings); the app then runs without a saved cache. */
function availableStorage(): Storage | undefined {
  try {
    localStorage.setItem('wh-probe', '1')
    localStorage.removeItem('wh-probe')
    return localStorage
  } catch {
    return undefined
  }
}

// Saved between visits so repeat lookups cost no request. Left out: the CEFR
// index (already bundled with the app) and search suggestions (one per keystroke).
const PERSISTED = ['entry', 'origin', 'collocations', 'audio', 'summary', 'similar', 'wotd']

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: createAsyncStoragePersister({
    storage: availableStorage(),
    key: 'wh-cache',
    // When the browser's storage quota is reached, drop the oldest results and try again
    retry: removeOldestQuery,
  }),
  maxAge: WEEK,
  // Change this when the shape of a cached result changes, to discard old caches
  buster: '1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && PERSISTED.includes(String(query.queryKey[0])),
  },
}
