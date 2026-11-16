# 0000: Migrate the frontend with Angular parity as the acceptance target

**Status:** Accepted project direction

**Recorded:** November 2, 2026, from the existing migration brief and assessments

## Context

Store Insights is being recreated from Angular in React. Business behavior
depends on APIs, hierarchy/permissions, fiscal views, BU settings/themes,
analytics and external workflows as well as component layout.

The source assessments and existing implementation do not establish parity
for every enabled BU. A framework rewrite alone cannot demonstrate that.

## Decision

Treat one-to-one functional and visual parity as the acceptance target.
Implement React feature slices while retaining existing Python API ownership
and wire contracts. Compare against an explicitly recorded Angular baseline
and refresh evidence when newer source changes are in scope.

Separate source-derived implementation, automated regression evidence,
synthetic browser checks and authorized BU qualification. Preserve source
quirks until an explicit product decision changes them. Do not include an
unapproved backend, database or deployment-platform rewrite in this frontend
migration.

## Consequences and expected benefits

Preserving behavior limits simultaneous changes and makes regressions easier
to attribute. Incremental feature ownership and reusable React logic support
maintainability, while keeping Python contracts avoids a coupled backend
replacement.

The costs are ongoing Angular/React drift review, learning/testing effort and
the need for real identity/theme/BU evidence. Performance, productivity,
cost and accessibility benefits must be measured; they are not established
by choosing React or attaining high line coverage.

## Alternatives

A simultaneous redesign/backend/platform rewrite would broaden scope and
obscure parity failures. A desktop-only approximation or accepting unit coverage
as completion would not satisfy the agreed project target. Staying on Angular
would avoid rewrite cost but is outside the established React project direction;
these docs do not assert that Angular is technically unsuitable.

## References

- [Project objective and reviewed baseline](../../README.md)
- [Benefits, risks and acceptance gates](../migration-strategy.md)
- [Source/history assessment](../migration-status.md)
- [Weekly/MyPlan assessment](../weekly-facts-myplan-parity.md)
