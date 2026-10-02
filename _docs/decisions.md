# Agent-context decisions

Short decision log for agent scaffolding. Format: Decision · Why · Revisit when.

## Tiered agent context

Decision: use root `AGENTS.md`, nested `AGENTS.md` files in `_data/` and `assets/scripts/`, and reference docs in `_docs/`.
Why: a single root file would have to carry every checklist and would be too large for routine work.
Revisit when: tooling or repo structure makes local checklists unnecessary.

## `_docs/` for reference docs

Decision: keep agent reference docs in `_docs/`.
Why: Jekyll ignores underscore-prefixed directories by default, it matches the repo's `_data`/`_includes` idiom, and it avoids publishing agent context as website content.
Revisit when: Jekyll configuration changes to publish `_docs/` or the maintainer wants a different private-doc location.

## Known gaps stay short and in-repo for now

Decision: keep a neutral [`known-gaps.md`](known-gaps.md) with safe workarounds; convert items to GitHub issues only if the maintainer asks.
Why: agents need the "meanwhile" guidance to avoid rediscovering gaps or fixing them opportunistically.
Revisit when: the maintainer chooses an issue-tracking workflow.

## `AGENTS.md` is canonical; `CLAUDE.md` is a shim

Decision: root `AGENTS.md` is the cross-tool source. `CLAUDE.md` should only import it.
Why: multiple agent tools read `AGENTS.md`; duplicating guidance would drift.
Revisit when: tool conventions change.

## Root README pointer

Decision: add one root `README.md` line pointing contributors/agents to `AGENTS.md` and `_docs/`.
Why: humans browsing the repo need a visible entry point.
Revisit when: a future `CONTRIBUTING.md` becomes the better entry point.

## One PR with separable commits

Decision: land the reflow as one PR split into independently reviewable commits.
Why: two PRs would ship temporary duplication first; separable commits still let the maintainer drop pieces.
Revisit when: review requests a narrower PR.

## Agent docs describe the repo, not one machine

Decision: do not add Windows-local dev-server notes to root agent rules.
Why: they would document one contributor environment and go stale.
Revisit when: the maintainer wants a supported Windows/WSL development guide.

## No guessed house-style section yet

Decision: do not invent PR or house-style conventions before maintainer review teaches them.
Why: process details are currently undocumented and should not be guessed from history.
Revisit when: this PR review reveals stable conventions.

## One home per fact

Decision: each operational fact should have one owning doc; other docs link to it.
Why: duplicated warnings like "main is production" and "no tests" drift and bloat context.
Revisit when: a fact is repeated often enough that its ownership is unclear.

## Point, do not copy

Decision: agent docs point to source files for volatile/public facts instead of restating them.
Why: consortium membership, version semantics, field lists, and changelog details already have public homes.
Revisit when: a source file lacks enough context for safe agent work.

## Separate stable from volatile

Decision: stable architecture can be prose; volatile facts need verification stamps or recompute commands.
Why: byte maps, counts, line numbers, and versions go stale quickly.
Revisit when: scripts/CI replace manual commands.

## Rules, not research

Decision: final agent docs state what to do and why, not how the fact was discovered.
Why: research narrative belongs in git history and planning commits.
Revisit when: provenance is needed for a specific disputed decision.

## Mechanical rules should migrate into checks

Decision: prose checklists are temporary homes for rules that can eventually be scripted.
Why: executable checks reduce context load and review burden.
Revisit when: adding or changing a checklist item that could be automated.
