import { vi } from 'vitest'

/** Replaces fetch with one that answers every request with the given JSON body. */
export function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
