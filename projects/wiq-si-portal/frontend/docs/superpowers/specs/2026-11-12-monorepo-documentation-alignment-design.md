# Monorepo Documentation Alignment

## Context

The Store Insights React application has moved from a repository-root layout to
`projects/wiq-si-portal/frontend` in a monorepo. Project-level deployment
configuration and encrypted configs live under `projects/wiq-si-portal/`;
shared Cloud Build, governance and Copilot entry-point files remain at the
repository root. Documentation has been relocated, but the Markdown set needs
to consistently distinguish these scopes.

## Design

Keep three documentation ownership levels:

- Root `README.md` describes the monorepo, its top-level layout, shared
  commands and links to the project and frontend guides.
- `projects/wiq-si-portal/README.md` describes project scope, deployment
  configuration paths, branch/trigger transition details and project-level
  validation boundaries.
- `projects/wiq-si-portal/frontend/README.md`, `AGENTS.md`,
  `CONTRIBUTING.md` and `docs/` describe React application development,
  testing, architecture, API contracts and frontend operations.

The root Copilot instructions remain a short repository entry point that links
to the frontend's canonical assistant guide. Current maintained documents will
use links and commands rooted at their actual locations. References to old
repository paths inside dated migration assessments, plans and specs remain
historical evidence; only broken links from maintained documents to those
records are corrected.

## Scope and constraints

Update maintained Markdown whose ownership, path references, commands or
navigation are inconsistent with the monorepo. Do not change application
source, build/deployment behavior, historical claims or dated source-path
evidence. Do not commit the changes.

## Validation

Run `npm run docs:check` from
`projects/wiq-si-portal/frontend` to verify maintained local links and heading
anchors. Review the final diff to ensure only intended documentation files
changed and historical paths were preserved.
