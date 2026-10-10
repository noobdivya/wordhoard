# Wordhoard

A learner's dictionary: definitions, examples, UK and US pronunciation, CEFR levels, word lists
and an A-Z index. Front end only; all content comes from free public APIs.

Live: https://wordhoard-blue.vercel.app

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
