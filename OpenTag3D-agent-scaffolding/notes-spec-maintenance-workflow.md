# Spec maintenance workflow — how a change actually gets from idea to production

Researched by reading `.github/workflows/*`, `about.md`, git tag/log history, and `_data/spec.json` across tags. Goal: map the *actual, observable* process for changing OpenTag3D (PRs → CI → merge → version bump → tag → deploy), and separate that from the *documented-but-unenforced* consortium governance model. This file is the source material for the "decision points" synthesis at the bottom, which is meant to feed `gaps.md` and eventually a PR-conventions section of `draft-AGENTS.md`.

## 1. PR lifecycle: creation, review, merge

What's actually enforced, from the workflows:

- **`ci.yml`** — `bundle exec jekyll build` on push to `main` and on every PR. Fails the check if the site doesn't build (bad Liquid, invalid YAML/JSON in `_data/`, etc.).
- **`format.yml`** — `npm run format:check` (Prettier over `**/*.{js,scss,json,yml,yaml}`) on push to `main` and every PR. Notably **excludes `.md`** — the most-edited file type has no format gate (already tracked in `gaps.md`).
- No `CODEOWNERS` file anywhere in the repo — no automatic reviewer assignment.
- No visible branch protection config (that lives in GitHub repo settings, not in-repo, so it can't be confirmed from a checkout — worth asking the maintainer directly rather than assuming).

What the git history shows about actual merge behavior:

- `git log --merges` returns **nothing** — there are no merge commits on `main`'s visible history.
- Individual PRs land as single commits with the PR number in the message, e.g. `0edfb52 dependabot[bot] Bump actions/setup-node from 4 to 7 (#44)`. This is the signature of **GitHub's "Squash and merge"** button, not a fast-forward or a real merge — confirms PRs are squashed, not merged, so per-commit history inside a PR doesn't survive into `main`.
- Almost all recent authorship is a single person (Queen Vinyl Da.i'gyu-Kazotetsu, the spec author / repo owner per `about.md`'s Contact section) plus `dependabot[bot]`. There is no visible evidence of a second human's PR being merged in the recent log window — this doesn't prove nobody else has contributed, but it does mean **the observable merge pattern is "owner reviews/merges their own PRs and dependabot's"**, not a multi-reviewer process.
- No `CONTRIBUTING.md` exists (already tracked in `gaps.md`) — so there's no written PR template, branch-naming convention, or "who can merge what" rule. The only issue template is `.github/ISSUE_TEMPLATE/support.yml` (supporter intake), not a code/spec-change template.

**Bottom line:** the *mechanical* PR gate is "builds with Jekyll" + "passes Prettier on non-Markdown files." Everything about review/approval is undocumented and, from the visible history, currently informal (owner-driven).

## 2. Version release process

There is **no release workflow at all** — no `release.yml`, no `workflow_dispatch` job that bumps a version or cuts a tag, nothing in `.github/workflows/` other than `ci.yml`, `format.yml`, and `pages.yml` (deploy-on-push-to-main). Confirmed by listing `.github/workflows/` in full: only those three files exist.

What actually happens on a version bump, reconstructed from tag history:

1. `_data/spec.json`'s top-level `"version"` field is hand-edited to the new value (e.g. `"2.002"` → `"2.003"`), in the same commit/PR as the spec change itself.
2. A changelog entry is hand-added to the bottom of `spec.md`'s `## Changelog` section, in prose, describing what changed (e.g. `- 2.003\n  - Added a qa_status property to the web API`).
3. A **lightweight, unannotated git tag** matching the new version is pushed manually — `git cat-file -t v2.003` returns `commit`, not `tag`, confirming these are `git tag vX.YYY` (no `-a`, no release notes attached to the tag object itself). The changelog in `spec.md` is the only place release notes live.
4. `pages.yml` deploys `main` to production on every push regardless of tags — tags are not what triggers deployment. The tag is purely a version marker for implementers/historical reference, disconnected from the deploy pipeline.

Versioning scheme (from tag list `v0.001` … `v0.020`, `v1.000` … `v2.003` and `spec.md`'s Reader Implementation Guidelines section):

- Format is `major.minor.patch` with patch/minor zero-padded to 3 digits (e.g. `v0.001`, `v0.010`, `v0.020`, `v2.003`).
- **Major** bump = breaking change to the on-tag byte layout; readers must reject unsupported major versions outright (`spec.md` line ~108). Confirmed by the 2.000 changelog entry: dropped tag types, rearranged the entire memory map, resized fields — all layout-breaking.
- **Minor** bump = additive/non-breaking; older readers should warn but still parse.
- **Patch** bump = clarifications with no on-tag structural change (e.g. 2.001: "treat missing bytes as 0x00" is an implementer-behavior clarification, not a byte-layout change).
- Legacy major-version support: `opentag3d.js` fetches `assets/json/spec_v{major}.json` on demand for old tags (see `notes-repo-rundown.md` §"The spec is data-driven"). **A major bump requires freezing a new `spec_v{N}.json` snapshot before the fields change out from under old tags** — this step is manual and easy to forget; nothing in CI checks that a `spec_v{N}.json` exists for every major version referenced.

**Bottom line:** "release" is really just "edit two files by hand, then push a bare tag." There is no automation gate ensuring the tag, the changelog entry, and the `version` field agree, or that a major bump actually shipped a frozen legacy snapshot.

## 3. Consortium governance model (per `about.md`)

`about.md`'s "OpenTag3D Consortium" section (lines 42-85) documents a two-tier membership model:

- **Voting members** — authority to vote on spec-modification proposals. Seats split evenly between **Industry Representatives** (currently 2: Polar Filament, Push Plastic) and **Community Representatives** (currently 6: Gooborg Studios/spec host, a YouTube creator, and four named community members). The page itself flags this as currently imbalanced and is actively recruiting more industry members.
- **Non-voting members** — can (a) propose changes for voting members to evaluate, and (b) elect voting members via popular vote.
- Primary coordination channel: Discord (`discord.opentag3d.info`), described as where voting members, spec authors, implementers, and community members all congregate. Direct fallback contact is the spec author personally, via email/Telegram/Matrix.

**What's documented vs. what's operationalized — this is the key gap:**

- There is **no mechanism anywhere in the repo** that ties a GitHub PR or issue to a consortium vote. No issue template for "propose a spec change," no vote-tracking file/label, no reference in any `.md` file to *how* a vote is called, quorum, what counts as a pass, or how a vote's outcome gets recorded.
- Nothing in `about.md`, `spec.md`, or CI distinguishes "this PR needs a consortium vote before merge" from "this PR is a typo fix" — the same two CI checks (build + format) gate both.
- The squash-merge/owner-driven pattern observed in §1 means that, as far as the repo can show, **voting (if it happens) happens off-repo — in Discord — with no artifact left in git.** An agent (or a new human contributor) reading only the repo has no way to tell whether a merged spec change was voted on, informally approved by the spec author, or a mix.
- This disconnect is worth surfacing to the maintainer directly rather than guessing at a process to document — see decision points below.

## 4. Contribution guidelines

There are none, as a discrete document. What exists instead, scattered:

- `.github/ISSUE_TEMPLATE/support.yml` — structured intake for "add my company/product to the supporters list," not a general contribution guide. Already noted in `gaps.md` that this stops short of full automation (maintainer hand-transcribes into `_data/supporters.yml`).
- `README.md` (repo root) — covers local dev setup (`setup.sh`, macOS/Linux only) and a project description, not contribution norms.
- No `CODE_OF_CONDUCT.md`, no PR template (`.github/PULL_REQUEST_TEMPLATE.md` doesn't exist), no explicit statement of what CI must pass before merge (implicit only, from reading the workflow files themselves).
- The closest thing to a "how to contribute a spec change" guideline is the general prose in `about.md`'s Non-Voting Members bullet ("Propose Changes: Submit new ideas or modifications to the specification, which voting members will evaluate and vote on") — but it doesn't say *where* (GitHub issue? Discord? PR directly?) or *how* that evaluation is requested/tracked.

This confirms and slightly extends the existing `gaps.md` "No CONTRIBUTING.md" line — the missing piece isn't just PR mechanics, it's specifically **the bridge between "open a PR that touches `_data/spec.json`" and "the consortium's voting process."**

## 5. Decision points: human oversight vs. automation

Synthesized from §1-4, framed for what this means for an AI agent (or any new contributor) working in this repo.

**Must stay human (no amount of tooling should auto-approve these):**

- Any PR that changes `_data/spec.json`'s `core.fields` (byte layout, sizes, required-ness) — this is a standards decision under the consortium's stated remit, not a code-quality question. CI passing (build + format) says nothing about whether it should ship.
- Any major-version bump (breaking change to on-tag layout) — per `about.md`'s own model, this is exactly the kind of decision voting members exist to make, and it also carries the operational obligation to freeze a `spec_v{N}.json` snapshot (§2) before the change goes live, since old tags in the field depend on it.
- Publishing/merging a new voting member or election outcome — inherently a governance action, not a repo action.
- Tag-writing NTAG "config pages" edits in `opentag3d.js` (AUTH0 and friends) — already flagged in `notes-repo-rundown.md` as a high-caution zone since a wrong byte can password-lock a physical tag; this is a correctness/safety judgment call CI cannot make.

**Safe to automate further than it is today (mechanical, low-judgment):**

- Format-checking Markdown in `format.yml` (currently excluded) — a pure lint gate, no judgment involved.
- A schema/round-trip validation job for `_data/spec.json` (`type` enum check, byte-range overlap check, `spec_v{N}.json` example round-trip against `opentag3d.js`) — already scoped in `gaps.md`, purely mechanical verification that today relies on manual review to catch.
- Supporter-list intake (`support.yml` issue → `_data/supporters.yml` entry) — structured data in, structured data out; the hand-transcription step is pure automatable plumbing, not a judgment call (already noted in `gaps.md`/`notes-automation-opportunities.md`).
- Link-checking across `.md` files — already scoped in `gaps.md`.

**Ambiguous / needs a maintainer decision before an agent should touch it:**

- Whether the `version` field bump + changelog entry + git tag (§2) should become a single scripted "cut a release" step (e.g. a `workflow_dispatch` job that takes a version number and does all three atomically) — this would remove a class of drift bugs (tag doesn't match `version` field, changelog forgotten) without touching the judgment call of *what* changes go into the release. Purely a "should we build this" question for the maintainer, not something to build speculatively.
- Whether/how to formalize the proposal→vote pipeline from §3 (e.g. a "spec-proposal" issue template, a `governance/` log of vote outcomes) — this is a real gap, but it's the maintainer's/consortium's process to design, not something an agent should invent and impose. Best framed as a question to ask, not a deliverable to draft unprompted.
- Who besides the spec author currently has merge rights, and whether that's intentional given the consortium model exists — couldn't be determined from the checkout (branch protection lives in GitHub settings, not in-repo). Worth asking directly rather than inferring from the single-author-heavy commit log, since that log window may simply not include another contributor's merged PR.
