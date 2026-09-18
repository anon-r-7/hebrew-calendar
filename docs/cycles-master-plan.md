# Cycles master plan

**Status (2026-09-16): built.** Everything below is implemented on the working tree and applied to the local database. Prod still needs the migrations run (see Deploy). This document is now the record of what was built and why; the original phase plan follows for reference.

## What was built

**Engine** — `packages/api/src/utils/analysis.js` (plain JS so migrations can require it), ANALYSIS_VERSION 3. `analyzePair(a, b, tol, mode)` reads a span as k + r/d rungs of 8190 over the divisors of 8190 up to 30 (plus the half/quarter denominators 4, 8, 12, 20, 28), plus whole 7 / 360 / 364 / 1260 / 2548 periods and the Hebrew-year layer, which only counts on the same Hebrew month and day. Every hit carries a signed offset up to ±3 days: **+1 means the span is one day short of the clean value (counting the first day makes it exact — the old include-first-day), −1 one day over.** Tolerance is a filter, not a score: `mode: 'exact'` (what the UI uses) keeps only hits in the bucket (tol−1, tol] — 0 is exact, ±1 catches ½ and 1, ±2 catches 1¼–2, ±3 catches 2¼–3 — and a pair or candidate is listed only if it has such a hit.

Scores are a 0–10 tier scale: whole rung 8 (+1 named rung, +½ whole in both calendars, +½ self-similar 90m/91m, so k=91 is 9.5 and k=360 is 10); fractions of a rung by denominator (½ 6.5, ⅓ ¼ 6, ⅕–⅛ 5.5, ⅑–1/16 5, coarser 4.5, +½ when the whole part is a named rung and d ≤ 10); classic 2548 → 6, 1260 → 5.5, 364 / 360 → 4.5, weeks 1; same-date Hebrew years: jubilee multiple 6 (6.5 if also a named count), named count 5, sabbatical 3, plain 2.5; both ends jubilee years 1; same day of month 1. A hit implied by a larger-period hit at the same offset is dropped. Pair score = best + ¼ second + ⅒ third, capped at 10. The offset never changes a score.

**Persistence** — migration `20260915000000-pair-analysis.js` adds `analysis JSONB`, `score`, `analysis_version`, `hebrew_years`, `same_month_day` to `events_pairs` and backfills. `recalcPairs` stores the analysis on create and on event edit; `yarn analyze:pairs [--all]` recomputes (stale-only by default).

**Endpoints** (all behind login)
- `GET /events` — each event now carries `from_creation` (days, y364, y360, and its reading from Creation day 1 and day 8).
- `GET /events/:uuid/candidates?tol=` — every other event analysed against this one, ranked by score, minus existing partners.
- `GET /events/cycles?period=&tol=&anchor=` — same-rung groups (residue classes) under a day period or a Hebrew-year modulus (y49 / y50 / y7), from Creation day 1 / day 8 / any event.
- `GET /events/project?anchor=` — the named rungs from the anchor as calendar dates with nearby events, and every event's reading from the anchor.
- `GET /events/pairs` gains `tol`, `min_score`, `family`, `flag`, `hebrew_years`, `same_month_day`, and `sort=score` (scored in SQL over the stored hits at the requested tolerance).
- Public `dates/days-between-dates?detail=true` now returns `analysis` too.

