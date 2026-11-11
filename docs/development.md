# Local development and troubleshooting

## Prerequisites

- Git and an approved Node LTS runtime: Node 22.13+ in the Node 22 line,
  or a supported newer LTS. Use the lockfile rather than choosing package
  versions from old plan examples.
- Access to this React repository. Only live integration work needs the
  separately maintained Angular/Python source and an authorized backend session.
- A browser for UI work. Offline Vitest tests need no live API or credentials.

No database, Node server, Python virtual environment or cloud credentials are
installed by this frontend's package scripts.

## First run

```bash
git status --short
git branch --show-current
npm ci
```

Create `.env.local` locally:

```dotenv
VITE_API_URL=/api
```

The file is not currently ignored. Keep it uncommitted; if needed, add the
filename to your local Git exclude file (locate it with
`git rev-parse --git-path info/exclude`). Do not change global Git settings
or overwrite another contributor's local configuration.

Start the existing Python backend separately according to its authorized
setup, then run:

```bash
npm run dev
```

Open the frontend URL printed by Vite. Its configured `/api` proxy forwards
to `http://127.0.0.1:8080`; it does not provision the API, copy authentication
or populate data. Do not point mutation tests at shared/production services.

If dependencies are already present, no reinstall is needed for documentation
or normal source changes. Restore dependencies after a manifest/lock change
or a missing-package failure.

## Environment and build behavior

See the complete [configuration table](operations.md#configuration) before
working on BU branding or exports. Every `VITE_*` setting is embedded in the
browser; it is not secret storage.

| Mode | Behavior |
|---|---|
| `npm run dev` | Vite development mode; reads matching local env files; does not run prebuild |
| `npm run build` | Runs prebuild, TypeScript and Vite production mode; writes ignored `.env.production.local` |
| `npm run preview` | Serves built output, not TypeScript source; no configured backend proxy |
| Vitest | Sets `VITE_API_URL=/api`, intercepts HTTP with MSW |

Prebuild reads `env-config.json` or `ENV_CONFIG_PATH` and emits allowlisted
frontend values. It does not emit `VITE_API_URL`. Configure the API prefix for
the target environment rather than assuming the production generator supplies
it. In production mode, generated mode-specific values can override values
from `.env.local`; process environment has Vite's normal higher precedence.
Restart the dev server after changing env files, and rebuild for production.

The demo portal defaults to `SI`; changing it is not an authenticated user/BU
switch and does not qualify another BU.

## Useful loops

For selection logic:

```bash
npm test -- --run src/features/trend/utils/trendSelection.test.ts
```

For HTTP/query behavior:

```bash
npm test -- --run src/shared/api/client.test.ts src/features/quick-facts/hooks/sqfQueries.test.tsx
```

For an integrated code change:

```bash
npm run check:code
```

For documentation use `npm run docs:check`; for both use `npm run check`.
See [repeatable validation](testing.md#repeatable-validation) for exact scope,
fail-fast behavior and build side effects.

See [testing](testing.md) for what each layer proves. Avoid adding a second
dev server/test runner when an existing one is already serving your worktree.

## Troubleshooting

| Symptom | Inspect / explanation |
|---|---|
| API requests return HTML with status 200 | Inspect URL, prefix and Content-Type. An unprefixed request can hit SPA fallback; the transport does not make HTML into valid page data |
| Connection refused or proxy error | Confirm the authorized backend is actually running on configured port 8080 |
| API returns 401/403 | Check authorized session/access through the approved backend flow; the React demo identity cannot grant access |
| UI remains in hierarchy loading | Inspect `/sqf/getUniversalFilterGeneric`, permitted-tree contents and `isLoaded`; an invalid/empty tree stays unloaded |
| Changing period/axis makes no network request | This is expected when projecting an already-fetched period response |
| Default title/logo/portal after build | Inspect prebuild source/config availability and generated frontend values; KMS is currently disabled in Cloud Build |
| Styling/icons differ from Angular | Check injected `env.css`, runtime variables, hosted fonts, viewport and literal global classes before changing component selectors |
| A local setting is ignored in production | Check `.env.production.local`, process environment and Vite mode precedence; do not print secret config |
| MSW reports an unhandled request | Add a specific synthetic handler in the relevant test; do not enable live passthrough globally |
| Multipart test fails between jsdom/Fetch types | Use the Node-environment HTTP test pattern with native File/FormData |
| Slides unavailable | Check public client config, SDK loading and approved OAuth access; tests alone do not validate Google permissions |
| Build warns about large chunks | Existing warning; do not disable it or change bundling as incidental migration cleanup |
| `npm run lint` fails for missing configuration | No ESLint config is tracked; do not report a lint pass |

Capture only synthetic/sanitized diagnostic data. Do not paste raw API bodies,
cookies or employee details into tickets or assistant prompts.
