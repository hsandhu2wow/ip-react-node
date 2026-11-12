# Repository guide for coding assistants

## Purpose and evidence

Recreate Angular Store Insights in React with one-to-one functional and visual
parity across every enabled business unit (BU). This is a migration, not a
redesign. Preserve routes, API contracts, permissions, analytics, responsive
behavior, export workflows and source-specific quirks unless a change is
explicitly approved.

This directory (`projects/wiq-si-portal/frontend` in `Q-Retail/wiq-si-portal`)
is a React frontend using the existing Python APIs, not a Node backend. Run
frontend commands from here; the [project guide](../README.md) covers the
monorepo layout, Cloud Build paths and branches. Authentication is still a
demo; a successful build, high unit coverage or one local SI profile does not
establish authentication or all-BU parity.

Start with the [documentation hub](docs/README.md) for role-based reading paths,
[migration strategy](docs/migration-strategy.md) for rationale/acceptance,
and [contributor workflow](CONTRIBUTING.md) for changes and reviews.
The [AI collaboration guide](docs/ai-guide.md) explains tool-neutral context
loading and handoffs without relying on private conversation history.

For work in a subtree, also read its scoped guide:
[Quick Facts](src/features/quick-facts/AGENTS.md),
[Weekly/MyPlan](src/features/trend/AGENTS.md) or
[shared infrastructure](src/shared/AGENTS.md). Local guides add context and
inherit this guide. Tool discovery varies; open them explicitly if not loaded.
Use the [traceability register](docs/migration-traceability.md) to connect
requirements to current code/tests and unresolved acceptance evidence.

Before changing a feature:

1. Read the relevant source and colocated tests, then its migration assessment.
2. Read [architecture](docs/technical-architecture.md) and the applicable
   [decision records](docs/decisions/README.md).
3. Use [migration status](docs/migration-status.md) for gaps and
   [Weekly/MyPlan assessment](docs/weekly-facts-myplan-parity.md) for that feature.
