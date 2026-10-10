import { useQuery } from '@tanstack/react-query'
import { similarWords } from '../api/datamuse'
import { usePageMeta } from '../hooks/usePageMeta'
import { PageHead } from './PageHead'
import { WordCard } from './WordCard'

export function NoMatch({ query }: { query: string }) {
  const { data: similar, isPending } = useQuery({
    queryKey: ['similar', query],
    queryFn: ({ signal }) => similarWords(query, 4, signal),
  })

  usePageMeta(`No match for “${query}”`)

  // A failed lookup of similar words is treated the same as finding none
  const hasSimilar = !!similar?.length
  return (
    <main className="page full">
      <div>
        <div className="crumbs">
          <span>Search results</span>
        </div>
        <PageHead
          kicker="Search"
          title={<>No match for “{query}”</>}
          lead={
            isPending
              ? 'Looking for similar words…'
              : hasSimilar
                ? 'Check the spelling, or try one of these similar words.'
                : 'Check the spelling and try again.'
          }
        />
        {hasSimilar && (
          <ul className="wcards">
            {similar.map((s) => (
              <WordCard key={s.word} word={s.word} pos={s.pos} definition={s.definition ?? ''} />
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
