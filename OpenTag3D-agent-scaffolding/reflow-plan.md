# Reflow plan: moving the agent scaffolding into the OpenTag3D repo

Plan for turning this staging folder into permanent, maintainable agent context in the repo proper.
Written 2026-09-26 against `main` at `6c6791d` (spec v2.003). **Decisions D1–D6 resolved 2026-09-26; D7 added after review** (§8).
This plan is revised for reusable future workflows, not just safe orientation docs. Nothing in here has been executed yet.

---

## 1. Summary

The research in this folder is good, but it is organised by *when it was researched*: original notes,
later draft skeletons, architecture notes, audits, and acceptance-test prompts. The same facts now appear
in several places. The reflow reorganises it by **what kind of content it is** and **when an agent needs it**:

| Kind of content | Question it answers | Home in the repo |
| --- | --- | --- |
| **Rules and orientation** | "What is this, where do I go, what must I never do?" | `/AGENTS.md` (always loaded) |
| **Local rules at the danger zones** | "I'm about to touch the spec or the protocol code, what's the checklist?" | `_data/AGENTS.md`, `assets/scripts/AGENTS.md` (loaded when working there) |
| **Reference and procedure** | "How exactly does the byte map / release / governance work?" | `_docs/*.md` (read when needed) |
| **Contributor guidance** | "I am new/outside the maintainer context; what is safe to change?" | `_docs/contributor-agent-guide.md` |
| **Maintainer runbooks** | "I am the maintainer/trusted agent; how do I triage, release, review, and maintain this system?" | `_docs/maintainer-runbooks.md` |
| **Architecture notes for hot paths** | "How do the frequently edited make/read tools fit together?" | `_docs/make-read-tools.md` |
| **Backlog** | "Is this known to be missing? Should I fix it?" | `_docs/known-gaps.md` (later: GitHub issues) |
| **Rationale** | "Why is it like this? Can I change it?" | `_docs/decisions.md` |
| **Research log** | "How did we find this out?" | Git history only. The notes files are retired. |

This folder is then deleted in the same PR, so its research stays retrievable from the PR's commits.

**Scope update after review:** this is no longer just a "safe orientation docs" pass. The reflow should also leave reusable systems for future work: separate contributor-vs-maintainer paths, a maintainer runbook for bug triage/release/review workflows, and an initial architecture note for the high-churn `make.html` / `read.html` tools.

---

## 2. What this repo is, seen from an agent's side

### 2.1 A standards body's repo that happens to be a website

On the surface OpenTag3D is a small Jekyll site. What it actually hosts is a **published binary data
contract**. Third-party firmware, mobile apps and filament makers build against it, physical tags carry it
on spools, and a consortium governs it. That creates a risk profile most small-website repos don't have.
Some edits are fixed by the next deploy, and some last as long as a spool of filament.

| Surface | Reversibility | Blast radius | Agent posture |
| --- | --- | --- | --- |
| Prose pages, `getting-started.md`, `articles/`, SCSS | Next push to `main` fixes it | Site visitors | Just do it; build + format must pass |
| `make.html` / `read.html` UI | Next push fixes it | Tool users | Do it; verify in a browser |
| `assets/scripts/opentag3d.js` encode/decode | **Bad bytes persist on tags already written.** Config-page mistakes can password-lock a tag permanently | Every tag written with the tool | Careful; round-trip verify; ask before touching config pages |
| `_data/spec.json` `core` layout / `version` | Published at `/spec.json`; implementers ship against it | Whole ecosystem | **Not an agent's decision.** Propose, don't merge |
| `assets/json/spec_v*.json` | Old tags in the field depend on it | Every legacy tag | **Never edit** |

**Design principle that follows:** context depth should match blast radius, not code size. The common
path (content edits) should need almost no context. The rare, high-stakes paths should run into a
checklist.

### 2.2 How the repo actually changes

`git log main` (191 commits since 2026-03-01) shows where edits land:

| File | Commits | What that means for context |
| --- | --- | --- |
| `make.html` | 59 | **The hottest file.** Use `notes-make-read-tools.md` as the source for the initial architecture note |
| `_data/spec.json` | 29 | Spec edits are **frequent**, not rare, but most are descriptions or `web_api` additions, not `core` layout. The rules must tell the edit classes apart (§5.2) |
| `spec.md` | 22 | Moves with `spec.json` (the changelog) |
| `about.md`, `index.md`, `supporters.yml`, `getting-started.md` | 10–16 each | The routine content path; supporter data is duplicated by hand across two files |

It is essentially a single-maintainer repo: frequent small commits, squash-merged PRs, dependabot. An
agent-docs PR from a new contributor has to be **low-footprint and easy to review**: few files, nothing
published to the site, nothing that changes behaviour.

### 2.3 Who the agents are

