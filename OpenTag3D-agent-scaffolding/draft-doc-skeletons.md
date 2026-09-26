# Draft skeletons for future-facing agent docs

Planning-only draft for the three new reusable-system docs proposed in [`reflow-plan.md`](reflow-plan.md). These are **not** repo-root deliverables yet and should not be copied into `_docs/` until the reflow is executed deliberately.

Constraints carried forward here:

- Keep root `AGENTS.md` lean: it should route agents to these docs, not duplicate their procedures.
- Keep contributor guidance distinct from maintainer/trusted-agent runbooks.
- Treat suspected bugs as suspected findings until the maintainer confirms them.
- Do not invent maintainer policy. Unknown process details stay marked as unknown.
- Point to source material in this staging folder instead of copying large research notes.

---

## 1. Future doc: `_docs/contributor-agent-guide.md`

### Purpose

Give outside contributors and their agents a safe path through OpenTag3D: what is routine, what is high-blast-radius, when to ask first, and where deeper context lives.

This doc should answer: "I am not the maintainer; what can I change safely, and what must I propose rather than silently commit?"

### Intended reader

- First-time or occasional human contributors.
- Coding agents acting for those contributors.
- Maintainer-directed agents when they need to simulate the outside-contributor path.

### When an agent should read it

Read this before making changes if any of these are true:

- You are operating without explicit maintainer instructions.
- The task touches `_data/spec.json`, `spec.md`, `make.html`, `read.html`, `assets/scripts/opentag3d.js`, releases, tags, workflows, or supporter data.
- You found a gap or suspected bug and are tempted to fix it while doing another task.

Root `AGENTS.md` should link here from its "Where to start" router for new/outside contributors.

### Proposed table of contents

1. Contributor safety model
2. Routine changes you can usually make
3. Changes that require extra context
4. Changes to propose, not silently implement
5. Co-change reminders
6. Verification by change type
7. Known gaps are not an open work queue
8. Where to ask or escalate

### Sample sections in final-doc style

#### Contributor safety model

OpenTag3D is both a website and a published data contract. Some edits are easy to correct with the next deploy; others can affect tags already written by users or implementations that consume `/spec.json`.

Match your caution to the blast radius:

- Site prose, links, and styling are usually routine changes.
- `make.html` / `read.html` UI changes need browser verification because users rely on these tools directly.
- `_data/spec.json` and `assets/scripts/opentag3d.js` changes can affect encoded tag bytes. Treat those as standards/protocol work, not normal website edits.

If in doubt, open a proposal or ask first. Do not silently change the spec contract.

#### Routine changes you can usually make

These are usually safe for an outside contributor when the requested change is clear:

- Fix typos or broken prose in Markdown pages.
- Update content links when the target is known.
- Make small styling adjustments and verify the Jekyll build.
- Update supporter data when there is matching issue context and the affected files are kept in sync.

Still run the relevant verification from root `AGENTS.md`, and include what you checked in the PR notes.

#### Known gaps are not a work queue

`_docs/known-gaps.md` documents missing automation, suspected findings, and manual workarounds so agents do not rediscover them. It is not permission to fix those items unprompted.

When you encounter a known gap:

1. Follow the "Meanwhile, agents should" workaround in that entry.
2. Do not broaden the current task to solve the gap unless the maintainer explicitly asked for it.
3. If the gap blocks the requested work, report that clearly and ask how to proceed.

### Links to existing source material

- Overall target placement and router role: [`reflow-plan.md`](reflow-plan.md) §§3, 5.1, 5.5.
- Contributor-vs-maintainer split and current status: [`README.md`](README.md) "Current state & next steps".
- Existing root-agent draft to be slimmed into a router: [`draft-AGENTS.md`](draft-AGENTS.md).
- Repository orientation and risk profile source: [`notes-repo-rundown.md`](notes-repo-rundown.md).
- Spec edit classes and validation gaps: [`notes-spec-json-extensibility.md`](notes-spec-json-extensibility.md).
- Supporter/content automation gaps: [`notes-automation-opportunities.md`](notes-automation-opportunities.md).
- Out-of-scope backlog and suspected findings: [`gaps.md`](gaps.md).

### Open questions / risks

- The repo has no confirmed `CONTRIBUTING.md` or maintainer-approved contributor process yet. Avoid inventing review policy.
- Supporter-update authority is unclear from the checkout alone; require issue context or maintainer direction.
- The guide must stay short enough that outside agents actually read it; detailed protocol procedure belongs in `_data/AGENTS.md`, `assets/scripts/AGENTS.md`, and other `_docs/` files.
- The phrase "usually safe" must not be read as bypassing CI, formatting, or co-change checks.

