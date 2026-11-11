# Tool-neutral AI collaboration guide

The repository should be understandable without a particular assistant,
conversation history or personal memory service. Humans can use this guide
as a task intake/review checklist too.

## Entry points

- [AGENTS.md](../AGENTS.md) is the shared project guide.
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) points
  Copilot to that guide.
- [CLAUDE.md](../CLAUDE.md) imports the shared guide for Claude.
- Any other tool can be explicitly given `AGENTS.md` and the
  [documentation hub](README.md). File discovery/loading varies by tool:
  a Markdown link is not proof its contents were loaded.

Read the relevant scoped guide as well as root instructions:
[Quick Facts](../src/features/quick-facts/AGENTS.md),
[Weekly/MyPlan](../src/features/trend/AGENTS.md),
[shared](../src/shared/AGENTS.md). Each adds only local context and inherits
the root rules; automatic discovery is tool-dependent.

No repo hooks, permission grants, MCP server, automatic memory upload or
custom agent fleet is required. Do not copy all documentation into each tool's
instruction file; use one shared source and task-relevant references.

## Context to establish before acting

| Question | Evidence |
|---|---|
| Which code is in scope? | Current branch/HEAD, dirty files and worktree; not earlier chat assumptions |
| What is the objective? | [Migration strategy](migration-strategy.md); exact Angular parity unless explicitly changed |
| What is implemented? | Current source, [architecture](technical-architecture.md) and [feature guide](feature-guide.md) |
| Why is it designed this way? | [Accepted decisions](decisions/README.md) |
| What contract must survive? | Relevant source assessment, wire types, endpoint functions and tests |
| Which requirement/evidence is affected? | [Traceability register](migration-traceability.md), retaining existing WF gap IDs |
| How is it checked? | [Testing guide](testing.md), existing cases and configuration |
| What is unavailable? | Authorized source/BU identity, browser evidence, actual Google access or release approval |

Inspect only the source and context needed for the task. Avoid large blind
reads of encrypted config, fixture dumps or unrelated subsystems.

## Example task brief

Use synthetic identifiers and fill in the actual task; this is a communication
template, not an executable command:

```text
Objective: preserve Angular behavior while fixing <specific case>.
Repository boundary: <branch and compared commit>.
Relevant code: <page/helper/API and test paths>.
Source evidence: <Angular baseline and behavior reference, if available>.
Must preserve: <payload, state, responsive or theme contracts>.
Acceptance: <focused behavior assertions and required browser checks>.
Not authorized: <live mutations, deployment, push/merge unless requested>.
Known gap: <missing BU/source/runtime evidence>.
```

Do not claim access to an Angular checkout just because a historical document
names one. Ask for the missing authorized input when parity cannot be resolved.

## Change and handoff discipline

Follow [CONTRIBUTING.md](../CONTRIBUTING.md). Use source-backed reasoning,
focused changes and appropriate tests; do not redesign features or lower
coverage to make a migration appear complete. Preserve unrelated work and
wireframes. Never post raw identity/configuration/business data to external
services or into prompts/fixtures.

Use `npm run docs:check` for documentation changes, `npm run check:code` for
integrated code validation or `npm run check` for both. These do not run
lint, browser/BU acceptance or deployments. Record the relevant register ID
and update evidence, not just a task checkbox.

At handoff, state what changed, why, which behavior was preserved, checks
actually run and remaining uncertainty. Clearly state whether work is local,
committed, pushed or merged if publication is relevant. Do not claim browser/
BU qualification from unit coverage or synthetic fixtures.

## Persistent context maintenance

| Information | Place |
|---|---|
| Stable contributor rule / code ownership | `AGENTS.md` and contributor guide |
| Design rationale / trade-off | New or superseding ADR |
| Current architecture / API / feature behavior | Relevant handbook guide |
| Dated parity evidence or unresolved source gap | Migration assessment |
| Requirement-to-code/test mapping | Migration traceability register |
| Temporary task progress / session notes | Session workspace or task tracking, not shared instructions |
| Personal tool preference | User's own settings, not repository policy |

Update the shared reference instead of creating contradictory tool-specific
copies. If implementation and documented decisions disagree, report it and
resolve deliberately. Never treat an old plan, generated summary or assistant
memory as stronger evidence than the current source and approved product scope.