4. For parity questions, compare the Angular baseline described in
   [README](README.md#reviewed-checkouts). If source or authorized BU evidence
   is unavailable, state that limitation; do not infer acceptance.

For implementation facts, inspect current code/configuration. Documents contain
dated sections: newer progress entries supersede older snapshots, and
`docs/superpowers/` specs/plans are historical intent, not completion reports.
If source, decisions and documentation disagree, report the discrepancy rather
than silently implementing an old plan or declaring a gap resolved.

## Architecture boundaries

| Location | Responsibility |
|---|---|
| `src/main.tsx` | Root providers, router, query client and theme bootstrap |
| `src/app/` | Route composition, navigation/filter shell, theme configuration |
| `src/features/quick-facts/` | Summary/details cards, endpoints, hooks and transforms |
| `src/features/trend/` | Shared Weekly Facts/My Plan pages, selection, tables, dialogs, endpoints and types |
| `src/shared/` | Cross-feature transport, contexts, UI, types and utilities |
| `src/styles/globals.css` | Global runtime theme variables and backend-HTML classes |
| `src/test/` | Test lifecycle, MSW handlers/server and sanitized fixtures |

Keep feature-specific code in its feature and tests/styles beside their owner.
Runtime dependencies flow from app to features/shared, and from features to
shared; shared must not import app/features. Do not duplicate Weekly/MyPlan
rendering or selection logic. Avoid new barrels or abstractions without a
concrete reuse need.

## Decisions to preserve

- **Styling:** use `.module.scss` for scoped styles. Preserve `:global(...)`
  selectors, preview/export classes, runtime CSS variables and BU themes.
  Do not convert backend-supplied literal classes into scoped names.
- **Server state:** TanStack Query owns caching, retries and query lifecycles;
  native Fetch in `src/shared/api/client.ts` owns HTTP. Do not reintroduce Axios
  or add competing component-level caches.
- **HTTP contracts:** preserve credentials, the 30-second timeout, `{ data }`
  endpoint envelope, text/empty responses and multipart boundaries. Non-2xx
  responses throw `HttpError`; preserve its status/payload for UI consumers.
  Network/timeout/cancellation failures must not become successful empty data.
- **Endpoint spelling:** page data uses `/myPlan/<code>` but subscriptions use
  lowercase `/myplan/...`; Weekly uses `/wf/...`. Preserve required trailing
  slashes such as `/feedbackPopup/` and `/npsSurvey/`.
- **Backend HTML:** API-supplied cells, headers, rich text and dialogs render
  through `dangerouslySetInnerHTML` and rely on global classes; only
  `TrendBanner` sanitizes with DOMPurify. Do not route user-entered or
  non-API HTML through these paths without sanitizing it.
- **Testing:** use MSW for HTTP/query integration. Keep isolated component,
  canvas and external SDK mocks when those are the boundary under test.
- **Parity:** response-defined history keys, original table column IDs and
  separate desktop/mobile selection rules are intentional. The 767px
  TypeScript and 768px stylesheet boundaries differ in source; do not unify
  them without checking the Angular behavior and regression cases.

The [decision index](docs/decisions/README.md) explains the rationale and
trade-offs. Update or supersede a decision when intentionally changing it.

## Commands and validation

Use the committed lockfile; see [README](README.md#stack-and-setup) for Node
requirements and backend setup.

| Command | Use |
|---|---|
| `npm ci` | Install the locked dependencies when setup/restoration is needed |
| `npm run dev` | Frontend; `/api` proxies to the separately started backend on port 8080 |
| `npm test -- --run <test-paths>` | Targeted Vitest regression checks |
| `npm run test:coverage` | Full-source V8 coverage and enforced line gate |
| `npm run build` | Prebuild configuration, TypeScript and production Vite build |
| `npm run docs:check` | Checker regressions and maintained-document local links/anchors |
| `npm run check:code` | Full coverage then production build |
| `npm run check` | Documentation plus code checks, stopping on failure |

Keep the **95.01% global line threshold** and executable-source coverage scope.
Do not lower the threshold or exclude code to make a change pass. Other
metrics are reported, not gated. Do not hardcode a current test count in these
instructions; run commands before claiming results.

MSW starts in `src/test/setup.ts`, rejects unhandled requests, resets handlers
after each test and closes after all tests in that setup lifecycle. Use
sanitized fixtures and `server.use(...)` overrides, not live API calls.
Multipart HTTP tests use the Node environment to keep native File/FormData
paired with Fetch.

Add focused regressions for behavior changes; use existing checks first.
Run build/type checks for code/import/dependency changes. Vitest does not
type-check, so passing tests can still fail `npm run build` in Cloud Build;
`npx tsc -b` checks types without the prebuild step that rewrites
`.env.production.local`. SCSS changes also
need visual or compiled-style comparison; unit coverage does not measure CSS.
There is no tracked ESLint configuration or configured browser parity suite;
do not claim those checks pass.

## Working safely and keeping context current

- Inspect the active branch and dirty state first. Preserve other worktrees
  and unrelated edits; do not assume a branch or checkout from previous chats.
- Leave `wireframes/` and local brainstorming artifacts out of commits; the
  repository-root `.gitignore` excludes them.
- Never copy credentials, raw business data or decrypted configuration into
  code, fixtures, logs or assistant instructions. Frontend `VITE_*` values are
  public. Do not submit live feedback, recognition or subscription changes
  merely to test them.
- Read the repository-root [cloudbuild.yaml](../../../cloudbuild.yaml) and
  [project guide](../README.md#build-and-deployment) before deployment work:
  config decryption is currently
  disabled pending KMS permission. Default branding is not proof of correct BU
  configuration. Do not change deployment/auth settings as incidental cleanup.
- Keep changes surgical and update directly related docs. Record durable
  architectural decisions in `docs/decisions/`, not duplicated tool-specific
  instructions. Keep personal notes and task status out of repository guidance.
- Report blockers and missing user input promptly. Distinguish implemented,
  locally verified and Angular/BU-qualified behavior in the handoff.
