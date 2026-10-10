import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchEntry } from '../api/freeDictionary'
import { EntryArticle } from '../components/entry/EntryArticle'
import { Sidebar } from '../components/entry/Sidebar'
import { NoMatch } from '../components/NoMatch'
import { PageHead } from '../components/PageHead'
import { usePageMeta } from '../hooks/usePageMeta'
import { useStoredList } from '../hooks/useStoredList'

function EntrySkeleton({ word }: { word: string }) {
  return (
    <div className="page full">
      <main>
        <article className="sheet skeleton" aria-busy="true" aria-label={`Looking up ${word}`}>
          <h1 className="hw">{word}</h1>
          <div className="sk-line" style={{ width: '30%' }} />
          <div className="sk-line" style={{ width: '85%' }} />
          <div className="sk-line" style={{ width: '70%' }} />
          <div className="sk-line" style={{ width: '78%' }} />
        </article>
      </main>
    </div>
  )
}

export function EntryPage() {
  const { word = '' } = useParams()
  const [params] = useSearchParams()
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['entry', word],
    queryFn: ({ signal }) => fetchEntry(word, signal),
  })

  // Only words that have an entry count as recent searches
  const { add: addRecent } = useStoredList('recent')
  const found = data?.word
  useEffect(() => {
    if (found) addRecent(found, 8)
  }, [found, addRecent])

  // ?pos= is either an index or a part-of-speech name ("verb")
  const wanted = params.get('pos') ?? ''
  const named = data ? data.entries.findIndex((e) => e.pos === wanted) : -1
  const pos = data ? (named >= 0 ? named : Math.min(Math.max(Number(wanted) || 0, 0), data.entries.length - 1)) : 0
  const entry = data?.entries[pos]
  usePageMeta(
    entry ? `${data!.word} (${entry.pos}): meaning, pronunciation and examples` : isPending ? word : undefined,
    entry?.senses[0]?.definition,
  )

  if (isPending) return <EntrySkeleton word={word} />
  if (isError) {
    return (
      <main className="page full">
        <div>
          <PageHead
            kicker="Dictionary"
            title="Something went wrong"
            lead={<>The dictionary service did not respond, so “{word}” could not be looked up.</>}
          />
          <button className="btn" onClick={() => refetch()}>Try again</button>
        </div>
      </main>
    )
  }
  if (!data) return <NoMatch query={word} />

  const letter = data.word[0].toLowerCase()

  return (
    <>
      <div className="crumbs">
        <Link to="/">Home</Link>
        <span aria-hidden="true">›</span>
        <Link to={`/browse/${letter}`}>Dictionary · {letter.toUpperCase()}</Link>
        <span aria-hidden="true">›</span>
        <span>{data.word} {data.entries[pos].pos}</span>
      </div>
      <div className="page">
        <main>
          {/* Keyed so expanded examples and meanings reset between entries */}
          <EntryArticle key={`${data.word}/${pos}`} data={data} pos={pos} />
        </main>
        <Sidebar data={data} pos={pos} />
      </div>
    </>
  )
}
