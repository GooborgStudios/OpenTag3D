# make/read tools architecture notes

## Summary for agents

`make.html` and `read.html` are Jekyll pages with large page-local ES modules. They are not bundled; the browser loads the inline page module plus shared modules from `assets/scripts/`.

Both pages depend on this order:

1. Jekyll renders `_data/spec.json` into an inline script as `globalThis.OpenTag3D = { spec: {{ site.data.spec | jsonify }} };`.
2. The page module imports `assets/scripts/opentag3d.js`.
3. `opentag3d.js` reads `globalThis.OpenTag3D?.spec` at module evaluation time into module-level `SPEC`, then exports helpers derived from it (`allFields`, encoders/decoders, import/export helpers, Web NFC helpers).

Practical implication: do not move the shared import above the inline Jekyll spec bootstrap unless the shared module is refactored to accept the spec explicitly. Any new agent docs should describe this by function/section names, not line numbers.

The safe mental model:

- `_data/spec.json` defines the data contract and field layout.
- `opentag3d.js` implements protocol, encoding/decoding, import/export formats, NDEF/NTAG packing, Web NFC, and legacy layout loading.
- `make.html` owns form UX, form state, required-field validation, converting inputs to tag bytes, and user-triggered write/export/share actions.
- `read.html` owns read/import UI, display layout, optional-field suppression, and friendly rendering of decoded values.
- `site.js` owns small site-wide UI helpers: element creation, flash messages, and dropdown button menus.

## make.html architecture

### Spec bootstrap

`make.html` has an inline non-module script before the module script:

```html
<script>
  globalThis.OpenTag3D = { spec: {{site.data.spec | jsonify}} };
</script>
```

The following `<script type="module">` imports from `site.js` and `opentag3d.js`. Because ES module imports execute after dependency loading/evaluation, `opentag3d.js` sees `globalThis.OpenTag3D.spec` at module evaluation time.

### Page-local responsibilities

Page-local logic in `make.html` is mostly UI orchestration around shared protocol helpers:

- **Page layout and controls:** Read/Import menu, Write/Export menu, example-fill controls, reset/help buttons, upload input, hex dump, form host, Web NFC dialog, help dialog.
- **State model:** `tagState` tracks `values` (`Map` of field id to raw/form value), current encoded `buffer`, generated `hash`, and export `filename`.
- **Input synchronization:** `inputSynchronizers`, `syncInputValue()`, and `setInputValue()` keep DOM inputs and `tagState.values` in sync, including values loaded from imports.
- **Dynamic form generation:** `renderForm()` iterates `allFields`, skips `tag_version`, and renders a row with label, required marker, generated input, field metadata chips, and description.
- **Input rendering by field type:** `renderInputForField()` creates type-specific inputs for `rgba`, `int`, `date`, `time`, and text fallback. It handles placeholders from spec examples, URL query parameters, RGBA background previews, numeric scale/round/clip behavior, and maxlength for text.
- **Required-field validation:** `checkMissing()` and the local `isPresent()` helper inside `buildMemory()` enforce required-field presence and mark `.field-row.invalid`.
- **Building the raw OpenTag3D payload:** `buildMemory()` allocates a buffer based on `SPEC.core.address_range.end`, writes `tag_version`, encodes each field through shared `encodeFieldValue()`, updates the hex dump, calculates a hash, and builds the default export filename.
- **Import-to-form path:** `loadImportedText()` uses shared `parseImportedText()`, then `loadBufferIntoForm()` uses shared `decodeTagBuffer()` and sets decoded display values back into inputs.
- **Example fill:** `fillExamples()` copies input placeholders into required or all fields.
- **Event wiring:** `DOMContentLoaded` wires errors, dialogs, Web NFC read/write buttons, file and clipboard import, URL `hex` import, reset, example fill, downloads/exports, copy hex, copy share link, help dialog, and Web NFC feature gating.
- **Export/download orchestration:** Click handlers call shared exporters (`downloadFlipperNfc()`, `buildProxmark3Bin()`, `buildNfcToolsDesktopJson()`, `buildNfcToolsMobileJson()`, `downloadFile()`, etc.) but decide filenames, descriptions, success messages, and missing-required checks locally.
- **Share-link generation:** The `copyLink` handler serializes current `tagState.values` to query parameters, with special handling for RGBA and scaled fields.

