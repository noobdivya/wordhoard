import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/** Keeps the header and footer usable when a page fails to render. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="page full">
        <section className="phead">
          <div>
            <div className="kicker">Error</div>
            <h1>This page could not be shown</h1>
            <p className="lead">Something went wrong while displaying it.</p>
            <button className="btn" onClick={() => location.reload()}>Reload the page</button>
          </div>
        </section>
      </main>
    )
  }
}
