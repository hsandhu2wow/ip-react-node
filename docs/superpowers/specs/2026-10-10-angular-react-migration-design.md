# Angular-to-React migration design

Date: 2026-10-10  
Status: Approach and documentation scope approved; implementation not started by this review.

## Goal and baseline

Recreate the Angular Store Insights application in React with one-to-one
user-visible and functional parity. Framework internals may differ; routes,
permissions, data, interactions, copy, responsive presentation and integrations
must not differ without a separately approved exception.

The user selected the latest checked-out **committed Angular source** as the
baseline. Local configuration edits are recorded separately, not incorporated
into the product specification.

| Repository | Baseline |
|---|---|
| Angular: `dsa-buying-insights/store-insights` | `dbd096cd36c457531f7d3ffd6e6b6fa9176d6c02` |
| React: `hsandhu2wow/ip-react-node`, `dev-branch` | `c97525f268befdc68446c7c864a9f2c79b279d5c` |

The comparison window is July 10 through October 10, 2026, inclusive, using
local Git history. This is not a claim about remote branches or production.
React has active uncommitted application changes; findings distinguish the
committed baseline from work in progress.

## Chosen approach

Migrate incrementally by complete feature slices, retaining the existing React
19, TypeScript, Vite, React Router, TanStack Query, Axios and CSS Modules stack.
Keep the Angular application's Python backend and existing deployment/API
contracts. The repository name does not imply a Node backend.

Alternatives considered:

| Approach | Trade-off |
|---|---|
| Incremental parity-first migration, chosen | Reuses implemented slices; requires explicit gap tracking and differential acceptance evidence. |
| Rewrite React from scratch | Discards existing work and repeats contract discovery without guaranteeing better parity. |
| Continue screenshot/wireframe-led implementation | Useful for presentation, but insufficient for permissions, state, analytics and backend actions. |

Angular at the pinned commit is authoritative. Earlier React specs, deferrals
and wireframes remain historical context, not permission to omit Angular
behavior. The source baseline is fixed for each migration slice; subsequent
Angular changes enter a separate delta backlog.

The [comparison report](../../angular-react-parity-analysis.md) records source
evidence, route coverage, contract details and the three-month change ledger.

## Architecture and boundaries

Keep the existing separation:

- `src/api/` owns HTTP endpoint contracts and typed responses.
- `src/context/` owns identity, permissions and shared filter state.
- `src/hooks/` owns query lifecycles and derived card data.
- `src/utils/` owns pure transformations, dates, formatting and sorting.
- `src/components/` owns shared presentation and interactions.
- `src/pages/` owns route-specific composition.

Implement real authentication and feature permissions before exposing gated
routes or actions. Cache identity-sensitive data by the appropriate user,
portal and location scope; invalidate it when identity or permissions change.
Keep reporting dates separate from timestamp timezone conversion.

Period and breakdown switching must preserve the Angular behavior across
summary, details, location changes and navigation. Compare actual query-string
names and restoration semantics rather than assuming React's existing
`period`/`axis` parameters match Angular.

Preserve source bootstrap role/feature flags and CFC restrictions. Normal
identity comes from the existing backend/IAP flow, not frontend-generated
trusted headers. The source's initial non-yesterday query-date redirect and
desktop/mobile period-visibility differences are explicit acceptance cases;
changing them requires approval, even if an alternative seems more intuitive.

Preserve trusted backend HTML and its global CSS contract where required.
Do not flatten rich table cells or tooltips into plain text. Document the trust
boundary and apply the same authorization constraints as the source.

## Migration units

Order work by dependencies, not screenshots:

1. Freeze inventories, response fixtures and browser acceptance scenarios.
2. Complete identity, permissions, route compatibility and shared shell.
3. Close recent Quick Facts period, breakdown, date, cache and analytics gaps.
4. Complete summary/detail card variants, drill-down, sorting and real actions.
5. Complete Weekly Facts/My Plan behavior, mobile views and integrations.
6. Migrate remaining Angular routes and externally hosted feature entry points.
7. Perform cross-feature visual, behavioral and deployment acceptance.

Each unit requires its own bounded implementation work and regression evidence.
The accompanying plan identifies source/target surfaces and exit criteria.
This documentation pass changes no application code.

## Error handling and parity acceptance

Match loading, pending-refresh, failure, empty and permission-denied states.
Malformed responses and failed auxiliary queries must not silently look like a
successful empty page. Preserve backend error/support information and retry
behavior where Angular exposes it.

Compare Angular and React using the same authorized user, portal, location,
reporting date, payload, viewport, browser and timezone. Required evidence:

- Contract fixtures cover the real response variants and failure states.
- Interaction scenarios cover initial load, deep links, refresh, navigation,
  browser history, period/axis changes and action side effects.
- Permission scenarios cover allowed and denied routes, nodes and features.
- Visual comparisons cover source breakpoints, scrolling, overlays, tables,
  chart labels/tooltips and print output.
- Analytics scenarios assert source event names and payloads without duplicates.
- Production-like smoke checks cover session cookies, API dispatch, direct
  route loads, static assets and rollback.

There must be no unexplained visual or behavioral difference in an accepted
scenario. Record unavoidable rendering differences individually rather than
inventing a global screenshot tolerance. Passing existing unit tests is not
proof of Angular parity.

## Documentation ownership

The root README becomes the entry point for setup and truthful current status.
The comparison report records evidence and gaps. This document records the
approved migration strategy; the implementation plan records ordered tasks and
acceptance gates. The Angular-developer tutorial remains educational, with
outdated architecture and response examples corrected.

Older date-stamped specs and plans are not rewritten as if their scope never
changed. Link to this full-parity design when their deferrals conflict with the
current objective.

## Review limitations

This review is based on local source, Git history and existing test inventory.
Neither app was run against a shared authenticated backend, and no screenshot
comparison or production verification was performed. Completion status must
therefore remain "migration in progress", not "one-to-one parity achieved".