## read.html architecture

### Spec bootstrap

`read.html` uses the same bootstrap pattern as `make.html`:

```html
<script>
  globalThis.OpenTag3D = { spec: {{site.data.spec | jsonify}} };
</script>
```

Its module then imports `msg()` from `site.js` and read/import helpers from `opentag3d.js`.

### Page-local responsibilities

`read.html` is display-focused. It delegates protocol decoding/import parsing to `opentag3d.js` and owns the presentation model:

- **Page layout and controls:** Load file, load clipboard, upload input, empty state, rich tag display, color swatches, field panels, footer, and hidden hex dump.
- **DOM convenience:** `el()` and `setText()` centralize repeated `getElementById()` / `textContent` updates.
- **Optional-field suppression:** `fieldValue(values, id)` decides whether a decoded optional field should be treated as unset. It checks the field definition in `allFields`, then handles text, RGBA, date, time, and integer defaults differently.
- **Friendly display rendering:** `renderTag(values)` maps decoded field ids to human-facing UI sections: brand/color/material, version/serial/date/SKU/barcode, color swatches, diameter/tolerance, weight/density, print/bed/chamber temperatures, nozzle, drying, VSO, measured length/weight, spool metrics, MFI values, and online data URL.
- **Decode-to-display path:** `loadBufferIntoDisplay()` shows the hex dump, calls shared `decodeTagBuffer()`, flashes warnings, calls `renderTag()`, hides the empty state, and reveals the display.
- **Import event wiring:** `DOMContentLoaded` wires global errors, file picker, clipboard import, upload parsing, URL `hex` import, and automatic Web NFC scanning if available.
- **Automatic Web NFC read flow:** `startAutomaticWebNFC()` is called when `NDEFReader` exists; the page callback decodes and displays the payload, then shared code restarts scanning.

## Shared modules

### `assets/scripts/opentag3d.js`

Main shared responsibility: protocol and format implementation for the tools. It expects `globalThis.OpenTag3D.spec` at import time.

Important named sections/functions for documentation:

- **Module constants:** `SPEC`, `allFields`, `urlParams`, `NFC_INFO`, `nfcController`.
- **Web NFC dialog helpers:** `showWebNfcDialog()`, `finishWebNfcAction()`.
- **Byte/encoding utilities:** `hex()`, `addrHex()`, `parseHex()`, base64 helpers, `packInt()`, `encodeAscii()`, `encodeUtf8()`, `rgbaFromHex()`, `fixHexRgba()`, `bufferFromText()`, `formatBytes()`, `bufferToHex()`, `hexdump()`, `downloadFile()`, `generateHash()`.
- **Field encoding/decoding:** `encodeFieldValue()`, `getFieldsForMajorVersion()`, `decodeTagBuffer()`.
- **Web NFC:** `writeViaWebNFC()`, `readViaWebNFC()`, `startAutomaticWebNFC()`, `cancelWebNFC()`.
- **NTAG/NDEF packing:** `buildNtagPageDump()` wraps raw OpenTag3D payloads in an NDEF MIME record and constructs full NTAG page dumps for exporter formats.
- **Flipper export:** `downloadFlipperNfc()`.
- **Proxmark3 export/import:** `buildProxmark3Bin()`, `parseProxmark3Bin()`, plus PM3 header constants.
- **Importers:** `parseBytesFromText()`, `extractNdefPayload()`, `parseNfcToolsDesktopJson()`, `parseNfcToolsMobileJson()`, `parseNfcToolsJson()`, `parseImportedText()`.
- **NFC Tools exporters:** `describeTag()`, `buildNfcToolsDesktopJson()`, `NFC_TOOLS_MOBILE_TAG_FIELD_NAMES`, `buildNfcToolsMobileJson()`.
- **Public exports:** The final `export { ... }` block is the best quick index of what page modules are expected to call.

