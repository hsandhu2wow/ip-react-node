# Architecture decision records

These records explain **why** the current implementation uses its major
patterns. They supplement the [technical architecture](../technical-architecture.md)
and [shared assistant guide](../../AGENTS.md); they are not parity certificates
or a list of completed Angular features.

These records were documented retrospectively on November 2, 2026.
Record 0000 captures the existing project direction. Records 0001-0004
describe the implemented modernisation commit `99f2b89` and its integration in
`16e8c6f`, not new backend or deployment proposals.

| Record | Accepted choice |
|---|---|
| [0000: Parity-first frontend migration](0000-parity-first-frontend-migration.md) | Preserve business behavior and Python API contracts; qualify enabled-BU parity separately |
| [0001: SCSS Modules](0001-scss-modules.md) | Sass preprocessing while preserving local scoping and runtime themes |
| [0002: Fetch and TanStack Query](0002-fetch-and-tanstack-query.md) | Separate HTTP transport from server-state management |
| [0003: Feature-based organisation](0003-feature-based-organisation.md) | App composition, feature ownership and shared infrastructure |
| [0004: MSW HTTP integration tests](0004-msw-http-integration-tests.md) | Intercept requests at the HTTP boundary without a live backend |

## Reading the documentation

Use the [documentation hub](../README.md) and
[migration strategy](../migration-strategy.md) for the broader context.
Inspect current source/configuration for implementation facts. Use accepted
decisions for rationale, the architecture document for the detailed map, and
the [migration status](../migration-status.md) /
[Weekly/MyPlan assessment](../weekly-facts-myplan-parity.md) for evidence and gaps.
Dated plans under `docs/superpowers/` can contain superseded paths or deferred
features; do not treat them as current-state specifications.

## Maintaining decisions

For an architectural change, add a numbered record with status, context,
decision, consequences, alternatives and code references. Label proposals as
proposed until approved and implemented. If replacing an accepted choice,
mark its record superseded and link both records; retain its historical
rationale. Update current guides at the same time.

Do not put secrets, raw payloads, machine-specific paths, branch status or
frequently changing coverage counts in these records. Store evidence and
remaining parity work in the appropriate assessment instead.
