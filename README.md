# Store Insights: Angular-to-React migration

This project recreates the Angular Store Insights application in React.
The goal is **one-to-one functional and visual parity**, not a redesign.
Angular is the source of truth for routes, permissions, data, interactions,
analytics, responsive layouts and integrations.

**Status, 2026-10-10:** migration in progress. Quick Facts summary/details and
the core Weekly Facts/My Plan tables are implemented, but parity has not been
demonstrated. Authentication is a demo stub; several routes and actions are
missing or placeholders. Existing wireframes and earlier phase specifications
do not override the current full-parity requirement.

## Documentation

| Document | Purpose |
|---|---|
| [Repository comparison](docs/angular-react-parity-analysis.md) | Source inventory, July–October changes, contracts and parity gaps |
| [Migration design](docs/superpowers/specs/2026-10-10-angular-react-migration-design.md) | Approved baseline, architecture and acceptance criteria |
| [Migration plan](docs/superpowers/plans/2026-10-10-angular-react-migration.md) | Ordered feature slices, dependencies and verification gates |
| [React tutorial for Angular developers](docs/react-tutorial-for-angular-devs.md) | Educational guide to the existing React code |

Date-stamped earlier documents under `docs/superpowers/` record previous scope
and decisions. They are historical references, not current completion reports.

## Source baseline

| | Angular | React |
|---|---|---|
| Local directory | `/Users/lakhwinderkaur/Documents/work-wow/dsa-buying-insights/store-insights` | This repository |
| Branch reviewed | `feature/smkt-qf-yday-toggle-mobile` | `dev-branch` |
| Committed baseline | `dbd096cd36c457531f7d3ffd6e6b6fa9176d6c02` | `c97525f268befdc68446c7c864a9f2c79b279d5c` |

The Angular directory is inside the `dsa-buying-insights` Git repository.
History comparisons must be scoped to `store-insights/`. The agreed baseline
excludes local uncommitted configuration changes. React also has active local
application work; do not overwrite it or describe it as committed parity.

## Stack and architecture

React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5, Axios,
Chart.js 4 and CSS Modules. `package-lock.json` pins installed dependency
versions; `package.json` declares supported ranges.

Despite the repository name, this is a React frontend, **not a Node API
implementation**. It uses the existing Angular application's Python backend.
Development proxies `/api` to `http://127.0.0.1:8080`; production dispatch
routes API requests to existing backend services.

```text
src/api/          HTTP client and endpoint contracts
src/context/      Authentication and shared filter state
src/hooks/        Queries and derived card data
src/components/   Shared shell, filters, cards and tables
src/pages/        Route-level composition
src/types/        Backend response types
src/utils/        Pure transformations and formatting
src/styles/       Global theme and backend-HTML styles
public/assets/    Static refresh-state illustrations
```

## Local development

Use Node **22.12 or newer in the Node 22 line, or a supported newer LTS
release**. The checked-in Cloud Build configuration uses `node:22`.

```bash
npm ci
```

Set frontend configuration in `.env.local`:

```dotenv
VITE_API_URL=/api
VITE_PORTAL=SI
```

`VITE_PORTAL` currently labels the demo user/theme context; it is not a
permission or authentication mechanism. Never put credentials in `VITE_*`
variables: Vite embeds them in the browser bundle. Restart Vite after changing
environment variables.

### Per-BU logo, favicon and theme

