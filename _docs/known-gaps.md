# Known gaps

These gaps are context and safe-workaround notes, not an unprompted work queue. Do not fix one unless the maintainer asked for it or it directly blocks the assigned task.

### No CONTRIBUTING.md — status: needs maintainer decision

Why it matters: first-time contributors cannot see the expected PR, review, or spec-proposal path in one place.
Meanwhile, agents should: use [`contributor-agent-guide.md`](contributor-agent-guide.md) and ask when process authority is unclear.
Do not: invent maintainer policy or branch rules.

### Consortium vote trail is not visible in-repo — status: needs maintainer confirmation

Why it matters: `about.md` describes consortium approval for spec changes, but the checkout does not show how approvals map to PRs.
Meanwhile, agents should: treat `core` spec changes and major bumps as proposals requiring human confirmation.
Do not: create vote logs, issue templates, or governance process unprompted.

### Release/version drift is unchecked — status: idea

Why it matters: `_data/spec.json` version, `spec.md` changelog, legacy snapshots, homepage announcement, and git tags are manually coordinated.
Meanwhile, agents should: follow [`spec-change-process.md`](spec-change-process.md) and call out every touched/untouched release surface.
Do not: create tags or release automation without maintainer direction.

### Merge rights and review process are unconfirmed — status: needs maintainer confirmation

Why it matters: branch protection and merge rights are GitHub settings, not files in the repo.
Meanwhile, agents should: avoid assuming who can merge or approve; ask if it matters to the task.
Do not: infer policy from commit history alone.

### No automated protocol tests — status: idea

Why it matters: `opentag3d.js` handles byte encoding/decoding, NDEF/NTAG packing, import/export formats, and Web NFC with no test suite.
Meanwhile, agents should: use the manual/Node round-trip guidance in `assets/scripts/AGENTS.md` once added and include verification evidence.
Do not: refactor protocol code opportunistically.

### No schema or byte-range validation for `_data/spec.json` — status: idea

Why it matters: bogus types, overlaps, out-of-range fields, and missing legacy snapshots can pass build/format checks.
Meanwhile, agents should: use [`spec-data-model.md`](spec-data-model.md)'s byte-map command and `_data/AGENTS.md` once added.
Do not: treat a passing Jekyll build as proof a spec edit is safe.

### Suspected 6-byte `barcode` integer round-trip issue — status: needs maintainer confirmation

Why it matters: planning suggested large multi-byte integers may interact with 32-bit shift behavior.
Meanwhile, agents should: reproduce with the suspected-protocol-bug triage flow in [`maintainer-runbooks.md`](maintainer-runbooks.md), present bytes and decoded values, and ask for confirmation.
Do not: patch integer packing/reading as a side quest.

### Remaining `core` byte budget is manual — status: idea

Why it matters: only 24 bytes are free as of spec v2.003, and no script enforces the budget.
Meanwhile, agents should: recompute gaps with [`spec-data-model.md`](spec-data-model.md)'s command before proposing `core` fields.
Do not: choose field offsets by inspection only.

### Supporter tables duplicate `_data/supporters.yml` — status: idea

Why it matters: `getting-started.md` tables and structured supporter data can drift.
Meanwhile, agents should: update both places when a requested supporter change affects both.
Do not: add supporters without issue context or maintainer direction.

### Link, Markdown, and content cross-reference checks are minimal — status: idea

Why it matters: Markdown formatting, outbound links, navigation targets, supporter logo paths, and data enums are not comprehensively checked in CI.
Meanwhile, agents should: manually check links/data paths touched by the task.
Do not: broaden a content edit into CI tooling unless asked.

### No staging or post-deploy smoke test — status: idea

Why it matters: `main` deploys to production through GitHub Pages.
Meanwhile, agents should: build locally/CI and use browser checks for rendered behavior when relevant.
Do not: push to `main` or change deploy workflows without maintainer instruction.

Ideas, not proposals: article/feed automation, supporter-intake PR automation, Discord announcements, Windows dev-server notes, and CODE_OF_CONDUCT norms may be useful later if the maintainer wants them.
