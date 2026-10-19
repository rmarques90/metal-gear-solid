**English** · [Português](README.pt-BR.md)

# Metal Gear Solid Guide

An interactive site that gathers the story of the first four Metal Gear Solid games, organized by section, with favorites saved in the browser and a timeline of the main plot events.

Games covered:

- Metal Gear Solid (1998)
- Metal Gear Solid 2: Sons of Liberty (2001)
- Metal Gear Solid 3: Snake Eater (2004)
- Metal Gear Solid 4: Guns of the Patriots (2008)

> Fan project, not affiliated with Konami or Hideo Kojima.

## Features

- **Section-based reading:** each game has a button-style table of contents, collapsible sections and subsections, and a **Summary** button that opens a short summary of the section in a popup.
- **Favorites:** mark sections with the star. Favorites are stored in the browser's IndexedDB and appear grouped by game on the **Favorites** page.
- **Timeline:** an SVG chart with the 21 plot events, in story order. It has autoplay (play/pause), manual navigation, keyboard support (arrow keys and space), and a progress bar that follows playback.
- **Timeline-to-text links:** each event has a **Go to section** link that takes you to the matching paragraph in the guide and highlights it.
- **Two languages:** Portuguese (Brazil) and English. The language is part of the URL (`/pt-BR/...` and `/en/...`) and is remembered between visits. If the browser is set to Portuguese, the site opens in pt-BR.
- **Credits and attribution:** an **About** page with the content license, and a **Credits** page listing the source of each text, cover and image.

## Stack

- [Vue 3](https://vuejs.org/) with `<script setup>` and [Vite](https://vite.dev/)
- [Vue Router](https://router.vuejs.org/) for routes with a language prefix
- [Pinia](https://pinia.vuejs.org/) for the favorites state
- [vue-i18n](https://vue-i18n.intlify.dev/) for interface text
- [Dexie](https://dexie.org/) on top of IndexedDB for favorites and preferences
- [Vitest](https://vitest.dev/) for unit tests
- [Playwright](https://playwright.dev/) for end-to-end tests
- [cheerio](https://cheerio.js.org/) and the Wikipedia API to generate the data

## Requirements

- Node.js 20 or newer
- npm

## Installation and usage

```bash
npm install            # install dependencies
npm run dev            # development server (http://localhost:5173)
npm run build          # production build in dist/
npm run preview        # serve the build locally
```

Tests:

```bash
npm test               # unit tests (Vitest)
npm run test:e2e       # end-to-end tests (Playwright, builds and serves the site automatically)
```

The first time you run the e2e tests, install the Playwright browser:

```bash
npx playwright install chromium
```

## Data

The game content is generated from English Wikipedia and is versioned in `src/data/`. You don't need to run the pipeline to use the site; the scripts are there to regenerate or update the data.

Suggested order:

| Command | What it does |
| --- | --- |
| `npm run dados:wiki` | Downloads the four articles and generates `src/data/en/mgs1..4.json` (sections with stable IDs) |
| `npm run dados:capas` | Downloads the game covers to `src/assets/capas/` and generates `src/data/capas.json` with their credits |
| `npm run dados:imagens` | Downloads the timeline event images to `src/assets/timeline/` and updates their credits in `timeline.json` |
| `npm run dados:paragrafos` | Links each timeline event to the most relevant paragraph of its section (the `paragrafo` field) |

Important points:

- `src/data/en/` is the source. `src/data/pt-BR/` contains the translations, and each file is still marked with `"revisado": false`.
- Section IDs come from the English title (e.g. `mgs2/synopsis/plot`) and do not change with translation. That is why a favorite works in both languages.
- The translation keeps the same number of sections and paragraphs as the original. The timeline's `paragrafo` field is valid for both languages for this reason.
- Fixed translation terms (character names, titles and brand terms) live in `scripts/glossario.json`.
- The timeline (`src/data/en/timeline.json` and `src/data/pt-BR/timeline.json`) is curated by hand. Main fields:
  - `anoHistoria`: year in the story, used to order the timeline;
  - `ordemHistoria`: sequence within the same year;
  - `anoLancamento`: the game's release year;
  - `secaoId`: the section linked to the event.
- The scripts use the public Wikipedia API, which rate-limits requests. They already retry on HTTP 429.

## Project structure

```
src/
  components/   reusable components (language selector, summary popup, flags)
  data/         game data per language, loaders, and summary/preview helpers
  db/           local database (Dexie): favorites and preferences
  i18n/         vue-i18n setup and interface text (pt-BR and en)
  router/       routes with language prefix
  stores/       Pinia store for favorites
  views/        pages: home, game, favorites, timeline, about, credits and 404
  assets/       covers and timeline images
  __tests__/    unit tests
e2e/            end-to-end tests
scripts/        data collection pipeline and translation glossary
public/         static files (favicon)
```

## License and credits

**Text content:** the game texts are adapted from [English Wikipedia](https://en.wikipedia.org/) articles, published under the [CC BY-SA 4.0 license](https://creativecommons.org/licenses/by-sa/4.0/). The Portuguese translations are derived from those texts and follow the same license.

**Images:** covers, screenshots and icons belong to their respective rights holders (Konami, Kojima Productions and the photo authors). They are shown with credit to the original source. The site's **Credits** page lists each file and its origin.

**Code:** the code license has not been defined yet.

Metal Gear and the characters mentioned are trademarks and properties of Konami and Kojima Productions. This is a fan project, not affiliated with those companies.
