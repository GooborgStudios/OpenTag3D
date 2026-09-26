# OpenTag3D agent scaffolding — planning

Working folder for figuring out how to set OpenTag3D up for AI coding agents. This folder lives inside the repo root while the plan is being designed, but it is now committed on the feature branch rather than hidden/untracked. Delete this whole folder once the real deliverables have been reviewed and copied out into the repo proper.

## Why this project exists

OpenTag3D's repo was largely built with AI assistance, but it has none of the scaffolding that helps an AI coding agent work in it safely (no `AGENTS.md`, no notes on the spec-is-data-driven design, no warning about the zero-test-coverage JS or the consortium-governed spec). Multiple people are actively building on `main`, so this effort is deliberately staged in this temporary folder until the deliverable is ready to land as a single, low-conflict PR. The folder is now committed on the feature branch and must be excluded/deleted before anything reaches `main`.

## Goal

Land a well-scoped set of agent-scaffolding files at the repo root — designed here first, moved out deliberately once we're happy with them. The goal has expanded from "safe orientation docs" to reusable systems: contributor-vs-maintainer paths, local danger-zone checklists, maintainer runbooks, known gaps with safe workarounds, and an initial architecture note for high-churn make/read tooling.

## Files in this folder

0. [`AGENTS.md`](AGENTS.md) — agent-facing rules scoped to *this folder itself* (not the OpenTag3D repo). If you're an agent and this is your working directory, read this one first.
1. [`reflow-plan.md`](reflow-plan.md) — the controlling plan for moving everything in this folder into the repo proper: target layout (`/AGENTS.md`, nested `AGENTS.md` files, `_docs/`), source→destination map, execution steps, acceptance criteria, and resolved decisions (D1–D7).
2. [`notes-repo-rundown.md`](notes-repo-rundown.md) — raw research on what the OpenTag3D repo actually is (site structure, tech stack, spec-as-data-source, CI, gotchas). Read this next for repo context; it's the source material everything else is built from.
3. [`notes-spec-json-extensibility.md`](notes-spec-json-extensibility.md) — deeper follow-up research specifically on `_data/spec.json`'s field model: how new fields get added today, how much byte budget is left, and confirmation that no schema validation exists. Feeds the "editing the spec" safety notes in the draft and a few new items in `gaps.md`.
4. [`notes-automation-opportunities.md`](notes-automation-opportunities.md) — research pass over `index.md`, `getting-started.md`, and `articles/` looking for manual/duplicated work and CI/testing/community-engagement gaps (e.g. `getting-started.md`'s supporter tables duplicating `_data/supporters.yml` by hand). Feeds several new items in `gaps.md`; nothing here is in scope for the current draft.
5. [`notes-spec-maintenance-workflow.md`](notes-spec-maintenance-workflow.md) — research pass mapping the actual PR/review/merge pattern, the (undocumented, fully manual) version-bump-and-tag process, and the OpenTag3D Consortium governance model in `about.md` — plus where the two disconnect (a merged spec change has no visible link to a consortium vote). Feeds new items in `gaps.md`; out of scope for the current draft.
6. [`draft-AGENTS.md`](draft-AGENTS.md) — the working draft of the file we intend to place at the OpenTag3D repo root. Treat it as source material, not the final deliverable by itself.
7. [`gaps.md`](gaps.md) — scaffolding gaps noticed along the way that move to `_docs/known-gaps.md`; don't treat them as unprompted work.
8. [`notes-make-read-tools.md`](notes-make-read-tools.md) — fresh architecture pass over `make.html`, `read.html`, `assets/scripts/opentag3d.js`, and `assets/scripts/site.js`; source for `_docs/make-read-tools.md` and shared-script danger-zone notes.
9. [`draft-doc-skeletons.md`](draft-doc-skeletons.md) — planning skeletons/sample prose for contributor guidance, maintainer runbooks, and make/read docs; use as shape, not final copy.
10. [`routing-duplication-audit.md`](routing-duplication-audit.md) — reviews duplicated facts, weak routes, and ownership boundaries; treat as execution constraint.
11. [`cold-start-tests.md`](cold-start-tests.md) — future acceptance tests for the finished scaffolding; run after the reflow, before deleting this folder.

## Current state & next steps

**Status:** Draft reviewed once; reflow plan written, then expanded after review to include reusable future-work systems (D7): contributor-vs-maintainer routing, maintainer runbooks, suspected-bug triage, PR-review support, and `_docs/make-read-tools.md`. This folder is now **committed** on `feature/shark-0001-agent-scaffolding-setup` (`ca8ac2d`, `b059ca1`) — the old "untracked" description is historical. It must not reach `main` as-is (Jekyll would publish it unless excluded; see reflow-plan §6).

**Settled (don't re-litigate):**
- ~~Scope is one file (`AGENTS.md`) for this pass.~~ **Superseded 2026-09-26 by reflow-plan D1:** tiered context — root `AGENTS.md`, nested `AGENTS.md` in `_data/` and `assets/scripts/`, and `_docs/`. Items in `gaps.md` are still out of scope (they move to `_docs/known-gaps.md`, not into the deliverable).
- ~~This planning folder stays untracked.~~ Superseded: it's committed on the feature branch. It is deleted in the reflow PR (reflow-plan §7, commit 7).
- One PR with separable commits (D6); `_docs/` as the reference-doc folder (D2); `CLAUDE.md` shim (D4); one-line root `README.md` pointer (D5); known gaps stay in-repo, short and neutral, with GitHub issues only if the maintainer wants them (D3); the plan now includes reusable systems, not just orientation docs (D7).
- No Windows dev-server note in `AGENTS.md` — that file should describe the repo, not any one contributor's machine, and the note would go stale. Windows dev-server support (if it happens) is a separate future project; already tracked in `gaps.md`.
- No guessed house-style section in root `AGENTS.md` — the repo owner is new to this repo and doesn't know the maintainer's unwritten conventions yet. Instead, `_docs/maintainer-runbooks.md` will include a review/context-upkeep loop, and conventions learned from this project's own PR should be recorded later in `_docs/decisions.md`.

**Next action:** do **not** execute yet. Review the expanded [`reflow-plan.md`](reflow-plan.md) for the D7 scope change and check whether any other future-work systems are missing. Once settled, execute §7 starting with commit 1 (the `_config.yml` exclude, including this staging folder). The folder is deleted as part of that PR.
