# Spec change process

This doc owns the observed path from spec idea to production. It describes what can be seen from the repo and labels unknown process details as unknown.

## Governance touchpoint

`about.md` describes the OpenTag3D Consortium: voting members evaluate spec-modification proposals, and non-voting members may propose changes. It points people to Discord and direct maintainer contact.

The checkout does not show how votes are called, quorum rules, or whether approvals are recorded in git. A PR that changes the on-tag contract should therefore point to maintainer/consortium approval rather than assuming CI is sufficient.

## Edit classification

Before editing `_data/spec.json`, classify the change:

- Description/wording clarification: usually patch-level; still add a `spec.md` changelog entry.
- New `web_api` field: usually minor/additive; changelog and PR callout required.
- New `core` field in unused space: standards proposal first; maintainer/consortium decides.
- Move, resize, remove, or reinterpret a `core` field: breaking/major proposal; legacy snapshot requirement applies.
- Version bump: maintainer-only unless explicitly delegated.

Detailed data-model checks live in [`spec-data-model.md`](spec-data-model.md) and `_data/AGENTS.md` once added.

## PR and CI gates

Observed mechanical gates:

- `.github/workflows/ci.yml`: `bundle exec jekyll build` on PRs and pushes to `main`.
- `.github/workflows/format.yml`: `npm run format:check` for `js`, `scss`, `json`, `yml`, and `yaml`.
- `.github/workflows/pages.yml`: deploys `main` to production.

Observed from history, unconfirmed as policy: PRs appear to be squash-merged, and recent history is mostly a single maintainer plus Dependabot. Branch protection, merge rights, and review requirements are GitHub settings and are not visible in the checkout.

## Maintainer-only release runbook

1. Confirm the human decision/approval for the spec change.
2. If the next release is a major bump, freeze the old layout into `assets/json/spec_v{oldMajor}.json` before changing current `core.fields`.
3. Edit `_data/spec.json` `version` and fields.
4. Add the matching entry to the `spec.md` changelog.
5. Review whether `index.md`'s `announcement:` should change.
6. Run build/format checks and any manual protocol verification needed.
7. Merge to `main`; GitHub Pages deploys on push to `main`, not on tag creation.
8. Maintainer creates the lightweight version tag if appropriate. Agents must not create or push tags unless explicitly instructed.

## Versioning reference

Do not restate version semantics here. Link readers to `spec.md`'s Reader Implementation Guidelines and changelog for the authoritative public wording.

Operational reminders from observed history:

- The `version` field, `spec.md` changelog, and git tag can drift because there is no release automation.
- Major bumps require legacy snapshots for old tags in the field.
- Existing `assets/json/spec_v*.json` files are historical compatibility data; do not edit them casually.
