# Store Insights React migration

Recreate Angular **Store Insights** in React with **one-to-one functional and
visual parity across every enabled business unit (BU)**. This is a migration,
not a redesign. Preserve behavior, data contracts, permissions, analytics,
responsive layouts, themes and integrations.

This repository contains the **React frontend**, despite its `ip-react-node`
name. It uses the existing Python APIs; there is no Node application server,
new backend or database migration here.

## Start here

| Reader / task | Start with |
|---|---|
| Anyone new to the project | [Documentation hub](docs/README.md) |
| Why migrate? What are the benefits and risks? | [Migration strategy and rationale](docs/migration-strategy.md) |
| Run and debug locally | [Development guide](docs/development.md) |
| Understand design and data flow | [Technical architecture](docs/technical-architecture.md) |
| Change a feature | [Feature guide](docs/feature-guide.md) and [contributing](CONTRIBUTING.md) |
| Trace migration evidence | [Requirement/code/test register](docs/migration-traceability.md) |
| HTTP or backend integration | [API reference](docs/api-reference.md) |
| Tests, fixtures and parity checks | [Testing guide](docs/testing.md) |
| Build, configuration or deployment | [Operations guide](docs/operations.md) |
| Any AI assistant | [AGENTS.md](AGENTS.md) and [AI collaboration guide](docs/ai-guide.md) |
| Why a technical choice was made | [Architecture decisions](docs/decisions/README.md) |

Copilot's [entry point](.github/copilot-instructions.md) and Claude's
[entry point](CLAUDE.md) use the same tool-neutral guide. Other tools and people
can read it directly; none of the project documentation requires a particular
AI product.

## Current status

Documentation reviewed **November 2, 2026**, against code at `16e8c6f`.
Quick Facts summary/details, seasonal/profile cards and shared
feedback/NPS/recognition/preview/export workflows are implemented. Weekly Facts
and My Plan share a renderer with desktop and mobile selection, tables,
information/alert dialogs, subscriptions, AI drawer, banners and analytics.
Implementation does **not** mean all source behavior has been qualified.

Real identity/roles/feature gating, source-specific table/layout fidelity,
authorized all-BU comparisons and production integration checks remain open.
Authentication is a demo. Several top-level routes still show Coming Soon.
See the [current feature guide](docs/feature-guide.md) and
[delivery gates](docs/migration-strategy.md#delivery-roadmap-and-acceptance-gates).

The last recorded integrated-code validation on November 2 passed **604 tests
in 72 files**, **97.15% line coverage**, and the production build. These are
dated results, not a substitute for running checks on a new change or proof
of Angular/browser parity. The enforced global line gate is **95.01%**.

## Stack and setup

React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5, native Fetch,
Chart.js 4 and SCSS Modules. Tests use Vitest, React Testing Library and MSW.
Use `package-lock.json` for resolved versions. Use Node **22.13+** in the
Node 22 line or a supported newer LTS release; Cloud Build uses `node:22`.

```bash
npm ci
```

For development, create an uncommitted `.env.local`:

```dotenv
VITE_API_URL=/api
```

`.env.local` is **not currently ignored** by the repository. Keep it out of
commits or add it to your checkout's local Git exclusion rules. All `VITE_*`
values are public browser configuration, never a place for backend secrets.

Start the existing Python API separately using its authorized setup, then:

```bash
npm run dev
```

Open the URL Vite prints. `/api` is proxied to `http://127.0.0.1:8080`.
Starting Vite does not start the backend or authenticate the user. Offline
tests do not need either service. See [development](docs/development.md) for
configuration precedence and troubleshooting.

## Commands and tests

| Command | Purpose |
|---|---|
| `npm run dev` | Frontend development server and API proxy |
| `npm test -- --run` | Full Vitest suite once |
| `npm test -- --run <test-paths>` | Targeted tests |
| `npm run test:coverage` | Full-source V8 coverage and line gate |
| `npm run build` | Prebuild configuration, TypeScript check and Vite bundle |
| `npm run docs:check` | Node checker regressions and maintained-document local links/heading anchors |
| `npm run check:code` | Coverage followed by the production build; fails at the first failed command |
| `npm run check` | Documentation checks followed by code checks |
| `npm run preview` | Preview `dist/`; no configured API proxy |
| `npm run lint` | Declared but no tracked ESLint configuration; not an established passing check |

Coverage reports go to ignored `coverage/`. CSS, actual chart/export pixels
and unimplemented Angular features are outside unit coverage. There is no
checked-in browser differential test runner. See [testing](docs/testing.md).
The combined commands do not run lint, browser acceptance or deployments.

## Reviewed checkouts

The historical Angular comparison baseline is
`dsa-buying-insights/store-insights`, branch
`feature/smkt-qf-yday-toggle-mobile`, commit
`02a9cf69889d74fb8542ec26c9ecb57aae041278`. Its Git root is the parent
`dsa-buying-insights` repository; scope source history to `store-insights/`.
Do not treat that historical baseline as the latest Angular HEAD without
rechecking the authorized source checkout.

The October source/history reviews and progress evidence remain in
[migration status](docs/migration-status.md) and the
[Weekly/MyPlan assessment](docs/weekly-facts-myplan-parity.md). Dated plans under
`docs/superpowers/` retain intent and detailed source references, including
superseded source paths; they are not current completion reports.

## Deployment and contribution boundaries

The checked-in delivery path is Vite static assets on App Engine service
`ip-react`, with API dispatch to existing services. KMS config decryption is
currently disabled in `cloudbuild.yaml` pending permission; fresh cloud builds
use default frontend configuration. Default branding is not BU acceptance.
See [operations](docs/operations.md) before release work.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before making changes. Preserve other
worktrees, keep secrets/raw business data out of fixtures and documentation,
and leave **`wireframes/` out of commits**, including tracked files. Runtime
changes, deployment and branch publication are separate from documentation.