**UI**
- Pairs (tab order is now Cycles, Pairs, Events; the calendar "+ Event" link still opens Events): tolerance control (0 / ±1 / ±2 / ±3, remembered, "only that bucket"), Interest (min score) and Hits (family / flag) filters, sort by Interest (default). Cards show the score and best hit; at ±1–±3 an offset column between Event B and the numbers (exact / +1d / −2d …); the detail strip has the hit chips and five metric columns (Revelation, Enochian, Hebrew years, fractional new moons, weeks + half days). Include-first toggle removed.
- Add pair: Event B is the server ranking for the chosen Event A, each row with its score and top hits; Interest filter on the list; Only-whole switches removed. Saving keeps Event A.
- Events: From Creation column (days, rungs, best reading when it scores ≥ 2).
- Cycles tab: a **view** switch (Ladder · Event groupings · Events, remembered per browser) above the controls, and only the controls that change the view in front of you — Ladder has period + anchor, Event groupings has period + tolerance (the anchor cannot change which events group, it only renumbers, so it is hidden and pinned to Creation day 1), Events has all three.
  - **Ladder**: the anchor stepped along the period. 8190 lists every multiple of 44, 56, 90 and 91; a multiple of 8190 lists every step; any other day period lists only the steps with an event within ±14 days; year periods have no ladder. Columns: k (or step), Revelation, Enochian, Hebrew, Gregorian, and events ±14 days with any holiday on the day.
  - **Event groupings**: events sharing a residue, i.e. a whole number of periods apart. At ±1–±3 each group is its baseline members (a muted `0d` badge) plus the ones that miss by exactly that much.
  - **Events**: every event read against the chosen period from the anchor, ordered by how close it sits to a whole multiple, with that reading (`44 × 8,190`, `exact` / `+1d` / a plain distance), its score, and the hits that survive the tolerance. Rows on the period at the chosen tolerance are highlighted.
  - Period menu: fractions of 8190, the rung, its multiples (k = 4 / 16 / 44 / 56 / 90 / 91), other periods (2548, 1260), and the year layers (Revelation, Enochian, jubilee mod 49, sabbatical mod 7).
- Days Between (public): a Cycles panel under the breakdown table.

## Verification (2026-09-16)

- Engine: 20,000 randomised spans property-tested (reconstruction of days from k + r/d, flag rules, dedupe, weighted score rule, `atTolerance` ≡ `analyzePair` at every tolerance, year-layer rules, edge cases) — pass.
- API: every event's candidates at tol 0 and 2 (count, exclusions, ordering, day counts, tolerance); 180 cycles calls (15 periods × 3 anchors × 4 tolerances, 1,989 groups: pairwise spread ≤ tol, residue arithmetic); projection from all three anchors; 21 pairs-filter combinations; SQL score == engine score for every pair at tol 0–3 and `min_score` set equality — pass.
- Write path: create → 409 on duplicate and reversed duplicate, 400 on same event / missing event, 404 unknown; favorite PATCH; event date edit recalculates its pairs (days +31, version 2); candidates exclude new partners; deletes; include_first_day ignored by the engine; public days-between with and without detail, BC dates — pass, no leftovers.
- Browser: Events, Event Pairs (filters, sort), add-pair with ranked Event B, save through the queue, Cycles (8190 from Creation, y49 from 1st Temple Jubilee), Days Between panel, light mode, phone width.

Fixes made during verification: SQL score now applies the engine's 1 / 0.5 / 0.25 weights (sort by Interest was wrong before); same-rung groups no longer chain past the tolerance (every pair of members is within ±tol); malformed uuids return 404 instead of 500; `day_index` on events is numeric; fetch failures show an error instead of "0 candidates"; fractions capped at 1/30 of a rung; named-rung-plus-fraction bonus only for denominators ≤ 10.

**Generator.** `generatePairs()` in `EventsPairs/methods.ts` is the standing rule: score ≥ 4.5 within ±3 days, favorite at ≥ 6, existing pairs skipped (it only adds). It runs automatically, restricted to the one event involved, after every event create and after every event re-date (a name-only edit does not trigger it; pairs that stop being interesting after a re-date are kept). `yarn pairs:generate [--min-score 4.5] [--tol 3] [--favorite 6] [--reset] [--dry-run]` runs the same function over every event for a full sweep; `--reset` deletes all pairs first. On the 0–10 scale 4.5 is a whole 364/360-year or any rung fraction, 6 a ⅓-rung or a same-date jubilee multiple, 8 a whole rung.

## Deploy

