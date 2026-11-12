# Migration strategy, rationale and benefits

## Purpose and scope

The agreed objective is to recreate Angular Store Insights in React with the
same user-visible functionality and appearance for every enabled BU.
The [historical source baseline](../README.md#reviewed-checkouts) provides
comparison evidence; it must be refreshed when newer Angular changes are in
scope. A rewritten component is not complete until its source behavior is
accounted for and appropriately qualified.

The current scope is **frontend replacement while retaining Python APIs**.
No FastAPI rewrite, Cloud Run move, database migration, identity replacement
or infrastructure-as-code choice is implemented or approved by these docs.
Such changes require separate decisions and release plans.

## Why migrate?

The product direction to use React is established by the project brief.
The following are engineering reasons for the chosen implementation, not a
claim that Angular is obsolete, insecure or inherently slower:

| Intended benefit | Mechanism in this repository | How to evaluate it |
|---|---|---|
| Easier feature ownership | App/feature/shared boundaries and colocated code/tests/styles | Review feature changes for cross-folder churn and unintended dependencies |
| More reusable UI and logic | Shared dialogs/export/filter infrastructure; one Weekly/MyPlan renderer and pure selectors | Check duplication, regression reuse and cost of source-equivalent changes |
| Explicit server-state management | TanStack Query keys, readiness gates, caching and retry policies | Test cache reuse, filter refetching, errors and stale-response behavior |
| Fewer HTTP-specific dependencies | Native Fetch behind a shared typed transport | Verify package removal and preserved HTTP contracts; monitor build/bundle evidence separately |
| Maintainable scoped styling | SCSS Modules with local scoping and optional Sass reuse | Review selector specificity, theme compatibility and visual comparisons |
| More reliable offline regression checks | Vitest/RTL, MSW and sanitized fixtures | Check determinism, unexpected-request failures and meaningful bug-catching cases |
| Safer incremental delivery | Reuse backend contracts and qualify feature slices rather than replacing every layer | Track accepted parity cases, unresolved BU gaps and rollback readiness |
| Faster onboarding and clearer decisions | One handbook, shared AI guide and ADRs with source references | Have new contributors trace a feature and explain its constraints without chat history |

These are **expected benefits**, not measured productivity, cost, performance
or accessibility improvements. No before/after study establishes those
outcomes yet. The code review and test evidence support specific implementation
properties, not a blanket return-on-investment claim.

## Why preserve behavior before redesigning?

Business rules are encoded not only in components but also in permissions,
API payloads, HTML/classes, fiscal labels, column IDs, links, event envelopes
and BU-specific settings. Changing these while changing frameworks makes
regressions harder to distinguish from intentional product changes.

Retaining contracts isolates the frontend migration and reduces simultaneous
change. It does not remove backend, identity or deployment risk. Source quirks
are recorded and preserved until a separately approved product decision changes
them. Wireframes are not the source of truth for parity.

## Adopted decisions

| Choice | Reasoning and boundary |
|---|---|
| [Parity-first frontend migration](decisions/0000-parity-first-frontend-migration.md) | Limit migration scope; keep API ownership and separate implementation from acceptance |
| [SCSS Modules](decisions/0001-scss-modules.md) | Add Sass without replacing scoped styling or runtime themes |
| [Fetch + TanStack Query](decisions/0002-fetch-and-tanstack-query.md) | Separate HTTP concerns from server-state concerns |
| [Feature folders](decisions/0003-feature-based-organisation.md) | Keep related code together; avoid shared-to-feature dependencies |
| [MSW integration tests](decisions/0004-msw-http-integration-tests.md) | Exercise real query/API/transport boundaries without live mutations |

The React direction is the project requirement. A new component or external
library should still be justified by an actual need; migration is not permission
to introduce a parallel framework or generic abstraction layer.

## Costs and risks

| Risk / cost | Mitigation or acceptance requirement |
|---|---|
| Two implementations evolve during migration | Record compared Angular/React commits and review intervening source changes |
| Similar UI hides permission/BU differences | Build an authorized identity/settings/hierarchy/theme matrix |
| Rewritten behavior differs in edge cases | Source-derived tests for error, empty, date/history, mobile and navigation paths |
| New component/state patterns require learning | Use the handbook, Angular-to-React tutorial and concrete existing examples |
| High coverage creates false confidence | Require paired browser/integration evidence separately |
| Exports and hosted fonts/themes differ at runtime | Validate actual browser capture, print/PDF/Slides and approved external assets |
| Demo auth and default config appear production-ready | Keep blockers explicit; do not use portal flags as authorization |
| Build/deployment changes affect shared services | Review dispatch/KMS changes separately with staging and rollback approval |

React does not automatically improve security, speed or accessibility.
Evaluate those concerns at their real boundaries. The current known large
bundle warning, trusted backend-HTML surfaces and missing real identity remain
visible limitations rather than problems solved by a framework switch.

## Delivery roadmap and acceptance gates

This is the current high-level sequence, not a replacement for detailed source
references in the [Weekly/MyPlan assessment](weekly-facts-myplan-parity.md).
Historical task checkboxes must be reconciled with current code before work.

| Stage | Current position | Exit evidence |
|---|---|---|
| 1. Baseline and engineering foundation | Source assessments, feature boundaries, Fetch/SCSS/MSW and regression suites exist | Agreed source commits, reproducible setup and stable validation policy |
| 2. Identity and enabled-BU definition | Demo auth remains; one historical authorized SI profile is insufficient | Approved bootstrap/roles/settings behavior, permitted hierarchy, account/cache isolation and BU owners |
| 3. Complete feature contracts | Quick Facts and trend surfaces implemented, with layout/edge/integration gaps | Traceable source cases for views, filters, errors, lifecycle, actions and themes |
| 4. Qualify per-BU behavior and visuals | Source-derived tests and limited synthetic browser evidence exist | Paired Angular/React scenarios using authorized configurations and accepted differences |
| 5. Release rehearsal and controlled rollout | App Engine deployment config exists; KMS workaround and integration checks remain | Staging deep-link/session/assets/export checks, sign-off, rollback rehearsal and approved rollout |

Work on source-derived UI cases can continue while identity evidence is being
gathered, but cannot bypass identity/BU or release gates.

For each enabled BU, capture an access-controlled acceptance matrix with
portal/configuration, role, permitted hierarchy level, enabled pages/views,
desktop/mobile viewport, error/empty states, actions and accepted evidence.
Public fixtures must be sanitized and must not contain actual identities.

## Definition of migration completion

1. All agreed Angular behaviors and enabled-BU variants are mapped to React
   cases, with intentional deviations explicitly approved.
2. Regression tests and build checks pass under unchanged coverage policy.
3. Authorized identity/permission behavior, API failures and cache transitions
   are verified, not inferred from a demo user.
4. Paired desktop/mobile browser checks cover layout, keyboard/focus behavior,
   charts/tables, themes, links, analytics and export/action workflows.
5. Operational checks cover configuration, session/deep links, static/API
   routing, deployment monitoring and rollback.
6. Remaining exclusions and approvals are documented with owners; the team
   does not substitute a high test count for missing acceptance.

No all-BU completion claim is made by this handbook.
