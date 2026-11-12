# 0004: Use MSW at the HTTP boundary in integration tests

**Status:** Accepted

**Implemented:** October 30, 2026 (`99f2b89`)

**Recorded:** November 2, 2026

## Context

Mocking API modules or client methods is useful for isolated units but cannot
verify that real query hooks, endpoint functions and transport agree on HTTP
contracts. The Fetch migration particularly needs evidence for URL handling,
error payloads, session credentials and multipart requests.

## Decision

Use MSW's Node interceptor for HTTP/query integration tests. The shared server
starts in `src/test/setup.ts` with `onUnhandledRequest: 'error'`, resets handler
overrides after each test and closes after the suite.

Default hierarchy/status/summary handlers use the sanitized SQF fixture.
Individual tests use `server.use(...)` for specific responses and failures.
Tests set `VITE_API_URL=/api` and do not require a live API, credentials or a
browser service worker.

Use jsdom for UI/query tests. Multipart HTTP contract tests select Vitest's
Node environment to keep native File/FormData and Fetch in the same realm.
Use isolated component/canvas/SDK mocks when those, rather than HTTP, are the
unit under test. MSW adoption does not require rewriting every existing mock.

## Consequences

Unhandled requests fail visibly rather than escaping to a real backend.
Integration tests exercise actual Query and endpoint code. Keep Query caches
isolated/cleared between tests and use deterministic fixtures; do not record
raw identities, secrets or business values.

Preserve all-source executable coverage and the 95.01% line threshold.
Coverage and mocked HTTP verify only implemented behavior: they are not
real-authentication, visual rendering, production data or all-BU evidence.

## Alternatives

Only mocking API modules misses wire-contract regressions. Live-backend unit
tests would depend on identity, mutable data and network availability and
could cause unwanted mutations. A browser worker is unnecessary for the
current Vitest setup.

## References

- [MSW server](../../src/test/server.ts)
- [Default handlers](../../src/test/handlers.ts)
- [Lifecycle](../../src/test/setup.ts)
- [Query integration](../../src/features/quick-facts/hooks/sqfQueries.test.tsx)
- [Trend HTTP contracts](../../src/features/trend/api/trend.http.test.ts)
- [Coverage policy](../../vitest.config.ts)