- **The maintainer's own agents.** Most of the repo was built with AI help, so these will benefit most.
- **Contributors' agents** (Cursor, Codex, Copilot, Claude Code, Gemini…). Tool-agnostic is required,
  which is why `AGENTS.md` is canonical.
- **Implementers' agents reading the spec from outside.** They consume `spec.md` / `/spec.json`, not this
  scaffolding. The published spec stays the authority; agent docs point to it and never restate it.

---

## 3. Context architecture

### 3.1 Tiers (progressive disclosure)

```
Tier 0  /AGENTS.md                 always in context · ~150 lines · orientation, router, boundaries, co-change map
Tier 1  _data/AGENTS.md            loaded when working in that dir · short checklists at the danger zones
        assets/scripts/AGENTS.md
Tier 2  _docs/*.md                 loaded on demand via links from tier 0/1 · reference + procedures
        _docs/contributor-agent-guide.md   outside-contributor safety path
        _docs/maintainer-runbooks.md       maintainer/trusted-agent workflows
        _docs/make-read-tools.md           high-churn make/read tool architecture
Tier 3  the code and data itself   the source of truth · context POINTS here, never copies it
```

Auto-discovery of nested `AGENTS.md` files varies by tool. So Tier 0 also contains an explicit router line
("before editing in `_data/` or `assets/scripts/`, read the `AGENTS.md` there"). That keeps the design
working in every tool, with auto-discovery as a bonus.

### 3.2 Principles (these go into `_docs/decisions.md` so they outlive this folder)

1. **One home per fact.** "No tests / no staging / main is production" currently appears in five
   files. After the reflow each fact lives in exactly one place, and everything else links to it.
2. **Point, don't copy.** Don't restate consortium membership (it lives in `about.md`), versioning
   semantics (`spec.md`) or the field list (`_data/spec.json`). Copies go stale; pointers don't.
3. **Separate stable from volatile.** Stable facts (the architecture, the governance model) get plain
   prose. Volatile facts (byte-gap map, spec version, line numbers, counts) either get a
   `Verified against spec vX / <sha>` stamp or, better, are replaced by a **command that recomputes them**.
   Line-number citations (`opentag3d.js:195-318`) become function names.
4. **Rules, not research.** Agent docs state what to do and why in one clause. How it was
   discovered belongs in git history.
5. **Mechanical rules should migrate into checks.** A rule that can be checked by a script is prose
   only until the script exists. The path is prose rule → copy-paste command in the doc → `scripts/` →
   CI gate, and at that point the doc shrinks to "run X". §9 lays out this path.
6. **Agent docs are not website content.** Nothing added by this reflow may be published to
   opentag3d.info (§6).

### 3.3 Target layout

```
/AGENTS.md                      ← draft-AGENTS.md, reworked into a router (§5.1)
/CLAUDE.md                      ← one line: @AGENTS.md   (Claude Code shim; D4)
/README.md                      ← + one-line pointer to AGENTS.md and _docs/ (D5; own commit)
/_config.yml                    ← + exclude: AGENTS.md, CLAUDE.md, assets/scripts/AGENTS.md
/_data/AGENTS.md                ← NEW: spec.json edit classes + checklist; supporters.yml flow
/assets/scripts/AGENTS.md       ← NEW: protocol-code map, danger zones, Node round-trip recipe
/_docs/
    README.md                   ← index: what each doc is for, one line each
    contributor-agent-guide.md  ← safety path for outside contributors and their agents
    maintainer-runbooks.md      ← maintainer/trusted-agent workflows: triage, release, review, context upkeep
    make-read-tools.md          ← architecture note for make.html/read.html and page-local JS
    spec-data-model.md          ← field model, type enum, byte budget (+ recompute command)
    spec-change-process.md      ← idea → consortium → PR → version/changelog/snapshot → tag → deploy
    known-gaps.md               ← deduped gaps.md + automation notes, each with "meanwhile, do X" and "do not" where needed
    decisions.md                ← settled decisions + context-engineering principles, with rationale
```

**Why `_docs/`:** Jekyll ignores `_`-prefixed directories that aren't configured as collections, so it
is unpublished with zero config. It matches the repo's own idiom (`_data`, `_includes`, `_sass`), and it
stays visible in a file listing, unlike a dot-folder. A top-level `docs/` would be confusing in a repo
whose whole purpose is publishing docs, and it would ship to the site. `_data/AGENTS.md` is also safe:
Jekyll's data reader only loads `yml/yaml/json/csv/tsv`.

---

## 4. Source → destination map

Every source file in this folder, and where it goes. **Retire** means it's fully absorbed elsewhere or is
research narrative. It stays retrievable in git. Newer planning files (`notes-make-read-tools.md`,
`draft-doc-skeletons.md`, `routing-duplication-audit.md`, and `cold-start-tests.md`) are authoritative for
their narrow topics where they are more specific than the older notes.

