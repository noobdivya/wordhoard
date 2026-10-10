import { PageHead } from './PageHead'

/** Shown by pages that need the CEFR word lists while they load, or when loading failed. */
export function ListsUnavailable({ failed, retry }: { failed: boolean; retry: () => void }) {
  return (
    <main className="page full">
      {failed ? (
        <div>
          <PageHead
            kicker="Word lists"
            title="The word lists did not load"
            lead="Check your connection and try again."
          />
          <button className="btn" onClick={retry}>Try again</button>
        </div>
      ) : (
        <p className="lead" role="status">Loading the word lists…</p>
      )}
    </main>
  )
}
