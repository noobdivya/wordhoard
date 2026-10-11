# Wordhoard

A learner's dictionary: definitions, examples, UK and US pronunciation, CEFR levels, word lists
and an A-Z index. Front end only; all content comes from free public APIs.

## Live demo

**https://wordhoard-blue.vercel.app**

## Features

- **Search** with suggestions as you type, keyboard navigation, and `/` to focus the search box
  from any page. A misspelt word shows close spellings to try instead.
- **Entry pages** with senses grouped by part of speech, example sentences, synonyms,
  collocations, verb forms, word origin, and UK and US pronunciation (IPA plus audio).
- **CEFR levels** (A1 to C2) on 8,845 headwords, with a "core vocabulary" marker up to B2.
- **Word lists** by level, with "Mark learned" and a progress ring.
- **Browse A-Z** index of every headword on the lists.
- **Word of the day**, recent searches and saved words.
- **Light and dark themes**, remembered between visits.
- Saved, recent and learned words stay in your browser (`localStorage`); there is no account
  and no backend.

## Tech stack

| Concern | Choice |
|---|---|
| Build | Vite 8, TypeScript 6 |
| UI | React 19 |
| Routing | React Router 7 |
| Data fetching and caching | TanStack Query 5, cached in `localStorage` for a week |
| Styling | Plain CSS |
| Lint | oxlint |
| Tests | Vitest + React Testing Library |
| Hosting | Vercel |

## Run it

Needs Node 20.19 or newer (`nvm use` picks the version in `.nvmrc`).

```
npm install
npm run dev        # http://localhost:5173
npm test           # unit and component tests
npm run build      # type-check and build to dist/
npm run lint
npm run data:cefr  # re-download the CEFR word lists into src/data/cefr.json
```

## Deploy

```
npx vercel deploy --prod
```

## Data sources

- Definitions, examples, forms, IPA: [Wiktionary](https://en.wiktionary.org) via
  freedictionaryapi.com, CC BY-SA 4.0
- Suggestions, similar words, collocations, card definitions: [Datamuse](https://www.datamuse.com/api/)
- Word of the day, word origin, recordings: Wiktionary and Wikimedia Commons APIs
- CEFR levels: CEFR-J Wordlist 1.5 (Tono Laboratory, Tokyo University of Foreign Studies) and
  the Octanove Vocabulary Profile C1/C2 (CC BY-SA 4.0)

See `PLAN.md` for the architecture, what each phase built, and the known gaps.
