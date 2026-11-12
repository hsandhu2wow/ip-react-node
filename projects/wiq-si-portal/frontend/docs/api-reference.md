# Frontend API reference

This inventories **requests made by the current React code**, not the complete
Python service API or an OpenAPI specification. Check endpoint functions and
authorized backend source before extending a contract.

All paths below are relative to `VITE_API_URL` (normally `/api`). They are
case-sensitive. The shared [Fetch client](../src/shared/api/client.ts) adds the
base prefix and resolves against the browser origin.

## Transport contract

| Concern | Current behavior |
|---|---|
| Methods | Typed `get<T>(path, options?)` and `post<T>(path, body?, options?)` |
| Envelope | Transport returns `{ data: T }`; feature wrappers usually unwrap it |
| Credentials | `include`; backend session and CORS policy still determine access |
| Timeout | 30 seconds; request timer cleared on completion/failure |
| Cancellation | Optional caller `AbortSignal`; hooks do not universally forward Query's signal |
| Body | Browser BodyInit, notably FormData; no automatic object-to-JSON body serialization |
| Decode | Explicit `responseType: 'text'` stays text; otherwise attempt JSON parsing, retaining empty/plain text |
| Malformed JSON | JSON-advertised successful response rejects; non-2xx keeps status and available body |
| HTTP failure | Throws `HttpError({ status, data }, url)`; `isHttpError` is the guard |
| Network / abort / timeout | Rejects; not converted into an HTTP-success envelope |
| Retries | No transport retries; Query defaults are configured separately |

Do not manually set multipart Content-Type: the browser must supply the
boundary. Generic response types are compile-time expectations, not input or
response validation. There is no default `/api` prefix in client code.

## Quick Facts endpoints

Owner: [sqf.ts](../src/features/quick-facts/api/sqf.ts), except where noted.

| Method / path | Function | Response / use |
|---|---|---|
| GET `/sqf/getUniversalFilterGeneric` | `getUniversalFilter` | Hierarchy wire nodes, processed by FilterContext |
| GET `/sqf/getNearbyStores/<lat>/<lng>` | `getNearbyStores` | Nearby hierarchy nodes for location selection |
| GET `/sqf/getSQFMetricCardsStatus` | `getSQFCardStatus` | Per-card config: order, details levels and feature flags |
| GET `/sqf/summaryCards/<depth>/<date>[/code]` | `getSummaryCards` | Generic cards, mapped before rendering |
| GET `/sqf/detailCard/<metric>/<depth>/<date>[/code]` | `getDetailCard` | Detail cards for selected metric/location/date |
| GET `/sqf/getDataLoadETA` | `getDataLoadETA` | Data-availability timestamps for cutoff messaging |
| GET `/supportEmail/<SQF-or-BQF>` | `getSupportEmail` | Text response; current hook requests SQF |
| GET `/sqf/getCFCChildCodes` | `getCFCChildCodes` | Extracts `cfc_codes` from response |
| GET `/sqf/seasonalMetric/<depth>/<date>[/code]` | `getSeasonalMetric` | Seasonal raw summary; owner is seasonal.ts |
| GET `/sqf/seasonalMetricDetails/<depth>/<date>[/code]` | `getSeasonalMetric` with details flag | Seasonal raw details |
| GET `/sqf/storeProfileDetails/<code>` | `getStoreProfileCard` | Profile/address model; owner is storeProfile.ts |
| GET `/sqf/storeProfileRoleDetails/<code>` | `getStoreProfileRoleNames` | Profile role names |

Summary/details include depth and code only when both are truthy; otherwise
the wrapper requests national depth zero without a code. Seasonal omits the
code at depth zero. Inspect actual path construction rather than inventing
a new URL convention. Selected dates are date-only strings, not UTC timestamps
to round-trip through timezone conversion.

Generic mapping preserves supported arrays/period wrappers, adds
`apiType: 'generic'`, derives `tableOnly`, and assigns `jsId` to non-error cards
in wire order. Period projection accepts WTD/YDAY shapes via the period
normalizer. Keep the mapper and normalizer contracts distinct: passing an
arbitrary wrapper through one does not mean every downstream layer supports it.

Seasonal payloads are mapped into legacy/common card models in
[seasonal.ts](../src/features/quick-facts/api/seasonal.ts). Do not apply generic
card transformation rules to raw seasonal fields without checking that adapter.

## Weekly Facts and My Plan

Owner: [trend.ts](../src/features/trend/api/trend.ts).

