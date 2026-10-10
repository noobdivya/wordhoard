import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlphaGrid } from '../components/AlphaGrid'
import { LevelChip } from '../components/LevelChip'
import { ListsUnavailable } from '../components/ListsUnavailable'
import { PageHead } from '../components/PageHead'
import { cefrSummary, LETTERS, useCefrQuery, useLetterCounts, wordsStarting, type CefrIndex } from '../data/cefr'
import { usePageMeta } from '../hooks/usePageMeta'
import { useLazySummary } from '../hooks/useLazySummary'
import { plural, wordPath } from '../lib/text'

const PAGE_SIZE = 40

function IndexRow({ word, cefr }: { word: string; cefr: CefrIndex }) {
  const { pos, level } = cefrSummary(cefr, word)
  const [ref, summary] = useLazySummary<HTMLLIElement>(word, pos)
  return (
    <li ref={ref}>
      <div>
        <Link className="ix-w" to={wordPath(word)}>{word}</Link>
        {summary?.definition && <p className="ix-d">{summary.definition}</p>}
        <div className="ix-pos">
          {pos.filter(Boolean).map((p) => (
            <Link key={p} className="chip" to={`${wordPath(word)}?pos=${encodeURIComponent(p)}`}>{p}</Link>
          ))}
        </div>
      </div>
      <LevelChip level={level} />
    </li>
  )
}

function Index({ words, cefr }: { words: string[]; cefr: CefrIndex }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const rest = words.length - shown
  return (
    <div>
      <ol className="index">
        {words.slice(0, shown).map((w) => <IndexRow key={w} word={w} cefr={cefr} />)}
      </ol>
      {rest > 0 && (
        <div className="more-row">
          <button className="more-senses" onClick={() => setShown(shown + PAGE_SIZE)}>
            Show {Math.min(rest, PAGE_SIZE)} more
          </button>
          <span className="count">{rest} not shown</span>
        </div>
      )}
    </div>
  )
}

export function BrowsePage() {
  const { data: cefr, isError, refetch } = useCefrQuery()
  const counts = useLetterCounts(cefr)
  const param = useParams().letter?.toLowerCase()
  const shown = param && counts[param] ? param.toUpperCase() : undefined
  usePageMeta(shown ? `Words starting with ${shown}` : 'Browse A–Z')

  if (!cefr) return <ListsUnavailable failed={isError} retry={refetch} />

  const available = LETTERS.filter((l) => counts[l])
  const letter = param && available.includes(param) ? param : available[0]
  const at = available.indexOf(letter)
  const previous = available[at - 1]
  const next = available[at + 1]
  const words = wordsStarting(cefr, letter)

  return (
    <main className="page full">
      <div>
        <div className="crumbs">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link to="/browse">Browse A–Z</Link>
          <span aria-hidden="true">›</span>
          <span>{letter.toUpperCase()}</span>
        </div>
        <PageHead
          kicker="Index"
          title="Browse A–Z"
          lead="Every headword on the CEFR word lists, in alphabetical order."
        />
        <AlphaGrid counts={counts} selected={letter} />
        <div className="azwrap">
          <div className="bigletter">
            <span className="L" aria-hidden="true">{letter.toUpperCase()}</span>
            <div>
              <p>
                {plural(words.length, 'word')} starting with <b>{letter.toUpperCase()}</b>
              </p>
              <div className="azpn">
                {previous && <Link to={`/browse/${previous}`}>← {previous.toUpperCase()}</Link>}
                {next && <Link to={`/browse/${next}`}>{next.toUpperCase()} →</Link>}
              </div>
            </div>
          </div>
          {/* Keyed so "show more" starts again for each letter */}
          <Index key={letter} words={words} cefr={cefr} />
        </div>
      </div>
    </main>
  )
}