Same setup as the Angular app. Cloud Build decrypts
`configs/env-config-$PROJECT_ID.json.enc` with KMS (keyring `$PROJECT_ID`, key
`si-cicd`) into `env-config.json`, then `npm run build` runs
`scripts/prebuild.mjs` (the equivalent of Angular's `prebuild.js`). It copies
only the frontend values (`BUCKET_URL`, `SITE_TITLE`, `PORTAL`, `GCP_CLIENT_ID`,
`GCP_API_KEY`) into the git-ignored `.env.production.local` as `VITE_*`
variables. The app then loads `logo.svg`, `favicon.ico`, `home.png` and
`env.css` from the BU's `BUCKET_URL` (see `src/config/theme.ts`). The sidebar
label follows the portal (`360FM`, `PEOPLE`, otherwise "Insights Portal").

To onboard a BU/environment, add its `env-config-<project-id>.json.enc` to
`configs/`. Without that file (or `env-config.json`) the build uses the bundled
defaults in `public/assets/`. For a local one-off, put a plain `env-config.json`
in the repo root or set `ENV_CONFIG_PATH`; it is git-ignored.

### Google Slides export (optional)

The Quick Facts "Google Slide" export (`preview('slide')`, a port of Angular
`GCPSlidesService`) needs a Google Cloud browser API key and an OAuth 2.0 web
client ID:

```dotenv
VITE_GOOGLE_API_KEY=<browser API key with Slides + Drive APIs enabled>
VITE_GOOGLE_CLIENT_ID=<OAuth web client ID>.apps.googleusercontent.com
```

Both are public browser identifiers (not secrets), but restrict the API key to
the Slides/Drive APIs and your HTTP referrers, and add the app origin (for
example `http://localhost:5173`) to the client's authorised JavaScript origins.
Sign-in uses Google Identity Services (`google.accounts.oauth2.initTokenClient`,
scopes `presentations` + `drive`) instead of the deprecated `gapi.auth2`; both
Google scripts are loaded on demand. If either variable is missing, the export
shows "Missing Client and API key".

Start the existing Python backend separately using its own repository's
instructions and an authorized development identity/session. This frontend
does not start it or bypass its IAP authentication.

```bash
npm run dev
```

Open the URL printed by Vite. API requests send cookies with
`withCredentials: true`; a working UI shell does not prove authenticated
backend connectivity.

## Commands

| Command | Purpose / caveat |
|---|---|
| `npm run dev` | Vite development server with `/api` proxy |
| `npm run build` | TypeScript project build and production bundle to `dist/` |
| `npm run preview` | Preview the production frontend; the dev API proxy is not configured here |
| `npm test -- --run` | Run Vitest once with jsdom and React Testing Library |
| `npm test -- --run src/utils/periods.test.ts src/utils/breakdown.test.ts` | Targeted period/axis regression checks |
| `npm run lint` | Declared ESLint command; no ESLint configuration is tracked at the reviewed baseline |

These commands describe available tooling, not results from this documentation
review. Existing tests are not an Angular differential acceptance suite.

## Current routes

| React route | Current implementation |
|---|---|
| `/quick-facts` | Redirects to summary |
| `/quick-facts/summary` | Summary cards |
| `/quick-facts/details/:type` | Details cards, sidebar and drill-down |
| `/quick-facts/weekly` | Weekly Facts core table |
| `/quick-facts/myplan` | My Plan core table |
| `/weekly`, `/trend`, `/dashboards` | Coming Soon |
| `/pricing-simulator`, `/availability-navigator` | Coming Soon; names differ from Angular routes |
| Other paths | Redirect to Quick Facts; not equivalent to Angular's full route inventory |

`ProtectedRoute` currently always receives authenticated demo context.
Logout reloads the page. These are migration scaffolding, not production
authentication. Feedback/download are disabled and other displayed actions
may be inert; consult the parity matrix before treating a feature as complete.

## Deployment

`cloudbuild.yaml` installs dependencies, builds the frontend, deploys
`app.yaml` to the App Engine `ip-react` service, and applies `dispatch.yaml`.
`app.yaml` serves `dist/assets` and a SPA fallback from `dist/index.html`.
Its `python312` runtime does not mean this repository contains the Python API.

Check the deployment-time `VITE_API_URL`, authenticated cookie/IAP flow, API
dispatch, direct deep links and asset responses in an authorized staging
environment before release. The SPA fallback is not an API error handler.
Do not deploy shared dispatch changes merely to validate the frontend.
