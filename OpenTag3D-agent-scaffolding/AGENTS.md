# AGENTS.md — scoped to this folder only

This file describes `OpenTag3D-agent-scaffolding/` itself. It is **not** the OpenTag3D project's AGENTS.md — that's [`draft-AGENTS.md`](draft-AGENTS.md), a draft payload destined to become `/AGENTS.md` at the repo root once finished. Don't confuse the two.

## What you're standing in

A temporary staging folder for designing OpenTag3D's agent scaffolding, kept inside the repo (for easy sharing) but currently untracked (so it can't conflict with the other people actively building on `main`). It is not part of the Jekyll site — nothing here is built, linted, or deployed. Full context and current status: [`README.md`](README.md).

## Rules for working in this folder

- Read [`README.md`](README.md) first, specifically **"Current state & next steps"**, before changing anything — it lists what's settled vs. still open. Don't silently redecide something marked settled.
- Treat [`draft-AGENTS.md`](draft-AGENTS.md) as a draft, not ground truth about OpenTag3D — verify claims in it against the real repo (one level up) before relying on them, since the repo evolves out from under this snapshot.
- New follow-up ideas that are out of scope for the current `AGENTS.md` pass go in [`gaps.md`](gaps.md), not into `draft-AGENTS.md` itself — keep the draft focused on what's actually shipping.
- This folder's own docs (this file, `README.md`) are meta — they're about the planning process, not the OpenTag3D repo. Don't copy their content into `draft-AGENTS.md` by mistake.
- When `draft-AGENTS.md` is finished and approved: copy it to the OpenTag3D repo root as `AGENTS.md`, open a PR, and delete this entire folder. Don't leave it lingering after that point.
