export class HttpError extends Error {
  status: number
  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`)
    this.status = status
  }
}

export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new HttpError(res.status, url)
  return res.json() as Promise<T>
}
