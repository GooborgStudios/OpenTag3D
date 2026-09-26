# Automation opportunities & process gaps — raw research

Gathered by reading `index.md`, `getting-started.md`, `articles/`, `_data/supporters.yml`,
`_config.yml`, `Gemfile`, `.github/workflows/*`, and `.github/ISSUE_TEMPLATE/support.yml`.
This is a supplementary research pass, not a rewrite of [notes-repo-rundown.md](notes-repo-rundown.md) —
read that first for general repo context. Findings here feed new items into
[gaps.md](gaps.md); nothing here is in scope for the current single-file `draft-AGENTS.md` pass
(per this folder's own [AGENTS.md](AGENTS.md)).

## 1. `index.md` — feature highlights

- The three `feature_row` cards (hardware cost, data compactness, open standard) and the
  `intro` quote are hand-written prose in front matter. Low-churn, not worth automating.
- The **supporters grid** on this page (`{%- assign items = site.data.supporters.supporters -%}`)
  is already a good example of the pattern the rest of the site *doesn't* follow elsewhere: one
  data file (`_data/supporters.yml`), one render include, no duplicated prose. See §2 for where
  this pattern is missing.
- The **announcement banner** (`announcement: "[OpenTag3D v2.0](./articles/v2-already) is out
  now!"`) is a manually-edited front-matter string with no link to the actual release process.
  Nothing enforces updating or retiring it — if a v3.0 ships, someone has to remember this line
  exists and change it by hand. Low cost today (one string), but there's no changelog-driven
  automation tying "spec version bumped in `_data/spec.json`" to "update the homepage banner."
- "Did you make a design to add RFID to your printer? Let us know..." — an unstructured
  call-to-action with no intake mechanism (contrast with the supporters flow, which has a
  structured GitHub issue template — see §2/§4).

## 2. `getting-started.md` — user-facing workflows

This file contains **three separate hand-authored Markdown tables** that overlap significantly
with data that already exists in structured form:

- "Supported Printers" (printer name, support method, links, notes)
- "Supported Filament Brands" (brand, pre-programmed tags?, online export link)
- The mobile-app comparison table (app name, platform, features, spec version, notes)

Compare this against [`_data/supporters.yml`](_data/supporters.yml), which **already models**
`category` (`filament` / `hardware` / `software` / `hybrid`) and `implstage`
(`unknown` / `pending` / `active` / `v1`) per supporter, and is already rendered elsewhere via
`_includes/supporters_list.html` (used on `about.md`, and the homepage grid on `index.md`).

**The overlap is concrete, not hypothetical** — the same names appear in both places today:
"NFC Tools," "SpoolSense," "SpoolFlux," and "Polar Filament" are all entries in
`_data/supporters.yml` *and* hand-typed rows in `getting-started.md`'s tables, with no link
between them. This means:

- A supporter's implementation status can drift out of sync between the two places (e.g.
  `supporters.yml` says `implstage: "active"` for SpoolFlux, but the getting-started.md table's
  "Spec Version" column has to be updated by hand for the same fact).
- Adding a new supported printer/app currently means editing **prose tables in a page nobody
  else derives from data**, instead of extending the one data file everything else already reads
  from.
- The getting-started.md tables carry columns `supporters.yml` doesn't have yet (support method
  + links + notes for printers; pre-programmed-tags yes/no + export link for filament brands;
  platform + features + spec version for apps) — closing this gap would mean extending the
  `supporters.yml` schema (a few new optional keys per category) and replacing the three
  hand-written tables with Liquid includes, the same way the homepage/about-page grid already
  works.
- A related, smaller issue: the "Spec Version" column in the apps table is a point-in-time claim
  that nothing re-validates. Now that v2.0 has shipped (see `articles/v2-already.md`), any app
  still listing only "v1" support is a real signal worth surfacing automatically (e.g. a CI
  annotation or a "last verified" date) rather than trusting the table stays current by hand.
