# Repo rundown — raw research notes

Gathered by reading the OpenTag3D repo directly (README, spec.md, about.md, _config.yml, _data/spec.json, assets/scripts/*.js, .github/workflows/*, make.html/read.html). This is the source material the draft AGENTS.md is built from — kept here so we can revise the draft without re-deriving everything from scratch.

## What it is

- OpenTag3D: an open, community-driven **specification** for RFID/NFC tags on 3D-printer filament spools. Not a single app/product.
- This repo is the spec's public home: source for the Jekyll site at opentag3d.info (custom domain via `CNAME`), deployed via GitHub Pages.
- Defines: Hardware (NTAG215/216 NFC), Mechanical placement on spool, Data structure (byte-level memory map in an NDEF MIME record `application/opentag3d`), optional Web API (supplemental only, tag must remain fully offline-usable).
- Governed by an **OpenTag3D Consortium** — industry + community voting members vote on spec changes (see about.md). Non-voting members can propose changes. This matters for agents: editing `_data/spec.json`'s field layout/version is a standards decision, not just a code edit.
- History: started as "Open 3D-RFID" inside the Bambu Research Group (reverse-engineering Bambu Lab's proprietary tags), later spun out to its own repo under Gooborg Studios. Competing standard "OpenPrintTag" (Prusa) announced Oct 2025 — OpenTag3D continues independently (see articles/response-to-openprinttag.md).

## Tech stack

- **Jekyll 4.4** (Ruby), theme `minimal-mistakes-jekyll`, dark skin. Plugins: jekyll-include-cache, jekyll-gfm-admonitions.
- Content: Markdown + YAML front matter, plus a few raw `.html` pages (make.html, read.html, memory-map.html).
- **Two interactive JS tools**, each a Jekyll page:
  - `/make` (make.html, ~995 lines) — builds tag data from a form (generated from spec fields) and writes it via Web NFC, or exports to Flipper Zero/.nfc, Proxmark3/.bin, NFC Tools JSON.
  - `/read` (read.html, ~711 lines) — reads a tag via Web NFC or imported dump, decodes fields, displays them.
  - Shared logic:
    - `assets/scripts/opentag3d.js` (852 lines) — the real "protocol implementation": field encode/decode (`encodeFieldValue`, `decodeTagBuffer`), NDEF/NTAG byte packing (`buildNtagPageDump`), Web NFC calls (`readViaWebNFC`/`writeViaWebNFC`), format importers/exporters (Flipper `.nfc`, Proxmark3 `.bin` incl. mfu header, NFC Tools Desktop/mobile JSON). Also handles legacy major-version field layouts by fetching `/assets/json/spec_v{major}.json` on demand.
    - `assets/scripts/site.js` (123 lines) — tiny DOM helper `h()`, flash alert `msg()`, `.btn-menu` dropdown widget. Used site-wide.
  - Plain ES modules, no bundler, no frontend framework.
- **Node/npm**: only used for Prettier formatting (`package.json` has no site-build script). `npm start` runs Jekyll via Ruby, not Node.

## The spec is data-driven

- `_data/spec.json` = single source of truth. Contains `version`, `mime_type`, and `core.fields[]` (each field: name, id, required, added-version, type, unit, scaling, start address, length, usage, examples, description).
- Derivations:
  - `spec.md` — human-readable page. Pulls in `_includes/spec_table.md` (Liquid template rendering the field table from `site.data.spec`) and `_includes/memory_map.html` (visualization, 35KB — likely SVG/HTML generated map).
  - `spec.json` (repo root, **different file from `_data/spec.json`**) — Jekyll page with `layout: none` that outputs `{{ site.data.spec | jsonify }}`. This is the public `https://opentag3d.info/spec.json` — spec.md explicitly tells implementers to parse this at runtime instead of hardcoding offsets. It's in `.prettierignore` since it's generated output, not authored.
  - `assets/json/spec_v1.json` — frozen snapshot of a prior major version's `core.fields`, used by `opentag3d.js`'s `getFieldsForMajorVersion()` so old tags can still be decoded correctly. New major bumps need a new `spec_v{N}.json` before the fields change.
- Confirmed via commit `8f493d2` ("Update descriptions for common points of confusion"): editing `_data/spec.json` field descriptions is commonly paired with a `spec.md` changelog entry addition in the same commit — they're meant to move together.
- Changelog lives at the bottom of spec.md (manually maintained list, e.g. "2.003 - Added a qa_status property...").

## Directory map

| Path | Purpose |
|---|---|
| root `*.md` / `*.html` | Jekyll pages (front matter + `layout: single` mostly) |
| `_includes/` | Liquid partials; some `.md` files (`spec_table.md`, `web_api_example.md`, `web_api_properties.md`) are Liquid templates, not prose |
| `_data/` | `spec.json` (the spec), `navigation.yml` (top nav — Getting Started/About/Spec/Read/Make/GitHub), `supporters.yml` (companies list, rendered via `_includes/supporters_list.html`) |
| `_sass/` | extra SCSS (buttons, dialogs, flash messages, a custom font) layered on the theme |
| `assets/scripts/` | `opentag3d.js`, `site.js` — hand-written, no build step |
| `assets/json/` | frozen legacy spec snapshots |
| `articles/` | blog-style posts |
| `.github/workflows/` | `ci.yml` (Jekyll build), `format.yml` (Prettier check), `pages.yml` (deploy) |
| `.github/ISSUE_TEMPLATE/support.yml` | how new supporters are supposed to get added (issue → maintainer adds to `_data/supporters.yml`), not a direct PR to the yml |

## Build / dev / CI

- Local dev per README: **macOS/Linux only, explicitly no Windows support**. `setup.sh` → `npm i`, `bundle install`, `mkcert -install`, `mkcert localhost`; then `npm start` → `bundle exec jekyll serve --host 0.0.0.0 --ssl-cert ... --ssl-key ...`. HTTPS is required because Web NFC needs a secure context, not because Jekyll needs it — `bundle exec jekyll build` alone (no serve, no SSL) is likely sufficient for pure content changes and should work cross-platform.
- CI `ci.yml`: `bundle exec jekyll build` on push/PR to main — effectively the only automated correctness check.
- CI `format.yml`: `npm run format:check` (Prettier over js/scss/json/yml/yaml) on push/PR.
- CI `pages.yml`: builds + deploys to GitHub Pages on push to `main` only. **No staging — main is production.**
- **No automated tests for the JS protocol logic whatsoever.** `opentag3d.js`'s encode/decode/NDEF-packing functions are pure and testable (no DOM/Web NFC dependency in most of them) but nothing currently covers them. Changes need manual verification via `/make` → `/read` round-trip in a browser (ideally Web-NFC-capable, e.g. Chrome on Android) or careful manual byte-math review.
- Tag "config pages" (`NFC_INFO.ntag.types.*.configPages` in opentag3d.js) are commented as "verified byte-exact against 3 real NTAG215 tags" — getting AUTH0 wrong can password-lock a tag. High-caution zone for any agent-driven edit.

## Misc gotchas

- `spec.json` (root, generated) vs `_data/spec.json` (authored) — easy to confuse, only one is meant to be hand-edited.
- `read.html`/`make.html` expect `globalThis.OpenTag3D.spec` to already be populated (from `site.data.spec` via an inline Jekyll-rendered `<script>`) before `opentag3d.js`'s module-level `const SPEC = ...` runs.
- This session is running on Windows, which the README says isn't supported for the dev-server scripts — worth deciding whether to document a workaround (WSL?) or just note the limitation.
