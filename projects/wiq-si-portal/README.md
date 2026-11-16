# Store Insights project

## Layout and scope

`frontend/` contains the React/Vite application and its existing tests, assets
and migration documentation. `services/` is reserved for independently owned
backend services; no backend code or runtime is imported in this transition.
The frontend continues calling the existing Python APIs.

This is a clean snapshot of `hsandhu2wow/ip-react-node` at `d23a216` plus its
current uncommitted Weekly Facts/My Plan parity changes and architecture docs.
Old Git history is not imported; the new repository's governance files and
initial history are preserved. Local environment files (except the public
frontend `.env` API prefix), dependencies, build/coverage output and
brainstorming artifacts are excluded. Historical migration
documents retain their original dates, branches and source paths as evidence,
not as current setup instructions.

Later original-repository commits through `635c198` are synchronized into
their mapped locations: account-driven navigation and Weekly/MyPlan route
guards, the documentation hub, decision records, scoped assistant guides and
the `npm run docs:check` link checker. Where both repositories changed a file,
the new repository's Weekly/MyPlan and transition updates are retained.
Frontend `AGENTS.md`, `CLAUDE.md` and `CONTRIBUTING.md` live in `frontend/`;
Copilot's entry point is repository-root `.github/copilot-instructions.md`.
The docs checker scans frontend documentation and verifies links up to the
repository root.

The original `hsandhu2wow/ip-react-node` repository is restructured to this
same layout on its `feat/monorepo-structure` branch, so both repositories keep
identical tracked trees. Its brainstorming notes, wireframes, editor settings
and `verify_spec.md` remain on disk there but are no longer tracked.

## Branches

Local `dev-branch` and `uat-branch` start from the new repository's initial
`main` baseline. The relocation is developed on
`feat/frontend-monorepo-migration`. These names do not configure remote branch
protections or cloud triggers. No branches are pushed and no deployments are
performed as part of this local transition.

## Build and deployment

The repository-root [`cloudbuild.yaml`](../../cloudbuild.yaml) runs Node 22
install/build steps in `projects/wiq-si-portal/frontend`. Vite emits
`frontend/dist/`; frontend `app.yaml` and `.gcloudignore` keep static handler
paths relative to that directory and upload only `app.yaml` and `dist/`.
The repository-root `.gcloudignore` applies to Cloud Build source uploads;
it excludes local/generated files while retaining source and encrypted configs.

The committed frontend `.env` supplies the public `VITE_API_URL=/api`, so clean
Cloud Build checkouts call the dispatched `/api/*` routes. Prebuild does not
generate this value.

The frontend still deploys to App Engine service **`ip-react`**. Project-level
`dispatch.yaml` preserves `/api/ps/*`, `/api/widget/*`, `/api/act/*` and general
`/api/*` routing to existing services. No service rename, Cloud Run migration,
backend deployment or routing redesign is included.

KMS decryption remains temporarily commented out because the existing build
identity lacks decryption permission. Builds use bundled defaults. When
permissions are restored, enable the commented step and add `decrypt-config`
to the build step's `waitFor` list. Ciphertext is read from this project's
`configs/`; plaintext must be written to `frontend/env-config.json`, where
the existing frontend prebuild script expects it. Never commit the plaintext.

## Cloud trigger cutover (not applied automatically)

Before enabling deployment from this repository:

1. Connect `Q-Retail/wiq-si-portal` to the authorized Cloud Build integration.
2. Configure dev/uat triggers for `^dev-branch$` and `^uat-branch$` in their
   respective approved GCP projects, using root `cloudbuild.yaml`.
3. Use included-file filters `cloudbuild.yaml`, `.gcloudignore`,
   `projects/wiq-si-portal/frontend/**`, `projects/wiq-si-portal/configs/**`
   and `projects/wiq-si-portal/dispatch.yaml`. Do not enable deployment
   triggers for feature branches.
4. Verify the build service account's App Engine/Cloud Build permissions,
   existing backend services and target project before deploying dispatch.
   KMS access is additionally required before enabling decryption.
5. Promote the reviewed feature changes through dev then uat. Disable or
   retire the old repository's corresponding triggers at the agreed cutover
   so both repositories cannot deploy concurrently. Triggers that remain on the
   restructured original repository need the same root `cloudbuild.yaml` and
   included-file filters.

The pipeline retains the old `gcloud app deploy` promotion behavior. Trigger
project mapping, branch protections and actual environment releases require
cloud/repository administrator action; local branch creation alone does not
make dev or uat deployable.

## Local transition validation

The relocated frontend builds and passes all 631 existing tests with the
unchanged 95.01% coverage gate (97.39% line coverage). The first unbounded
run and a targeted rerun timed out on different page tests on the shared
machine; the full bounded-worker run passes without changing code, tests or
timeouts:

```bash
npm --prefix projects/wiq-si-portal/frontend run test:coverage -- --maxWorkers=2
```

After synchronizing original-repository changes through `635c198`, that run
passes 645 tests in 76 files with 97.39% line coverage; `npm run docs:check`
and the production build also pass.

Source/asset snapshots were compared with the original checkout, and actual
`gcloud meta list-files-for-upload` checks verify both Cloud Build source
inclusion and the frontend's built-only App Engine upload. These checks do
not authenticate, deploy or qualify production environments.
