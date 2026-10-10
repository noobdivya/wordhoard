import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { suggest } from '../api/datamuse'
import { cefrSummary, useCefr } from '../data/cefr'
import { useDebounced } from '../hooks/useDebounced'
import { LevelChip } from './LevelChip'

interface Props {
  /** Prefix for element ids; must differ between instances */
  id: string
  placeholder: string
  /** The large variant used in the home hero */
  big?: boolean
}

function Highlighted({ word, match }: { word: string; match: string }) {
  const at = word.indexOf(match)
  // Datamuse also suggests spelling corrections, which do not contain the typed text
  if (at < 0) return <span>{word}</span>
  return (
    <span>
      {word.slice(0, at)}
      <mark>{word.slice(at, at + match.length)}</mark>
      {word.slice(at + match.length)}
    </span>
  )
}

export function SearchBox({ id, placeholder, big }: Props) {
  const navigate = useNavigate()
  const cefr = useCefr()
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(-1)

  const typed = value.trim().toLowerCase()
  const term = useDebounced(typed, 150)
  const { data, isFetching } = useQuery({
    queryKey: ['suggest', term],
    queryFn: ({ signal }) => suggest(term, signal),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  })
  const items = typed && data ? data.map((d) => d.word) : []
  const settled = term === typed && !isFetching
  const listId = `${id}-list`
  const showList = open && typed.length > 0 && (items.length > 0 || settled)

  // "/" focuses the search from anywhere
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const tag = document.activeElement?.tagName ?? ''
      if (e.key === '/' && !/input|textarea|select/i.test(tag)) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function go(word: string) {
    const target = word.trim().toLowerCase()
    if (!target) return
    setValue('')
    setOpen(false)
    setSelected(-1)
    input.current?.blur()
    navigate(`/word/${encodeURIComponent(target)}`)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    go(items[selected] ?? value)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      input.current?.blur()
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setOpen(true)
      setSelected((s) => (s + step + items.length) % items.length)
    }
  }

  return (
    <div className={`search${big ? ' big-search' : ''}`} role="search" ref={root}>
      <form onSubmit={onSubmit} autoComplete="off">
        <input
          ref={input}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label="Search the dictionary"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={selected >= 0 ? `${listId}-${selected}` : undefined}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
            setSelected(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <button className="sbtn" type="submit" aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </form>
      <span className="sr-only" role="status">
        {showList ? (items.length ? `${items.length} suggestions` : 'No suggestions') : ''}
      </span>
      <ul className="suggest" id={listId} role="listbox" hidden={!showList}>
        {items.length > 0 ? (
          items.map((word, i) => {
            const { pos, level } = cefrSummary(cefr, word)
            return (
              <li
                key={word}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === selected}
                // Keep focus in the input so the click is not lost to a blur
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => go(word)}
              >
                <Highlighted word={word} match={typed} />
                <span className="s-pos">{pos.join(', ')}</span>
                <span className="s-lv"><LevelChip level={level} /></span>
              </li>
            )
          })
        ) : (
          <li aria-disabled="true">
            <span>No matches. Press Enter to see similar words.</span>
          </li>
        )}
      </ul>
    </div>
  )
}
