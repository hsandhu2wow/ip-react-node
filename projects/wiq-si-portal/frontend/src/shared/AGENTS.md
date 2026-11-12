# Shared infrastructure contributor context

Follow the [root guide](../../AGENTS.md). Shared runtime modules serve multiple
features and must not import `app` or `features`. Do not put feature-specific
selection/rendering here just to make imports shorter.

## Trace a change

| Concern | Read first |
|---|---|
| HTTP transport and structured errors | `api/client.ts`, `api/client.test.ts` |
| Shared form serialization | `api/feedback.ts`, `api/nps.ts`, `api/recognition.ts`, `api/forms.http.test.ts` |
| URL-backed selection/hierarchy | `context/FilterContext.tsx`, `context/FilterContext.test.tsx` |
| Preview/capture/export | `components/PreviewDialog/`, `utils/cardsCapture.ts`, `utils/pdf.ts`, `utils/gcpSlides.ts` |
| Analytics and user metadata | `utils/analytics.ts`, `api/users.ts` |

Read [API contracts](../../docs/api-reference.md),
[architecture](../../docs/technical-architecture.md) and
[shared evidence](../../docs/migration-traceability.md#quick-facts-and-shared-foundation)
before changing a cross-feature contract.

## Invariants

- Fetch preserves credentials, timeout/cancellation, multipart boundaries,
  text/empty responses and structured non-2xx data. Query owns retry/cache.
- Preserve endpoint casing and required trailing slashes. Existing adapter
  error fallbacks are documented exceptions, not a standard for new code.
- Filter values follow current search parameters; setters preserve unrelated
  parameters. Defaults are derived, not automatically written to the URL.
- Preserve stable capture IDs/classes, cancellation and object-URL cleanup.
  PDF/Slides mocks cannot establish actual artifacts or OAuth access.
- Demo auth and analytics user metadata are not interchangeable. Do not infer
  real authorization from portal flags or a successful metadata request.
- Use synthetic/sanitized data and intercepted writes. Do not run forms or
  upload/cleanup endpoints against a live service merely to validate code.

## Focused checks

```bash
npm test -- --run src/shared/api/client.test.ts src/shared/api/forms.http.test.ts src/shared/context/FilterContext.test.tsx
npm test -- --run src/shared/utils/cardsCapture.test.ts src/shared/utils/pdf.test.ts src/shared/utils/gcpSlides.test.ts src/shared/components/PreviewDialog/PreviewDialog.test.tsx
```

Use MSW for HTTP integration. Multipart tests need Node-native File/FormData
and Fetch; do not mix jsdom file constructors into that boundary.
Finish code changes with `npm run check:code`, including both consuming features.
