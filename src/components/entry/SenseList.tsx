import { Fragment, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { plural } from '../../lib/text'
import type { PosEntry, Sense } from '../../types/entry'

const SENSES_SHOWN = 6
const EXAMPLES_SHOWN = 2

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Bolds the headword and its inflected forms inside an example sentence. */
function emphasise(text: string, words: string[]): ReactNode {
  const pattern = [...words].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')
  // split() with a capture group puts the matches at the odd positions
  return text
    .split(new RegExp(`\\b(${pattern})\\b`, 'gi'))
    .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))
}

function SenseItem({ sense, words }: { sense: Sense; words: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const extra = sense.examples.length - EXAMPLES_SHOWN
  const examples = expanded ? sense.examples : sense.examples.slice(0, EXAMPLES_SHOWN)
  return (
    <li className="sense">
      <div className="sense-main">
        <p className="def">
          {sense.label && <span className="tag reg">({sense.label}) </span>}
          {sense.definition}
        </p>
        {examples.length > 0 && (
          <ul className="ex">
            {examples.map((x, i) => <li key={i}>{emphasise(x, words)}</li>)}
          </ul>
        )}
        {extra > 0 && !expanded && (
          <button className="more-ex" onClick={() => setExpanded(true)}>
            + {plural(extra, 'more example')}
          </button>
        )}
        {sense.synonyms.length > 0 && (
          <div className="syn">
            <b>SYNONYM{sense.synonyms.length > 1 ? 'S' : ''}</b>
            {sense.synonyms.map((s, i) => (
              <Fragment key={s}>
                {i > 0 && <span className="sep">,</span>}
                <Link to={`/word/${encodeURIComponent(s)}`}>{s}</Link>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

export function SenseList({ word, entry }: { word: string; entry: PosEntry }) {
  const [showAll, setShowAll] = useState(false)
  const words = [word, ...entry.forms.map((f) => f.word)]
  const hidden = entry.senses.length - SENSES_SHOWN
  const senses = showAll ? entry.senses : entry.senses.slice(0, SENSES_SHOWN)
  return (
    <>
      <ol className={`senses${entry.senses.length === 1 ? ' single' : ''}`}>
        {senses.map((s, i) => <SenseItem key={i} sense={s} words={words} />)}
      </ol>
      {hidden > 0 && !showAll && (
        <button className="more-senses" onClick={() => setShowAll(true)}>
          Show {plural(hidden, 'more meaning')}
        </button>
      )}
    </>
  )
}
