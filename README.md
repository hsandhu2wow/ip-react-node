# Store Insights React migration

This repository recreates the Angular **Store Insights** application in React.
The objective is **one-to-one functional and visual parity**, not a redesign:
routes, permissions, data, interactions, analytics, responsive behavior and
integrations must match the agreed Angular baseline.

**Status as of October 23, 2026:** partial migration. Quick Facts summary/details
and basic Weekly Facts/My Plan tables exist. Authentication is still a demo
stub, several actions are inert, and most other Angular applications are not
migrated. Implemented components and passing unit tests, when available, do not
by themselves establish Angular parity.

## Technical documentation

| Document | Contents |
|---|---|
| [Architecture and development](docs/technical-architecture.md) | Current providers, routing, state, API contracts, caching, tooling and deployment |
| [Migration status and source comparison](docs/migration-status.md) | Reviewed commits, recent changes, feature gaps and source references |
| [Future migration plan](docs/superpowers/plans/2026-10-14-angular-react-migration.md) | Prioritized delivery slices, dependencies and acceptance gates |
| [Weekly Facts/My Plan assessment](docs/weekly-facts-myplan-parity.md) | Thorough source review, recent changes, real SI response shapes, BU differences and parity gaps |
| [Weekly Facts/My Plan implementation plan](docs/superpowers/plans/2026-10-21-weekly-facts-myplan-parity.md) | Detailed replacement for roadmap Stage 4, task dependencies and per-BU acceptance |
| [React guide for Angular developers](docs/react-tutorial-for-angular-devs.md) | Educational walkthrough of existing React patterns |

Earlier date-stamped specs/plans under `docs/superpowers/` retain historical
scope and intent. They are not completion reports, and earlier feature
deferrals do not exclude those features from the full migration.

## Reviewed checkouts

| | React | Angular |
|---|---|---|
| Repository/application | `hsandhu2wow/ip-react-node` | `dsa-buying-insights/store-insights` |
| Branch | `document-migration-plan` | `feature/smkt-qf-yday-toggle-mobile` |
| Commit | `c97525f268befdc68446c7c864a9f2c79b279d5c` | `02a9cf69889d74fb8542ec26c9ecb57aae041278` |

The Angular source is at
`/Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights/store-insights`;
its Git root is the parent `dsa-buying-insights` repository.
This review uses its committed product source, excluding local configuration
edits. The React review is for this worktree, not uncommitted work or documents
in another checkout. Recheck both HEADs before executing the plan.

## Stack and setup

React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5, Axios,
Chart.js 4 and CSS Modules. The repository is a **frontend**; despite its name,
it does not implement a Node backend. It reuses the existing Python APIs.

Use Node 22.12+ in the Node 22 line, or a supported newer LTS release.
The checked-in Cloud Build configuration uses `node:22`.

```bash
npm ci
```

Create `.env.local` with:

```dotenv
VITE_API_URL=/api
```

Vite exposes `VITE_*` values to the browser: never place credentials there.
Keep this local file uncommitted; the current `.gitignore` does not ignore
environment files.
The current demo portal is hardcoded to `WW` in `AuthContext`; no
`VITE_PORTAL` setting is implemented in this checkout.

Start the existing Python backend separately, using its own setup instructions
and an authorized development identity/session. Then run:

```bash
npm run dev
```

Use the local URL printed by Vite. Development requests to `/api` are proxied
to `http://127.0.0.1:8080`; opening the frontend does not authenticate against or
start the backend.

## Commands and tests

| Command | Purpose / current limitation |
|---|---|
| `npm run dev` | Development frontend and `/api` proxy |
| `npm run build` | TypeScript project build, then Vite bundle to `dist/` |
| `npm run preview` | Preview built frontend; no preview API proxy is configured |
| `npm test -- --run` | Run the Vitest suite once |
| `npm run test:coverage` | Run tests with V8 coverage; text summary and HTML report at `coverage/index.html` |
| `npm test -- --run src/utils/periods.test.ts src/utils/breakdown.test.ts` | Focused period/axis tests |
| `npm run lint` | Declared, but no ESLint configuration is tracked at the reviewed commit |

