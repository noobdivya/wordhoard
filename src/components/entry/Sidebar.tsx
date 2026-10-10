import { Link } from 'react-router-dom'
import { cefrSummary, neighbours, useCefr } from '../../data/cefr'
import { useStoredList } from '../../hooks/useStoredList'
import { useWordOfTheDay } from '../../hooks/useWordOfTheDay'
import { LEVELS, type WordEntry } from '../../types/entry'

const wordPath = (word: string) => `/word/${encodeURIComponent(word)}`

function WordOfTheDay() {
  const { entry, today } = useWordOfTheDay()
  if (!entry) return null
  const first = entry.entries[0]
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(today)
  return (
    <section className="sbox wotd">
      <h2>
        Word of the day <span>{date}</span>
      </h2>
      <div className="in">
        <p className="w">
          <span>{entry.word}</span>
        </p>
        <div className="wi">
          {entry.pronunciation.uk && <span className="ipa">{entry.pronunciation.uk} · </span>}
          <em>{first.pos}</em>
        </div>
        <p>{first.senses[0]?.definition}</p>
        <Link className="btn" to={wordPath(entry.word)}>See full entry</Link>
      </div>
    </section>
  )
}

function Chips({ words, empty }: { words: string[]; empty: string }) {
  if (!words.length) return <p className="empty">{empty}</p>
  return words.map((w) => <Link key={w} className="chip" to={wordPath(w)}>{w}</Link>)
}

export function Sidebar({ data, pos }: { data: WordEntry; pos: number }) {
  const cefr = useCefr()
  const recent = useStoredList('recent')
  const saved = useStoredList('saved')
  const near = cefr ? neighbours(cefr, data.word) : undefined
  const multi = data.entries.length > 1

  return (
    <aside className="side" aria-label="Related">
      <section className="sbox">
        <h2>All matches</h2>
        <ul className="rlist">
          {data.entries.map((e, i) => (
            <li key={e.pos}>
              <Link to={`?pos=${i}`} aria-current={i === pos}>
                <span className="w">{data.word}</span>
                {multi && <sup>{i + 1}</sup>} <em>{e.pos}</em>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {near && (
        <section className="sbox">
          <h2>Nearby words</h2>
          <ul className="rlist">
            {[...near.before, data.word, ...near.after].map((w) => (
              <li key={w}>
                <Link to={wordPath(w)} aria-current={w === data.word}>
                  <span className="w">{w}</span> <em>{cefrSummary(cefr, w).pos.join(', ')}</em>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <WordOfTheDay />

      <section className="sbox">
        <h2>
          Recent searches
          {recent.list.length > 0 && (
            <button className="clear" onClick={() => recent.set([])}>Clear</button>
          )}
        </h2>
        <div className="in chips">
          <Chips words={recent.list} empty="Words you look up appear here." />
        </div>
      </section>

      <section className="sbox">
        <h2>Saved words</h2>
        <div className="in chips">
          <Chips words={saved.list} empty="Select Save on an entry to keep it here." />
        </div>
      </section>

      <section className="sbox">
        <h2>Browse by level</h2>
        <div className="in">
          <div className="levels">
            {LEVELS.map((l) => (
              <Link key={l} className={l[0]} to={`/lists/${l.toLowerCase()}`}>{l}</Link>
            ))}
          </div>
          <p className="hint">Levels follow the CEFR scale, from A1 (beginner) to C2 (mastery).</p>
        </div>
      </section>
    </aside>
  )
}
