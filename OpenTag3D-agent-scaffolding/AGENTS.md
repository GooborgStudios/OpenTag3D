# AGENTS.md — scoped to this folder only

This file describes `OpenTag3D-agent-scaffolding/` itself. It is **not** the OpenTag3D project's AGENTS.md — that's [`draft-AGENTS.md`](draft-AGENTS.md), a draft payload destined to become `/AGENTS.md` at the repo root once finished. Don't confuse the two.

## What you're standing in

A temporary staging folder for designing OpenTag3D's agent scaffolding, committed on the feature branch `feature/shark-0001-agent-scaffolding-setup`. It is not meant to be part of the Jekyll site. **It must never reach `main` as-is**, because Jekyll would publish these Markdown files (see [`reflow-plan.md`](reflow-plan.md) §6). Full context and current status: [`README.md`](README.md), but note that today's newer planning files may be more current than parts of that README.

## Current planning status

The project has moved well beyond the original one-file `draft-AGENTS.md` idea. Today's work added/revised the system for executing a full reflow into repo-root agent scaffolding:

- [`reflow-plan.md`](reflow-plan.md) is still the controlling document. It now defines the tiered target layout, execution sequence, acceptance criteria, settled decisions D1–D7, and follow-up ideas that require maintainer direction.
- [`draft-doc-skeletons.md`](draft-doc-skeletons.md) sketches the future `_docs/contributor-agent-guide.md`, `_docs/maintainer-runbooks.md`, and `_docs/make-read-tools.md` docs. Use it as planning source, not as final deliverable text.
- [`notes-make-read-tools.md`](notes-make-read-tools.md) records the fresh architecture pass over `make.html`, `read.html`, `assets/scripts/opentag3d.js`, and `assets/scripts/site.js`. This is the best current source for make/read tool flow and danger-zone details.
- [`routing-duplication-audit.md`](routing-duplication-audit.md) reviews the planned doc system for duplicated facts, weak routes, and boundary risks. Treat its deduplication guidance as part of the execution constraints.
- [`cold-start-tests.md`](cold-start-tests.md) defines future acceptance tests for the finished scaffolding. Do not run them until `/AGENTS.md`, nested `AGENTS.md` files, and `/_docs/` exist at the repo root.

Net status: the architecture is a **go after minor wording/deduplication tightening**. The next real work is to execute `reflow-plan.md` §7 deliberately, starting with the `_config.yml` exclude commit, not to keep expanding the staging-folder notes.

## Rules for working in this folder

- Read [`README.md`](README.md) first, specifically **"Current state & next steps"**, but reconcile it with the newer files listed above; if they disagree, prefer [`reflow-plan.md`](reflow-plan.md) plus [`routing-duplication-audit.md`](routing-duplication-audit.md).
- Treat [`draft-AGENTS.md`](draft-AGENTS.md) as an old draft, not ground truth about OpenTag3D or the final target architecture. The target is now the tiered layout in `reflow-plan.md`.
- Verify claims against the real repo (one level up) before relying on them, since the repo evolves out from under this snapshot.
- New follow-up ideas that are out of scope for the reflow go in [`gaps.md`](gaps.md) or the appropriate future-work section of [`reflow-plan.md`](reflow-plan.md), not into `draft-AGENTS.md` itself.
- This folder's own docs (this file, `README.md`) are meta — they're about the planning process, not the OpenTag3D repo. Don't copy their content into final repo docs by mistake.
- Keep deduplication strict during execution: root `/AGENTS.md` owns routing and hard boundaries; `_data/AGENTS.md` owns spec/supporter data checklists; `assets/scripts/AGENTS.md` owns protocol-code and Node verification; `_docs/*` owns reference/runbooks/backlog. Link instead of repeating.
- Decisions D1–D7 are resolved. Don't re-open them without the user. The old "just copy `draft-AGENTS.md` to the root" instruction is superseded.
- The folder is deleted in the reflow PR itself (reflow-plan §7, commit 7). Don't leave it lingering after that point.
