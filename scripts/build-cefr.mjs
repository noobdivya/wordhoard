// Downloads the open CEFR word lists and writes src/data/cefr.json.
// Run with `npm run data:cefr`. The output is committed, so this only needs
// re-running when the upstream lists change.
//
// Sources (github.com/openlanguageprofiles/olp-en-cefrj):
//   CEFR-J Wordlist 1.5 (A1-B2) - Tono Laboratory, TUFS. Free to use with citation.
//   Octanove Vocabulary Profile C1/C2 1.0 - CC BY-SA 4.0.
import { writeFile } from 'node:fs/promises'

const BASE = 'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/'
const FILES = ['cefrj-vocabulary-profile-1.5.csv', 'octanove-vocabulary-profile-c1c2-1.0.csv']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function parseLine(line) {
  const cells = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { cells.push(cell); cell = '' }
    else cell += c
  }
  cells.push(cell)
  return cells
}

// word -> { pos: level }, keeping the lowest level when a word/pos pair repeats
const words = {}
for (const file of FILES) {
  const res = await fetch(BASE + file)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  const lines = (await res.text()).split(/\r?\n/).slice(1)
  for (const line of lines) {
    if (!line.trim()) continue
    const [headword, pos, level] = parseLine(line)
    if (!LEVELS.includes(level)) continue
    // "a.m./A.M./am/AM" lists spelling variants of one headword
    for (const variant of headword.split('/')) {
      const word = variant.trim().toLowerCase()
      if (!word) continue
      const entry = (words[word] ??= {})
      if (!entry[pos] || LEVELS.indexOf(level) < LEVELS.indexOf(entry[pos])) entry[pos] = level
    }
  }
}

const sorted = Object.fromEntries(Object.keys(words).sort().map((w) => [w, words[w]]))
await writeFile(new URL('../src/data/cefr.json', import.meta.url), JSON.stringify(sorted))
console.log(`Wrote ${Object.keys(sorted).length} headwords to src/data/cefr.json`)
