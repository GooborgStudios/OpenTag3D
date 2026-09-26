# Routing and duplication audit

## Overall assessment

The planned doc system is directionally sound: tiered context, nested danger-zone `AGENTS.md` files, and separate contributor/maintainer paths should keep root `/AGENTS.md` lean while still giving high-blast-radius work strong guardrails.

The main risk before execution is not missing content; it is over-documenting the same safety rules in too many places. The plan already states "one home per fact," but several outlines still propose copying the co-change map, verification matrix, blast-radius model, and known-gap warnings across root, contributor guide, make/read docs, nested `AGENTS.md`, and runbooks. Execution should aggressively collapse repeated detail into one authoritative home plus links.

## Duplicated facts to collapse

- **Co-change map:** Planned in root `/AGENTS.md`, then repeated in `_docs/contributor-agent-guide.md`, `_data/AGENTS.md`, and cold-start expectations. Recommended home: root `/AGENTS.md` as the canonical short table. Other docs should link to it and add only local exceptions.
- **Known gaps are not work queue:** Correctly important, but appears in `reflow-plan.md`, `draft-doc-skeletons.md`, `cold-start-tests.md`, and planned root/contributor/known-gaps docs. Recommended home: `_docs/known-gaps.md` opening rule. Root router can have one line: "Known gaps are not unprompted work."
- **Verification by change type:** Planned in root, contributor guide, make/read tools, and `assets/scripts/AGENTS.md`. Recommended homes:
  - root: minimal verify routing table;
  - `assets/scripts/AGENTS.md`: Node/protocol recipe;
  - `_docs/make-read-tools.md`: browser/UI/Web NFC matrix.
  Contributor guide should link rather than restate.
- **Blast-radius framing:** Appears in the reflow summary, root outline, contributor guide, make/read skeleton, and runbooks. Recommended home: root `/AGENTS.md` gets the compact model; deeper docs specialize it only for their area.
- **Spec edit classes:** Root router, `_data/AGENTS.md`, contributor guide, spec-change process, and cold-start tests all mention them. Recommended home: `_data/AGENTS.md` is canonical for classification. `spec-change-process.md` links to it.
- **Supporter duplication:** Needed in root co-change map and `_data/AGENTS.md`; avoid also expanding it in contributor guide beyond a link.
- **Suspected barcode bug:** Mentioned in `gaps.md`, `reflow-plan.md` §5.6/§10, maintainer skeleton, and cold-start tests. Recommended home: `_docs/maintainer-runbooks.md` as a triage example plus `_docs/known-gaps.md` one short suspected-finding entry.

## Missing or weak routes

- Root router is planned well, but should explicitly route **suspected bugs** to `_docs/maintainer-runbooks.md` before behavior changes. Right now suspected-bug routing is mostly implied through maintainer workflows and known gaps.
- Add a root route for **import/export format changes** if they do not obviously look like `make.html`/`read.html` or `opentag3d.js` tasks. These affect user files and external tools, so they should route to `assets/scripts/AGENTS.md` and `_docs/make-read-tools.md`.
- `_docs/README.md` is listed as an index, but the plan does not define its boundary beyond "one line each." Keep it purely navigational; do not let it become a second router competing with root `/AGENTS.md`.
- `spec-change-process.md` should route back to `_data/AGENTS.md` for edit classification and to `maintainer-runbooks.md` for release authority. Without this, it may read like an executable process for contributors.
- `contributor-agent-guide.md` should clearly say when to stop reading maintainer docs unless explicitly directed. Otherwise contributors may treat maintainer runbooks as permission to perform maintainer-only work.

## Boundary problems

- **Maintainer-only workflows could leak into contributor guidance.** The contributor guide outline includes high-caution tasks and co-change reminders, which is useful, but it must not include release/tag procedures, governance operating details, or suspected-bug patch flows beyond "ask/propose." Those belong in maintainer runbooks and spec-change process with maintainer-only labels.
- **Root `/AGENTS.md` can bloat quickly.** The planned root includes router, tech stack, data-driven spec, build table, boundaries, co-change map, gotchas, and upkeep. Keep detailed explanations out. Use terse rules and links.
- **`_docs/spec-change-process.md` could become contributor policy.** Since `CONTRIBUTING.md` is intentionally absent, label unconfirmed process details and maintainer-only release/tag actions very explicitly.
- **`_docs/make-read-tools.md` overlaps with `assets/scripts/AGENTS.md`.** Keep make/read responsible for page flows, bootstrapping, UI verification, and Web NFC expectations. Keep byte-level protocol checklists and Node recipe details in `assets/scripts/AGENTS.md`.
- **`_docs/spec-data-model.md` overlaps with `_data/AGENTS.md`.** Keep `_data/AGENTS.md` as the edit checklist. Keep `spec-data-model.md` as reference/recompute material.

## Known-gaps safety issues

- The plan correctly says known gaps are not permission for speculative work. Preserve that exact rule at the top of future `_docs/known-gaps.md`.
- Each known gap needs a "Do not" line only where there is a tempting unsafe action. Avoid turning every entry into a long essay.
- Items like release automation, supporter-table generation, schema validation, link checking, Markdown formatting, and CI staging should be framed as **future maintainer decisions**, not obvious next tasks.
- The "After the reflow" section in `reflow-plan.md` is useful but could be mistaken for an ordered implementation backlog. When harvested into `_docs/known-gaps.md` or decisions, label these as "ideas/follow-ups; do not start without a prompt."
- Cold-start CST-09 correctly distinguishes "known gap explicitly requested" from drive-by work; carry that distinction into `_docs/known-gaps.md`.

## Suspected-bug wording issues

- The barcode/int issue is mostly worded safely now: "suspected," "needs maintainer confirmation," and "do not patch opportunistically." Keep that wording in all final docs.
- Avoid phrases like "fails silently" unless verified in current code during execution. Safer wording: "may fail or be ignored without schema validation; verify against current encode/decode branches."
- `notes-make-read-tools.md` mentions `SPEC.core.address_range.end + 1` as a suspected review point only if observable. That is appropriately cautious; do not promote it to `known-gaps.md` unless reproduced.
- Any statement about branch protection, merge rights, consortium voting, and release authority must remain "observed/unconfirmed" unless the maintainer confirms it.

## Recommended edits before execution

- Completed in `reflow-plan.md`: §5.5 now says to link to the root co-change map rather than copy it; §5.8 labels the release runbook maintainer-only; §9 labels the ranked list as follow-up ideas requiring maintainer direction, not a work queue.
- During execution, give each final doc a one-sentence "owns / does not own" boundary:
  - root owns routing and hard boundaries;
  - `_data/AGENTS.md` owns spec/supporter data edit checklists;
  - `assets/scripts/AGENTS.md` owns protocol-code checklist and Node recipe;
  - contributor guide owns outside-contributor posture;
  - maintainer runbooks own trusted workflows;
  - make/read tools owns page architecture;
  - known gaps owns backlog safety.
- Keep `_docs/README.md` as an index only.
- Add explicit ask-first/never boundaries for high-blast-radius tasks in root and only link/restate minimally elsewhere: `core` layout, spec `version`, legacy snapshots, Web NFC write/config pages, release tags, workflows/package deps, consortium membership/governance records.

## Go / no-go recommendation

**Go after minor wording tightening.** The architecture is good enough to execute, provided the implementer treats deduplication as a hard acceptance criterion. Do not expand root `/AGENTS.md`; route from it. Do not let known gaps become a backlog of unprompted refactors. Do not turn suspected findings into confirmed bugs without reproduction and maintainer confirmation.
