# Contributing

Start with the [documentation hub](docs/README.md) and
[development guide](docs/development.md). The project target is Angular parity,
not incidental redesign. This workflow applies to people and AI assistants.

## Before changing code

1. Inspect `git status --short`, the active branch and relevant recent commits.
   Do not assume a checkout or dirty change belongs to this task.
2. Read the feature's source, colocated tests, [architecture](docs/technical-architecture.md)
   and applicable [decision records](docs/decisions/README.md).
3. For migration work, identify the Angular source behavior and compared
   commits. Use the [feature guide](docs/feature-guide.md) and detailed
   assessments as maps, not proof all source paths remain unchanged.
4. Define the expected behavior and smallest useful regression case. Confirm
   ambiguous product/BU behavior rather than choosing a convenient default.

Read any scoped `AGENTS.md` in the affected feature/shared subtree and identify
the relevant [traceability ID](docs/migration-traceability.md). The root guide
continues to apply; scoped files add entry points and local invariants.

Use an appropriate feature branch according to the agreed task. Do not merge,
push, deploy or change another worktree merely because a local change is ready.
Preserve unrelated work; leave `wireframes/` out of commits even if files are
already tracked.

## Implementation conventions

| Area | Convention |
|---|---|
| Ownership | App composes features; feature-specific code stays in the feature; genuinely reused infrastructure lives in shared |
| Dependencies | Shared runtime modules do not import app/features; do not duplicate Weekly/MyPlan selection/rendering |
| Types | Preserve strict TypeScript and real wire types; avoid unnecessary casts or a parallel `any` model |
| Endpoints | Use shared Fetch transport; retain exact casing, trailing slashes, payload serialization and error data |
| Server state | Reuse TanStack Query keys/hooks; avoid a competing component cache |
| Styling | Colocated `.module.scss`; preserve runtime CSS variables, literal global classes and preview/export selectors |
| Accessibility | Preserve keyboard, focus, labels, escape/backdrop behavior and responsive state transitions |
| Errors | Surface new failures explicitly using existing UI/logging patterns; do not copy legacy silent fallbacks into new logic |
| Tests | Focus on behavior introduced/fixed; use MSW for network integration and focused mocks for non-network boundaries |

Prefer the existing implementation pattern unless there is a concrete reason
to change it. Architectural deviations need an ADR and explicit review, not a
large unrelated cleanup. Existing source quirks may be intentional parity
contracts; investigate before "simplifying" them.

## Validation and review

Run the smallest relevant tests during development, followed by full coverage
and build when the change affects application code, dependencies or imports:

```bash
npm test -- --run <relevant-test-paths>
npm run check
git diff --check
```

Keep the 95.01% line threshold and all executable-source coverage scope.
Do not install extra tooling merely to claim an existing check passes.
`npm run lint` has no tracked configuration; the browser parity runner is not
checked in. State what was and was not checked.

For styling/layout, run appropriate browser comparisons or a compiled-style
comparison for a mechanical conversion. For cross-BU claims, use the
[acceptance gates](docs/migration-strategy.md#delivery-roadmap-and-acceptance-gates).
Documentation-only changes do not need application tests unless they alter
executable tooling; run `npm run docs:check` and inspect code references and
consistency instead. `npm run check:code` chains coverage/build;
`npm run check` includes docs checks too. None of these deploy or run lint.

Review the diff for unexpected config changes, raw data, missing source cases,
test-only shortcuts and files that should not be staged. Stage explicit paths,
not an indiscriminate `git add .` in a dirty worktree.

## Pull request / handoff contents

Include purpose, affected feature/contracts, reasoning, source comparison
boundary, validation commands/results and remaining uncertainty. Distinguish:

- Implemented code versus source/BU-qualified behavior.
- Unit/integration assertions versus browser/export/visual evidence.
- Intentional behavior changes versus migration-preserving refactors.

Do not include credentials, employee information, raw business payloads,
decrypted environment files or screenshots revealing real data. Mutating
feedback/recognition/subscription actions require explicit authorization; tests
must use interception rather than real submissions.

## Documentation maintenance

| Change | Update |
|---|---|
| Setup, environment or dependencies | README / development / operations as applicable |
| Component ownership or state flow | Architecture and feature guide |
| Endpoint/body/error contract | API reference and HTTP regressions |
| Accepted architectural choice | Add/supersede an ADR and update the decision index |
| Parity evidence / feature progress | Current summary plus dated detailed assessment |
| Requirement implementation or regressions | Traceability register: retain ID, source boundary and open acceptance gaps |
| Test policy / fixture lifecycle | Testing guide and shared assistant guide |

Keep one authoritative explanation per topic and link to it. Do not rewrite
historical evidence as though it had been verified again, or leave old plans
as the only current setup instructions. Documentation ownership is by topic,
not by a particular assistant or person.