---

## 2. Future doc: `_docs/maintainer-runbooks.md`

### Purpose

Provide reusable operating procedures for the maintainer and trusted maintainer-directed agents: reviewing agent PRs, triaging suspected protocol bugs, preparing releases, and keeping the agent context current.

This doc should answer: "I am acting with maintainer authority; what repeatable checklist should I use?"

### Intended reader

- The OpenTag3D maintainer.
- Trusted agents operating under maintainer direction.
- Future contributors only when explicitly asked to help with maintainer-level work.

### When an agent should read it

Read this when asked to do or support maintainer-level work, including:

- Review an agent-generated PR.
- Triage a suspected encode/decode, NFC, or spec-data bug.
- Prepare or audit a spec version bump/release.
- Update the agent docs after review reveals a new rule or convention.

Outside contributors should normally read `_docs/contributor-agent-guide.md` instead.

### Proposed table of contents

1. Scope and authority
2. Review an agent-generated PR
3. Triage a suspected protocol bug
4. Release/version bump checklist
5. Spec-governance touchpoints
6. Context upkeep after each PR
7. When to move prose into scripts or CI
8. Unknowns to confirm with the maintainer

### Sample sections in final-doc style

#### Scope and authority

Use this runbook only when acting as the maintainer or as a trusted agent under explicit maintainer direction. It contains operational workflows, not policy decisions.

If a process detail is not documented in the repository, treat it as unknown. Do not infer branch protection, merge rights, consortium voting process, or release authority from commit history alone.

#### Review an agent-generated PR

Review agent work by blast radius first, file diff second:

1. Classify the change: routine site/content, tool UI, protocol code, spec data, release/process, or automation.
2. Check the co-change map in root `AGENTS.md`.
3. For `_data/spec.json`, classify the edit before reviewing implementation details.
4. For protocol-code changes, require round-trip evidence and browser/manual evidence where relevant.
5. For release or governance-related work, confirm the human decision trail before accepting repo changes.
6. If review teaches a new repo convention, record it in `_docs/decisions.md` or the one doc where that rule belongs.

Prefer shrinking future review burden: when a prose checklist becomes mechanical, move it toward a script or CI check.

#### Triage a suspected protocol bug

Treat protocol bugs as suspected until reproduced and confirmed.

A minimal triage flow:

1. Identify the area: display-only UI, field encode/decode, NDEF/NTAG packing, Web NFC write flow, config pages, import/export, or legacy-spec handling.
2. Build the smallest reproduction. Use the Node recipe from `assets/scripts/AGENTS.md` when the code path does not require DOM or Web NFC.
3. Compare behavior against `_data/spec.json`, `spec.md`, and any relevant `assets/json/spec_v*.json` legacy snapshot.
4. Separate "new writes would be wrong" from "already-written tags may be affected".
5. Present evidence and ask the maintainer to confirm expected behavior before changing code.

Example triage target: the suspected 6-byte `barcode` integer round-trip finding. Reproduce it, show the exact bytes and decoded value, and ask whether the observed behavior is incorrect before patching.

### Links to existing source material

- Maintainer runbook outline: [`reflow-plan.md`](reflow-plan.md) §5.6.
- Release/version and governance research: [`notes-spec-maintenance-workflow.md`](notes-spec-maintenance-workflow.md).
- Suspected barcode finding and bug-triage framing: [`reflow-plan.md`](reflow-plan.md) §10 and [`gaps.md`](gaps.md).
- Spec field model and validation gaps: [`notes-spec-json-extensibility.md`](notes-spec-json-extensibility.md).
- Automation path from prose to scripts/CI: [`reflow-plan.md`](reflow-plan.md) §§3.2, 9.
- Known process gaps: [`gaps.md`](gaps.md).

### Open questions / risks

- Merge rights, branch protection, and review expectations cannot be fully confirmed from the checkout.
- Consortium vote mechanics and whether votes should leave a repo artifact are unknown.
- Release authority and exact tag process should not be delegated to an agent without explicit maintainer approval.
- The runbook must not become a hidden CONTRIBUTING.md. Human contributor policy belongs in a future maintainer-approved `CONTRIBUTING.md` if desired.
- Suspected bug examples could be misread as confirmed bugs; label them carefully every time.

---

## 3. Future doc: `_docs/make-read-tools.md`

