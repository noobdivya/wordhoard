// Wiktionary and Wikimedia Commons Action APIs. No key; `origin=*` enables CORS.
import { getJson } from './http'

const WIKT = 'https://en.wiktionary.org/w/api.php?format=json&origin=*'
const COMMONS = 'https://commons.wikimedia.org/w/api.php?format=json&origin=*'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface WordOfTheDay {
  word: string
  pos: string
}

/** Wiktionary's word of the day. Returns null if none is set for the date. */
export async function fetchWordOfTheDay(date: Date, signal?: AbortSignal): Promise<WordOfTheDay | null> {
  const title = `Wiktionary:Word_of_the_day/${date.getFullYear()}/${MONTHS[date.getMonth()]}_${date.getDate()}`
  const data = await getJson<{
    query: { pages: Record<string, { revisions?: { slots: { main: { '*': string } } }[] }> }
  }>(`${WIKT}&action=query&prop=revisions&rvprop=content&rvslots=main&titles=${title}`, signal)
  const wikitext = Object.values(data.query.pages)[0]?.revisions?.[0]?.slots.main['*']
  // {{WOTD|word|pos|definition...}}
  const match = wikitext?.match(/\{\{WOTD\|([^|]+)\|([^|]+)\|/)
  return match ? { word: match[1], pos: match[2] } : null
}

/** The word's etymology as plain text, or null when Wiktionary has none. */
export async function fetchOrigin(word: string, signal?: AbortSignal): Promise<string | null> {
  const data = await getJson<{ query: { pages: Record<string, { extract?: string }> } }>(
    `${WIKT}&action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(word)}`,
    signal,
  )
  const extract = Object.values(data.query.pages)[0]?.extract
  // The page covers every language; keep the English section only
  const english = extract?.split(/(?:^|\n)== English ==\n/)[1]?.split(/\n== [^=\n]+ ==\n/)[0]
  // "Etymology" or, for words with several origins, "Etymology 1"
  const section = english?.match(/=== Etymology(?: 1)? ===\n+([\s\S]*?)(?=\n+==|$)/)?.[1]
  const text = section?.replace(/\s+/g, ' ').trim()
  if (!text) return null
  if (text.length <= 600) return text
  // Long etymologies list every cognate; stop at the last full sentence that fits
  const cut = text.slice(0, 600)
  const end = cut.lastIndexOf('. ')
  return end > 200 ? cut.slice(0, end + 1) : cut + '…'
}

export interface AudioUrls {
  uk?: string
  us?: string
}

/** Recorded pronunciations on Commons, which follow the En-uk-{word}.ogg naming convention. */
export async function fetchAudio(word: string, signal?: AbortSignal): Promise<AudioUrls> {
  const files = { uk: `File:En-uk-${word}.ogg`, us: `File:En-us-${word}.ogg` }
  const titles = encodeURIComponent(`${files.uk}|${files.us}`)
  const data = await getJson<{
    query: { pages: Record<string, { title: string; imageinfo?: { url: string }[] }> }
  }>(`${COMMONS}&action=query&prop=imageinfo&iiprop=url&titles=${titles}`, signal)
  const urlFor = (title: string) =>
    Object.values(data.query.pages).find((p) => p.title === title)?.imageinfo?.[0]?.url
  return { uk: urlFor(files.uk), us: urlFor(files.us) }
}