There are **33 test files** in this worktree, using Vitest, jsdom and
React Testing Library. They cover components, hooks, context, API wrappers and
pure utilities. No configured browser E2E or Angular-versus-React screenshot
suite is present. The obsolete MetricCard renderer and its five tests were
removed during cleanup; the active SummaryCard/DetailsCard suites remain.
The October 20 test expansion adds coverage for SummaryPage/DetailsPage,
query/API integration, date selection, location search/expansion and HTML
tooltips. A second pass adds chart data/label/tooltip callbacks, nested tables,
scroll shadows, tab switching and hierarchy/URL state persistence.
The fixture-driven application tests now cover routing, provider/query
integration, period/breakdown selection, location/date changes and query errors.
The October 23 run passed all **267 tests** (248 at the October 20 baseline).
Using the same source scope as the initial measurement, line coverage increased
from **58.37% to 97.62%**; statements are 96.63%, branches 89.92% and
functions 97.58%. Coverage includes all application
TS/TSX files, excluding tests, setup and type declarations. It does not measure
CSS, browser rendering or Angular parity. Generated reports are ignored by Git.
Chart tests mock the canvas renderer and verify the data/options passed to it,
not Chart.js drawing or source gauge parity.
`npm run test:coverage` enforces **95.01% global line coverage**. Other metrics
are reported, not gated; branch coverage is not yet above 95%.

`src/test/fixtures/sqf-api.sanitized.json` was derived from successful read-only
requests to the local API at `http://localhost:8080/api` on October 20.
It contains pruned hierarchy, card-status, WTD/YDAY summary and detail payloads.
Locations, identifiers, text, business values and timestamps are synthetic;
response structure, filter keys and rendering flags are retained. Charts were
omitted from these fixtures and are tested separately. Provenance and capture
paths are embedded in the fixture. Tests mock HTTP transport and require no
running API, credentials or network access; these are not production snapshots.

## Current route coverage

| React route | Implementation |
|---|---|
| `/quick-facts` | Redirects to summary |
| `/quick-facts/summary` | Summary cards |
| `/quick-facts/details/:type` | Details, sorting, sidebar and child drill-down |
| `/quick-facts/weekly` | Initial history/default/grouping fixes; hierarchy/mobile/layout/integrations incomplete |
| `/quick-facts/myplan` | Initial history/default/grouping fixes; card-level Half Year/mobile/integrations incomplete |
| `/weekly`, `/trend`, `/dashboards` | Coming Soon |
| `/pricing-simulator`, `/availability-navigator` | Coming Soon; these names do not replace Angular's routes |
| Other paths | Redirect to Quick Facts; not source-equivalent application coverage |

`ProtectedRoute` receives an always-authenticated demo user. Logout reloads the
page. Feedback/download are disabled, recognition simulates loading, and Weekly
Metrics Info/subscription labels have no action flow. Consult the
[gap matrix](docs/migration-status.md#feature-parity-matrix) before declaring a
feature complete.

The October 23 initial Weekly/MyPlan migration slice adds response-defined
history keys (including observed `monthNo`/`halfNo`), server variance/KPI
expansion defaults, selection resets on new responses, source grouping/column
membership fixes and typed subscription transport. The subscription UI is
still not implemented, and existing inert labels are not working actions.
Remaining gaps include card-level Half Year, hierarchy
selection, mobile column projection, WFM/goal/sticky layouts and working
subscriptions/AI/export. The new plan covers source-specific behavior and
qualification for every enabled BU. Only one local SI profile was probed;
cross-BU browser parity is **not verified**, and the saved API fixture remains
SQF-only. Authorized BU configuration/session/theme evidence is an execution
prerequisite, not something unit coverage can replace.

## Deployment and contribution boundaries

`cloudbuild.yaml` installs/builds the frontend, deploys the App Engine
`ip-react` service using `app.yaml`, and applies `dispatch.yaml`. Existing
services handle `/api` requests. Build-time configuration, IAP/session behavior,
deep links and shared dispatch changes require staging/release approval.

Keep migration changes scoped to their feature and accompanying tests/docs.
Do not overwrite another checkout's local work, copy environment secrets or
treat wireframes as the source specification. Wireframes are excluded from
this documentation change; some remain tracked in this branch, so avoid
indiscriminate staging. The October 23 initial implementation is scoped to the
Weekly/MyPlan feature branch; no deployment or shared dispatch change was made.
