# Make/read tools architecture

This doc owns architecture context for `make.html`, `read.html`, and their page-local JavaScript. Protocol-code danger zones and the Node round-trip recipe live in `assets/scripts/AGENTS.md` once added.

## Boot sequence and spec injection

Both tool pages are Jekyll-rendered pages. Before importing shared code, they inject the current spec:

```html
<script>
  globalThis.OpenTag3D = { spec: {{site.data.spec | jsonify}} };
</script>
```

`assets/scripts/opentag3d.js` reads `globalThis.OpenTag3D.spec` at module evaluation time. Do not reorder imports or remove this bootstrap unless the shared module is refactored to accept the spec explicitly.

## Responsibility map

- `_data/spec.json`: source of truth for field ids, types, offsets, lengths, scaling, descriptions, and version.
- `make.html`: form UX, form state, required-field validation, encoding orchestration, write/export/share UI.
- `read.html`: read/import UI, optional-field suppression, friendly display rendering.
- `assets/scripts/opentag3d.js`: protocol encode/decode, NDEF/NTAG packing, Web NFC, import/export formats, legacy-version loading.
- `assets/scripts/site.js`: DOM helper `h()`, flash messages `msg()`, dropdown button menus.

Use page-local code for presentation and user-flow glue. Byte-level or format-level transformations belong in shared protocol code and need protocol verification.

## `make.html` flow

1. Jekyll injects `_data/spec.json` into `globalThis.OpenTag3D.spec`.
2. The page imports shared helpers and gets `allFields` from the active spec.
3. `renderForm()` builds inputs from spec fields, skipping `tag_version`.
4. User input, URL params, example fill, or imports update page-local state.
5. `buildMemory()` validates required fields, calls `encodeFieldValue()`, writes bytes into the payload buffer, updates the hex dump/hash/filename, and prepares outputs.
6. User writes through Web NFC or exports raw `.bin`, Proxmark3 `.bin`, Flipper `.nfc`, NFC Tools JSON, clipboard hex, or share links.

Import-to-edit follows the reverse path: read/load/import text, parse with shared helpers, `decodeTagBuffer()`, push decoded values into inputs, then rebuild the payload.

## `read.html` flow

1. Jekyll injects the spec and the page imports parsing/decoding/Web NFC helpers.
2. User loads file/clipboard/`?hex=`, or Web NFC scanning starts automatically where supported.
3. Shared helpers normalize the source into payload bytes.
4. `loadBufferIntoDisplay()` shows a hex dump and calls `decodeTagBuffer()`.
5. `decodeTagBuffer()` reads `tag_version`, loads an old major snapshot when needed, and returns values plus warnings.
6. `renderTag()` applies display rules, suppresses unset optional defaults with `fieldValue()`, and fills the friendly UI.

## Important shared function areas

In `opentag3d.js`, use function/section names rather than line numbers when discussing code:

- Constants/state: `SPEC`, `allFields`, `NFC_INFO`, `nfcController`.
- Encoding/byte utilities: `packInt()`, `parseHex()`, `bufferFromText()`, `bufferToHex()`, `hexdump()`, `generateHash()`.
- Field logic: `encodeFieldValue()`, `decodeTagBuffer()`, `getFieldsForMajorVersion()`.
- Web NFC: `writeViaWebNFC()`, `readViaWebNFC()`, `startAutomaticWebNFC()`, `cancelWebNFC()`.
- NTAG/NDEF/export/import: `buildNtagPageDump()`, Flipper, Proxmark3, NFC Tools builders/parsers, `parseImportedText()`.

## Danger zones

Slow down or ask first around:

- Spec bootstrap/import order.
- `_data/spec.json` `core` layout and `tag_version` semantics.
- Legacy snapshots in `assets/json/spec_v*.json`.
- `packInt()`/decode integer width handling.
- Web NFC writes and `NFC_INFO.ntag.types.*.configPages`.
- NDEF/NTAG packing and external import/export formats.
- NFC Tools mobile payload handling.
- Required vs optional display semantics in `read.html`.
- Share-link and URL parameter serialization in `make.html`.

## Verification expectations

- UI-only change: Jekyll build, browser-load affected page, check console, and exercise affected controls.
- Encode/decode or import/export change: use the Node round-trip recipe from `assets/scripts/AGENTS.md` once added, plus browser verification through `/make` and `/read`.
- Web NFC write/config-page change: ask first; verify on a supported Chrome/Android/Web NFC setup with a disposable tag, or state clearly that real NFC was not locally verified.
- Legacy decode change: include the old major-version snapshot and sample payload used for verification.

No automated test suite currently covers these flows, so verification evidence in PR notes matters.
