import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SearchBox } from './SearchBox'

vi.mock('../api/datamuse', () => ({
  suggest: vi.fn(async (prefix: string) =>
    prefix.startsWith('lig') ? [{ word: 'light' }, { word: 'lightly' }, { word: 'ligature' }] : [],
  ),
}))

function Opened() {
  return <p>Entry for {useParams().word}</p>
}

function renderSearch() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SearchBox id="q" placeholder="Look up a word" />
        <Routes>
          <Route path="/" element={<p>Home</p>} />
          <Route path="/word/:word" element={<Opened />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { user: userEvent.setup(), input: screen.getByRole('combobox') }
}

describe('SearchBox', () => {
  it('lists suggestions with the level of listed words', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'lig')
    const options = await screen.findAllByRole('option')
    expect(options.map((o) => o.querySelector('span')?.textContent)).toEqual(['light', 'lightly', 'ligature'])
    expect(input.getAttribute('aria-expanded')).toBe('true')
    // "light" is on the CEFR lists at A1; "ligature" is not listed
    await waitFor(() => expect(options[0].textContent).toContain('A1'))
    expect(options[2].textContent).toContain('Off-list')
    expect(screen.getByRole('status').textContent).toBe('3 suggestions')
  })

  it('moves through suggestions with the arrow keys and wraps round', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'lig')
    const options = await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(options[1].getAttribute('aria-selected')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id)
    await user.keyboard('{ArrowUp}{ArrowUp}')
    expect(options[2].getAttribute('aria-selected')).toBe('true')
  })

  it('opens the selected suggestion on Enter', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'lig')
    await screen.findAllByRole('option')
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(await screen.findByText('Entry for lightly')).toBeTruthy()
    expect((input as HTMLInputElement).value).toBe('')
  })

  it('looks up the typed text, lower-cased, when nothing is selected', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'Quaint{Enter}')
    expect(await screen.findByText('Entry for quaint')).toBeTruthy()
  })

  it('opens a suggestion when it is clicked', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'lig')
    await user.click((await screen.findAllByRole('option'))[2])
    expect(await screen.findByText('Entry for ligature')).toBeTruthy()
  })

  it('closes on Escape', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'lig')
    await screen.findAllByRole('option')
    await user.keyboard('{Escape}')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryAllByRole('option')).toEqual([])
  })

  it('says so when nothing matches', async () => {
    const { user, input } = renderSearch()
    await user.type(input, 'zzz')
    expect(await screen.findByText(/No matches/)).toBeTruthy()
  })

  it('focuses the search when / is pressed elsewhere', async () => {
    const { user, input } = renderSearch()
    await user.keyboard('/')
    expect(document.activeElement).toBe(input)
    expect((input as HTMLInputElement).value).toBe('')
  })
})
