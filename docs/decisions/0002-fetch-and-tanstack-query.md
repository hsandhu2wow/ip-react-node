# 0002: Use native Fetch beneath TanStack Query

**Status:** Accepted

**Implemented:** October 30, 2026 (`99f2b89`)

**Recorded:** November 2, 2026

## Context

TanStack Query already managed server state while Axios performed HTTP.
These are different responsibilities: Query still needs a request function.
Removing Axios must preserve backend contracts and structured errors consumed
by Weekly/MyPlan, seasonal cards and recognition.

## Decision

Keep existing Query hooks, keys and cache/retry policies. Replace Axios with
the typed native Fetch wrapper in `src/shared/api/client.ts`. Endpoint
functions retain the small `get`/`post` and `{ data }` interface so transport
migration does not require rewriting feature behavior.

The wrapper preserves the configured API prefix, session cookies through
`credentials: 'include'`, a 30-second timeout, caller cancellation,
text/empty responses and browser-generated multipart boundaries. It parses
legacy JSON bodies even without a JSON content type; explicit text remains
text. Malformed JSON successes advertised as JSON reject.

Non-2xx responses reject with `HttpError`, retaining `response.status` and
`response.data`. Network, cancellation and timeout failures propagate.
Transport does not add retries; Query owns query retries.

## Consequences

There is no Axios dependency or Axios-specific error guard. Use the shared
transport for application endpoints instead of duplicating Fetch behavior in
components. Type parameters describe expected wire data, not runtime schema
validation.

Preserve endpoint case and trailing slashes: My Plan page data uses
`/myPlan/...`, subscriptions use `/myplan/...`, and some Flask POST routes
require a trailing slash. Do not manually set a multipart Content-Type header.
Do not convert transport errors into successful empty page data.

## Alternatives

Retaining Axios was viable but kept an unnecessary HTTP dependency for the
used surface. TanStack Query alone cannot send requests. Scattering bare
Fetch calls across components would duplicate credentials, parsing and error
handling and make contract regression more likely.

## References

- [Transport and error types](../../src/shared/api/client.ts)
- [HTTP transport tests](../../src/shared/api/client.test.ts)
- [Trend endpoint contracts](../../src/features/trend/api/trend.ts)
- [Query lifecycle example](../../src/features/trend/hooks/useTrendData.ts)
- [Shared submission tests](../../src/shared/api/forms.http.test.ts)
