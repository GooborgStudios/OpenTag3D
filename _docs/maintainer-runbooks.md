# Maintainer runbooks

This doc owns trusted maintainer workflows. Use it only when acting as the maintainer or as a maintainer-directed agent; it is procedure support, not new policy.

## Review an agent-generated PR

Review by blast radius first, file diff second:

1. Classify the change: routine content, tool UI, protocol code, spec data, release/process, governance, or automation.
2. Check the co-change map in root `AGENTS.md` once added.
3. For `_data/spec.json`, classify the edit before reviewing details: wording, `web_api`, additive `core`, breaking `core`, or version bump.
4. For protocol-code changes, require round-trip evidence and browser/manual evidence appropriate to the path touched.
5. For Web NFC write/config-page changes, require maintainer intent and real-device evidence or an explicit "not locally verified" note.
6. For release or governance changes, confirm the human decision trail before accepting repo edits.
7. If review teaches a new repo convention, record it in [`decisions.md`](decisions.md) or the one doc where that rule belongs.

Prefer shrinking future review burden: when a prose checklist becomes mechanical, move it toward a script or CI check and shorten the docs.

## Triage a suspected protocol bug

Treat protocol bugs as suspected until reproduced and confirmed.

1. Identify the area: display-only UI, field encode/decode, NDEF/NTAG packing, Web NFC write, config pages, import/export, or legacy-spec handling.
2. Build the smallest reproduction. Use the Node recipe in `assets/scripts/AGENTS.md` once added when the path does not require DOM or Web NFC.
3. Compare behavior against `_data/spec.json`, `spec.md`, and relevant `assets/json/spec_v*.json` legacy snapshots.
4. Separate "new writes would be wrong" from "already-written tags may be affected".
5. Present bytes, decoded values, expected behavior, and uncertainty; ask the maintainer to confirm before patching.

Example target: a suspected 6-byte `barcode` integer round-trip issue. Reproduce it, show the exact encoded bytes and decoded value, and ask whether the observed behavior is incorrect before changing `packInt()` or decode logic.

## Release/version bump checklist

The full process lives in [`spec-change-process.md`](spec-change-process.md). Maintainer-level reminders:

- Confirm the spec change is approved through the appropriate human process before editing the repo.
- Update `_data/spec.json` `version` and the `spec.md` changelog together.
- For a major bump, freeze the old major layout into `assets/json/spec_v{oldMajor}.json` before changing current fields.
- Review whether `index.md`'s announcement banner should be updated or retired.
- Tags are maintainer-owned release markers; do not delegate tag creation to an agent without explicit instruction.

## Context upkeep

After each agent-docs or process-affecting PR:

- Fix agent docs in the same PR if they were wrong or incomplete.
- Put each new rule in exactly one owning doc and link to it elsewhere.
- Record durable rationale in [`decisions.md`](decisions.md).
- If a new script or CI check replaces a manual rule, shrink the prose to point at the executable check.

## Unknowns to keep explicit

The checkout does not confirm branch protection, merge rights, release authority, or how consortium votes are recorded. Ask the maintainer rather than inferring these from commit history.
