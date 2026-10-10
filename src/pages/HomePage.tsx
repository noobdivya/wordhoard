import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AlphaGrid } from '../components/AlphaGrid'
import { SpeakerIcon } from '../components/icons'
import { SearchBox } from '../components/SearchBox'
import { WordCard } from '../components/WordCard'
import { useCefr, useLetterCounts, wordsAt, type CefrIndex } from '../data/cefr'
import { usePageMeta } from '../hooks/usePageMeta'
import { useStoredList } from '../hooks/useStoredList'
import { useWordOfTheDay } from '../hooks/useWordOfTheDay'
import { pronounce } from '../lib/speak'
import { percent, plural, wordPath } from '../lib/text'
import { LEVELS, LEVEL_NAMES, type Level } from '../types/entry'

const POPULAR = ['serendipity', 'ubiquitous', 'light', 'nostalgia']

function WordOfTheDayCard() {
  const { entry, today } = useWordOfTheDay()
  if (!entry) return null
  const first = entry.entries[0]
  const sense = first.senses[0]
  // Some examples arrive already wrapped in quotation marks
  const example = sense?.examples[0]?.replace(/^["'“‘]+|["'”’]+$/g, '')
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(today)
  return (
    <aside className="wotd-hero" aria-label="Word of the day">
      <div className="wh-top">
        <span>Word of the day</span>
        <span>{date}</span>
      </div>
      <p className="wh-w">
        <span>{entry.word}</span>
      </p>
      <div className="wh-meta">
        <button className="spk wh-spk" onClick={() => pronounce(entry.word, 'en-GB')} aria-label={`Listen to ${entry.word}`}>
          <SpeakerIcon />
        </button>
        {entry.pronunciation.uk && <span className="ipa">{entry.pronunciation.uk} ·</span>}
        <em>{first.pos}</em>
      </div>
      <p className="wh-d">{sense?.definition}</p>
      {example && <p className="wh-ex">“{example}”</p>}
      <Link className="btn" to={wordPath(entry.word)}>Read the full entry</Link>
    </aside>
  )
}

function LevelCard({ level, cefr, known }: { level: Level; cefr: CefrIndex | undefined; known: string[] }) {
  const total = cefr ? wordsAt(cefr, level).length : 0
  const learned = cefr ? known.filter((w) => Object.values(cefr[w] ?? {}).includes(level)).length : 0
  return (
    <Link
      className="lvcard"
      style={{ '--c': `var(--lv-${level[0].toLowerCase()})` } as CSSProperties}
      to={`/lists/${level.toLowerCase()}`}
    >
      <b>{level}</b>
      <span className="lc-n">{LEVEL_NAMES[level]}</span>
      <span className="lc-c">{cefr ? `${plural(total, 'word')} · ${learned} learned` : ' '}</span>
      <span className="bar">
        <i style={{ width: `${percent(learned, total)}%` }} />
      </span>
    </Link>
  )
}

export function HomePage() {
  const cefr = useCefr()
  const counts = useLetterCounts(cefr)
  const known = useStoredList('known')
  const recent = useStoredList('recent')
  const recentCards = recent.list.slice(0, 4)
  usePageMeta()

  return (
    <main className="page full">
      <div>
        <section className="hero">
          <div>
            <div className="kicker">Learner's dictionary</div>
            <h1>
              Find the word. Know the <span className="hl">word.</span>
            </h1>
            <p className="lead">
              Clear definitions, real examples and British and American pronunciation, with every word
              tagged by CEFR level from A1 to C2.
            </p>
            <SearchBox id="hq" placeholder="Type a word, e.g. serendipity" big />
            <div className="trend">
              <span>Popular:</span>
              {POPULAR.map((w) => (
                <Link key={w} className="chip" to={wordPath(w)}>{w}</Link>
              ))}
            </div>
          </div>
          <WordOfTheDayCard />
        </section>

        <section className="sec">
          <div className="sec-head">
            <div>
              <h2>Explore by level</h2>
              <p>Study the words learners meet at each CEFR stage.</p>
            </div>
            <Link className="lnk" to="/lists">All word lists →</Link>
          </div>
          <div className="lvcards">
            {LEVELS.map((l) => <LevelCard key={l} level={l} cefr={cefr} known={known.list} />)}
          </div>
        </section>

        <section className="sec">
          <div className="sec-head">
            <div>
              <h2>Browse A–Z</h2>
              <p>Jump straight to a letter. The number shows how many entries it has.</p>
            </div>
            <Link className="lnk" to="/browse">Open the index →</Link>
          </div>
          <AlphaGrid counts={counts} />
        </section>

        {recentCards.length > 0 && (
          <section className="sec">
            <div className="sec-head">
              <div>
                <h2>Pick up where you left off</h2>
                <p>Words you looked up recently.</p>
              </div>
              <button className="lnk" onClick={() => recent.set([])}>Clear history</button>
            </div>
            <ul className="wcards">
              {recentCards.map((w) => <WordCard key={w} word={w} />)}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
