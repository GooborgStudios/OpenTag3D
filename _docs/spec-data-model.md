# Spec data model

This doc owns reference facts about `_data/spec.json`: field structure, type handling, byte budget, and the command for recomputing the current byte map. Edit rules live in `_data/AGENTS.md` once added.

## Source of truth

`_data/spec.json` is the editable source for the public spec data. The root `spec.json` page is generated from `site.data.spec`; do not edit root `spec.json` to change the spec.

Two field lists exist:

- `core.fields`: the on-tag byte layout within `core.address_range`.
- `web_api.fields`: optional supplemental JSON fields with no byte positions.

## Core field shape

Core fields use keys such as `name`, `id`, `required`, `added`, `unit`, `type`, `scaling`, `start`, `length`, `usage`, `examples`, and `description`. `start` is a hex string and `length` is bytes.

`web_api` fields are descriptive JSON API fields. They do not use `start`, `length`, or `usage`, and their `type` strings are not consumed by the browser protocol code.

## Type enum

For `core` fields, the practical type enum is whatever `encodeFieldValue()` and `decodeTagBuffer()` in `assets/scripts/opentag3d.js` implement:

- `int`
- `utf8`
- `ascii`
- `rgba`
- `date`
- `time`

`decodeTagBuffer()` also skips `type: "-"`, apparently for reserved bytes, but no current field uses it.

A typo or new unimplemented `core` type may fail silently during decode. Treat type changes as protocol work.

## Byte budget

Verified 2026-09-26 against spec v2.003: the `0x00`–`0xDF` range has 24 free bytes and 0 overlapping byte positions.

| Gap | Size |
| --- | ---: |
| `0x82`–`0x83` | 2 bytes |
| `0x8B` | 1 byte |
| `0xAB`–`0xB7` | 13 bytes |
| `0xD8`–`0xDF` | 8 bytes |

The command below is the authority; update the table only after rerunning it against the current spec.

```bash
node - <<'NODE'
const s = require('./_data/spec.json');
const start = parseInt(s.core.address_range.start, 16);
const end = parseInt(s.core.address_range.end, 16);
const used = new Array(end - start + 1).fill(0);
for (const f of s.core.fields) {
  const fieldStart = parseInt(f.start, 16) - start;
  for (let i = fieldStart; i < fieldStart + f.length; i++) used[i]++;
}
const gaps = [];
let i = 0;
while (i < used.length) {
  if (used[i]) {
    i++;
    continue;
  }
  let j = i;
  while (j < used.length && !used[j]) j++;
  gaps.push([start + i, start + j - 1, j - i]);
  i = j;
}
const hx = (n) => `0x${n.toString(16).toUpperCase().padStart(2, '0')}`;
console.log('version', s.version, 'free', used.filter((x) => !x).length, 'overlap', used.filter((x) => x > 1).length);
for (const [a, b, n] of gaps) console.log(`${hx(a)}${a === b ? '' : `-${hx(b)}`}: ${n}`);
NODE
```

## Manual checks until validation exists

Until a spec validation script exists, manually confirm every `core` change:

- Type is implemented by shared protocol code.
- `start`/`length` fits inside `core.address_range`.
- No overlap with existing fields.
- `id` remains unique.
- `added` is set to the introducing spec version.
- Changelog and snapshot requirements are handled by the spec-change process.
