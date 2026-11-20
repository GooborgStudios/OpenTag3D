# OpenTag3D agent guide

Guidance for AI coding agents working in this repository. This file owns routing, hard boundaries, co-change rules, and minimal verification. Deeper procedures live in `_docs/` and nested `AGENTS.md` files.

## What this repo is

OpenTag3D is an open, community-driven specification for RFID/NFC tags on 3D-printer filament spools. This repository is the public home for the spec and the source for the [opentag3d.info](https://opentag3d.info) Jekyll site.

The repo is a website, but it publishes a binary data contract. Some edits are fixed by the next deploy; others are written onto physical tags or consumed by third-party firmware/apps. Match caution to blast radius.

The spec defines hardware, mechanical placement, on-tag data structure, and an optional Web API. Tag data must remain authoritative offline; the Web API can never become required for reading a tag.

Spec governance belongs to the OpenTag3D Consortium described in `about.md`. Site/code fixes are normal PR work; `core` field layout and version changes are standards decisions.

## Where to start

| If you're... | Read first | Key rule |
| --- | --- | --- |
| A new/outside contributor or their agent | `_docs/contributor-agent-guide.md` | Propose high-blast-radius changes; do not silently change the spec contract. |
| The maintainer or a trusted maintainer-directed agent | `_docs/maintainer-runbooks.md` | Use runbooks for triage, review, release, and context upkeep. |
| Editing site content/supporters | This file's gotchas and co-change map | Supporter data can live in two places. |
| Editing `make.html` / `read.html` | `_docs/make-read-tools.md` and `assets/scripts/AGENTS.md` | Pages expect `globalThis.OpenTag3D.spec` before shared code runs. |
| Touching `assets/scripts/opentag3d.js` | `assets/scripts/AGENTS.md` | Round-trip verify; Web NFC/config pages require extra caution. |
| Touching `_data/spec.json` | `_data/AGENTS.md` | Classify the edit first; `core` layout is a proposal, not a casual commit. |
| Cutting a version/release | `_docs/spec-change-process.md` | Maintainer-only unless explicitly delegated. |
| "Fixing" something that seems missing | `_docs/known-gaps.md` | Known gaps are not unprompted work. |

## Tech stack

- Jekyll 4.4 with the `minimal-mistakes-jekyll` theme.
- Markdown/YAML front matter plus a few raw HTML pages.
- Vanilla browser ES modules; no JS bundler/framework.
- Node/npm is used for Prettier formatting only.
- Web NFC requires a secure browser context for real tag reads/writes.

## The spec is data-driven

Edit `_data/spec.json`, not root `spec.json`.

- `_data/spec.json` is the source of truth for version, MIME type, `core` byte fields, and `web_api` fields.
- `spec.md`, `_includes/spec_table.md`, and `_includes/memory_map.html` render human-readable spec pages from `site.data.spec`.
- Root `spec.json` is a Jekyll page that publishes `site.data.spec` at `/spec.json`.
- `assets/json/spec_v*.json` files are frozen legacy snapshots used by `opentag3d.js` to decode old major versions.

## Directory map

| Path | Purpose |
| --- | --- |
| `*.md`, `*.html` | Jekyll pages and tools |
| `_docs/` | Unpublished agent/contributor reference docs |
| `_data/` | Site/spec data; read `_data/AGENTS.md` before editing spec/supporter data |
| `_includes/` | Liquid partials/templates |
| `_sass/` | Theme overrides |
| `assets/scripts/` | Shared browser JS; read `assets/scripts/AGENTS.md` before protocol edits |
| `assets/json/` | Frozen legacy spec snapshots; do not edit casually |
| `articles/` | Blog-style posts, linked manually |
| `.github/workflows/` | Build, format, and Pages deploy workflows |

## Build, dev, and verification

Common commands:

```bash
bundle exec jekyll build
npm run format:check
npm run format
```

Local HTTPS dev server, per `README.md`:

```bash
./setup.sh
npm start
```

Verify by change type:

| Change type | Minimum verification |
| --- | --- |
| Markdown/content/Liquid | `bundle exec jekyll build`; browser check if rendered layout matters |
| `js`/`scss`/`json`/`yml`/`yaml` | `npm run format:check` |
| `make.html` / `read.html` UI | Jekyll build plus browser check of affected flow |
| `opentag3d.js` protocol logic | Node round-trip recipe in `assets/scripts/AGENTS.md` plus browser check |
| `_data/spec.json` | `_data/AGENTS.md` checklist, changelog, byte-map checks as applicable |
| Web NFC write/config behavior | Ask first; verify with supported Chrome/Android/Web NFC and a disposable tag, or state not locally verified |

CI runs Jekyll build and Prettier checks. GitHub Pages deploys `main` to production; there is no staging environment in this repo.

## Boundaries

Always:

- Edit `_data/spec.json`, never root `spec.json`, when changing spec data.
- Pair `_data/spec.json` changes with a `spec.md` changelog entry.
- Keep Jekyll build and `npm run format:check` green for touched file types.
- Keep tag data usable offline; the Web API is supplemental only.

Ask first:

- Any `core` field layout, requiredness, size, meaning, or top-level `version` change.
- NTAG config-page, AUTH0/PWD/PACK, or Web NFC write-path edits.
- Adding a supporter without matching issue/maintainer context.
- Workflow, `Gemfile`, `package.json`, or release-process changes.

Never:

- Push directly to `main`; it is production.
- Create or push git tags unless the maintainer explicitly instructs you.
- Edit an existing `assets/json/spec_v*.json` casually.
- Make the Web API required for tag interpretation.
- Edit consortium/governance membership in `about.md` unprompted.

## Co-change map

| When you change... | Also update/check... |
| --- | --- |
| `_data/spec.json` anything | `spec.md` changelog |
| `_data/spec.json` `version`, major bump | New frozen `assets/json/spec_v{oldMajor}.json` before current layout changes |
| `_data/spec.json` `core` layout | Byte-map stamp/table in `_docs/spec-data-model.md` |
| Supporter status/details | `_data/supporters.yml` and affected `getting-started.md` tables |
| New article | A link from somewhere; articles are not auto-listed |
| Workflows, scripts, directories, or agent-routing assumptions | This file and the owning `_docs/` page |

## Gotchas

- Root `spec.json` and `_data/spec.json` have different roles. The root file publishes data; `_data/spec.json` is the editable source.
- `make.html` and `read.html` depend on an inline Jekyll script setting `globalThis.OpenTag3D.spec` before `opentag3d.js` evaluates.
- Existing `assets/json/spec_v*.json` snapshots support tags already in the field.
- `getting-started.md` duplicates some supporter/product data by hand.
- New `articles/` pages are not discovered automatically.
- There are no automated protocol tests yet; verification evidence matters.

## Keeping context current

If an agent doc is wrong, fix it in the same PR as the work that exposed the problem. If you add a rule, put it in the one place it belongs and link to it; see `_docs/decisions.md`.
