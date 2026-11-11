# Copilot instructions

## Project
Frontend-only React migration of the Angular **Store Insights** app (`dsa-buying-insights/store-insights`). Goal is one-to-one functional/visual parity, not redesign. Despite the repo name there is **no Node backend**; it reuses existing Python APIs under `/api`. See `README.md` and `docs/migration-status.md` (parity gap matrix) before claiming a feature is complete.

## Stack
React 19, TypeScript 6, Vite 8, React Router 7, TanStack Query 5, native Fetch (no Axios), Chart.js 4, SCSS Modules (Dart Sass). Tests: Vitest + jsdom + React Testing Library + MSW.

## Commands
- `npm ci` – install (Node 22.13+)
- `npm run dev` – Vite; `/api` is proxied to `http://127.0.0.1:8080`
- `npm run build` – `scripts/prebuild.mjs` (rewrites the git-ignored `.env.production.local` from `env-config.json` or defaults), then `tsc -b && vite build`
- `npx tsc -b` – type-check only; Vitest does not type-check and Cloud Build runs `npm run build`, so type errors break deployment
- `npm test -- --run [files]` – Vitest once; pass paths for focused runs
- `npm run test:coverage` – enforces **95.01% global line coverage**
- `npm run lint` – declared, but no ESLint config is tracked; don't rely on it

## Layout
- `src/app` – app composition: `App.tsx`, layout (AppShell, FilterBar, SideNav…), theme config, coming-soon pages
- `src/features/<feature>` – `api/`, `components/`, `hooks/`, `pages/`, `utils/` (features: `quick-facts`, `trend` = Weekly/MyPlan)
- `src/shared` – API client, shared components/context/types/utils
- `src/test` – `setup.ts`, MSW `server.ts`/`handlers.ts`, fixtures

## Conventions
- Quick Facts and layout components live in a folder named after them; Trend components are flat files in `features/trend/components`. Tests (`*.test.ts(x)`) and SCSS Modules (`*.module.scss`) sit beside the source file; hooks are `useX.ts`.
- API access goes through `src/shared/api/client.ts` (`createHttpClient`, `HttpError`, `isHttpError`) wrapped by TanStack Query hooks. Base URL is `VITE_API_URL`.
- Never put secrets in `VITE_*` variables (exposed to the browser). Don't commit env files or copy secrets.
- Backend HTML (cell values, headers, rich text) is injected with `dangerouslySetInnerHTML` and styled by the global classes in `src/styles/globals.css`. Only `TrendBanner.tsx` sanitizes with DOMPurify; sanitize any HTML that doesn't come from those trusted API payloads.
- Keep global backend-HTML CSS and BU theme assets unchanged; scoped styles use SCSS Modules.

## Testing
- Add tests with every change; MSW intercepts HTTP and unexpected requests fail. Use `server.use(...)` for error/alternate responses; handlers reset automatically.
- Use the sanitized fixture `src/test/fixtures/sqf-api.sanitized.json`; keep data synthetic.
- Mock canvas/SDK boundaries only where a network interceptor isn't the relevant boundary.
- Passing tests do not prove Angular parity or all-BU behavior; don't claim it.

## Boundaries
- Keep changes scoped to the feature plus its tests/docs; update relevant docs under `docs/`.
- Wireframes are not the source spec; avoid indiscriminate `git add` (some are tracked).
- Deployment (`cloudbuild.yaml`, `app.yaml`, `dispatch.yaml`), IAP/session behavior and shared dispatch changes need staging/release approval.
- Auth is a demo stub (`src/shared/context/AuthContext.tsx`, `VITE_PORTAL`, default `SI`).