Notable design details:

- `decodeTagBuffer()` reads `tag_version` first, derives the major version, and calls `getFieldsForMajorVersion()` to fetch `/assets/json/spec_v{major}.json` for older major versions. This preserves legacy tag decoding.
- `encodeFieldValue()` handles current-spec writes only; it uses the current `SPEC.version` for `tag_version` unless a value is passed.
- Import paths normalize many external forms into the same payload shape: raw hex/app hexdump, Flipper page dump, Proxmark3 `.bin`, NFC Tools Desktop JSON, NFC Tools mobile JSON, and NDEF-wrapped dumps.
- Export paths produce raw `.bin`, Proxmark3 `.bin`, Flipper `.nfc`, NFC Tools Desktop JSON, NFC Tools Mobile JSON, clipboard hex, and share links through page-local glue.

### `assets/scripts/site.js`

Shared site/UI responsibilities:

- `h(tag, attrs, ...kids)`: small DOM element factory used heavily by `make.html` for dynamic form rendering.
- `msg(message, isErr = false)`: flash alert helper. Lazily creates `#messages`, sets status/alert roles, auto-dismisses, click-dismisses, and logs to console.
- Dropdown button menu behavior for `.btn-menu`: initialized on `DOMContentLoaded`; animates open/close, closes other menus, closes on outside click, and closes after panel button clicks.

`read.html` currently imports only `msg()`. `make.html` imports `h()` and `msg()`. The menu initializer runs globally because `site.js` registers a `DOMContentLoaded` listener at module load.

## User flows

### make/write/export flow

1. Jekyll injects `_data/spec.json` into `globalThis.OpenTag3D.spec`.
2. `opentag3d.js` loads shared helpers and `allFields` from that spec.
3. `DOMContentLoaded` in `make.html` calls `renderForm()` and `buildMemory()`.
4. `renderForm()` builds inputs from every spec core field except `tag_version`.
5. User enters values, URL params prefill values, examples are filled, or an existing tag dump is imported.
6. Input events update `tagState.values` and call `buildMemory()`.
7. `buildMemory()` validates required fields, encodes every field with `encodeFieldValue()`, writes bytes into the payload buffer, updates the hex dump, hash, and filename.
8. User chooses an output:
   - Web NFC write: local handler checks required fields, then calls `writeViaWebNFC(tagState.buffer)`.
   - Raw `.bin`: downloads the raw payload buffer.
   - Proxmark3 `.bin`: wraps through `buildProxmark3Bin()`.
   - Flipper `.nfc`: wraps/downloads through `downloadFlipperNfc()`.
   - NFC Tools Desktop/Mobile JSON: builds description with `describeTag()` and exports via the matching JSON builder.
   - Clipboard: copies `bufferToHex(tagState.buffer)`.
   - Share link: serializes current values into URL parameters.

### make/read-import-to-edit flow

1. User clicks Read via Web NFC, Load File, Load Clipboard, or opens a `?hex=` URL.
2. Shared import helper parses payload bytes (`readViaWebNFC()`, `parseImportedText()`, `parseProxmark3Bin()`, or `bufferFromText()`).
3. `loadBufferIntoForm()` calls `decodeTagBuffer()` and shows warnings.
4. Decoded display values are pushed into matching form inputs via `setInputValue()`.
5. `buildMemory()` re-encodes current form state so export/write actions use the updated buffer.

### read/import/decode/display flow

1. Jekyll injects `_data/spec.json` into `globalThis.OpenTag3D.spec`.
2. `read.html` imports shared parsing/decoding/Web NFC helpers.
3. User loads file/clipboard/`?hex=`, or the page automatically starts Web NFC scanning if supported.
4. Shared helpers normalize the source to `{ data, startAddr }` payload bytes.
5. `loadBufferIntoDisplay()` shows a hex dump and calls `decodeTagBuffer(data, startAddr)`.
6. `decodeTagBuffer()` reads the tag version, possibly fetches a legacy major-version spec snapshot, decodes fields, and returns `{ values, warnings }`.
7. Warnings are flashed with `msg()`.
8. `renderTag(values)` applies display rules, suppresses unset optional defaults with `fieldValue()`, and populates the friendly tag UI.
9. Empty state is hidden; display and hex dump are shown.

