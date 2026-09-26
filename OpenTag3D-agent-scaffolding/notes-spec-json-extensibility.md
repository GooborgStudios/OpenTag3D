# `_data/spec.json` deep dive — field model, extensibility, validation

Follow-up research beyond [notes-repo-rundown.md](notes-repo-rundown.md), triggered by wanting
to understand exactly how new fields get added to the spec and what (if anything) stops a bad
edit. Source: reading `_data/spec.json` in full, `assets/scripts/opentag3d.js`'s
`encodeFieldValue`/`decodeTagBuffer`, `_includes/spec_table.md`, `make.html`'s form/validation
code, `assets/json/spec_v1.json`, and both CI workflows.

## 1. Field definition structure

Two independent sections, each with its own `fields[]` array:

- **`core`** — the on-tag byte layout. Address range `0x00`–`0xDF` (224 bytes total, NTAG215/216
  user memory). Every field here has a fixed byte position and is part of the binary format.
- **`web_api`** — the optional supplemental JSON API. No byte constraints at all (no `start`/
  `length`) since it's just JSON; effectively unlimited to extend.

Per-field keys (core): `name`, `id`, `required`, `added` (spec version the field was introduced),
`unit` (optional), `type`, `scaling` (optional), `start` (hex string), `length` (bytes), `usage`
(`operational` | `display` | `inventory`), `examples`, `description`. `web_api` fields drop
`start`/`length`/`usage` and add nothing else — `type` there is a free-form string like
`"object{string, any}"`, purely descriptive, not consumed by any code.

`type` for `core` fields is **not a documented enum anywhere** — it's implicitly defined by
whichever branches exist in `encodeFieldValue`/`decodeTagBuffer` in
[opentag3d.js:195-318](../assets/scripts/opentag3d.js). Confirmed values in use: `int`, `utf8`,
`ascii`, `rgba`, `date`, `time`. There is also a `"-"` type handled in `decodeTagBuffer`
(`if (f.type === "-") continue`, [opentag3d.js:287](../assets/scripts/opentag3d.js)) meant for
reserved/skipped byte ranges, but **no field anywhere in `_data/spec.json` or
`assets/json/spec_v1.json` currently uses it** — it's dead code today, presumably intended for a
future deprecated-field-but-keep-the-bytes-reserved scenario.

## 2. How a new field actually gets added today (informal process, reverse-engineered)

There's no documented procedure — this is inferred from the code's expectations and one real
commit (`8f493d2`, description clarifications):

1. Pick an unused byte range within `0x00`–`0xDF` for a `core` field (see §3 for how little is
   left), or just append to `web_api.fields` (no byte constraints there).
2. Add the field object with all the standard keys. `type` **must** be one of the strings
   `encodeFieldValue`/`decodeTagBuffer` already branch on (§1) — anything else silently falls
   through to a generic numeric-or-string fallback in `encodeFieldValue`
   ([opentag3d.js:229-231](../assets/scripts/opentag3d.js)) and is **never decoded at all** in
   `decodeTagBuffer` (no `else` branch, no error, no warning — the field is just absent from the
   decoded output). A typo'd `type` fails silently, not loudly.
3. Set `added` to the spec version the field is introduced in.
4. Bump `version` in `_data/spec.json` and add a changelog line at the bottom of
   [spec.md](../spec.md) — confirmed as the paired convention from commit `8f493d2`.
5. **Only if it's a major version bump** (i.e. the byte layout changed in a way that breaks old
   readers): snapshot the *pre-change* `core.fields` into a new
   `assets/json/spec_v{N}.json` first, since `getFieldsForMajorVersion()`
   ([opentag3d.js:238-253](../assets/scripts/opentag3d.js)) fetches that file by number and throws
   if it's missing. A minor bump (e.g. adding an optional field in unused space) does not need a
   new snapshot.
6. Per the repo's own governance (README/about.md, see notes-repo-rundown.md), this is meant to
   go through the OpenTag3D Consortium as a spec decision, not land as an ordinary code PR — but
   nothing in tooling enforces that; it's a social/process rule only.

