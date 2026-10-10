import { Link } from 'react-router-dom'
import { LETTERS } from '../data/cefr'
import { plural } from '../lib/text'

interface Props {
  counts: Record<string, number>
  selected?: string
}

export function AlphaGrid({ counts, selected }: Props) {
  return (
    <div className="alpha">
      {LETTERS.map((l) => {
        const n = counts[l] ?? 0
        const label = l.toUpperCase()
        if (!n) return <span key={l} className="off" aria-hidden="true">{label}</span>
        return (
          <Link key={l} to={`/browse/${l}`} aria-current={l === selected} aria-label={`${label}, ${plural(n, 'word')}`}>
            {label}
            <small>{n}</small>
          </Link>
        )
      })}
    </div>
  )
}
