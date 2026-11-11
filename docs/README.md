# Documentation hub

This handbook is for developers, reviewers, maintainers, product stakeholders
and any AI assistant working on Store Insights. It explains what exists,
why it was designed this way, how to change it and what is not yet verified.

**Current implementation review:** November 2, 2026, code `16e8c6f`.
This documentation refresh does not include a new Angular or live-BU review.

## Reading paths

| Goal | Reading order |
|---|---|
| Understand the project | [Migration strategy](migration-strategy.md), [architecture](technical-architecture.md), [feature guide](feature-guide.md) |
| Make a first change | [Development](development.md), [contributing](../CONTRIBUTING.md), [testing](testing.md) |
| Investigate data | [Architecture](technical-architecture.md), [API reference](api-reference.md), feature's endpoint/hook/tests |
| Work on Weekly Facts/My Plan | [Feature guide](feature-guide.md#weekly-facts-and-my-plan), [focused assessment](weekly-facts-myplan-parity.md), dated detailed plan linked there |
| Find migration evidence / next case | [Traceability register](migration-traceability.md): source references, code, tests and remaining acceptance |
| Review or release | [Decisions](decisions/README.md), [testing](testing.md), [operations](operations.md), [acceptance gates](migration-strategy.md#delivery-roadmap-and-acceptance-gates) |
| Use an AI tool | [AGENTS.md](../AGENTS.md), [AI collaboration](ai-guide.md), then the relevant feature documents |
| Learn React coming from Angular | [Angular-to-React tutorial](react-tutorial-for-angular-devs.md), checked against current code |

## Document ownership and authority

| Document | What belongs here |
|---|---|
| [Root README](../README.md) | Project summary, setup entry points and current status summary |
| [Migration strategy](migration-strategy.md) | Motivation, intended benefits, trade-offs, scope and delivery gates |
| [Technical architecture](technical-architecture.md) | Current runtime composition, state ownership and boundaries |
| [Feature guide](feature-guide.md) | Current feature contracts, code map and verification gaps |
| [Traceability register](migration-traceability.md) | Stable requirement IDs mapped to source, implementation, regressions and qualification gaps |
| [API reference](api-reference.md) | Frontend-used endpoints, payload conventions and error behavior |
| [Development](development.md) | Local setup, configuration and debugging |
| [Testing](testing.md) | Test layers, mocks, coverage and browser acceptance |
| [Operations](operations.md) | Current build/deployment path and release/rollback prerequisites |
| [Contributing](../CONTRIBUTING.md) | Change/review workflow and documentation maintenance |
| [Decision records](decisions/README.md) | Adopted choices, alternatives, benefits and consequences |
| [Migration status](migration-status.md) | Dated broader Angular source/history assessment and integration evidence |
| [Weekly/MyPlan assessment](weekly-facts-myplan-parity.md) | Detailed source evidence, quirks, BU inventory and dated progress |
| [OLD/NEW architecture and WIQ business case](architecture/README.md) | Presentation, PDF and diagrams: Angular/Flask/App Engine versus the proposed React/FastAPI/Cloud Run target; IaC tool undecided |
| `docs/superpowers/` | Historical specs/plans; not a completion ledger |

For an implementation question, verify current source and configuration.
For intended parity, use the agreed Angular baseline plus authorized product/BU
evidence. Decisions describe approved choices, not proof every feature meets
them. If these conflict, identify the mismatch and seek the appropriate
decision; do not silently prefer an old example.

Current guides supersede earlier present-tense statements such as "no mobile
UI" or "no analytics adapter" in dated assessments. Do not delete the historical
evidence or treat a newer implementation as automatically qualified.

## Evidence vocabulary

| Label | Meaning |
|---|---|
| Implemented | Wired in this repository's current code |
| Unit/integration verified | Automated assertions cover particular implemented behavior |
| Synthetic browser checked | Intercepted fixture scenarios ran in a browser; not live-data or pixel acceptance |
| BU-qualified | Authorized identity, permitted hierarchy, configuration/theme and paired behavior/visual evidence accepted for that BU |
| Planned / proposed | Not implemented or not approved; must not be presented as current architecture |

High coverage is not parity certification. The repository has no established
all-BU qualification; the focused assessment records the limits of the single
local SI profile and later synthetic browser work.

## Glossary

| Term | Meaning in this repository |
|---|---|
| BU / portal | Business-unit/deployment context; identity, settings and theme determine actual enablement |
| SQF / QF | Quick Facts API/source naming, including Daily branding for SI/METRO |
| WF / trend | Weekly Facts and My Plan feature; not all top-level routes named Trend |
| WTD / YDAY / ETD | Week-to-date / yesterday / event-to-date reporting periods |
| CFC | Source fulfilment-centre classification used in card availability |
| WFM | Workforce-management-specific source behavior; `360FM` is a relevant portal branch |
| KPI | Key performance indicator; table grouping/filter tags are wire contracts |
| ETA | Expected data availability used in refresh/cutoff messaging |
| ADR | Architecture decision record: context, accepted choice and consequences |
| MSW | Mock Service Worker; tests here use its Node HTTP interceptor |

When adding documentation, link it from this hub, cite its code/evidence
boundary and avoid duplicating volatile task status across guides.
