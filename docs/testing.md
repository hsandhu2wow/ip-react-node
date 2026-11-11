# Testing and parity validation

## What the tests prove

The repository uses Vitest, React Testing Library, jsdom, MSW and V8 coverage.
These checks protect **implemented behavior**; they cannot measure missing
Angular functionality or prove all-BU visual acceptance.

| Layer | Appropriate assertions | Not established by it |
|---|---|---|
| Pure utility | Selection, mapping, projection, formatting and edge cases | DOM layout or API permissions |
| Component | User interaction, accessibility labels/focus, rendering, cleanup | Browser pixels and full backend integration |
| Query / HTTP integration | Real hooks/endpoints/Fetch, paths, errors, cache behavior, multipart | Real identity or production response completeness |
| Application integration | Route/provider composition and fixture-driven flows | Every source route or BU |
| Mocked canvas / SDK | Chart options/drawing callbacks, capture/export orchestration | Actual Chart.js/PDF/Slides output |
| Authorized paired browser acceptance | Source-equivalent behavior/appearance for recorded configuration | Other configurations not exercised |

Test counts and percentages are dated measurements, not static guarantees.
The [README](../README.md#current-status) records the integrated baseline;
run checks again when changing code.

## Commands

```bash
# Whole suite, once
npm test -- --run

# A focused selection/table change
npm test -- --run src/features/trend/utils/trendSelection.test.ts src/features/trend/utils/tableTransform.test.ts

# HTTP/query contracts
npm test -- --run src/shared/api/client.test.ts src/shared/api/forms.http.test.ts src/features/trend/api/trend.http.test.ts src/features/quick-facts/hooks/sqfQueries.test.tsx

# Coverage and production types/bundle
npm run test:coverage
npm run build
```

`npm test` without `--run` uses Vitest's interactive behavior.
Use existing targeted checks during development; run full coverage/build for
integrated code/dependency/import changes. Documentation-only work does not
need application tests.

## Repeatable validation

| Command | Runs / boundary |
|---|---|
| `npm run docs:check` | Node checker regressions, then maintained-document local links/heading anchors; no application dependencies required when invoked through Node |
| `npm run check:code` | Existing full-source coverage gate, then production build including TypeScript |
| `npm run check` | Documentation checks, then code checks |

Each chain stops and returns a nonzero exit code when a step fails. None runs
lint, live API writes, browser acceptance or deployment, and none is currently
wired into Cloud Build. Build still invokes the existing prebuild and writes
ignored `.env.production.local`; these commands are not read-only.

The dependency-free checker is [check-docs.mjs](../scripts/check-docs.mjs).
It checks root Markdown files, `.github/*.md`, `docs/*.md`,
`docs/decisions/*.md` and recursively discovered `src/**/AGENTS.md`.
Historical `docs/superpowers/` plans, wireframes, dependencies and generated
output are not scanned. Links **from** maintained guides to historical files
still need valid targets/headings.

Checks cover inline links/images and reference-definition destinations, local
file existence and ATX (`#`) Markdown heading anchors, including duplicate
headings. Fenced examples and inline code are excluded. External URLs are
not fetched. Use Markdown links for source references you want checked;
plain code-formatted paths, Claude `@` imports, reference-label usage,
HTML/Setext anchors and arbitrary Markdown extensions are not validated.
Use angle brackets or URL encoding for destinations containing spaces.
It is a focused handbook check, not a full Markdown linter.

Run its Node tests directly without installed frontend dependencies:

```bash
node --test scripts/check-docs.node-test.mjs
node scripts/check-docs.mjs
```

The explicit Node test filename keeps these tests separate from Vitest's
application test discovery and coverage totals. Add a focused failing case
there before extending the checker. For migration changes, update the
[traceability register](migration-traceability.md) with the relevant tests
and remaining acceptance rather than equating a green command with parity.

## HTTP integration with MSW

[setup.ts](../src/test/setup.ts) starts the
[Node server](../src/test/server.ts) before the suite, rejects unhandled
requests, resets overrides after each test and closes afterward.
Vitest config sets `VITE_API_URL=/api`.

[Default handlers](../src/test/handlers.ts) cover hierarchy, card configuration
and summary cards with sanitized data. They are intentionally **not** a
catch-all for every endpoint; tests must declare other requests. Add
`server.use(...)` per-test overrides for errors and alternate payloads.

For example, inside a transport test configured like
[client.test.ts](../src/shared/api/client.test.ts):

```ts
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { createHttpClient } from './client'

it('retains backend error details', async () => {
  server.use(http.get('*/api/wf/fixture-store', () =>
    HttpResponse.json({ errorTitle: 'Unavailable' }, { status: 503 }),
  ))
  const client = createHttpClient({ baseURL: '/api' })
  await expect(client.get('/wf/fixture-store')).rejects.toMatchObject({
    response: { status: 503, data: { errorTitle: 'Unavailable' } },
  })
})
```

Use the existing test's environment/origin setup. Multipart contracts use
`// @vitest-environment node` and a synthetic window origin, keeping native
File/FormData paired with Node Fetch. Do not mix jsdom file constructors into
those tests or "fix" a handler failure by sending a live request.

Choose the boundary deliberately:

- HTTP integration should not mock the endpoint or transport it claims to test.
- Isolated components can mock query/API modules to exercise UI branches.
- Canvas, PDF SDK, OAuth and Google SDK mocks remain appropriate where
  external rendering/services are not the test target.
- Never globally bypass unhandled requests just to make a suite pass.

## Query/provider tests

Use a fresh QueryClient per test and clear it afterward. Tests that assert
errors commonly disable retries for deterministic timing; that must not alter
runtime retry policy. Keep keys, enabled flags and response transitions
consistent with the [architecture](technical-architecture.md#queries-caching-and-period-selection).

Prefer behavior that fails if the contract breaks: a changed location/date
refetches, a period/axis change reuses fetched data, disabled queries do not
request, structured HTTP errors reach UI, and cached hierarchy/configuration
are shared. Avoid checking only that a mocked hook was called.

For component tests, use the actual required router/providers and clean up
listeners/timers/URLs. Use deterministic clocks for cutoff/history behavior;
do not make expectations depend on the current hour or timezone.

## Fixtures and privacy

[sqf-api.sanitized.json](../src/test/fixtures/sqf-api.sanitized.json) was derived
from successful local read-only GETs on October 20, 2026. It preserves WTD/YDAY,
hierarchy, status, nested breakdown shapes and flags, but replaces identifiers,
titles, business values and timestamps. It is pruned and omits charts.

It is **not** a complete backend schema or a fixture for every enabled BU.
Synthetic trend/form/SDK cases supplement it without claiming live-data
provenance. Add only the fields needed for meaningful regressions, retaining
relevant source shapes and recording derivation/sanitization when applicable.
Never commit raw API dumps, employee information, cookies or decrypted config.

## Coverage policy

[vitest.config.ts](../vitest.config.ts) includes `src/**/*.{ts,tsx}`, including
unimported application source. It excludes:

```text
src/**/*.test.{ts,tsx}
src/test/**
src/**/types/**
```

The global **line** threshold is **95.01%**. Statements, functions and branches
are reported but not independently gated. Do not lower the threshold or hide
executable modules in excluded directories to make a change pass.

Reports are generated under ignored `coverage/`, including
`coverage/index.html` and `coverage/coverage-summary.json`. Unit coverage does
not include SCSS or guarantee browser behavior. Add tests for changed behavior,
not arbitrary assertions written only to raise the percentage.

## Browser and BU acceptance

There is **no checked-in browser E2E/differential runner**. The focused
assessment records session-local synthetic browser probes; those are not a
reproducible repository command or a source of all-BU certification.

For qualification, record compared commits and approved environment, then cover:

| Dimension | Examples |
|---|---|
| Identity/configuration | Role, permitted hierarchy, enabled views, portal/theme, account/cache transition |
| Desktop/mobile | Narrow screen and boundary cases at 767/768/769px; resizing with active selection |
| Data states | Loading, empty, structured HTTP error, stale response, no available mobile view |
| Selection | Period/axis, view/history/hierarchy, child-peer, Half Year, unmatched filters |
| Layout | Headers/column IDs, spans, sticky/scroll geometry, WFM/goal layouts, icons/fonts |
| Interaction | Keyboard/focus, cancel/commit, dialog reset, banner dismissal, AI resize cleanup |
| Integrations | Approved feedback/NPS/recognition, subscriptions, analytics, actual print/PDF/Slides |
| Routes/release | Deep links, reload/back-forward, session, API/static dispatch and asset loading |

Use authorized test identities and sanitized/intercepted scenarios first.
Live mutations need explicit approval. Document accepted differences rather
than hiding them in snapshots or treating a single screenshot as parity.

## Known tooling limits

`npm run lint` is declared but there is no tracked ESLint configuration.
Cloud Build currently builds/deploys without tests or coverage. These are
visible gaps, not passing checks; adding CI or lint tooling is separate work.

The current application suite can emit MSW unhandled-GET diagnostics for
`/triggerNPSSurvey/` and `/getUserdetails` while still passing: existing
consumers catch the rejected requests. Inspect the logs rather than treating
exit zero as proof every request has a handler. Do not silence these diagnostics
with global passthrough; affected component tests need explicit handling in
a separate test-isolation follow-up.