## Danger zones

Agents should slow down or ask first in these areas:

- **Spec bootstrap/import order:** Both pages depend on `globalThis.OpenTag3D.spec` existing before `opentag3d.js` evaluates. Refactors to module loading or script order can break both tools.
- **`_data/spec.json` core layout:** Start offsets, lengths, field ids, types, scaling, and `tag_version` affect physical tag bytes and third-party implementations. Core layout changes are standards/protocol changes, not UI changes.
- **`tag_version` and legacy decode:** `decodeTagBuffer()` assumes `tag_version` can always be read using the current first-field location/format, then loads legacy major field layouts from `assets/json/spec_v{major}.json`. Changing this contract requires careful migration planning.
- **Existing legacy snapshots:** Do not edit existing `assets/json/spec_v*.json` casually; they are used to decode tags already in the field.
- **Field type handling:** `encodeFieldValue()` and `decodeTagBuffer()` branch on known `type` values. A new spec type without corresponding encode/decode/UI handling may fail or degrade silently depending on path.
- **Integer width handling:** `packInt()` and the local `readInt()` inside `decodeTagBuffer()` are central to byte-level correctness. Large multi-byte integers deserve explicit round-trip verification. Any issue here should be treated as suspected until reproduced.
- **Web NFC writes:** `writeViaWebNFC()` writes real tags. Bad payloads can persist physically.
- **NTAG config pages:** `NFC_INFO.ntag.types.*.configPages` in `buildNtagPageDump()` include factory-default config pages and AUTH0 values. The comments explicitly warn that wrong bytes can password-protect/lock tags. Ask before changing.
- **NDEF/NTAG packing:** `buildNtagPageDump()` affects Flipper and Proxmark3 outputs. Mistakes may make exported dumps unwritable/unreadable even if the raw OpenTag3D payload is correct.
- **Import/export format compatibility:** Flipper, Proxmark3, NFC Tools Desktop, and NFC Tools Mobile formats each have idiosyncratic parsing/building. Changes need sample-file verification.
- **NFC Tools mobile byte mangling:** `mobilePayloadFromBase64()` exists for a specific observed export behavior. Do not simplify without fixtures or real app verification.
- **Required vs optional display semantics:** `read.html`'s `fieldValue()` hides optional zero/default values. UI tweaks here can change what users believe is present on a tag without changing bytes.
- **Share-link and URL param semantics:** `make.html`'s URL prefill/share-link path has special scaling and RGBA handling. Changes can break reproducibility of shared tag data.
- **No automated tests:** There is no current test suite covering these flows. Manual and/or Node round-trip verification is required for protocol changes.

## Verification by change type

### UI-only changes

Examples: CSS, labels/help copy, panel layout, button grouping, display formatting that does not alter encoded values.

Verify:

- Browser-load `/make` and/or `/read`.
- Check console for errors.
- Exercise affected controls: menus, dialogs, reset/help, file picker/clipboard if touched.
- For `make.html`, confirm required-field highlighting still works and the hex dump still updates after input changes.
- For `read.html`, load a known hex dump or `?hex=` payload and confirm the display/empty state/hex dump behave as expected.
- Run formatting checks if touched file types are covered by Prettier.

### Protocol changes

Examples: `_data/spec.json` core field changes, `encodeFieldValue()`, `decodeTagBuffer()`, `packInt()`, `parseHex()`, scaling, dates/times, legacy version handling, import normalization.

Verify:

