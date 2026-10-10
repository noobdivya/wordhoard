import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { collocations } from '../../api/datamuse'
import { fetchOrigin } from '../../api/wiktionary'
import { verbForms } from '../../lib/forms'
import type { PosEntry } from '../../types/entry'

// These boxes each depend on their own request. When one fails or comes back
// empty the box is left out; it never blocks the rest of the entry.

export function VerbForms({ word, entry }: { word: string; entry: PosEntry }) {
  if (entry.pos !== 'verb') return null
  const rows = verbForms(word, entry.forms)
  if (rows.length < 2) return null
  return (
    <details className="box">
      <summary>Verb forms</summary>
      <div className="box-b">
        <table className="vf">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function Synonyms({ entry }: { entry: PosEntry }) {
  if (!entry.synonyms.length) return null
  return (
    <div className="box">
      <div className="box-h">Synonyms</div>
      <div className="box-b">
        <div className="syn-grid">
          {entry.synonyms.slice(0, 12).map((s) => (
            <Link key={s} className="chip" to={`/word/${encodeURIComponent(s)}`}>{s}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Collocations({ word, pos }: { word: string; pos: string }) {
  const { data } = useQuery({
    queryKey: ['collocations', word, pos],
    queryFn: ({ signal }) => collocations(word, pos, signal),
  })
  if (!data?.length) return null
  return (
    <div className="box">
      <div className="box-h">Collocations</div>
      <div className="box-b">
        <ul className="colloc">
          {data.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
    </div>
  )
}

export function Origin({ word }: { word: string }) {
  const { data } = useQuery({
    queryKey: ['origin', word],
    queryFn: ({ signal }) => fetchOrigin(word, signal),
  })
  if (!data) return null
  return (
    <details className="box" open>
      <summary>Word origin</summary>
      <div className="box-b">
        <p className="origin">{data}</p>
      </div>
    </details>
  )
}
