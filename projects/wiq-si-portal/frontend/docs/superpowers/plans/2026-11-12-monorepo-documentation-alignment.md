# Monorepo Documentation Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align maintained Markdown with the monorepo layout while preserving dated migration evidence.

**Architecture:** Keep repository-wide entry points at the root, project-level deployment and transition information in `projects/wiq-si-portal/`, and application development guidance under `projects/wiq-si-portal/frontend/`. Fix only current documentation paths, commands and navigation; do not rewrite historical source-path claims.

**Tech Stack:** Markdown, Node.js documentation checker (`npm run docs:check`).

---

## File map

- `README.md`: monorepo overview and root-relative navigation.
- `CONTRIBUTING.md`: repository contribution instructions and root-level command entry points.
- `.github/copilot-instructions.md`: concise root assistant entry point.
- `projects/wiq-si-portal/README.md`: project structure, deployment, branches and transition notes.
- `projects/wiq-si-portal/frontend/README.md`: frontend setup, commands and documentation index.
- `projects/wiq-si-portal/frontend/AGENTS.md` and `CLAUDE.md`: frontend-scoped assistant guidance and imports.
- `projects/wiq-si-portal/frontend/CONTRIBUTING.md`: frontend-local contribution commands and links.
- `projects/wiq-si-portal/frontend/docs/README.md`: frontend documentation hub and ownership map.
- `projects/wiq-si-portal/frontend/docs/development.md`, `operations.md`, `testing.md`: frontend-local setup, deployment and validation paths.
- Other maintained `projects/wiq-si-portal/frontend/docs/*.md`: update a file only if the audit finds a current path/command/navigation reference inconsistent with its location.
- `projects/wiq-si-portal/frontend/docs/superpowers/specs/2026-11-12-monorepo-documentation-alignment-design.md`: approved scope and constraints.

## Task 1: Audit and align repository entry points

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `.github/copilot-instructions.md`
- Reference: `projects/wiq-si-portal/README.md`
- Reference: `projects/wiq-si-portal/frontend/README.md`

- [ ] **Step 1: Check entry points against the actual tree**

Run from the repository root:

```bash
git status --short
find projects/wiq-si-portal -maxdepth 2 -type d | sort
```

Expected: project configuration is under `projects/wiq-si-portal/configs`, the React app is under `projects/wiq-si-portal/frontend`, project routing is `projects/wiq-si-portal/dispatch.yaml`, and root `cloudbuild.yaml` remains at the repository root. Preserve pre-existing staged changes.

- [ ] **Step 2: Update only root-level navigation and commands**

Ensure root `README.md` describes the monorepo and points to the project/frontend guides using paths from the repository root. Ensure root `CONTRIBUTING.md` and `.github/copilot-instructions.md` link to the frontend's canonical guides and do not give frontend-root commands as if the repository root were the frontend directory. Keep detailed frontend instructions in the frontend docs rather than duplicating them at root.

- [ ] **Step 3: Review the entry-point diff**

Run:

```bash
git diff -- README.md CONTRIBUTING.md .github/copilot-instructions.md
```

Expected: only structure, navigation or command corrections directly required by the monorepo layout; no unrelated policy changes.

## Task 2: Align project and frontend documentation

**Files:**
- Modify if needed: `projects/wiq-si-portal/README.md`
- Modify if needed: `projects/wiq-si-portal/frontend/README.md`
- Modify if needed: `projects/wiq-si-portal/frontend/AGENTS.md`
- Modify if needed: `projects/wiq-si-portal/frontend/CLAUDE.md`
- Modify if needed: `projects/wiq-si-portal/frontend/CONTRIBUTING.md`
- Modify if needed: `projects/wiq-si-portal/frontend/docs/README.md`
- Modify if needed: `projects/wiq-si-portal/frontend/docs/development.md`
- Modify if needed: `projects/wiq-si-portal/frontend/docs/operations.md`
- Modify if needed: `projects/wiq-si-portal/frontend/docs/testing.md`
- Modify if needed: other current frontend guides under `projects/wiq-si-portal/frontend/docs/`

- [ ] **Step 1: Find current path and command mismatches**

Search maintained documentation only:

```bash
rg -n --glob '*.md' --glob '!**/docs/superpowers/**' \
  '(^|[ (])((src|scripts|public|docs|configs)/|npm (ci|run|test)|cloudbuild\.yaml|dispatch\.yaml|AGENTS\.md)' \
  README.md CONTRIBUTING.md .github projects/wiq-si-portal
```

For each result, resolve the path relative to the Markdown file or its stated working directory. Do not treat paths inside historical `docs/superpowers/` records or dated migration evidence as current setup instructions.

- [ ] **Step 2: Correct path ownership and relative links**

Use the ownership boundaries from the approved design: repository-wide files at root; deployment/project files under `projects/wiq-si-portal/`; frontend source, scripts, package commands and application documentation under `projects/wiq-si-portal/frontend/`. Correct Markdown links relative to the file containing each link. Keep frontend commands executable from the documented working directory; when commands are presented for repository-root use, use `npm --prefix projects/wiq-si-portal/frontend ...`.

- [ ] **Step 3: Preserve historical evidence**

Do not rewrite historical branch names, commit IDs, dated test counts, former source paths or statements describing earlier repository structure. Fix only a maintained document's link to a historical record if the link itself is broken.

- [ ] **Step 4: Review all changed Markdown**

Run:

```bash
git diff -- '*.md' '*.mdx' .github/copilot-instructions.md
```

Expected: changes are limited to current paths, commands, ownership descriptions and navigation; no historical evidence is represented as a new verification.

## Task 3: Verify documentation navigation

**Files:**
- Test: maintained Markdown links in `README.md`, `CONTRIBUTING.md`, `.github/`, and `projects/wiq-si-portal/`

- [ ] **Step 1: Run the maintained-document checker**

From `projects/wiq-si-portal/frontend`:

```bash
npm run docs:check
```

Expected: Node checker tests pass and the documentation check reports no broken maintained local links or heading anchors. If a link fails, correct the source Markdown link rather than suppressing the checker.

- [ ] **Step 2: Check whitespace and scope**

From the repository root:

```bash
git diff --check
git diff --cached --check
git status --short
```

Expected: no whitespace errors; only documentation files intended by this plan are changed. Do not commit.

## Self-review against the approved spec

- Root, project and frontend ownership levels are each addressed in Tasks 1 and 2.
- Root Copilot entry-point responsibilities and frontend guide destination are covered in Task 1.
- Current link/command correction and preservation of historical path evidence are covered in Task 2.
- Maintained-link validation and explicit no-commit constraint are covered in Task 3.
- The plan contains no application behavior change or application test requirement.
