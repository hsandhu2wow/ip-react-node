# 0003: Organise by application, feature and shared responsibility

**Status:** Accepted

**Implemented:** October 30, 2026 (`99f2b89`)

**Recorded:** November 2, 2026

## Context

The earlier technical-layer layout spread feature changes across top-level
API, hook, page, type and component folders. Quick Facts and Weekly/MyPlan
have distinct domain logic but share filtering, presentation and integrations.
Reorganisation must preserve routes, behavior and existing regression tests.

## Decision

Use these ownership boundaries:

| Directory | Owner |
|---|---|
| `src/app/` | Routes, shell/navigation/filter composition and theme bootstrap |
| `src/features/quick-facts/` | Summary/details cards, endpoints, hooks and transforms |
| `src/features/trend/` | Weekly Facts and My Plan, including shared selection, tables, dialogs and API/types |
| `src/shared/` | Cross-feature transport, contexts, UI, types and utilities |
| `src/test/` | Test setup, fixtures and MSW infrastructure |

Keep tests and scoped styles colocated with the implementation. Application
composition may depend on features/shared; features may depend on shared.
Shared runtime code must not depend on app/features. Keep the two trend pages
on the same implementation rather than creating duplicate Weekly/MyPlan code.

## Consequences

Moving a file includes updating imports, dynamic imports, test mocks and
documentation references. A file belongs in shared only when its responsibility
is genuinely cross-feature; do not extract generic frameworks preemptively.
Some shared wire types retain SQF names because filters and export workflows
also use them.

Module moves do not change public browser URLs: Weekly and My Plan remain
under `/quick-facts/weekly` and `/quick-facts/myplan`. Historical plans still
contain old layer-based source paths; inspect current source before editing.

## Alternatives

Keeping technical-layer folders would minimise move churn but continue
scattering feature ownership. Separate Weekly and MyPlan features would
duplicate their shared renderer and selection contract. A new packaging or
alias framework was not needed for this reorganisation.

## References

- [Route composition](../../src/app/App.tsx)
- [Trend page](../../src/features/trend/pages/TrendPage.tsx)
- [Quick Facts page](../../src/features/quick-facts/pages/SummaryPage.tsx)
- [Shared recognition endpoint](../../src/shared/api/recognition.ts)
- [Detailed directory map](../technical-architecture.md#runtime-boundaries)
