import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { toggleTheme } from '../lib/theme'
import { LEVELS, LEVEL_NAMES } from '../types/entry'
import { ErrorBoundary } from './ErrorBoundary'
import { SearchBox } from './SearchBox'
import { Toast } from './Toast'

export function Layout() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  const content = useRef<HTMLDivElement>(null)
  const firstView = useRef(true)

  // A new page starts at the top, and keyboard and screen-reader users start
  // at its content instead of being left on the link they followed
  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (firstView.current) firstView.current = false
    else content.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <>
      <a className="skip" href="#content">Skip to content</a>
      <header className={`band${onHome ? ' on-home' : ''}`}>
        <div className="shell band-in">
          <Link className="brand" to="/" aria-label="Wordhoard home">
            <span className="logo">W</span>
            <span className="brand-t">
              Wordhoard<small>Learner's Dictionary</small>
            </span>
          </Link>
          {!onHome && <SearchBox id="q" placeholder="Look up a word, e.g. ephemeral" />}
          <button className="theme" onClick={toggleTheme} aria-label="Switch colour theme" title="Switch colour theme">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
        </div>
        <nav className="subnav" aria-label="Sections">
          <div className="shell subnav-in">
            <NavLink to="/" end>Dictionary</NavLink>
            <NavLink to="/lists">Word lists</NavLink>
            <NavLink to="/browse">Browse A–Z</NavLink>
          </div>
        </nav>
      </header>

      <div className="shell" id="content" tabIndex={-1} ref={content}>
        {/* Keyed so the boundary clears when the reader moves to another page */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>

      <footer className="foot">
        <div className="shell">
          <div className="foot-grid">
            <div>
              <div className="foot-brand">
                <span className="logo">W</span>Wordhoard
              </div>
              <p>
                A learner's dictionary with clear definitions, real examples, UK and US pronunciation and
                CEFR levels.
              </p>
            </div>
            <div>
              <h3>Explore</h3>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/lists">Word lists</Link></li>
                <li><Link to="/browse">Browse A–Z</Link></li>
              </ul>
            </div>
            <div>
              <h3>Levels</h3>
              <ul>
                {LEVELS.map((l) => (
                  <li key={l}>
                    <Link to={`/lists/${l.toLowerCase()}`}>{l} · {LEVEL_NAMES[l]}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Sources</h3>
              <ul>
                <li>
                  Definitions from <a href="https://en.wiktionary.org">Wiktionary</a> (
                  <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>)
                </li>
                <li>Levels from the CEFR-J Wordlist (Tono Laboratory, TUFS) and the Octanove C1/C2 profile</li>
                <li>Word search by <a href="https://www.datamuse.com/api/">Datamuse</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Wordhoard</span>
            <span>Press <kbd>/</kbd> to search from any page</span>
          </div>
        </div>
      </footer>
      <Toast />
    </>
  )
}