`spec_table.md` and `memory_map.html` both render straight off `site.data.spec` via Liquid, so a
newly added field automatically appears on the public `/spec` page and in
`https://opentag3d.info/spec.json` — no separate step needed there.

## 3. Extensibility analysis — how much room is actually left

Walking every `core.fields` entry by `start`/`length` and diffing against `0x00`–`0xDF`
(224 bytes), the byte map has exactly **4 unused gaps totaling 24 bytes** (~11% of the address
space) as of spec version 2.003:

| Gap | Size | Between |
| --- | --- | --- |
| `0x82`–`0x83` | 2 bytes | `barcode` end and `mfg_date` start |
| `0x8B` | 1 byte | `mfg_time` end and `diameter` start |
| `0xAB`–`0xB7` | 13 bytes | `mfi_value` end and `data_url` start |
| `0xD8`–`0xDF` | 8 bytes | `data_url` end and the address range's own end |

Nothing documents these gaps as "reserved for future fields" vs. just leftover slack, and nothing
computes or checks them automatically — a contributor adding a `core` field today has to
manually read the byte map and do the arithmetic by hand to find free space and confirm they
don't overlap an existing field. **There is no overlap check anywhere** (not in CI, not in any
script) — two fields could be given colliding `start`/`length` values and nothing would catch it
short of a human noticing during review or a tag misdecoding in the field.

Practical implication for future fields: the 13-byte and 8-byte gaps are the only ones large
enough for most useful new fields (e.g. another `utf8` string field of meaningful length); the
two 1-2 byte gaps only fit single small `int` fields. Anything bigger, or exceeding remaining
total space, requires either shrinking/repurposing an existing field (a breaking, major-version
change) or isn't possible within the current 224-byte NTAG215/216 budget at all.

`web_api` has no equivalent constraint — it's arbitrary JSON, so extensibility there is a
non-issue by comparison.

## 4. Schema validation — confirmed: none exists

Checked for: a JSON Schema file, ajv/zod or similar validation library, any custom validation
script, any test referencing `_data/spec.json`. Found none of the above anywhere in the repo.

What CI actually checks (both workflows read in full):

- **`ci.yml`** runs `bundle exec jekyll build`. This will fail only if `_data/spec.json` is not
  valid JSON, or if a Liquid template consuming it (`spec_table.md`, `memory_map.html`) throws.
  It does **not** check field semantics — a field with a bogus `type`, an overlapping byte range,
  a missing required key, or a `start`/`length` that runs past `0xDF` would all build successfully
  and deploy to production (`main` has no staging, per notes-repo-rundown.md).
- **`format.yml`** runs Prettier (`format:check`) — pure formatting (indentation/quoting), not
  content.

So today, correctness of a `_data/spec.json` edit rests entirely on manual review — same
situation as `opentag3d.js`'s complete lack of test coverage (already flagged in
[gaps.md](gaps.md)), but for the data file that logic depends on rather than the logic itself.

## 5. Opportunities for automated spec validation (not yet actioned — see gaps.md)

Concrete, scoped ideas surfaced by this research, added to `gaps.md` rather than acted on here
(out of scope for the current `AGENTS.md` pass):

- A small validation script (Node, since `npm ci` is already a CI dependency) that checks, on
  every `_data/spec.json` change: every `core` field's `type` is in the known set the JS actually
  implements; no two `core` fields have overlapping `start`+`length` ranges; every field's
  `start`+`length` fits within `core.address_range`; `id`s are unique; `required`/`added` are
  present and well-formed.
- A round-trip test per field with `examples`: run each example value through
  `encodeFieldValue` → `decodeTagBuffer` and assert the decoded `display` matches — cheap,
  would need no DOM/Web NFC, and would double as the first real unit test for `opentag3d.js`.
- Surfacing the free-byte-gap accounting from §3 as a script/CI annotation, so a contributor
  proposing a new `core` field sees immediately whether it fits before opening a PR.
