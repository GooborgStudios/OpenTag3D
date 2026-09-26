# OpenTag3D agent scaffolding — planning

Working folder for figuring out how to set OpenTag3D up for AI coding agents. This folder lives inside the repo root (so it's easy to share with the team when it's ready), but it is **currently untracked** — not added or committed to git — so it stays invisible to other contributors and can't cause a merge conflict until we deliberately commit it. Delete this whole folder once the real deliverables have been reviewed and copied out into the repo proper.

## Why this project exists

OpenTag3D's repo was largely built with AI assistance, but it has none of the scaffolding that helps an AI coding agent work in it safely (no `AGENTS.md`, no notes on the spec-is-data-driven design, no warning about the zero-test-coverage JS or the consortium-governed spec). Multiple people are actively building on `main`, so this effort is deliberately staged outside the tracked repo content until the deliverable is ready to land as a single, low-conflict PR — see the "untracked folder" note above for how that's enforced in practice.

## Goal

Land a well-scoped set of agent-scaffolding files at the repo root (primarily `AGENTS.md`, possibly more per `gaps.md`) — designed here first, moved out deliberately once we're happy with them. When we're ready to share progress with the team before that final move, commit this folder as-is (or open a draft PR) rather than leaving it silently untracked.

## Files in this folder (read in this order)

0. [`AGENTS.md`](AGENTS.md) — agent-facing rules scoped to *this folder itself* (not the OpenTag3D repo). If you're an agent and this is your working directory, read this one first.
1. [`notes-repo-rundown.md`](notes-repo-rundown.md) — raw research on what the OpenTag3D repo actually is (site structure, tech stack, spec-as-data-source, CI, gotchas). Read this next for repo context; it's the source material everything else is built from.
2. [`notes-spec-json-extensibility.md`](notes-spec-json-extensibility.md) — deeper follow-up research specifically on `_data/spec.json`'s field model: how new fields get added today, how much byte budget is left, and confirmation that no schema validation exists. Feeds the "editing the spec" safety notes in the draft and a few new items in `gaps.md`.
3. [`notes-automation-opportunities.md`](notes-automation-opportunities.md) — research pass over `index.md`, `getting-started.md`, and `articles/` looking for manual/duplicated work and CI/testing/community-engagement gaps (e.g. `getting-started.md`'s supporter tables duplicating `_data/supporters.yml` by hand). Feeds several new items in `gaps.md`; nothing here is in scope for the current draft.
4. [`notes-spec-maintenance-workflow.md`](notes-spec-maintenance-workflow.md) — research pass mapping the actual PR/review/merge pattern, the (undocumented, fully manual) version-bump-and-tag process, and the OpenTag3D Consortium governance model in `about.md` — plus where the two disconnect (a merged spec change has no visible link to a consortium vote). Feeds new items in `gaps.md`; out of scope for the current draft.
5. [`draft-AGENTS.md`](draft-AGENTS.md) — the working draft of the file we intend to place at the OpenTag3D repo root. This is the actual deliverable.
6. [`gaps.md`](gaps.md) — scaffolding gaps noticed along the way that are deliberately **out of scope** for this first `AGENTS.md` pass (no tests, no CONTRIBUTING.md, spec.json schema validation, supporter-table duplication, no proposal→vote pipeline, etc.) — don't try to solve these now, just don't rediscover them either.

## Current state & next steps

**Status:** Draft in progress — reviewed once, not yet copied into the OpenTag3D repo, not yet committed to git.

**Settled (don't re-litigate):**
- Scope is one file (`AGENTS.md`) for this pass; everything else goes in `gaps.md` as a future follow-up, not scope creep onto this deliverable.
- This planning folder stays untracked until we're deliberately ready to share it or land the final PR.
- No Windows dev-server note in `AGENTS.md` — that file should describe the repo, not any one contributor's machine, and the note would go stale. Windows dev-server support (if it happens) is a separate future project; already tracked in `gaps.md`.
- No house-style/PR-conventions section in this first `AGENTS.md` — the repo owner is new to this repo and doesn't know the maintainer's unwritten conventions yet. Learning them is deliberately left to this project's own PR (a real-world test of the scaffolding), to feed a possible follow-up project rather than being guessed at now.

**Next action:** copy the finished `draft-AGENTS.md` to the OpenTag3D repo root as `AGENTS.md` and open a real PR — at that point this whole folder can be deleted.