Pending prod migrations, in order: 20260912000000, 20260913000000, 20260913000001, 20260913000002, 20260913000003, 20260915000000, 20260916000000 (seeds the three 3rd Temple candidate events, so the generator includes them). Stop the API, `yarn db:migrate`, deploy api + ui. The last migration backfills the analysis for every pair (209 pairs, a few seconds). Whenever the engine rules change: bump `ANALYSIS_VERSION`, deploy, run `yarn analyze:pairs`.

Then, to replace the hand-made pairs with the engine's set (destructive — deletes all 209 pairs and their favorites):

```bash
cd packages/api && yarn pairs:generate --dry-run --min-score 5.5 --tol 2   # look first
```

```bash
cd packages/api && yarn pairs:generate --reset --min-score 5.5 --tol 2 --favorite 8
```

Without `--reset` it only adds pairs that are missing.

## Not built (deliberately)

- The old numeric measure filters (Measure / min / max / divisible by) are still there; they could be folded into the engine later.
- The candidate list is client-filtered by Interest; the server returns all candidates (cheap at this size).

---

# Original plan (reference)

Goal: move the Events tooling from "pairs that are whole in one calendar" to the interlaid 364/360 system: the 8190 ladder, signed tolerance, the Hebrew-year layer, and class views. Nothing here is implemented yet. Each phase is one migration (where needed) plus API and UI work, and each is deployable on its own.

Background: `docs/` does not hold the analysis; the prod analysis and the ladder write-up live in the session scratchpad (`prod/REPORT.md`, `prod/LADDER.md`). Key facts they establish:

- lcm(364, 360) = 32,760 = 90 × 364 = 91 × 360. 8,190 = 32,760 / 4 = 90 × 91.
- Whole 364-year and 360-year pairs occur at the chance rate. Divisibility by 8190 and its integer divisions (4095, 2730, 1638, 1365, 819) is far above chance in prod.
- The cleanest patterns are in Hebrew year numbers (490, 3000, 1000, jubilee years ≡ 12 mod 49), which nothing measures today.
- The include-first toggle is a +1 tolerance in disguise; −1 and ±2 do not exist.

---

## Phase 1 — Signed tolerance replaces "whole"

**Definition.** For a span of `days` and a period `P`, `offset(P) = ((days + P/2) mod P) − P/2`, a signed integer in (−P/2, P/2]. "Whole within k" means `|offset| ≤ k`. Include-first-day is `offset = −1` of the exclusive count. Tolerance is a filter setting, not a property of the pair, so it needs no new columns.

**API** (`packages/api/src/models/EventsPairs/methods.ts`)
- `listPairs` filter gains `tol` (0, 1, 2; default 0). The `whole` predicate for a field with period P becomes `(days % P) <= tol OR (P - days % P) <= tol`, computed on the stored `days` column. Fields and periods: weeks 7, years_364 364, years_360 360, months_364 (364/12 is not integer, drop from whole tests), months_360 30, plus the phase-2 periods.
- `new_moons` wholeness stays as today (same day of month); tolerance for it means dd within ±k, computed from the stored sides.
- Response adds `offsets: {weeks, years_364, years_360, …}` so the UI never recomputes.

**UI**
- `utils/breakdown.ts` gets `offset(days, P)` and `wholeWithin(days, P, tol)`.
- Pair card: number shows the offset when nonzero and within 2, e.g. `1050 y364 +1d`, `2637 y360 −2d`. The "incl. first day" label becomes part of the same notation.
- Event Pairs toolbar: Measure row gains a tolerance segment `0 · ±1 · ±2`.
- Add-pair card: the Only whole group gets the same segment, applied client-side to Event B candidates.

**Deploy:** no migration.

---

## Phase 2 — Ladder measures, persisted

**Migration** `events_pairs`: add numeric columns `cycles_32760`, `cycles_8190`, `cycles_4095`, `cycles_2730`, `cycles_1638`, `cycles_1365`, `cycles_819` (days ÷ period) and `half_years_364`, `half_years_360`, `quarter_years_360`. Backfill from `days`. Index `cycles_8190`, `cycles_2730`, `cycles_1638`.

