# Contributor and agent guide

This guide is for outside contributors and their AI agents. It owns the safety posture for non-maintainer work; detailed protocol checklists live in `_data/AGENTS.md` and `assets/scripts/AGENTS.md` once those files are added.

## Safety model

OpenTag3D is both a website and a published data contract. Some edits are fixed by the next deploy; others affect bytes written to physical NFC tags or implementations that consume `/spec.json`.

If in doubt, open a proposal or ask first. Do not silently change the spec contract.

## Usually routine changes

These are usually safe when the requested change is clear:

- Prose fixes in Markdown pages.
- Link or copy updates with an obvious source of truth.
- Small styling changes, verified with a Jekyll build and browser check.
- Supporter updates when there is matching issue or maintainer context, and all duplicated locations are kept in sync.

Still run the relevant verification and say what you checked in the PR notes.

## Changes that need extra context

- `_data/spec.json`: read `_data/AGENTS.md` and classify the edit before changing anything.
- `make.html` or `read.html`: read [`make-read-tools.md`](make-read-tools.md); shared protocol changes also require `assets/scripts/AGENTS.md`.
- `assets/scripts/opentag3d.js`: treat byte encode/decode, NDEF/NTAG packing, import/export, and Web NFC as protocol work.
- Releases, tags, spec version bumps, workflows, `Gemfile`, and `package.json`: ask first unless the maintainer explicitly assigned the task.

## Propose, do not silently implement

Open a proposal or stop for maintainer direction before:

- Changing `core` field layout, field sizes, requiredness, or the spec `version`.
- Editing Web NFC write behavior or NTAG config pages.
- Editing legacy snapshots in `assets/json/spec_v*.json`.
- Making the web API required for tag interpretation; offline tag data is authoritative.
- Changing governance/consortium records in `about.md` unprompted.

## Co-change reminders

Use the co-change map in root `AGENTS.md` once added. Until then, key pairs are:

- `_data/spec.json` changes need a `spec.md` changelog entry.
- Major spec bumps need a frozen legacy snapshot before the current layout changes.
- Supporter status/details may appear in both `_data/supporters.yml` and `getting-started.md`.
- New articles are not auto-listed; link them intentionally from somewhere.

## Known gaps are not a work queue

[`known-gaps.md`](known-gaps.md) documents missing automation, suspected findings, and manual workarounds so agents do not rediscover them. It is not permission to fix those items unprompted.

When you encounter a known gap, follow its "Meanwhile" line. If it blocks the requested work, report that and ask how to proceed.
