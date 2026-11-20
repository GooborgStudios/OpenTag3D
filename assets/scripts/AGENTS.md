# `assets/scripts/` agent notes

This file owns local rules for shared browser scripts, especially protocol code in `opentag3d.js`. For page-local tool architecture, read `_docs/make-read-tools.md` too.

## Responsibility map

`opentag3d.js` expects `globalThis.OpenTag3D.spec` at module evaluation time and owns:

- Constants/state: `SPEC`, `allFields`, `urlParams`, `NFC_INFO`, `nfcController`.
- Web NFC dialogs: `showWebNfcDialog()`, `finishWebNfcAction()`.
- Byte/encoding utilities: `hex()`, `addrHex()`, `parseHex()`, base64 helpers, `packInt()`, `encodeAscii()`, `encodeUtf8()`, `rgbaFromHex()`, `fixHexRgba()`, `bufferFromText()`, `bufferToHex()`, `hexdump()`, `downloadFile()`, `generateHash()`.
- Field encode/decode: `encodeFieldValue()`, `decodeTagBuffer()`, `getFieldsForMajorVersion()`.
- Web NFC: `writeViaWebNFC()`, `readViaWebNFC()`, `startAutomaticWebNFC()`, `cancelWebNFC()`.
- NTAG/NDEF packing: `buildNtagPageDump()`.
- External formats: Flipper export, Proxmark3 import/export, NFC Tools Desktop/Mobile import/export, and `parseImportedText()`.

`site.js` owns small site-wide UI helpers: `h()`, `msg()`, and dropdown menu behavior.

## Danger zones

Ask first or slow down before touching:

- `NFC_INFO.ntag.types.*.configPages`, especially AUTH0/PWD/PACK bytes. Wrong bytes can password-protect or lock physical tags.
- `writeViaWebNFC()`, `readViaWebNFC()`, automatic scanning, dialog cancellation, and real tag write behavior.
- `packInt()` and the local `readInt()` in `decodeTagBuffer()`; multi-byte integers need explicit round-trip evidence.
- `tag_version` handling and `getFieldsForMajorVersion()`; old tags rely on legacy `assets/json/spec_v*.json` snapshots.
- `buildNtagPageDump()`; Flipper/Proxmark3 exports can break even if the raw OpenTag3D payload is valid.
- NFC Tools Mobile payload/base64 handling; do not simplify without fixtures or real app verification.
- Import parsers that accept user-provided text/files; keep error messages useful and avoid broadening accepted formats by accident.

Existing `assets/json/spec_v*.json` files are compatibility data for tags already in the field. Do not edit them from this directory unless the task is explicitly about legacy snapshot maintenance.

## Node round-trip recipe

Pure encode/decode paths can be exercised from Node without DOM or Web NFC. Use this as manual verification until a real test script exists:

```bash
node --input-type=module - <<'NODE'
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

globalThis.window = { location: { search: '' }, addEventListener() {} };
globalThis.OpenTag3D = {
  spec: JSON.parse(readFileSync('_data/spec.json', 'utf8')),
};

const { allFields, encodeFieldValue, decodeTagBuffer, bufferToHex } =
  await import(pathToFileURL('assets/scripts/opentag3d.js').href);

const buffer = new Uint8Array(0xe0);
for (const field of allFields) {
  let value = field.id === 'tag_version' ? undefined : field.examples?.[0];
  if (field.id !== 'tag_version' && value === undefined) continue;
  if (field.type === 'date' && Array.isArray(value)) {
    value = `${String(value[0]).padStart(4, '0')}-${String(value[1]).padStart(2, '0')}-${String(value[2]).padStart(2, '0')}`;
  }
  if (field.type === 'time' && Array.isArray(value)) {
    value = `${String(value[0]).padStart(2, '0')}:${String(value[1]).padStart(2, '0')}:${String(value[2]).padStart(2, '0')}`;
  }

  buffer.set(encodeFieldValue(field, value), parseInt(field.start, 16));
}

const { values, warnings } = await decodeTagBuffer(buffer.buffer);
console.log('bytes', bufferToHex(buffer).slice(0, 95) + '...');
console.log('decoded fields', values.size);
console.log('warnings', warnings);
NODE
```

Caveats:

- Leave `tag_version` undefined/current unless you are explicitly testing legacy decoding.
- `date` and `time` encoders take strings; `spec.json` examples may be arrays, so convert them.
- This proves shared encode/decode behavior only. UI changes still need a browser check, and Web NFC writes need a supported real-device check or an explicit "not locally verified" note.

## Verification expectations

- UI helper changes in `site.js`: browser-check affected pages and menus/messages.
- Encode/decode changes: run a Node round-trip and browser-check `/make` to `/read` behavior.
- Import/export changes: test the specific file format changed with sample content.
- Web NFC/config-page changes: ask first, test with a disposable tag, read back the result, and document the device/browser/tool used.