**Breakdown** (`packages/api/src/utils/breakdown.ts`, `packages/ui/src/utils/breakdown.ts`): add the same fields; `BREAKDOWN_FIELDS` grows accordingly so `recalcPairs` and `createPair` persist them.

**Filters:** the Measure select gains a "Ladder" group: 32760, 8190, 4095, 2730, 1638, 1365, 819. "Whole" on a ladder measure means whole rungs; add "half" as a second option (x.5) since odd k on 8190 is a half-year in 364.

**Badges:** `DIVISORS` gains 32760, 4095, 2730, 1638, 1365, 819. Badge shows `÷8190` as today; on hover the rung index and both year readings (`k=91 · 2047.5 y364 · 2070.25 y360`).

**Days Between tool:** the breakdown table gets a Ladder section with the same rows so the public tool shows it too.

---

## Phase 3 — Hebrew-year layer

**Migration** `events_pairs`: `hebrew_years INTEGER` (yy_b − yy_a), `same_month_day BOOLEAN`, `years_mod_49 SMALLINT`, `years_mod_50 SMALLINT`, `years_mod_7 SMALLINT`. Backfill from the joined `hebrew_dates`. Index `hebrew_years` and `same_month_day`.

**Filters:** Measure select gains "Hebrew years" with min/max/exact; a "same date" switch (same Hebrew month and day); a "jubilee-aligned" switch (`years_mod_49 = 0`); "sabbatical" (`years_mod_7 = 0`).

**Pair card:** a fourth line under the days total: `490 Hebrew years · same date` when same_month_day, otherwise `490 Hebrew years`. Detail strip gains a column for the year layer.

**Events list:** column "AM year mod 49" only in the expanded view, to see jubilee families at a glance.

Phases 1–3 ship together: one migration file for 2 and 3, one `recalcPairs` over every pair, one deploy.

---

## Phase 4 — Cycles tab (classes instead of pairs)

New tab `Events | Event Pairs | Cycles`.

**Controls:** period (364, 360, 2548, 8190, 32760, or a Hebrew-year modulus 7 / 49 / 50), tolerance (0, ±1, ±2), anchor (Creation day 1, or any event via the picker), and a "half rungs" switch for 8190.

**Query** (`GET /events/cycles?period=&tol=&anchor=`): one pass over `events` joined to `hebrew_dates`; `residue = (day_index − anchor_index) mod period`; group by residue with tolerance merging (residues within tol of each other join one class; wrap at the period boundary). Returns classes sorted by size, each with its events, the class residue, and each member's signed offset from the class centre.

**UI:** class cards, largest first: header `residue 290 · 3 events`, then the members as the same stacked event blocks used in the picker, each with its offset badge (`+1d`). Clicking a member sets it as the anchor. A "save all pairs in this class" action creates the missing pairs through the existing queue.

**Also:** the Event B candidate filter in the add-pair card reuses the residue math, so "Only whole" becomes "same class as Event A under the selected period and tolerance".

---

## Phase 5 — From-Creation columns and rung projection

**Events list:** optional columns `days from Creation`, `y364`, `y360`, and `rung` (nearest k × 8190 with signed offset, shown only when |offset| ≤ 14).

**Event detail / picker card:** a "Project" action: from this event, list the named rungs (k = 16, 44, 56, 88, 90, 91, 112, 132, 176, 264, 308 and 6000 y364 / 6000 y360) as real dates via `hebrew_dates`, and flag any that land within ±14 days of another event. This is the "anchor + rung → date" query already used in the analysis, exposed in the UI.

**Days From tool:** unit select gains "8190 rungs" so the public tool can step the ladder from any date.

---

## Order and deploy

1. Phase 1 (no migration) can ship immediately.
2. Phases 2 + 3: one migration `2026xxxx-pair-ladder-and-year-layer.js`, recalc all pairs, deploy api + ui.
3. Phase 4, then 5.

Pending before any of this: the five migrations already waiting for prod (20260912000000 through 20260913000003).