| Method / path | Function | Contract |
|---|---|---|
| GET `/wf/<code>` | `getWeeklyFacts` | `WfPageData` for Weekly |
| GET `/myPlan/<code>` | `getMyPlan` | `WfPageData`; preserve uppercase P |
| GET `/wf/userSubscriptions` | `getUserSubscriptions('wf')` | Saved locations/views |
| GET `/myplan/userSubscriptions` | `getUserSubscriptions('myplan')` | Lowercase subscription prefix |
| POST `/wf/updateUserSubscriptions` | `updateUserSubscriptions('wf', ...)` | Multipart preference update |
| POST `/myplan/updateUserSubscriptions` | `updateUserSubscriptions('myplan', ...)` | Multipart preference update |

`getTrendSubscriptions` / `updateTrendSubscriptions` map metric `weekly` to
`wf` and `myPlan` to `myplan`; they delegate to the key-based functions.

Preference bodies contain **JSON strings inside FormData**:

```text
locations       = ["fixture-store"]
selected_views  = ["week_overview"]
```

Empty arrays represent clearing selections. `available_views` is an array of
card keys; the UI joins those keys to page-card labels in page order.
The subscription dialog's save/no-op rules are separate from transport
serialization; see the [feature guide](feature-guide.md).

Trend responses can provide object or array `cardContents`, history keys,
hierarchy, KPI/variance settings, HTML, alerts, banners and AI content.
The shared [wire types](../src/features/trend/types/wf.types.ts) and source
assessment are the shape reference, not a single response fixture.

## Shared forms and user endpoints

| Method / path | Owner / function | Body or behavior |
|---|---|---|
| GET `/feedbackIssuesType/<pageSection>` | [feedback.ts](../src/shared/api/feedback.ts): `getFeedbackIssueTypes` | Issue-type choices |
| POST `/feedbackPopup/` | feedback.ts: `submitFeedback` | FormData with files and feedback metadata |
| GET `/triggerNPSSurvey/` | [nps.ts](../src/shared/api/nps.ts): `getNPSSurveyFlag` | Survey enablement/rating metadata |
| POST `/npsSurvey/` | nps.ts: `submitNPSSurvey` | FormData campaign, URL and optional answers |
| POST `/sqf/recognize` | [recognition.ts](../src/shared/api/recognition.ts): `submitRecognize` | FormData prepared by recognition helpers |
| GET `/users/userSearch/<name>` | [users.ts](../src/shared/api/users.ts): `searchUsers` | Employee search model |
| GET `/getUserdetails` | users.ts: `getUserDetails` | Module-cached user metadata for analytics |
| POST `/uploadImageForSlide` | [gcpSlides.ts](../src/shared/utils/gcpSlides.ts) | Image FormData; returns upload status/URL |
| POST `/deleteImageForSlide` | gcpSlides.ts | FormData URL for temporary-image cleanup |

Feedback appends `image0`, `image1`, etc., `reason`, stringified `feedback`,
`contactMe`, `requestOrigin`, `issueType`, `url` and applicable optional IDs.
An unset feedback value is stringified to `"undefined"` to match source.
Preserve the exact trailing slashes on feedback/NPS endpoints: removing them
can introduce Flask redirects and cross-origin problems.

Recognition builds its attachment/recipient/manager fields in
[recognize.ts](../src/shared/components/RecognizeDialog/recognize.ts).
An HTTP rejection with body status `NoQfAccess` participates in its confirmation
flow; a generic Error with no payload is not equivalent.

Analytics pushes a dataLayer event via
[analytics.ts](../src/shared/utils/analytics.ts); it is not an extra analytics
POST in this wrapper inventory. Actual GTM/Google delivery is external.

## Error behavior and existing exceptions

Transport errors propagate by default, but the current application has
source-derived adapter/UI exceptions:

| Boundary | Existing behavior |
|---|---|
| Seasonal API adapter | Maps error data into card error/hidden models |
| Store profile wrapper | Catches request/mapping failures and returns `{ error: true }` |
| User search | Resolves failures to an empty list |
| Analytics user details | Resolves failures to `{}` and clears its cached promise so a later call can retry |
| Subscription initial read | Dialog suppresses the rejection and remains without loaded preferences |
| Subscription save / form flows | Use existing notifications or confirmation behavior |

These are known behaviors to assess against Angular, **not templates for
silently swallowing new failures**. Do not broadly replace all errors with
empty data or alter source-preserving exceptions as incidental cleanup.

Use [MSW HTTP tests](testing.md#http-integration-with-msw) for contract changes.
Do not submit real feedback, recognition, subscriptions or Google image uploads
to discover a payload shape.
