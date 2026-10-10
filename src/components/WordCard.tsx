import { Link } from 'react-router-dom'
import { cefrSummary, useCefr } from '../data/cefr'
import { useLazySummary } from '../hooks/useLazySummary'
import { useStoredList } from '../hooks/useStoredList'
import { pronounce } from '../lib/speak'
import { wordPath } from '../lib/text'
import { toast } from '../lib/toast'
import { SpeakerIcon } from './icons'
import { LevelChip } from './LevelChip'

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="var(--sheet)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

interface Props {
  word: string
  /** Supplied by callers that already have them; otherwise looked up when the card scrolls into view */
  pos?: string[]
  definition?: string
}

export function WordCard({ word, pos, definition }: Props) {
  const cefr = useCefr()
  const known = useStoredList('known')
  const listed = cefrSummary(cefr, word)
  const [ref, summary] = useLazySummary<HTMLLIElement>(word, listed.pos, definition !== undefined)
  const isKnown = known.list.includes(word)
  const parts = pos?.length ? pos : listed.pos
  const shownDefinition = definition ?? summary?.definition

  function toggleKnown() {
    known.toggle(word)
    toast(isKnown ? `Moved “${word}” back to your to-learn list` : `Marked “${word}” as learned`)
  }

  return (
    <li className={`wcard${isKnown ? ' known' : ''}`} ref={ref}>
      <div className="wc-top">
        <LevelChip level={listed.level} />
        <button className="known-btn" onClick={toggleKnown} aria-pressed={isKnown}>
          <CheckIcon />
          {isKnown ? 'Learned' : 'Mark learned'}
        </button>
      </div>
      <Link className="wc-w" to={wordPath(word)}>{word}</Link>
      <div className="wc-meta">
        <em>{parts.join(', ')}</em>
      </div>
      {shownDefinition && <p className="wc-d">{shownDefinition}</p>}
      <div className="wc-foot">
        <button className="mini-spk" onClick={() => pronounce(word, 'en-GB')} aria-label={`Listen to ${word}`}>
          <SpeakerIcon />
        </button>
        <Link className="lnk" to={wordPath(word)}>Open entry →</Link>
      </div>
    </li>
  )
}
