# `_data/` agent notes

This file owns local rules for data files. Root `AGENTS.md` routes here before spec, density, supporter, or navigation data edits.

## `spec.json`: classify the edit first

`_data/spec.json` is the editable source for the public spec data. The root `spec.json` page is generated from it; do not edit root `spec.json` to change the spec.

| Edit class | Typical version effect | Agent posture |
| --- | --- | --- |
| Description or wording clarification | patch | Do it when requested; add a `spec.md` changelog entry. |
| New `web_api` field | minor | Do it when requested; add changelog; flag as a spec change in PR notes. |
| New `core` field in unused space | minor | Draft as a proposal; maintainer/consortium decides. |
| Move, resize, remove, or reinterpret a `core` field | major/breaking | Proposal only; legacy snapshot requirement applies. |
| Top-level `version` change | release-dependent | Ask first unless explicitly assigned by maintainer. |

## `core` field checklist

Before changing any `core.fields` byte layout, read `_contributing/spec-data-model.md` and verify:

- `type` is implemented by `encodeFieldValue()` and `decodeTagBuffer()` in `assets/scripts/opentag3d.js`: `int`, `utf8`, `ascii`, `rgba`, `date`, or `time`.
- No byte range overlaps another field.
- `start` + `length` fits inside `core.address_range`.
- `id` remains unique and stable unless the change is explicitly breaking; deprecated fields use the `deprecated_` prefix (skipped by `assets/scripts/make.js` and handled in `decodeTagBuffer()` if migrated).
- `added` is set to the introducing spec version.
- `_data/spec.json` and `spec.md` changelog change together.
- Major bumps freeze the old layout into `assets/json/spec_v{oldMajor}.json` before current fields move.

Unrecognized `core` types can fail silently during decode. Jekyll build success is not proof a spec edit is safe.

## `supporters.yml`

Supporter entries should come from a GitHub issue or maintainer direction. The enum lists at the top of the file are authoritative for `category` and `implstage` values.

Some supporter/product facts are duplicated by hand in `getting-started.md` tables. When a requested supporter edit affects those tables, update both files or say clearly why only one changed.

Do not add or change consortium/governance membership in `about.md` as part of a supporter-data task unless explicitly asked.

## `material_densities.json`

`make.html` injects `_data/material_densities.json` into `globalThis.OpenTag3D.materialDensities`, and `assets/scripts/make.js` uses it for two features:

- Populating the `material` field's `<datalist>` with material keys whose UTF-8 byte length fits `material.length` in `_data/spec.json` (currently 5 bytes).
- Auto-filling `density` from `material` + `material_mod` (matched case-insensitively, falling back to the `""` base entry).

Density data is sourced from SpoolmanDB-Community (see `articles/filament-lookup.md`). Run `npm run format:check` and `bundle exec jekyll build` after edits, and browser-check `make.html` if keys or nesting change.

## `navigation.yml`

Navigation changes are site UX changes. Verify the target page/link exists and run the normal Jekyll build/format checks.