- Classify the spec edit first (description/web API/core/add/move/remove/version) and follow the spec-change rules from the planned `_data/AGENTS.md` / `_docs/spec-data-model.md`.
- Round-trip representative fields with the Node recipe planned for `assets/scripts/AGENTS.md`, or manually construct an equivalent browser round-trip.
- Include required fields, optional empty/default fields, scaled integers, RGBA, date, time, ASCII/UTF-8, and any changed field.
- Verify `make.html` can encode and `read.html` can decode the same payload.
- Verify old major-version decode if `tag_version`, field offsets, or legacy spec loading are touched.
- Check that generated payload still fits `SPEC.core.address_range` and field writes do not overlap/out-of-bounds.
- If import/export parsing changed, test the affected file format(s) with sample content.

### Web NFC write changes

Examples: `writeViaWebNFC()`, `readViaWebNFC()`, `startAutomaticWebNFC()`, dialog/cancel behavior, `buildNtagPageDump()`, NTAG constants/config pages, output formats intended for writing physical tags.

Verify:

- Ask/slow down before changing NTAG config pages or real write path behavior.
- Browser check on a secure context with a Web-NFC-capable browser/device (typically Chrome on Android), or explicitly state "not locally verified on real Web NFC".
- For writes, verify with a disposable tag first.
- After writing, read back with `/read` and compare decoded values to source form values.
- If possible, verify with at least one external writer/reader path affected by the change (Flipper, Proxmark3, NFC Tools) rather than only the website.
- Confirm cancel/error paths still clear dialogs/controllers and do not leave automatic scanning wedged.

## Proposed outline for `_docs/make-read-tools.md`

1. **Purpose and safety level**
   - These pages are high-churn UI around a physical-tag protocol.
   - Match verification depth to blast radius.
2. **Boot sequence and spec injection**
   - Jekyll `site.data.spec` -> `globalThis.OpenTag3D.spec`.
   - `opentag3d.js` reads `SPEC` at module evaluation.
   - Do not reorder imports without refactoring shared module initialization.
3. **File responsibility map**
   - `make.html`: form, state, validation, encode orchestration, write/export/share UI.
   - `read.html`: import/read orchestration, optional-field display policy, friendly rendering.
   - `opentag3d.js`: protocol, NDEF/NTAG, import/export formats, Web NFC, legacy specs.
   - `site.js`: DOM helper, flash messages, dropdown menus.
4. **Named architecture sections**
   - Use function names listed above rather than line references.
5. **Make flows**
   - New form -> build memory -> export/write/share.
   - Import/read existing tag -> decode -> edit -> re-export/write.
6. **Read flows**
   - File/clipboard/URL/Web NFC -> normalize payload -> decode -> render.
7. **Danger zones**
   - Script order/spec bootstrap, spec core layout, tag_version/legacy decode, integer widths, Web NFC, NTAG config pages, NDEF packing, import/export compatibility.
8. **Verification matrix**
   - UI-only, protocol, Web NFC write.
9. **Known limits / future tests**
   - No automated test suite yet.
   - Node round-trip recipe should become a script/CI check later.

## Open questions

- Should `opentag3d.js` eventually accept a spec explicitly instead of reading `globalThis.OpenTag3D.spec` at module load? That would make tests and future non-Jekyll use cleaner, but it is a behavior-affecting refactor.
- Should `make.html` and `read.html` share import/load glue now, or is duplication acceptable until tests exist? Current duplication keeps page behavior obvious but creates two paths to maintain.
- Are there maintainer-owned sample dumps for Flipper, Proxmark3, NFC Tools Desktop, and NFC Tools Mobile that can be used as future fixtures?
- What real-device matrix is expected before merging Web NFC write changes (tag type, Android/Chrome version, external tool verification)?
- Should `read.html` display more decoded fields generically from `allFields`, or intentionally keep a curated display? This is product/UI policy, not just code cleanup.
- If future major versions move `tag_version`, what migration rule replaces the current assumption that it is always readable from the current first-field location/format?
- Is the current `SPEC.core.address_range.end + 1` buffer allocation in `make.html` intentional? Do not call it a bug without reproducing an issue; include it only as a suspected review point if it causes observable behavior.
