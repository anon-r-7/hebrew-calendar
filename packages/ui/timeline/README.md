# Biblical Timeline — build

The timeline page (`/timeline`) is a self-contained static HTML file with its data
baked in. **`events.csv` is the single source of truth.** Edit it, and the page is
regenerated from it — automatically on every build.

```
events.csv     ← every event, one row each (edit this)
build.mjs      ← reads events.csv → regenerates the page (pure Node, no deps)
template.html  ← the page shell (layout / styles / colours / fonts)
README.md
```

`build.mjs` → `../src/public/timeline/index.html`. That output is **generated, not
committed** (it's in `.gitignore`); it's rebuilt from `events.csv` on every
`yarn build` and `yarn start`. No runtime data fetch — the JSON is inlined.

## Build

It runs automatically:

- `yarn start` → `yarn timeline && vite`  (dev: regenerated, then served)
- `yarn build` → `yarn timeline && vite build`  (regenerated **before** Vite copies `public/` into `dist/`)

To regenerate on its own:

```bash
yarn timeline           # from packages/ui
# or, from anywhere:
node packages/ui/timeline/build.mjs
```

## Editing the data (`events.csv`)

One row per event. Columns:

| column | meaning |
| --- | --- |
| `section` | one of the SECTION names defined in `build.mjs` — **drives both the era and the colour group** (see below) |
| `event` | the card title |
| `date` | the label shown on the card — free text (`586 BC`, `AD 30`, `c. 40 BC`) |
| `year_signed` | numeric year used **only for positioning**: negative = BC, positive = AD |
| `AM` | Anno Mundi year (optional) |
| `heb_month` / `heb_month_name` / `heb_day` | Hebrew date (optional; renders as `Month N Day D`) |
| `precision` | `YEAR` \| `MONTH` \| `DAY (month+day)` \| `INTERPRETIVE` … |
| `confidence` | one of four tiers — `Scriptural` (fixed by the biblical text + its intervals) · `Historical` (pinned by an extra-biblical record) · `Traditional` (early-church tradition or a prophetic reading) · `Relative` (judges/kings/prophets placed by reign-sequencing between the anchors). It drives the dot shape (solid / open / dotted / dashed) and the header key; `Relative` rows also get a dashed stem, an `≈` date, and the header show/hide toggle. |
| `category` | free-form tag |
| `source` | where the event/date comes from — your sourcing methodology, per event |
| `notes` | longer note shown when a card is expanded |

- **`date` shows; `year_signed` positions.** If you change one, change the other to match (only `year_signed` must be a whole number).
- **Add an event:** add a row. Order doesn't matter — the build sorts by era then year.
- **Add a new section/era** or reorder eras: edit `SECTION_TO_ERA`, `ERA_ORDER`, and `ERA_META` in `build.mjs`.

## Colours are derived, not stored

`era` and the card **colour group** are computed from `section` + the event title
by `eraFor()` and `groupOf()` in `build.mjs` (so you don't set them per-row). If a
new event lands in the wrong colour group, tweak the keyword rules in `groupOf()`.
The four card colours themselves (green / gold / blue / grey) and the section-title
tints live in `template.html`.

## Changing wording

- **Section titles + blurbs:** `ERA_META` in `build.mjs`.
- **Browser/page title:** `TITLE` in `build.mjs`.
- **Header wordmark, footer, any other on-page copy:** `template.html`.

## Era backdrop images

Optional `.jpg` per era in `../src/public/timeline/images/<era>.jpg` (prompts in
`images/PROMPTS.md`). They show in dark mode only. A missing file just drops that
one backdrop.