### `draft-AGENTS.md` → `/AGENTS.md`

| Section | Destination |
| --- | --- |
| What this repo is | Stays; add the reversibility framing from §2.1 in two sentences |
| Contributor-vs-maintainer router | Add: outside contributors read `_docs/contributor-agent-guide.md`; maintainer/trusted agents read `_docs/maintainer-runbooks.md` |
| Tech stack | Stays, condensed |
| The spec is data-driven | Keep the derivation diagram (3 bullets). **Move** the "If you change the field layout…" checklist and "Nothing validates a `core` field edit" block → `_data/AGENTS.md` |
| Directory map | Stays; add `_docs/` and the nested `AGENTS.md` locations |
| Build, dev, and CI | Stays; add a "verify by change type" table (§5.1) |
| Gotchas | Stays; add supporter duplication and manual article linking |
| Header "(DRAFT…)" + provenance blockquote | Delete |

### `notes-repo-rundown.md` → **retire**

Everything durable is already in the draft. The leftovers are the Bambu Research Group / OpenPrintTag
history (already told in `about.md` and `articles/`, so point, don't copy), line counts (volatile), and the
Windows note (→ `decisions.md` as a settled decision).

### `notes-spec-json-extensibility.md` → split

| Section | Destination |
| --- | --- |
| §1 Field model, `type` enum, dead `"-"` type | `_docs/spec-data-model.md` |
| §2 How a new field gets added | `_data/AGENTS.md` as a **checklist** (rule form), linking to the data model for detail |
| §3 Byte-gap table | `_docs/spec-data-model.md` with a `Verified against v2.003` stamp **plus the recompute command** (§5.3). The table is a convenience, and the command is the authority |
| §4 No schema validation | One line in `_data/AGENTS.md` ("be your own schema check"); detail → `known-gaps.md` |
| §5 Validation opportunities | `known-gaps.md` |

### `notes-spec-maintenance-workflow.md` → split

| Section | Destination |
| --- | --- |
| §1 PR lifecycle (CI gates) | `/AGENTS.md` build section (already there) |
| §1 Squash-merge / single-author observation | `spec-change-process.md`, clearly labelled **observed, unconfirmed** |
| §2 Release process + versioning scheme | `spec-change-process.md` as a runbook. The versioning *semantics* link to `spec.md`'s Reader Implementation Guidelines instead of being restated |
| §3 Governance model + the vote-tracking disconnect | `spec-change-process.md` (link to `about.md` for membership); the disconnect itself → `known-gaps.md` |
| §4 No contribution guidelines | `known-gaps.md` |
| §5 "Must stay human" list | **`/AGENTS.md` Boundaries section.** This is the most important agent-rule content in the whole folder |
| §5 "Safe to automate" / "ambiguous" | `known-gaps.md` (with a `needs maintainer` status on the ambiguous ones) |

### `notes-automation-opportunities.md` → mostly `known-gaps.md`

It's a backlog, not working context, with two exceptions that are **active rules today**:
- Supporter data is hand-duplicated between `_data/supporters.yml` and `getting-started.md`'s tables, so
  **update both** → `/AGENTS.md` gotchas + co-change map, and `_data/AGENTS.md`.
- `index.md`'s `announcement:` string is version-linked → a step in the `spec-change-process.md` runbook.
- New articles aren't auto-listed and must be linked by hand → co-change map.

### `notes-make-read-tools.md` → `_docs/make-read-tools.md` + `assets/scripts/AGENTS.md`

This is the freshest source for the make/read architecture. Harvest the boot sequence, file responsibility
map, user flows, danger zones, and verification matrix into `_docs/make-read-tools.md`. Move only the
protocol-code checklist and Node-verification details into `assets/scripts/AGENTS.md`. Do not copy line
numbers or speculative open questions into final docs unless re-verified and still useful.

### `draft-doc-skeletons.md` → `_docs/contributor-agent-guide.md`, `_docs/maintainer-runbooks.md`, `_docs/make-read-tools.md`

Use as shape and sample prose, not as final text. Its key contribution is the ownership split:
contributor guidance owns outside-contributor posture, maintainer runbooks own trusted workflows, and
make/read docs own page architecture. Keep unknown maintainer process details labelled unknown.

### `routing-duplication-audit.md` → execution constraints across all deliverables

Treat this audit as part of the plan, not optional commentary. During execution, give each final doc a
one-sentence ownership boundary and collapse duplicated facts into one authoritative home:

- root `/AGENTS.md` owns routing, hard boundaries, the co-change map, and the minimal verification router;
- `_data/AGENTS.md` owns spec/supporter data edit checklists;
- `assets/scripts/AGENTS.md` owns protocol-code danger zones and the Node round-trip recipe;
- `_docs/known-gaps.md` owns backlog safety and the "not a work queue" rule;
- `_docs/make-read-tools.md` owns page architecture and browser/Web NFC verification expectations;
- `_docs/maintainer-runbooks.md` owns suspected-bug triage and trusted maintainer workflows.

Other docs should link to those homes instead of repeating their tables.

### `cold-start-tests.md` → acceptance tests, not final repo content

Do not copy this file into the repo-root scaffolding. Use it after the reflow as the cold-start acceptance
suite in §7.1: a fresh agent should route to the right doc, classify the work, and stop at the right
boundary before editing. If a test fails, fix the docs rather than weakening the test.

### `gaps.md` → `_docs/known-gaps.md`

Merge with the automation notes and dedupe. For example, "no tests for opentag3d.js" and "no round-trip
tests" become one item. Reformat each item as:

```
### <gap>                                         status: idea | needs maintainer decision | needs maintainer confirmation | issue #NN
Why it matters: one sentence.
Meanwhile, agents should: the manual workaround (e.g. "compute the byte map with the command in spec-data-model.md").
Do not: one sentence where needed, especially for tempting refactors or suspected bugs.
```

The "meanwhile" line is what makes a backlog useful as agent context: it turns "this is missing" into
"here's how to work safely without it." The "do not" line prevents future agents from treating a gap as permission for speculative work. Open the file with a line telling agents **not to fix these
unprompted**. Each one is a separate PR decision for the maintainer. Suspected bugs are labelled as suspected findings, not factual conclusions, until the maintainer confirms them.

**Tone and length (D3):** keep it short and neutral. Describe each gap as the state of the repo plus a
workaround, not as a criticism, and drop anything speculative (the Discord webhook, the article feed) into
a single "ideas, not proposals" line at the bottom. Target: under ~80 lines. Items move to GitHub issues
only after the maintainer says they want that (see §7 step 9). When an item becomes an issue, its entry
shrinks to one line + the issue link.

### `README.md`, `AGENTS.md` (folder-scoped) → **retire**, harvest into `_docs/decisions.md`

The "Settled (don't re-litigate)" list is the one durable piece. It becomes the first entries of the
decision log.

---

## 5. Content outlines for the new and reworked files

### 5.1 `/AGENTS.md` (target ≤ ~150 lines)

1. **What this repo is.** Keep the draft's section. Add: *"Some edits here are fixed by the next deploy;
   others end up written onto physical tags. Match your caution to which kind you're making."*
2. **Where to start (router).** Task → read first → key rule:

   | If you're… | Read first | Key rule |
   | --- | --- | --- |
   | A new/outside contributor or their agent | `_docs/contributor-agent-guide.md` | Propose high-blast-radius changes; don't silently change the spec contract |
   | The maintainer or a trusted maintainer-directed agent | `_docs/maintainer-runbooks.md` | Use the runbooks for triage, review, release, and context upkeep |
   | Editing site content / supporters | this file's gotchas | Supporter data lives in two places |
   | Editing `make.html` / `read.html` | `_docs/make-read-tools.md` and `assets/scripts/AGENTS.md` | Pages expect `globalThis.OpenTag3D.spec` |
   | Touching `opentag3d.js` | `assets/scripts/AGENTS.md` | Round-trip verify; config pages = ask first |
   | Touching `_data/spec.json` | `_data/AGENTS.md` | Classify the edit first; `core` layout is a proposal, not a commit |
   | Cutting a version / release | `_docs/spec-change-process.md` | Maintainer-only |
   | "Fixing" something that seems missing | `_docs/known-gaps.md` | Known gaps are not unprompted work |

3. **Tech stack / data-driven spec / directory map.** Condensed from the draft.
4. **Build, dev, verify.** Commands from the draft, plus a verify-by-change-type table: content →
   `bundle exec jekyll build`; JS → the Node round-trip in `assets/scripts/AGENTS.md` plus a browser check;
   `js/scss/json/yml` → `npm run format`.
5. **Boundaries** (harvested from maintenance-workflow §5):
   - *Always:* edit `_data/spec.json`, never root `spec.json`; pair spec edits with a `spec.md` changelog
     entry; keep `jekyll build` and `format:check` green.
   - *Ask first:* any `core` field or `version` change; NTAG config-page / write-path edits; adding a
     supporter without a matching issue; workflow, `Gemfile` or `package.json` changes.
   - *Never:* push to `main` (it is production); create or push git tags (releases are the maintainer's);
     edit an existing `assets/json/spec_v*.json`; make the Web API required for anything (offline-first is
     a spec guarantee); edit consortium membership in `about.md` unprompted.
6. **Co-change map.** The key mechanism while there's no automation:

   | When you change… | Also update… |
   | --- | --- |
   | `_data/spec.json` (anything) | `spec.md` changelog |
   | `_data/spec.json` `version`, major bump | a new frozen `assets/json/spec_v{old}.json` *first* |
   | `_data/spec.json` `core` layout | the byte-map stamp in `_docs/spec-data-model.md` |
   | a supporter's status/entry | both `_data/supporters.yml` and `getting-started.md`'s tables |
   | a new article | a link from somewhere (nothing lists articles automatically) |
   | workflows, `package.json` scripts, dirs | this file |

7. **Gotchas.** From the draft, plus the two new ones above.
8. **Keeping this context current.** Two lines: "If you find an agent doc wrong, fix it in the same PR.
   If you add a rule, put it in the one place it belongs (see `_docs/decisions.md`)."

**Remove from the draft:** the DRAFT header; the provenance blockquote; the `see gaps.md` reference
(→ `_docs/known-gaps.md`). **Re-verify on ship day:** every path, the Windows note in the root `README.md`,
spec version, CI commands.

### 5.2 `_data/AGENTS.md` (target ≤ ~60 lines, since supporter edits load it too)

- **`spec.json`: classify the edit first.** This maps onto the versioning scheme in `spec.md`:

  | Edit class | Typical version effect | Agent may… |
  | --- | --- | --- |
  | Description / wording clarification | patch | do it; add changelog entry |
  | New `web_api` field | minor | do it; changelog; flag in PR as a spec change |
  | New `core` field in free space | minor | **draft as a proposal**; maintainer/consortium decides |
  | Move / resize / remove a `core` field | **major** | proposal only; snapshot requirement applies |

- **The `core` field checklist** (from extensibility §2 + the draft): `type` must be one of the values
  `decodeTagBuffer` branches on (fails *silently* otherwise); no overlap; fits `address_range`; `added` set;
  changelog; snapshot on major. Link to `_docs/spec-data-model.md` for the byte map command.
- **`supporters.yml`:** entries come from the issue template; the enums at the top of the file are
  authoritative; `getting-started.md` duplicates some entries by hand, so update both.
- **`navigation.yml`:** one line.

### 5.3 `_docs/spec-data-model.md`

Field model (core vs `web_api`, per-field keys, `type` enum, reserved `"-"` type), the byte budget, and the
**recompute command**, verified on 2026-09-26 (it reports 24 free bytes and 0 overlaps at v2.003):

```bash
node -e 'const s=require("./_data/spec.json");const u=new Array(224).fill(0);for(const f of s.core.fields)for(let i=parseInt(f.start,16);i<parseInt(f.start,16)+f.length;i++)u[i]++;console.log("version",s.version,"free",u.filter(x=>!x).length,"overlap",u.filter(x=>x>1).length)'
```

(Extend it to print the gap ranges when writing the doc.) Keep the gap table from the notes below it,
stamped `Verified against v2.003`.

### 5.4 `assets/scripts/AGENTS.md`

- A map of `opentag3d.js` by **function name** (encode/decode, NTAG/NDEF packing, Web NFC, importers and
  exporters, legacy-version loading), plus `site.js` in two lines.
- Danger zones: `NFC_INFO.ntag.types.*.configPages` (AUTH0, tag-locking), `packInt`/`readInt` width
  handling, legacy-spec fetch.
- **Verification recipe (new, tested during planning).** `opentag3d.js` *can* be exercised from Node with
  no DOM. Set two globals before a dynamic import:
  ```js
  globalThis.window = { location: { search: "" }, addEventListener() {} };
  globalThis.OpenTag3D = { spec: JSON.parse(readFileSync("_data/spec.json", "utf8")) };
  const m = await import(pathToFileURL("assets/scripts/opentag3d.js").href);
  // encodeFieldValue(field, value) → place at parseInt(field.start,16) in a 0xE0 buffer → await decodeTagBuffer(buf.buffer)
  ```
  Caveats: leave `tag_version` undefined so it uses the current spec version. `date`/`time` encoders
  take `"YYYY-MM-DD"` / `"HH:MM:SS"` strings, while `spec.json` `examples` are arrays, so convert them.
  This recipe is also the seed of the first real test suite (§9).

### 5.5 `_docs/contributor-agent-guide.md`

A short safety guide for outside contributors and their agents. It should explain the practical difference between routine site/content work and standards/protocol work, then route to the right deeper docs. Include:

- "If in doubt, open a proposal or ask first; do not silently change the spec contract."
- Safe/common tasks: content edits, supporter updates with issue context, typo fixes, docs links.
- High-caution tasks: `_data/spec.json`, `opentag3d.js`, Web NFC write/config pages, releases/tags.
- Link to the co-change map in `/AGENTS.md`; do not copy the table here unless the root map is dropped.
- A reminder that `_docs/known-gaps.md` is not a work queue; only act on an item when asked.

### 5.6 `_docs/maintainer-runbooks.md`

A reusable operating manual for the maintainer and trusted agents. This is where future problem-solving workflows live, rather than being buried in `known-gaps.md`. Include:

- **Reviewing agent-generated PRs:** classify blast radius; check co-change map; verify `_data/spec.json` edit class; require round-trip/manual evidence for protocol changes; ensure agent docs are updated when a new rule is learned.
- **Suspected protocol bug triage:** classify area (display, encode/decode, NDEF/NTAG packing, Web NFC write, config pages); build a minimal reproduction with the Node recipe where possible; compare against `_data/spec.json`, `spec.md`, and legacy snapshots; confirm before patching; document whether already-written tags are affected.
- **Release/version bump checklist:** link to `_docs/spec-change-process.md`; keep the tag/changelog/snapshot/homepage-banner relationship visible.
- **Context upkeep:** after each agent-docs PR review, record learned house style in `_docs/decisions.md`; shrink prose when a script/CI check replaces it.

The suspected 6-byte `barcode` finding belongs here as a *triage example*, not as an asserted bug: reproduce, present evidence, and ask the maintainer to confirm before changing behavior.

### 5.7 `_docs/make-read-tools.md`

Initial architecture note for the highest-churn UI files. Keep it practical and function/path-based, not a line-number map. Include:

- How `make.html` and `read.html` bootstrap `globalThis.OpenTag3D.spec` from Jekyll data before importing shared code.
- What logic is page-local vs shared in `assets/scripts/opentag3d.js` / `assets/scripts/site.js`.
- The user flows: form generation → encode/write/export in `make.html`; read/import/decode/display in `read.html`.
- Verification expectations: browser check for UI changes; Node round-trip recipe for pure protocol logic; Chrome/Android/Web NFC or explicit "not locally verified" note for real NFC writes.
- Danger zones: Web NFC write path, NTAG config pages, import/export formats, and assumptions that old major versions can still be decoded.

### 5.8 `_docs/spec-change-process.md`

One narrative from idea to production. It answers "where do proposals go?" by pointing to `about.md`, and
records that votes currently leave no trace in the repo. Then the PR and CI gates, the edit classification
(link to `_data/AGENTS.md`), and the **maintainer-only** release runbook: `version` → changelog → snapshot if major →
`index.md` announcement → bare tag (maintainer) → deploy happens on push, not on tag. Unconfirmed items
(merge rights, branch protection) are labelled as such.

### 5.9 `_docs/decisions.md`

Short ADR-style entries: **Decision · Why · Revisit when.** Seed entries:
- Agent context uses three tiers: root `AGENTS.md`, nested `AGENTS.md` at `_data/` and `assets/scripts/`,
  and `_docs/`. This replaces the earlier "one file only" scope (D1) because a single file would have to
  carry every checklist.
- Reference docs live in `_docs/`: unpublished by Jekyll by default, matches the repo's `_`-prefix idiom (D2).
- `known-gaps.md` lives in the repo, short and neutral; it becomes GitHub issues only at the maintainer's
  request (D3).
- `AGENTS.md` is canonical and cross-tool; `CLAUDE.md` only imports it (D4).
- The root `README.md` gets a one-line pointer to the contributor/agent docs (D5).
- The reflow lands as one PR with separable commits (D6).
- Agent docs describe the repo, not anyone's machine (the "no Windows dev note" decision).
- No house-style/PR-conventions section until the maintainer's conventions are learned (revisit after
  this PR's review).
- Agent context lives in `_docs/` and nested `AGENTS.md` files, and is never published.
- The context-engineering principles from §3.2.
- The research notes were retired; provenance is this PR's commits (link it once merged).

---

## 6. Keeping agent docs off the website

Jekyll copies Markdown files with no front matter to `_site/` as static files. **A root `AGENTS.md` would
be served at `opentag3d.info/AGENTS.md`**, and so would everything in this folder if it were merged as-is.

- Add to `_config.yml` (Jekyll 4 merges this with its default excludes):
  ```yaml
  exclude:
    - AGENTS.md
    - CLAUDE.md
    - assets/scripts/AGENTS.md
    - OpenTag3D-agent-scaffolding/
  ```
- `_docs/` and `_data/AGENTS.md` need no config (see §3.3).
- `OpenTag3D-agent-scaffolding/` is excluded as a belt-and-suspenders guard because this folder is currently present on the feature branch until the final delete commit. Remove that exclude in the same commit that deletes the folder, or leave it harmlessly stale if the maintainer prefers minimal churn.
- **Verify** with `bundle exec jekyll build`, then check `_site/` for `AGENTS.md`, `CLAUDE.md` and `_docs`.
  This machine has no Ruby, so use WSL or a Codespace, or state in the PR that it's unverified locally.
  CI's `jekyll build` passing proves it builds, not that nothing leaked.
- The existing root `README.md` and `LICENSE` are probably published the same way today. Note it; it's not
  ours to fix in this PR.

---

## 7. Execution sequence

**One PR, separable commits (D6).** Work on this branch (`feature/shark-0001-agent-scaffolding-setup`).
Rebase on the current `main` first, since `main` keeps moving. Each commit below stands alone, so the
maintainer can drop any one of them in review without breaking the others.

| Commit | Contents | Plan ref |
| --- | --- | --- |
| 1 | `_config.yml` exclude, including `OpenTag3D-agent-scaffolding/`. **Make this commit first**, so the branch can't publish agent/planning files even if it's merged early by accident. Run `npm run format`, since Prettier covers `yml` | §6 |
| 2 | `_docs/` (`README.md`, `contributor-agent-guide.md`, `maintainer-runbooks.md`, `make-read-tools.md`, `spec-data-model.md`, `spec-change-process.md`, `known-gaps.md`, `decisions.md`) | §4, §5.3, §5.5–§5.9 |
| 3 | `_data/AGENTS.md`, `assets/scripts/AGENTS.md` | §5.2, §5.4 |
| 4 | `/AGENTS.md`, promoted from `draft-AGENTS.md` and reworked into the router | §5.1 |
| 5 | `/CLAUDE.md` (the single line `@AGENTS.md`) | D4 |
| 6 | Root `README.md` pointer: one line under "Website Development", e.g. *"Contributor and AI-agent notes: see [`AGENTS.md`](./AGENTS.md) and [`_docs/`](./_docs/)."* | D5 |
| 7 | Delete `OpenTag3D-agent-scaffolding/` | — |

Commits 2–4 depend on each other only through links. If the maintainer drops `_docs/`, `/AGENTS.md`
still works, but its router links break, so in that case follow up by inlining the two checklists.

Then:

1. **Write the content.** Dedupe aggressively using `routing-duplication-audit.md` as a constraint, convert
   line numbers to function names, add verification stamps, and write `known-gaps.md` in the gap / why /
   meanwhile / status format with the D3 tone rules (§4). Re-verify every claim carried over from the draft
   against current `main`.
2. **Verify:**
   - Run `bundle exec jekyll build` and confirm `_site/` has no `AGENTS.md`, `CLAUDE.md`, `_docs` or
     `OpenTag3D-agent-scaffolding`. This needs Ruby (WSL or a Codespace), since this machine has none.
   - `npm run format:check`.
   - Every relative link in the new files resolves.
   - The byte-budget command and the Node recipe both run clean.
3. **Cold-start test.** Use `OpenTag3D-agent-scaffolding/cold-start-tests.md` as the acceptance suite before
   deleting this folder. Give a fresh agent session one realistic task per router row (e.g. "SpoolFlux now
   supports v2.004", "add a `web_api` field", "add a `core` field for X") with no other briefing. Check it
   finds the right file, classifies the edit correctly, and stops at the right boundary. Fix the docs where
   it stumbles. This is the acceptance test for the context, the same way CI is the acceptance test for code.
4. **Open the PR.** The description should cover:
   - What the maintainer is being asked to accept, commit by commit, and that each commit can be dropped
     independently.
   - That nothing changes site behaviour, and no agent file is published (the §6 verification result).
   - The open questions from `known-gaps.md`: who has merge rights, where consortium votes happen and
     whether they should leave a trace in the repo, and whether a `CONTRIBUTING.md` is wanted.
   - **The D3 offer:** "`_docs/known-gaps.md` lists N known gaps. Happy to turn any of them into GitHub
     issues if that's how you'd rather track them." Don't file any issues before the maintainer answers.
5. **After review.** Record what the review taught about house style in `_docs/decisions.md` (per the
   settled "learn conventions from this PR" decision). If the maintainer accepts the issues offer, convert
   those items and shrink their `known-gaps.md` entries to links.

---

## 7.1 Acceptance criteria

The reflow is successful only if the finished scaffolding changes agent behaviour, not just file count:

- **Routing works:** using `OpenTag3D-agent-scaffolding/cold-start-tests.md`, a fresh agent names the correct first doc/checklist before editing.
- **Boundaries hold:** agents stop, ask, or draft a proposal before changing `core` layout, spec `version`, write-path/config-page code, release tags, governance/consortium records, workflows, `Gemfile`, or `package.json`.
- **Maintainer runbooks are useful:** `_docs/maintainer-runbooks.md` gives an actionable path for PR review, suspected protocol-bug triage, release/version bump checks, and keeping agent context current after review.
- **Make/read context is useful:** before editing `make.html` or `read.html`, a future agent can explain the high-level flow, what is page-local versus shared code, and what verification is expected.
- **Known gaps are safe:** `_docs/known-gaps.md` explicitly says gaps are not an unprompted work queue, and each item gives a safe meanwhile/do-not posture.
- **Publishing is safe:** after `bundle exec jekyll build`, generated `_site/` does not contain `AGENTS.md`, `CLAUDE.md`, `_docs/`, or this staging folder.
- **The docs stay maintainable:** each operational fact has one home and other docs link to it; when a script/test replaces a prose rule, the prose is shortened to point at the executable check.

If any criterion fails, fix the scaffolding before treating the reflow as complete.

---

## 8. Decisions (resolved 2026-09-26)

The original six went with the recommendation; D7 was added after a later planning review expanded the goal from safe orientation docs to reusable future workflows. They're recorded here, and seeded into `_docs/decisions.md`
(§5.9) so they outlive this folder.

| # | Decision | Resolution | Where it shows up |
| --- | --- | --- | --- |
| **D1** | Scope: one file, or tiered context? | **Tiered:** root `AGENTS.md` + nested `AGENTS.md` in `_data/` and `assets/scripts/` + `_docs/`. **This supersedes the earlier settled "scope is one file" decision.** A single file would have to carry every checklist and bloat | §3, §5 |
| **D2** | Folder name for tier-2 docs | **`_docs/`**: unpublished by Jekyll with no config, and matches the repo's `_` idiom | §3.3 |
| **D3** | Backlog in the repo, or as GitHub issues? | **In the repo:** a short, neutral `_docs/known-gaps.md`, because agents need its "meanwhile" lines. The PR description offers to turn items into issues; nothing is filed before the maintainer answers | §4, §7 step 4 |
| **D4** | `CLAUDE.md` shim? | **Yes.** The single line `@AGENTS.md`, excluded from the site | §3.3, §6, commit 5 |
| **D5** | Pointer in the root `README.md`? | **Yes**, one line, in its own commit so the maintainer can drop it | §3.3, commit 6 |
| **D6** | One PR or two? | **One PR, separable commits.** Two PRs would mean shipping a bloated `AGENTS.md` first and trimming it later | §7 |
| **D7** | Safe orientation only, or reusable systems too? | **Reusable systems too.** Add contributor-vs-maintainer paths, maintainer runbooks, suspected-bug triage, PR-review support, and the `make.html`/`read.html` architecture note before executing | §3, §5.5–§5.7 |

---

## 9. After the reflow: where this goes next

Follow-up ideas requiring maintainer direction before implementation, ranked by value to agents using the churn data from §2.2:

1. **Promote the Node recipe to `scripts/` + an npm script** (`npm test`): round-trip every field's
   examples, then run it in CI. Then `assets/scripts/AGENTS.md`'s verification section becomes "run
   `npm test`".
2. **`scripts/check-spec.mjs`:** type enum, overlaps, bounds, id uniqueness, byte-budget report, and "a
   `spec_v{N}.json` exists for every older major." It replaces the checklist prose and the byte-map
   command in `_data/AGENTS.md` and `spec-data-model.md`.
3. **Generate `getting-started.md`'s tables from `supporters.yml`.** That removes a co-change-map row and
   a gotcha.
4. **Expand `_docs/make-read-tools.md` after real review.** The initial architecture note ships in this reflow; deepen it only when the maintainer's actual edit/review patterns reveal what is missing.
5. **`CONTRIBUTING.md`**, written from what the first PR review teaches, then fold the human-facing parts
   of `spec-change-process.md` into it.
6. **Skills or slash commands for the recurring workflows** ("update a supporter's status", "propose a
   spec field", "triage a suspected protocol bug") once the workflows are documented and stable. Encode procedures only after they've
   settled.

The pattern: each step moves a rule out of prose and into something that runs, and the agent docs get
*shorter* over time. That shrinkage is the sign the context engineering is working.

---

## 10. Findings surfaced while planning (outside the reflow's scope)

- **Suspected bug needing maintainer confirmation: 6-byte `barcode` integer round-trip.** Planning found that `packInt` appears to use 32-bit `>>`, and `readInt` appears to use 32-bit `<<`; the spec example `12345543210` appeared to round-trip as `3755608618`. Treat this as a suspected issue, not a proved repo bug. In `known-gaps.md`, label it `needs maintainer confirmation`; in `maintainer-runbooks.md`, include a minimal-reproduction workflow for confirming or rejecting suspected protocol bugs before patching.
- **Root `README.md` supporter link is broken:** it points to `template=supporter.yml`, but the template
  file is `support.yml`.
- **This folder's `README.md` says it's untracked.** It's committed (`ca8ac2d`, `b059ca1`), so the
  "invisible to other contributors" guarantee no longer holds once this branch is pushed. The status line
  is updated.
- **`spec.json` `examples` for `date`/`time` are arrays,** while the encoder takes strings. A round-trip
  test needs an adapter; this matters for §9 item 2.