### Purpose

Document the architecture and verification expectations for the high-churn `make.html` and `read.html` tools without overloading root `AGENTS.md`.

This doc should answer: "I need to edit the make/read tools; what code paths and assumptions must I understand first?"

### Intended reader

- Agents and humans editing `make.html`, `read.html`, or nearby shared scripts.
- Reviewers checking UI/tool changes.
- Maintainer-directed agents investigating tool bugs.

### When an agent should read it

Read this before editing:

- `make.html`
- `read.html`
- page-local JavaScript inside those files
- UI flows that depend on `globalThis.OpenTag3D.spec`
- import/export behavior surfaced through the make/read pages

Also read `assets/scripts/AGENTS.md` before touching shared protocol code in `assets/scripts/opentag3d.js`.

### Proposed table of contents

1. What this doc covers
2. Bootstrapping the spec into browser tools
3. Shared code vs page-local code
4. `make.html` flow: form generation to encode/write/export
5. `read.html` flow: read/import to decode/display
6. Import/export formats and legacy-spec assumptions
7. Verification expectations
8. Danger zones
9. Future improvements to this architecture note

### Sample sections in final-doc style

#### Bootstrapping the spec into browser tools

`make.html` and `read.html` are Jekyll-rendered pages that make the current spec available to browser JavaScript before shared modules run. Shared protocol code expects the active spec at `globalThis.OpenTag3D.spec`.

When editing these pages:

- Do not remove the spec bootstrap without replacing every dependent path.
- Keep browser behavior and the Node verification recipe aligned: both should exercise the same shared encode/decode logic where possible.
- Remember that `/spec.json` and `_data/spec.json` are part of the public contract; page UI should follow the spec, not fork it into hard-coded field definitions.

#### Shared code vs page-local code

Use page-local code for presentation, form layout, and user-flow glue. Use shared code for protocol behavior: field encode/decode, tag-buffer interpretation, NDEF/NTAG packing, import/export parsing, and legacy-version loading.

Before moving logic between a page and `assets/scripts/opentag3d.js`, ask what is being changed:

- A display-only transformation can usually stay page-local.
- A byte-level or format-level transformation belongs in shared code and needs protocol verification.
- Web NFC write behavior needs browser/device verification or an explicit "not locally verified" note.

#### Verification expectations

For `make.html` / `read.html` changes, include evidence appropriate to the path touched:

- UI-only change: Jekyll build plus a browser check.
- Field encode/decode or import/export change: Node round-trip recipe from `assets/scripts/AGENTS.md` plus a browser check.
- Web NFC write/config-page change: ask first; then verify on a supported Chrome/Android/Web NFC setup, or state clearly that real NFC was not locally verified.
- Legacy decode path: include the old major-version snapshot used for verification.

### Links to existing source material

- Need for this architecture note and high churn: [`reflow-plan.md`](reflow-plan.md) §§2.2, 5.7.
- Existing gap entry promoted into the plan: [`gaps.md`](gaps.md) "No architecture note for `make.html`/`read.html`."
- Shared-script danger zones and Node recipe target: [`reflow-plan.md`](reflow-plan.md) §5.4.
- General repo structure and shared script overview: [`notes-repo-rundown.md`](notes-repo-rundown.md).
- Automation/testing follow-ups for protocol logic: [`gaps.md`](gaps.md) and [`reflow-plan.md`](reflow-plan.md) §9.

### Open questions / risks

- The exact internal structure of `make.html` and `read.html` should be re-verified against current `main` when the real doc is written.
- Do not create a line-number map; it will go stale quickly. Use function names, page sections, and data-flow descriptions.
- Real Web NFC verification may not be available to every contributor. The doc should require honesty about what was and was not locally verified.
- The doc should not absorb protocol-code checklists that belong in `assets/scripts/AGENTS.md`.

---

## Final note: is this still the right split?

Yes. These three docs still look like the right split before execution:

- `contributor-agent-guide.md` keeps outside contributors safe without exposing maintainer-only procedure as default guidance.
- `maintainer-runbooks.md` gives the maintainer/trusted-agent workflows a home outside lean root `AGENTS.md`.
- `make-read-tools.md` covers the highest-churn UI/tools area without bloating either contributor guidance or protocol-script checklists.

No split change is needed before execution. The main execution risk is content overlap: root `AGENTS.md` should route to these docs, not repeat them; `assets/scripts/AGENTS.md` should own protocol-code checklists; and maintainer policy unknowns must remain explicitly unknown until confirmed.
