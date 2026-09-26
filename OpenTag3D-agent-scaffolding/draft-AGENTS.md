# AGENTS.md (DRAFT — not yet placed in the OpenTag3D repo)

> Working draft. Source research: [notes-repo-rundown.md](notes-repo-rundown.md). Once this is reviewed and settled, copy it to the OpenTag3D repo root as `AGENTS.md` in its own PR.

Guidance for AI coding agents working in this repository.

## What this repo is

**OpenTag3D** is an open, community-driven specification for RFID/NFC tags on 3D-printer filament spools — a standard, not a single app or product. This repository *is* the spec's public home: it's the source for the [opentag3d.info](https://opentag3d.info) Jekyll site, which hosts the human-readable spec, project docs, and two browser-based tools for reading/writing tags.

The spec defines four things (see [spec.md](spec.md)):

- **Hardware** — NTAG215/216 NFC tags (ISO/IEC 14443 Type A, NDEF Type 2)
- **Mechanical** — where the tag physically sits on a spool
- **Data structure** — the byte-level memory map stored on the tag (an NDEF MIME record, `application/opentag3d`)
- **Web API** — optional online supplemental data (tag data is always authoritative offline; the API can never be required)

Governance: an **OpenTag3D Consortium** (industry + community voting members, see [about.md](about.md)) owns changes to the spec itself. Site/code fixes are normal PR territory; changes to the actual field layout or version number are a standards decision, not just a code change — see "Editing the spec" below.

## Tech stack

- **Site generator:** Jekyll 4.4 (Ruby), theme `minimal-mistakes-jekyll` (dark skin). Content is Markdown with YAML front matter, plus a few raw `.html` pages.
- **Interactive tools:** `/make` ([make.html](make.html)) and `/read` ([read.html](read.html)) are Jekyll pages containing vanilla JS (ES modules, no framework/bundler) that use the **Web NFC API** to read/write tags in-browser, and can export to Flipper Zero `.nfc`, Proxmark3 `.bin`, and NFC Tools JSON formats. Shared logic lives in:
  - [assets/scripts/opentag3d.js](assets/scripts/opentag3d.js) — field encode/decode, NDEF/NTAG byte packing, Web NFC calls, format importers/exporters. This is the actual "protocol implementation" code in the repo.
  - [assets/scripts/site.js](assets/scripts/site.js) — small DOM helper (`h()`), flash messages (`msg()`), dropdown menu widget. Shared across all pages.
- **Node/npm** is used only for `prettier` formatting — it does not build the site.

## The spec is data-driven — start at `_data/spec.json`

[`_data/spec.json`](_data/spec.json) is the **single source of truth** for the tag data format (version, MIME type, and the full field list: id, type, byte offset, length, scaling, description, etc.). Everything else is derived from it:

- [spec.md](spec.md) renders it into the human-readable spec page via the Liquid include [`_includes/spec_table.md`](_includes/spec_table.md) (the field table) and [`_includes/memory_map.html`](_includes/memory_map.html) (visualization).
- [spec.json](spec.json) (repo root, note: different file from `_data/spec.json`) is a Jekyll page (`layout: none`) that just dumps `site.data.spec` as JSON — this is the public `https://opentag3d.info/spec.json` endpoint. The spec explicitly tells implementers to parse *this* at runtime instead of hardcoding field offsets, so it can't drift from prose.
- [assets/json/spec_v1.json](assets/json/spec_v1.json) is a **frozen snapshot** of an old major version's field layout. `opentag3d.js`'s `getFieldsForMajorVersion()` fetches `/assets/json/spec_v{major}.json` at runtime so the `/read` tool can still correctly decode tags written under an older major version.

**If you change the field layout or bump the version in `_data/spec.json`:**
1. Update the changelog section at the bottom of [spec.md](spec.md) to match.
2. If it's a **major** version bump, add a new frozen `assets/json/spec_v{N}.json` snapshot of the *old* layout before changing it (the legacy-version reader depends on this file existing).
3. Treat this as a spec/standards change, not just a code edit — flag it clearly rather than folding it silently into an unrelated fix, since the consortium governs the spec itself.

## Directory map

| Path | Purpose |
| --- | --- |
| `*.md`, `*.html` (root) | Jekyll pages (YAML front matter + `layout: single` mostly) |
| `_includes/` | Liquid partials (`{% include x.html %}`); some `.md` files are Liquid templates, not prose |
| `_data/` | YAML/JSON consumed via `site.data.*` — `spec.json` (the spec), `navigation.yml` (top nav), `supporters.yml` (companies list) |
| `_sass/` | Extra SCSS layered on the `minimal-mistakes-jekyll` theme |
| `assets/scripts/` | The two hand-written JS modules (`opentag3d.js`, `site.js`) — no build step, loaded as ES modules directly |
| `assets/json/` | Frozen legacy spec snapshots for backward-compatible tag reading |
| `articles/` | Blog-style posts (e.g. the response to the competing OpenPrintTag standard) |
| `.github/workflows/` | CI: Jekyll build check, Prettier format check, Pages deploy |

New supporters (companies implementing the spec) are meant to be added via the GitHub issue template ([.github/ISSUE_TEMPLATE/support.yml](.github/ISSUE_TEMPLATE/support.yml)), which a maintainer then turns into a `_data/supporters.yml` entry — don't just add entries to the yml unprompted.

## Build, dev, and CI

- **Local dev** (per [README.md](README.md), **macOS/Linux only — no Windows support** for these scripts): `./setup.sh` (npm install, `bundle install`, `mkcert -install`, `mkcert localhost`), then `npm start` → `bundle exec jekyll serve` over HTTPS. The HTTPS requirement is because Web NFC needs a secure context, not a Jekyll requirement.
  ```bash
  bundle exec jekyll build
  ```
  is the fastest way to sanity-check a content/Liquid change without the HTTPS dev server.
- **CI — build** ([.github/workflows/ci.yml](.github/workflows/ci.yml)): `bundle exec jekyll build` must succeed. This is effectively the *only* automated check that touches content/Liquid correctness.
- **CI — format** ([.github/workflows/format.yml](.github/workflows/format.yml)): `npm run format:check` (Prettier over `js`/`scss`/`json`/`yml`/`yaml`). Run `npm run format` to fix locally before committing.
- **Deploy** ([.github/workflows/pages.yml](.github/workflows/pages.yml)): auto-builds and deploys to GitHub Pages on push to `main` (custom domain via [CNAME](CNAME): `opentag3d.info`). **There is no staging environment — `main` is production.**
- **No automated tests exist for the JS protocol logic** (`opentag3d.js`'s byte encode/decode, NDEF/NTAG packing, format importers). Changes there need to be manually verified — e.g. round-tripping a value through `/make` → `/read` in a browser, ideally one with Web NFC (Chrome on Android), or by carefully re-reading the byte math. Be extra careful with anything touching tag config pages (`NFC_INFO.ntag.types.*.configPages` in [opentag3d.js](assets/scripts/opentag3d.js)) — those bytes were verified against real hardware and a mistake can leave a tag password-locked.

## Gotchas worth knowing up front

- `spec.json` (root) vs `_data/spec.json`: same data, different roles. Edit `_data/spec.json`; the root `spec.json` is generated output (and is in `.prettierignore` for that reason).
- Field `description`s in `_data/spec.json` have previously needed clarification after real confusion (e.g. clarifying that "measured length/weight" fields are production-time measurements, not realtime values) — when adding/editing a field, err toward an unambiguous description.
- `read.html` and `make.html` both assume `globalThis.OpenTag3D.spec` is populated by the page (from `site.data.spec` via Jekyll) before `opentag3d.js` runs — check the inline `<script>` at the top of those pages if `SPEC` seems to come from nowhere.

---

**Open questions before this is finalized (see also gaps.md):**
- Do we want a short "environment" note about Windows dev-server limitations, or leave that out since AGENTS.md should describe the repo, not any one contributor's machine?
- Any house style/PR conventions from the maintainer (Vinyl Da.i'gyu-Kazotetsu) we should capture that aren't visible from the code alone?
