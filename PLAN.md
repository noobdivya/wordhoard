# Wordhoard: front-end implementation plan

A learner's dictionary built as a front-end-only single-page app. No backend and no database:
content comes from free, keyless, CORS-enabled APIs, CEFR levels from a bundled JSON file, and
personal state (saved, recent, learned) from `localStorage`.

Design reference: the Wordhoard artifact. Its CSS is already in `src/styles/wordhoard.css`.

## Stack

| Concern | Choice |
|---|---|
| Build | Vite 8, TypeScript 6 (needs Node 20.19+; `.nvmrc` pins 24) |
| UI | React 19 |
| Routing | React Router 7 (`BrowserRouter`) |
| Data fetching and caching | TanStack Query 5 |
| Styling | Plain CSS with the artifact's tokens; light and dark via `data-theme` |
| Lint | oxlint (Vite template default) |
| Tests (phase 6) | Vitest + React Testing Library |

## Data sources

| Need | Source | Client |
|---|---|---|
| Senses, examples, tags, forms, IPA, synonyms | freedictionaryapi.com (Wiktionary, CC BY-SA 4.0) | `src/api/freeDictionary.ts` |
| Suggestions, similar spellings, collocates | Datamuse (100,000 requests/day, no key) | `src/api/datamuse.ts` |
| Word of the day, etymology | Wiktionary Action API | `src/api/wiktionary.ts` |
| UK / US recorded audio | Wikimedia Commons | `src/api/wiktionary.ts` |
| CEFR levels, word lists, A-Z index | CEFR-J 1.5 + Octanove C1/C2 (8,845 headwords) | `src/data/cefr.json`, built by `npm run data:cefr` |
| Saved, recent, learned | `localStorage` | `src/hooks/useStoredList.ts` |

Every upstream response is normalised into `WordEntry` (`src/types/entry.ts`). Views render only
from that type, so an API can be swapped without touching components.

## Routes

| Path | View | Artifact equivalent |
|---|---|---|
| `/` | Home | `#home` |
| `/word/:word?pos=n` | Entry | `#word_n` |
| `/lists`, `/lists/:level` | Word lists | `#lists`, `#lists-b1` |
| `/browse`, `/browse/:letter` | A-Z index | `#az`, `#az-s` |

## Phases

### Phase 1 - Scaffold (done)
- Vite + React + TS project, router, query client, artifact CSS, fonts, favicon.
- Header (search form, theme toggle, section nav), footer with source credits, `/` shortcut.
- Typed API clients, `WordEntry` model, CEFR data script and generated JSON.
- Entry page rendering live data (headword, part-of-speech switch, level, IPA, senses, examples).
- Home hero and level links; placeholder Lists and Browse pages.

### Phase 2 - Search (done)
- `SearchBox` (`src/components/SearchBox.tsx`), used in the header and the home hero: Datamuse
  `/sug` calls debounced by 150 ms, arrow keys / Enter / Escape, ARIA combobox roles,
  highlight of the typed text, `/` shortcut.
- Part of speech and CEFR chip beside each suggestion, read from `cefr.json`.
- "No match" page (`src/components/NoMatch.tsx`): Datamuse `sp=` close spellings with a short
  definition each, shown as word cards; proper nouns are skipped.
- Each word that has an entry goes to the front of the `recent` list (max 8).

### Phase 3 - Entry page (done)
- Normaliser (`src/api/freeDictionary.ts`): one entry per part of speech (Wiktionary's
  per-etymology splits are merged), the leading "(physics, uncountable)" note becomes the sense
  label, obsolete / archaic / dialectal senses move to the end, IPA prefers broad `/.../` forms.
- Entry sheet (`src/components/entry/`): Save and Copy with toast, level chip and "Core
  vocabulary" marker, forms line, part-of-speech switch, UK / US pronunciation (Commons
  recording when one exists, otherwise the browser voice), verb forms table, senses with
  "+ n more examples" and "Show n more meanings" (six shown first), linked synonyms,
  collocations, word origin, previous / next.
- Sidebar: all matches, nearby words, word of the day, recent, saved, browse by level.
- Nearby words and previous / next use the alphabetical CEFR index; a word that is not on the
  lists is placed where it would sort, so no Datamuse fallback was needed.
