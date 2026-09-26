# OpenTag3D agent scaffolding — planning

Working folder for figuring out how to set OpenTag3D up for AI coding agents. This folder lives inside the repo root (so it's easy to share with the team when it's ready), but it is **currently untracked** — not added or committed to git — so it stays invisible to other contributors and can't cause a merge conflict until we deliberately commit it. Delete this whole folder once the real deliverables have been reviewed and copied out into the repo proper.

## Why this project exists

OpenTag3D's repo was largely built with AI assistance, but it has none of the scaffolding that helps an AI coding agent work in it safely (no `AGENTS.md`, no notes on the spec-is-data-driven design, no warning about the zero-test-coverage JS or the consortium-governed spec). Multiple people are actively building on `main`, so this effort is deliberately staged outside the tracked repo content until the deliverable is ready to land as a single, low-conflict PR — see the "untracked folder" note above for how that's enforced in practice.

## Goal

Land a well-scoped set of agent-scaffolding files at the repo root (primarily `AGENTS.md`, possibly more per `gaps.md`) — designed here first, moved out deliberately once we're happy with them. When we're ready to share progress with the team before that final move, commit this folder as-is (or open a draft PR) rather than leaving it silently untracked.

## Files in this folder (read in this order)

1. [`notes-repo-rundown.md`](notes-repo-rundown.md) — raw research on what the OpenTag3D repo actually is (site structure, tech stack, spec-as-data-source, CI, gotchas). Read this first for repo context; it's the source material everything else is built from.
2. [`draft-AGENTS.md`](draft-AGENTS.md) — the working draft of the file we intend to place at the OpenTag3D repo root. This is the actual deliverable.
3. [`gaps.md`](gaps.md) — scaffolding gaps noticed along the way that are deliberately **out of scope** for this first `AGENTS.md` pass (no tests, no CONTRIBUTING.md, etc.) — don't try to solve these now, just don't rediscover them either.

## Current state & next steps

**Status:** Draft in progress — reviewed once, not yet copied into the OpenTag3D repo, not yet committed to git.

**Settled (don't re-litigate):**
- Scope is one file (`AGENTS.md`) for this pass; everything else goes in `gaps.md` as a future follow-up, not scope creep onto this deliverable.
- This planning folder stays untracked until we're deliberately ready to share it or land the final PR.

**Open / needs a decision** (also listed inline at the bottom of `draft-AGENTS.md`):
- Whether to include an "environment" note about Windows dev-server limitations in the final `AGENTS.md`, or leave it out since that file should describe the repo, not any one contributor's machine.
- Whether there's house style/PR conventions from the maintainer (Vinyl Da.i'gyu-Kazotetsu) that aren't visible from the code alone and should be captured.

**Next action:** the repo owner is reviewing `draft-AGENTS.md` directly. Once they give feedback, resolve the open questions above, fold in any requested changes, then copy the finished file to the OpenTag3D repo root as `AGENTS.md` and open a real PR — at that point this whole folder can be deleted.
