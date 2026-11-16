# 0001: Use SCSS Modules without changing runtime styling

**Status:** Accepted

**Implemented:** October 30, 2026 (`99f2b89`)

**Recorded:** November 2, 2026

## Context

The Angular-to-React migration requires visual parity, including BU themes,
backend HTML and export previews. The React app previously used CSS Modules.
The styling review requested Sass support without redesigning existing UI.

## Decision

Use `.module.scss` for scoped component styles and Dart Sass through Vite.
SCSS Modules retain CSS Modules' local scoping; they add preprocessing rather
than replacing the styling model.

The initial conversion preserves selectors and declarations. Keep
`src/styles/globals.css`, literal backend-HTML classes, `:global(...)` selectors
and external BU theme assets separate from scoped component layout. Preserve
runtime CSS custom properties rather than replacing them with build-time Sass
variables.

## Consequences

Components can use Sass when it improves maintainability, but nesting or mixin
extraction is a separate change requiring specificity/order review. Generated
module identifiers can change after file renames; raw class hashes are not
stable application contracts. Preview selectors and literal global classes
are contracts and must remain usable.

The conversion compared compiled CSS structure while normalising generated
identifiers. Future styling changes require appropriate visual checks;
TypeScript/unit coverage cannot certify CSS or all-BU appearance.

## Alternatives

Keeping plain CSS Modules would avoid a compiler dependency but not satisfy
the agreed Sass direction. Global SCSS or CSS-in-JS would change scoping and
runtime assumptions without helping the parity migration.

## References

- [Dependencies](../../package.json): `sass`
- [Scoped card example](../../src/features/quick-facts/components/SummaryCard/SummaryCard.module.scss)
- [Global styles](../../src/styles/globals.css)
- [Runtime theme assets](../../src/app/config/theme.ts)
