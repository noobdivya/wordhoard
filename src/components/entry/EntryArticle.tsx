import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchAudio } from '../../api/wiktionary'
import { neighbours, useCefr } from '../../data/cefr'
import { useStoredList } from '../../hooks/useStoredList'
import { otherForms } from '../../lib/forms'
import { pronounce, type Accent } from '../../lib/speak'
import { toast } from '../../lib/toast'
import type { WordEntry } from '../../types/entry'
import { BookmarkIcon, CopyIcon, KeyIcon, SpeakerIcon } from '../icons'
import { LevelChip } from '../LevelChip'
import { Collocations, Origin, Synonyms, VerbForms } from './EntryBoxes'
import { SenseList } from './SenseList'

const wordPath = (word: string) => `/word/${encodeURIComponent(word)}`

export function EntryArticle({ data, pos }: { data: WordEntry; pos: number }) {
  const { word } = data
  const entry = data.entries[pos]
  const multi = data.entries.length > 1
  const cefr = useCefr()
  const saved = useStoredList('saved')
  const isSaved = saved.list.includes(word)
  const { data: audio } = useQuery({
    queryKey: ['audio', word],
    queryFn: ({ signal }) => fetchAudio(word, signal),
  })

  const forms = otherForms(entry)
  // The lists up to B2 are the words a learner needs first
  const core = entry.level !== null && entry.level < 'C1'
  const { previous, next } = cefr ? neighbours(cefr, word) : {}
  const accents: { label: string; key: 'uk' | 'us'; accent: Accent; name: string }[] = [
    { label: 'UK', key: 'uk', accent: 'en-GB', name: 'British' },
    { label: 'US', key: 'us', accent: 'en-US', name: 'American' },
  ]

  function toggleSaved() {
    saved.toggle(word)
    toast(isSaved ? `Removed “${word}” from saved words` : `Saved “${word}”`)
  }

  function copy() {
    const ipa = data.pronunciation.uk ?? data.pronunciation.us ?? ''
    const text = `${word} ${ipa} (${entry.pos}): ${entry.senses[0]?.definition ?? ''}`
    const failed = () => toast("Copying isn't allowed here. Select the text to copy it.")
    if (!navigator.clipboard) return failed()
    navigator.clipboard.writeText(text).then(() => toast('Definition copied'), failed)
  }

  return (
    <article className="sheet" aria-labelledby="hw">
      <div className="hw-line">
        <div className="hw-group">
          <h1 className="hw" id="hw">
            <span className="hl">{word}</span>
            {multi && <sup>{pos + 1}</sup>}
          </h1>
          <span className="pos">{entry.pos}</span>
        </div>
        <div className="actions">
          <button className="abtn" onClick={toggleSaved} aria-pressed={isSaved}>
            <BookmarkIcon filled={isSaved} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button className="abtn" onClick={copy}>
            <CopyIcon />
            Copy
          </button>
        </div>
      </div>

      <div className="meta-row">
        {entry.level ? <LevelChip level={entry.level} /> : <span className="gram">Not on the core lists</span>}
        {core && (
          <span className="core">
            <KeyIcon />
            Core vocabulary
          </span>
        )}
        {forms && (
          <span className="forms">
            Forms: <b>{forms}</b>
          </span>
        )}
      </div>

      {multi && (
        <nav className="pos-switch" aria-label="Parts of speech">
          {data.entries.map((e, i) => (
            <Link key={e.pos} className={`chip${i === pos ? ' live' : ''}`} to={`?pos=${i}`} aria-current={i === pos}>
              {e.pos}
            </Link>
          ))}
        </nav>
      )}

      <div className="phon">
        {accents.map(({ label, key, accent, name }) => (
          <span className="ph" key={key}>
            <b>{label}</b>
            <button
              className={`spk ${key}`}
              onClick={() => pronounce(word, accent, audio?.[key])}
              aria-label={`Listen to ${name} pronunciation`}
            >
              <SpeakerIcon />
            </button>
            {data.pronunciation[key] && <span className="ipa">{data.pronunciation[key]}</span>}
          </span>
        ))}
      </div>

      <VerbForms word={word} entry={entry} />
      <SenseList word={word} entry={entry} />
      <Synonyms entry={entry} />
      <Collocations word={word} pos={entry.pos} />
      <Origin word={word} />

      <p className="hint">
        Definitions from <a href={data.source.url}>Wiktionary</a>, {data.source.license}.
      </p>

      <nav className="pn" aria-label="Neighbouring entries">
        {previous ? (
          <Link to={wordPath(previous)}>
            <small>← Previous</small>
            <b>{previous}</b>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={wordPath(next)}>
            <small>Next →</small>
            <b>{next}</b>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