- Word origin uses the Wiktionary TextExtracts API (plain text, so nothing to sanitise) and
  shows the first etymology only, capped at about 600 characters.
- Loading skeleton, and an error state with "Try again".
- Not done: idioms and guide-word labels (no source, see gaps below).

### Phase 4 - Home, word lists, A-Z (done)
- Home: word-of-the-day card, level cards with word counts and learned progress, A-Z tiles
  with counts, "Pick up where you left off" (four most recent words).
- Word lists (`/lists`, `/lists/:level`, `?show=todo|done`): level tabs, progress ring,
  All / To learn / Learned filter, word cards with "Mark learned" and a listen button.
- Browse A-Z (`/browse/:letter`): letter grid, big-letter panel with previous / next letter,
  headword index with part-of-speech chips that open that part of speech (`?pos=verb`).
- Long lists show 24 cards (40 index rows) at a time with "Show more". Each card or row asks
  Datamuse for its one-line definition only when it scrolls into view.
- Cards and index rows show no IPA: Datamuse's is machine-converted and disagrees with the
  entry page. The entry page remains the place for pronunciation.
- The contractions "'m", "'re", "'s" are left out of lists and the index.

### Phase 5 - Resilience and polish (done)
- Saved cache (`src/lib/queryClient.ts`): entries, origins, collocations, audio links, card
  definitions and the word of the day are kept in `localStorage` for a week, so a repeat lookup
  makes no API request. When storage fills up the oldest results are dropped; when storage is
  blocked the app runs without a saved cache. Bump `buster` when a cached shape changes.
- Failure handling: each entry box hides on its own failure; the word lists and index show
  "Try again" if the CEFR file fails to load; an error boundary keeps the header and footer
  usable if a page fails to render.
- Theme choice is remembered (`wh-theme`) and applied in `index.html` before first paint.
- Tab title and meta description per view (`src/hooks/usePageMeta.ts`).
- Accessibility: skip link, focus moves to the page content on navigation, suggestion count
  and list count are announced, and the light theme's green and blue were darkened so small
  text passes 4.5:1 (all token pairs checked in both themes).
- Not included: a service worker. Cached lookups need the app itself to be loaded, so the site
  does not open offline. Add `vite-plugin-pwa` if that is wanted.

### Phase 6 - Tests and deploy (done)
- Vitest + React Testing Library, 40 tests (`npm test`):
  - `freeDictionary.test.ts`: the normaliser against recorded responses for "light" and
    "quaint" (`src/test/fixtures/`).
  - `wiktionary.test.ts`: word-of-the-day template, etymology extraction, audio lookup.
  - `datamuse.test.ts`: card definitions, similar words, collocations.
  - `forms.test.ts`, `useStoredList.test.ts`, `SearchBox.test.tsx` (keyboard, click, `/`).
- Deployed to Vercel as project `wordhoard` (team `tim-alphas-projects`):
  https://wordhoard-blue.vercel.app. `vercel.json` rewrites every path to `index.html` so
  deep links such as `/word/light` work. Redeploy with `npx vercel deploy --prod`.
- Not set up: a Git repository on Vercel's side, so deploys are manual from this machine.
  Connecting a GitHub repo would deploy on every push.

## Known gaps against the design

| Design element | What the app will show |
|---|---|
| Learner-style definitions | Wiktionary definitions, which are denser |
| Guide-word labels on senses ("energy from sun") | Omitted; no open source |
| Curated idioms | Omitted at first; Wiktionary "Derived terms" is a possible later source |
| Phrase collocations ("a wave of nostalgia") | Single collocates from Datamuse ("deep nostalgia") |
| CEFR level on every word | "Off-list" for words outside the 8,845 headwords (e.g. serendipity) |
| Syllable breaks | Omitted; Wiktionary hyphenation data is inconsistent |

## Risks

- **Third-party uptime.** No SLA on any source. Mitigation: cached queries, per-section fallbacks.
  If it becomes a problem, add a small caching proxy; nothing in the front end has to change
  except the base URLs in `src/api/`.
- **Licensing.** Wiktionary text is CC BY-SA 4.0 and CEFR-J requires citation. Both are credited
  in the footer; keep those credits.
- **Wiktionary markup.** Etymology and WOTD come as wikitext or HTML and need careful
  sanitising before rendering.