- **No link-checking.** `getting-started.md` alone has a dozen+ outbound links (Discord invite,
  five-plus GitHub repos/PRs, Polar Filament's guide, three app vendor sites, wakdev.com). None of
  these are checked in CI; a renamed repo or a dead vendor domain would go unnoticed until a user
  reports it.

## 3. `articles/` — content patterns

- Only two posts exist (`response-to-openprinttag.md`, `v2-already.md`), both `layout: single`
  with `title`/`description` front matter only — **no `date` field**, no `categories`/`tags`.
- There is **no listing/index page for `articles/`** — nothing enumerates them automatically.
  The only way to discover a new article is a manual link added somewhere else (currently: the
  homepage announcement banner links `v2-already` by hand; `response-to-openprinttag` isn't
  linked from `index.md`, `getting-started.md`, or `about.md` at all as far as this pass found —
  it's reachable only via direct URL or search).
- `_config.yml` has `atom_feed: { hide: true }` — the theme's feed support is explicitly turned
  off, not simply unused. Worth confirming this is still the intended choice now that there's
  recurring blog-style content; two posts is thin, but the pattern (announce spec changes /
  respond to industry news) looks likely to continue.
- Because there's no `date` front matter, even turning the feed back on wouldn't produce a
  correctly-ordered feed without an authoring convention change first.

## 4. Manual tasks that could be automated (cross-cutting list)

Ranked roughly by how concrete/cheap the win is:

1. **Generate the three getting-started.md tables from `_data/supporters.yml`** (see §2) —
   highest-value item found in this pass; removes an active, already-drifting duplication.
2. **`_data/spec.json` → `spec.md` changelog / homepage banner linkage** — nothing currently
   forces the announcement banner, changelog, or `assets/json/spec_v{N}.json` snapshot to be
   touched together when the spec version bumps, beyond the convention noted in
   [notes-repo-rundown.md](notes-repo-rundown.md) (commit `8f493d2`). A CI check that diffs
   `_data/spec.json`'s `version` against whether `spec.md`'s changelog section was also touched
   in the same PR would catch the easy-to-forget case.
3. **Supporter intake is already semi-automated (issue template → manual YAML edit) but stops
   short of full automation.** The `.github/ISSUE_TEMPLATE/support.yml` form collects
   structured fields (name, URL, category, logo) that map almost 1:1 onto
   `_data/supporters.yml`'s schema — a maintainer still hand-transcribes the issue into YAML.
   A simple `/label` or bot workflow that opens a PR pre-filled from the issue form fields would
   remove the transcription step (and its error potential) entirely.
4. **No link-checking in CI** (§2) — a Markdown/HTML link checker (e.g. `lychee` or
   `markdown-link-check`) added as a scheduled or PR-triggered job would catch dead outbound
   links before users report them.
5. **No article index/feed** (§3) — low urgency at 2 posts, but if this becomes a recurring
   announcement channel, an auto-generated `/articles/` index (Liquid loop over
   `site.pages`/collection, same pattern as the supporters grid) plus re-enabling `atom_feed`
   would remove the "manually link the new post from the homepage" step this pass observed.

These are additive to, not duplicates of, the testing/spec-validation gaps already tracked in
[gaps.md](gaps.md) (no `opentag3d.js` tests, no `spec.json` schema validation, no byte-budget
tooling) — this pass focused on the content/docs/community side rather than the protocol code.

## 5. CI/CD, testing, and community-engagement suggestions

**CI/CD** (see [.github/workflows/](.github/workflows/) — `ci.yml`, `format.yml`, `pages.yml`):

- `format.yml`'s Prettier check globs `**/*.{js,scss,json,yml,yaml}` — **Markdown is excluded**.
  With the entire site being Markdown content, formatting/style drift in `.md` files (the most
  frequently edited file type here) is currently unchecked. Adding `md` to the Prettier glob (or
  a dedicated markdownlint job) is a small, mechanical CI addition.
- `ci.yml` only proves the site *builds*; it doesn't render/screenshot pages or check for broken
  internal links (`{{ site.baseurl }}`-relative links can silently 404 in production even though
  Jekyll build succeeds). A post-build "crawl `_site/` and check internal links" step is a cheap
  addition on top of a build that already succeeds.
- `pages.yml` deploys straight to production on every push to `main` with **no staging/preview
  environment** and no smoke test after deploy (already noted in
  [notes-repo-rundown.md](notes-repo-rundown.md)). At minimum, a PR-preview build (many static
  hosts/GH Actions support deploying a PR's build to a throwaway URL) would let reviewers see
  content changes rendered before they hit production.
- Link-checking (see §4) fits naturally as a fourth workflow or an added job in `ci.yml`.

**Testing** (mostly already tracked in [gaps.md](gaps.md), summarized here for completeness):

- No unit tests for `opentag3d.js`'s pure encode/decode functions.
- No schema/overlap validation for `_data/spec.json`.
- No round-trip test tying spec `examples` to `encodeFieldValue`/`decodeTagBuffer`.
- New from this pass: no **content-level** tests at all — e.g. nothing asserts every supporter
  entry has a resolvable `logo` file, or that `navigation.yml`'s links resolve to real pages.
  A small script that validates `_data/*.yml` cross-references (logo files exist, category/
  implstage values are within the enums declared at the top of `supporters.yml`) would be cheap
  and would have caught this pass's finding in §2 (data that *should* be single-sourced but
  isn't) going forward, once that refactor lands.

**Community engagement:**

- Discord is the primary real-time community channel (`discord.opentag3d.info`, linked from
  `_config.yml` footer and `getting-started.md`), but there's no bridge between GitHub activity
  (new supporters, new releases, new articles) and Discord — announcements appear to be manual.
  A simple GitHub Actions → Discord webhook step on release/merge-to-main would close this without
  needing a bot.
- The supporter issue template (§4 item 3) is the only structured community-intake path found.
  There's no equivalent template for "I built a printer mod / firmware for OpenTag3D" (index.md
  explicitly invites this in prose — see §1 — but with no form), nor for reporting a
  third-party app that should be added to the getting-started.md app table.
- No `CONTRIBUTING.md` (already tracked in [gaps.md](gaps.md)) means first-time contributors have
  no single place to learn the "issue first, then PR" convention that already exists implicitly
  for supporters — this is as much a community-engagement gap as a docs gap.
