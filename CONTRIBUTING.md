
# Contributing

This repository contains the Store Insights project under
`projects/wiq-si-portal/`. Shared build, governance and repository guidance
remain at the root; the React application and its development documentation
are in `projects/wiq-si-portal/frontend/`.

Before making changes, inspect `git status --short` and
`git branch --show-current`. Preserve unrelated work and do not assume the
current branch is safe to merge, push or deploy.

For frontend changes, follow
[`projects/wiq-si-portal/frontend/CONTRIBUTING.md`](projects/wiq-si-portal/frontend/CONTRIBUTING.md)
and the frontend [documentation hub](projects/wiq-si-portal/frontend/docs/README.md).
Run its commands from that directory, or use
`npm --prefix projects/wiq-si-portal/frontend <command>` from the repository
root.

Project deployment paths and transition boundaries are documented in the
[project guide](projects/wiq-si-portal/README.md). Never commit credentials,
decrypted configuration or local environment files.
