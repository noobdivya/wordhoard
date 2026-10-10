import { useState, type CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ListsUnavailable } from '../components/ListsUnavailable'
import { PageHead } from '../components/PageHead'
import { WordCard } from '../components/WordCard'
import { useCefrQuery, wordsAt, type CefrIndex } from '../data/cefr'
import { usePageMeta } from '../hooks/usePageMeta'
import { useStoredList } from '../hooks/useStoredList'
import { percent, plural } from '../lib/text'
import { LEVELS, LEVEL_NAMES, type Level } from '../types/entry'

type Scope = Level | 'all'
type Filter = 'all' | 'todo' | 'done'

const PAGE_SIZE = 24
const FILTERS: [Filter, string][] = [
  ['all', 'All words'],
  ['todo', 'To learn'],
  ['done', 'Learned'],
]
const LEVEL_DESC: Record<Level, string> = {
  A1: 'Everyday words for talking about yourself, your family and the things around you.',
  A2: 'Words for shopping, travel, work and simple conversations.',
  B1: 'Words to describe experiences, give opinions and explain your plans.',
  B2: 'Words for clear, detailed writing and discussion on a wide range of topics.',
  C1: 'Precise words for academic, professional and more nuanced language.',
  C2: 'Rare and subtle words that fluent speakers choose for effect.',
}

const colour = (scope: Scope) => (scope === 'all' ? 'var(--accent)' : `var(--lv-${scope[0].toLowerCase()})`)
const path = (scope: Scope) => (scope === 'all' ? '/lists' : `/lists/${scope.toLowerCase()}`)

/** How many of the learned words belong to a list. */
function learnedIn(cefr: CefrIndex, scope: Scope, known: string[]) {
  return known.filter((w) => {
    const levels = cefr[w]
    return levels && (scope === 'all' || Object.values(levels).includes(scope))
  }).length
}

function LevelTab({ scope, current, cefr, known }: { scope: Scope; current: Scope; cefr: CefrIndex; known: string[] }) {
  const total = wordsAt(cefr, scope).length
  return (
    <Link className="lvtab" style={{ '--c': colour(scope) } as CSSProperties} to={path(scope)} aria-current={scope === current}>
      <b>{scope === 'all' ? 'All' : scope}</b>
      <span>{plural(total, 'word')}</span>
      <span className="bar">
        <i style={{ width: `${percent(learnedIn(cefr, scope, known), total)}%` }} />
      </span>
    </Link>
  )
}

function WordList({ words }: { words: string[] }) {
  const [shown, setShown] = useState(PAGE_SIZE)
  const rest = words.length - shown
  return (
    <>
      <ul className="wcards">
        {words.slice(0, shown).map((w) => <WordCard key={w} word={w} />)}
      </ul>
      {rest > 0 && (
        <div className="more-row">
          <button className="more-senses" onClick={() => setShown(shown + PAGE_SIZE)}>
            Show {Math.min(rest, PAGE_SIZE)} more
          </button>
          <span className="count">{rest} not shown</span>
        </div>
      )}
    </>
  )
}

export function ListsPage() {
  const param = useParams().level?.toUpperCase()
  const scope: Scope = LEVELS.find((l) => l === param) ?? 'all'
  const [params, setParams] = useSearchParams()
  const filter = (FILTERS.find(([f]) => f === params.get('show'))?.[0] ?? 'all') as Filter
  const { data: cefr, isError, refetch } = useCefrQuery()
  const known = useStoredList('known')
  usePageMeta(
    scope === 'all' ? 'Word lists by CEFR level' : `${scope} ${LEVEL_NAMES[scope]} word list`,
    scope === 'all' ? undefined : LEVEL_DESC[scope],
  )

  if (!cefr) return <ListsUnavailable failed={isError} retry={refetch} />

  const all = wordsAt(cefr, scope)
  const learned = learnedIn(cefr, scope, known.list)
  const words =
    filter === 'todo'
      ? all.filter((w) => !known.list.includes(w))
      : filter === 'done'
        ? all.filter((w) => known.list.includes(w))
        : all

  return (
    <main className="page full">
      <div>
        <div className="crumbs">
          <Link to="/">Home</Link>
          <span aria-hidden="true">›</span>
          {scope === 'all' ? (
            <span>Word lists</span>
          ) : (
            <>
              <Link to="/lists">Word lists</Link>
              <span aria-hidden="true">›</span>
              <span>{scope} {LEVEL_NAMES[scope]}</span>
            </>
          )}
        </div>
        <PageHead
          kicker="Word lists"
          title={scope === 'all' ? 'Study by level' : `${scope} · ${LEVEL_NAMES[scope]}`}
          lead={
            scope === 'all'
              ? 'Choose a CEFR level, then mark words as learned as you go. Your progress is kept in this browser.'
              : LEVEL_DESC[scope]
          }
          aside={
            <div
              className="ring"
              style={{ '--p': percent(learned, all.length), '--c': colour(scope) } as CSSProperties}
              role="img"
              aria-label={`${learned} of ${all.length} words learned`}
            >
              <div>
                <b>{percent(learned, all.length)}%</b>
                <small>{learned} of {all.length} learned</small>
              </div>
            </div>
          }
        />

        <nav className="lvtabs" aria-label="Choose a level">
          {(['all', ...LEVELS] as Scope[]).map((s) => (
            <LevelTab key={s} scope={s} current={scope} cefr={cefr} known={known.list} />
          ))}
        </nav>

        <div className="toolbar">
          <div className="seg" role="group" aria-label="Show">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                aria-pressed={value === filter}
                onClick={() => setParams(value === 'all' ? {} : { show: value }, { replace: true })}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="count" aria-live="polite">{plural(words.length, 'word')}</span>
        </div>

        {words.length > 0 ? (
          // Keyed so "show more" starts again when the list changes
          <WordList key={`${scope}/${filter}`} words={words} />
        ) : (
          <div className="emptybox">
            {filter === 'done'
              ? 'No learned words here yet. Select “Mark learned” on a card to track it.'
              : "You've learned every word in this list."}
          </div>
        )}
      </div>
    </main>
  )
}
