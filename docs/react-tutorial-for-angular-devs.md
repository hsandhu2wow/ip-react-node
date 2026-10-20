# React App Tutorial — For Angular Developers

> This tutorial explains **every layer** of the `ip-react-node` app using Angular analogies.
> Every concept is backed by actual code from the codebase.

> **Migration status, 2026-10-10:** This is an educational guide, not a
> certification of Angular parity. React currently uses demo authentication
> and has incomplete routes/actions. See the [README](../README.md),
> [source comparison](angular-react-parity-analysis.md) and
> [migration plan](superpowers/plans/2026-10-10-angular-react-migration.md)
> for the current baseline and full-parity scope. Examples below may simplify
> page composition; use the implementation for complete behavior.

---

## Table of Contents

1. [Project Bootstrapping — `main.tsx`](#1-project-bootstrapping)
2. [Build Tool — Vite vs Angular CLI](#2-build-tool--vite-vs-angular-cli)
3. [Components — JSX vs Templates](#3-components--jsx-vs-templates)
4. [CSS Modules — Scoped Styles](#4-css-modules--scoped-styles)
5. [Routing — React Router vs Angular Router](#5-routing--react-router-vs-angular-router)
6. [Context — Dependency Injection in React](#6-context--dependency-injection-in-react)
7. [State — `useState` vs Component Properties](#7-state--usestate-vs-component-properties)
8. [Lifecycle — `useEffect` vs `ngOnInit` / `ngOnDestroy`](#8-lifecycle--useeffect-vs-ngoninit--ngondestroy)
9. [Data Fetching — TanStack Query vs Angular HttpClient](#9-data-fetching--tanstack-query-vs-angular-httpclient)
10. [Custom Hooks — Extracted Logic](#10-custom-hooks--extracted-logic)
11. [The Full Data Flow — End to End](#11-the-full-data-flow--end-to-end)
12. [Layout Architecture — AppShell, SideNav, MobileNav](#12-layout-architecture)
13. [Testing — Vitest vs Jest/Jasmine](#13-testing--vitest-vs-jestjasmine)
14. [TypeScript in React vs Angular](#14-typescript-in-react-vs-angular)

---

## 1. Project Bootstrapping

**Angular equivalent:** `main.ts` + `AppModule` / `bootstrapApplication()`

### `src/main.tsx`

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/globals.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 3, retryDelay: 1000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

### Angular comparison

| Angular | React equivalent in this file |
|---------|-------------------------------|
| `bootstrapApplication(AppComponent, { providers: [...] })` | `createRoot(...).render(<App />)` |
| `provideRouter(routes)` | `<BrowserRouter>` wrapping |
| `provideHttpClient()` | `<QueryClientProvider>` wrapping |
| `providers: [MyService]` | Wrapping with a `<Provider>` component |
| `NgZone` / change detection | React render/state updates; `<StrictMode>` adds development checks, not change detection |

**Key insight:** In React there is no module system or decorator-based DI. Instead, "global providers" are **components** that wrap the tree. Anything below `<QueryClientProvider>` can access React Query. Anything below `<BrowserRouter>` can use routing hooks. This is the React equivalent of Angular's root-level providers.

---

## 2. Build Tool — Vite vs Angular CLI

**Angular equivalent:** `angular.json` + webpack config

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      }
    }
  }
})
```

| Angular CLI | Vite |
|-------------|------|
| `ng serve` | `npm run dev` (calls `vite`) |
| `ng build` | `npm run build` (calls `tsc -b && vite build`) |
| `proxy.conf.json` | `server.proxy` in `vite.config.ts` |
| `environment.ts` | `import.meta.env.VITE_API_URL` in `.env` files |
| `angular.json` assets/styles | Direct imports in `main.tsx` / component files |

The proxy means: in dev, a request to `/api/sqf/summaryCards/...` is forwarded to the Python backend at `http://127.0.0.1:8080`. Identical to Angular's `proxy.conf.json`.

---

## 3. Components — JSX vs Templates

**Angular equivalent:** `@Component({ template: ... })`

In Angular you define a component with a class + decorator + separate template. In React, **the component IS a function** that returns its own HTML (JSX).

### Angular way:
```typescript
@Component({
  selector: 'app-side-nav',
  template: `<nav>{{ user.name }}</nav>`
})
export class SideNavComponent {
  user = { name: 'Demo User' }
}
```

### React way (`src/components/layout/SideNav/SideNav.tsx`):
```tsx
export function SideNav() {
  const { user } = useAuth()       // ← reads from context (like DI)
  const [menuOpen, setMenuOpen] = useState(false)  // ← local state

  return (
    <nav className={styles.sidenav} aria-label="Main navigation">
      <span className={styles.userName}>{user.name}</span>
    </nav>
  )
}
```

### JSX rules vs Angular template rules

| Angular template | JSX |
|------------------|-----|
| `*ngIf="condition"` | `{condition && <div />}` or ternary `{condition ? <A/> : <B/>}` |
| `*ngFor="let x of list"` | `{list.map(x => <div key={x.id}>{x.name}</div>)}` |
| `[class.active]="isActive"` | `` className={`btn ${isActive ? 'active' : ''}`} `` |
| `(click)="doThing()"` | `onClick={() => doThing()}` |
| `{{ value }}` | `{value}` |
| `[disabled]="!loaded"` | `disabled={!loaded}` |

**The `key` prop:** When you do `.map()` to render lists, React needs a unique `key` on each element. It's the equivalent of Angular's `trackBy` function in `*ngFor`.

```tsx
// From SummaryPage.tsx
sortedCards.map(card => (
  <div key={card.cardName} className="metric-card-slot">
    <SummaryCard card={card} />
  </div>
))
```

### Props — passing data down

Angular uses `@Input()`. React uses **props** — arguments to the function.

```tsx
// Defining a component that accepts props:
interface Props {
  card: ISQFMetricCard
  isLoading?: boolean
}

export function SummaryCard({ card, isLoading = false }: Props) {
  // card and isLoading are available as regular variables
  return <div>{card.cardName}</div>
}

// Using it:
<SummaryCard card={myCard} isLoading={false} />
```

The `children` prop is Angular's `<ng-content>` (content projection):
```tsx
// AppShell wraps its children
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <SideNav />
      <div className={styles.main}>{children}</div>
    </div>
  )
}
// Used as:
<AppShell>
  <Routes>...</Routes>   {/* this is "children" */}
</AppShell>
```

---

## 4. CSS Modules — Scoped Styles

**Angular equivalent:** `styleUrls` with `ViewEncapsulation.Emulated`

Angular automatically scopes component styles with generated attributes. React has no built-in scoping — **CSS Modules** are the community solution.

```css
/* SideNav.module.css */
.sidenav { position: fixed; width: 56px; }
.itemActive { background: rgba(255,255,255,0.12); }
```

```tsx
// SideNav.tsx — import the CSS file as an object
import styles from './SideNav.module.css'

// Use class names as object properties:
<nav className={styles.sidenav}>
  <a className={`${styles.item} ${isActive ? styles.itemActive : ''}`}>
    Daily
  </a>
</nav>
```

At build time, `.sidenav` becomes something like `.SideNav_sidenav__x3k2` — globally unique. No style leaking between components.

### Global styles

`src/styles/globals.css` contains CSS custom properties (variables) and global resets — imported once in `main.tsx`:

```css
/* globals.css */
:root {
  --color-primary: #0C482C;
  --sidenav-width: 56px;
  --mob-appbar-height: 0px;       /* desktop default */
}

@media (max-width: 767px) {
  :root {
    --sidenav-width: 0px;
    --mob-appbar-height: 56px;    /* mobile: show app bar */
  }
}
```

These are then used in CSS Modules:
```css
/* AppShell.module.css */
.main {
  margin-left: var(--sidenav-width);    /* auto-adjusts for mobile */
  padding-top: var(--mob-appbar-height);
}
```

---

## 5. Routing — React Router vs Angular Router

**Angular equivalent:** `RouterModule.forRoot(routes)` + `<router-outlet>`

### Route definition (`src/App.tsx`)

```tsx
// Angular routes look like:
// { path: 'quick-facts', component: QuickFactsLayout, children: [...] }

// React Router v7 looks like JSX:
<Routes>
  <Route
    path="/quick-facts"
    element={<ProtectedRoute><QuickFactsLayout /></ProtectedRoute>}
  >
    <Route index element={<Navigate to="summary" replace />} />
    <Route path="summary" element={<SummaryPage />} />
    <Route path="details/:type" element={<DetailsPage />} />
    <Route path="weekly" element={<TrendPage metric="weekly" />} />
    <Route path="myplan" element={<TrendPage metric="myPlan" />} />
  </Route>

  <Route path="/weekly" element={<ProtectedRoute><ComingSoon /></ProtectedRoute>} />
  <Route path="*" element={<Navigate to="/quick-facts" replace />} />
</Routes>
```

### `<Outlet>` = `<router-outlet>`

In `QuickFactsLayout.tsx`, the `<Outlet />` is where child routes render:

```tsx
export function QuickFactsLayout() {
  return (
    <FilterProvider>
      <div style={{ '--page-bar-height': '0px' } as React.CSSProperties}>
        <FilterBar />
        <div className={styles.content}>
          <Outlet />   {/* SummaryPage, DetailsPage or TrendPage renders here */}
        </div>
        <footer className={styles.footer}>
          <span>Store Insights · Powered by Quick Facts</span>
        </footer>
      </div>
    </FilterProvider>
  )
}
```

### Route guard = `ProtectedRoute`

The current `AuthProvider` always supplies authenticated demo context.
This guard is scaffolding, not source-equivalent IAP/role authorization;
logout currently reloads the page.

Angular uses `CanActivate`. React has no built-in guard — you build your own as a component:

```tsx
// src/context/AuthContext.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <div>Please log in.</div>
  }
  return <>{children}</>  // render children if auth passes
}
```

### Reading URL params

Angular uses `ActivatedRoute`. React uses the `useParams` hook:

```tsx
// src/pages/quick-facts/DetailsPage.tsx
import { useParams } from 'react-router-dom'

export function DetailsPage() {
  const { type } = useParams<{ type: string }>()
  // type = "sales" when URL is /quick-facts/details/sales
}
```

### Navigation

Angular: `this.router.navigate(['/quick-facts'])` or `<a routerLink="/quick-facts">`

React:
```tsx
import { NavLink, Navigate } from 'react-router-dom'

// Declarative link (renders as <a>):
<NavLink to="/quick-facts/summary">Summary</NavLink>

// Programmatic redirect (renders nothing, just redirects):
<Navigate to="/quick-facts/summary" replace />
```

`NavLink` automatically adds an active class when the URL matches — equivalent to `routerLinkActive`.

### Reading query params (URL search params)

Angular: `this.route.queryParams` — React:

```tsx
// src/context/FilterContext.tsx
import { useSearchParams } from 'react-router-dom'

const [searchParams, setSearchParams] = useSearchParams()
const code = searchParams.get('code')   // ?code=WW001

// Update URL query params without navigation:
setSearchParams(prev => {
  const next = new URLSearchParams(prev)
  next.set('code', node.code)
  return next
}, { replace: true })
```

`FilterContext` also stores reporting period (`WTD`/`YDAY`) and breakdown axis
(`childLevel`/`department`), synchronized to `period` and `axis` query parameters.
These React URL additions must be compared with Angular's actual state lifetime
and query contract; they do not prove matching deep-link behavior.

---

## 6. Context — Dependency Injection in React

**Angular equivalent:** `Injectable` services + DI tree

React has no class-based DI. Instead, **Context** is a shared value that any component in the subtree can read.

### How it works — three parts

#### 1. Create the context shape

```tsx
// src/context/AuthContext.tsx
interface AuthContextType {
  user: AuthUser
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({ /* default values */ })
```

#### 2. Provide the value (the "service registration")

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  function logout() { window.location.reload() }

  return (
    <AuthContext.Provider value={{ user: STUB_USER, isAuthenticated: true, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

This goes in `App.tsx`:
```tsx
<AuthProvider>        {/* ← provides auth to everything below */}
  <AppShell>
    ...
  </AppShell>
</AuthProvider>
```

#### 3. Consume (inject) the value

```tsx
// Custom hook wraps useContext — equivalent to constructor injection:
export function useAuth() {
  return useContext(AuthContext)
}

// Used in any component:
export function SideNav() {
  const { user, logout } = useAuth()  // ← "inject" auth
  return <span>{user.name}</span>
}
```

### FilterContext — the stateful context

`FilterContext` is the complex one. It holds the selected location node, the date, and the flat tree of all locations:

```tsx
// src/context/FilterContext.tsx — simplified
export function FilterProvider({ children }) {
  const [treeNodes, setTreeNodes] = useState<IQFTree[]>([])
  const [selectedNode, setSelectedNodeState] = useState<IQFTree | null>(null)
  const [selectedDate, setSelectedDateState] = useState<string>(...)

  // When node changes, also update ?code= in the URL
  const setSelectedNode = useCallback((node: IQFTree) => {
    setSelectedNodeState(node)
    setSearchParams(prev => { ... prev.set('code', node.code) ... })
  }, [setSearchParams])

  return (
    <FilterContext.Provider value={{ treeNodes, selectedNode, selectedDate, ... }}>
      {children}
    </FilterContext.Provider>
  )
}
```

It's placed inside `QuickFactsLayout` — so it only exists while you're on a `/quick-facts` route:
```tsx
export function QuickFactsLayout() {
  return (
    <FilterProvider>     {/* filter state scoped to this route */}
      <FilterBar />      {/* reads + writes filter state */}
      <Outlet />         {/* SummaryPage/DetailsPage also read filter state */}
    </FilterProvider>
  )
}
```

**Angular DI comparison:**

| Angular | React Context |
|---------|--------------|
| `@Injectable({ providedIn: 'root' })` | `<Provider>` in `main.tsx` |
| `@Injectable({ providedIn: SomeModule })` | `<Provider>` inside a layout component |
| `constructor(private myService: MyService)` | `const myService = useMyService()` |
| `BehaviorSubject` for shared state | `useState` inside Provider |
| `HttpClient` calls inside service | API calls inside custom hooks |

---

## 7. State — `useState` vs Component Properties

**Angular equivalent:** component class properties + `ChangeDetectorRef`

In Angular, you change a class property and the framework detects it. In React, you call a **setter function** to trigger a re-render.

### Basic state

```tsx
const [menuOpen, setMenuOpen] = useState(false)

// Read:
if (menuOpen) { ... }

// Write (triggers re-render):
setMenuOpen(true)
setMenuOpen(prev => !prev)   // functional form — safe when using previous value
```

### State inside SideNav

```tsx
// src/components/layout/SideNav/SideNav.tsx
export function SideNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div>
      {menuOpen && (          /* conditional render */
        <div className={styles.userMenu}>
          <button onClick={logout}>Log out</button>
        </div>
      )}
      <button
        onClick={() => setMenuOpen(o => !o)}   /* toggle */
        aria-expanded={menuOpen}
      >
        User
      </button>
    </div>
  )
}
```

Angular equivalent:
```typescript
isMenuOpen = false
toggleMenu() { this.isMenuOpen = !this.isMenuOpen }
```
```html
<div *ngIf="isMenuOpen"><button>Log out</button></div>
<button (click)="toggleMenu()">User</button>
```

### Derived state (no `useState` needed)

React has no `computed` properties — you just calculate in the render function:

```tsx
// DetailsPage.tsx
const isLoading = !isLoaded || detailsQuery.isLoading  // derived, no state needed
const cards = sortCards(raw.filter(c => !c.hidden), sortType)  // also derived
```

---

## 8. Lifecycle — `useEffect` vs `ngOnInit` / `ngOnDestroy`

**Angular equivalent:** lifecycle hooks (`ngOnInit`, `ngOnDestroy`, `ngOnChanges`)

### `useEffect` — runs after render

```tsx
// "Run this code after every render where [menuOpen] changed"
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false)
    }
  }

  if (menuOpen) document.addEventListener('mousedown', handleClickOutside)

  // Return value = cleanup function (equivalent to ngOnDestroy)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [menuOpen])   // ← dependency array: re-run when menuOpen changes
```

### Dependency array patterns

| Pattern | Angular equivalent | When it runs |
|---------|-------------------|--------------|
| `useEffect(() => {}, [])` | `ngOnInit` | Once on mount |
| `useEffect(() => {})` | `ngDoCheck` | Every render |
| `useEffect(() => {}, [x, y])` | `ngOnChanges({ x, y })` | When x or y changes |
| `return () => cleanup()` inside effect | `ngOnDestroy` | Before next run or unmount |

### ESC key handler in MobileNav

```tsx
// src/components/layout/MobileNav/MobileNav.tsx
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && drawerOpen) close()
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)   // cleanup!
}, [drawerOpen])
```

### `useRef` — DOM references

Angular uses `@ViewChild`. React uses `useRef`:

```tsx
const dropdownRef = useRef<HTMLDivElement>(null)

// Attach to DOM element:
<div ref={dropdownRef} className={styles.dropdown}>

// Access the DOM node:
dropdownRef.current?.contains(e.target as Node)
```

---

## 9. Data Fetching — TanStack Query vs Angular HttpClient

**Angular equivalent:** `HttpClient` + RxJS `Observable` + `async` pipe

React has no built-in HTTP client or reactive streams. This app uses:
- **Axios** for HTTP (`src/api/client.ts`)
- **TanStack Query (React Query)** for caching, loading states, retries

### The API client (`src/api/client.ts`)

```ts
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // from .env file, like Angular's environment.ts
  withCredentials: true,                  // send session cookie
  timeout: 30_000,
})
```

Angular equivalent:
```typescript
// environment.ts
export const environment = { apiUrl: '/api' }

// http.interceptor.ts — withCredentials
```

### API functions (`src/api/sqf.ts`)

```ts
// Plain async functions — no Observables
export async function getSummaryCards(
  apiDepth: number,
  date: string,
  code?: string
): Promise<ISQFPeriodResponse | ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/summaryCards/${apiDepth}/${date}/${code}`
    : `/sqf/summaryCards/0/${date}`
  const res = await client.get<ISQFPeriodResponse | ISQFMetricCard[]>(path)
  return res.data
}
```

Historical array-only Angular equivalent (the current source additionally
supports period-keyed responses and wrapper values):
```typescript
getSummaryCards(apiDepth: number, date: string, code?: string): Observable<ISQFMetricCard[]> {
  const path = apiDepth && code
    ? `/sqf/summaryCards/${apiDepth}/${date}/${code}`
    : `/sqf/summaryCards/0/${date}`
  return this.http.get<ISQFMetricCard[]>(path)
}
```

### TanStack Query (`src/hooks/useSummaryCards.ts`)

```ts
export function useSummaryCards() {
  const { selectedNode, selectedDate, isLoaded } = useFilter()

  return useQuery({
    // queryKey = cache key — like ngrx entity key or memoization key
    queryKey: ['sqf', 'summary-cards', selectedNode?.apiDepth, selectedNode?.code, selectedDate],

    // queryFn = the actual fetch — must return a Promise
    queryFn: () => getSummaryCards(selectedNode!.apiDepth, selectedDate, selectedNode!.code),

    // enabled = only fetch when isLoaded (like combineLatest with a boolean guard)
    enabled: isLoaded,

    staleTime: 0,  // data is immediately stale; normal mount/focus rules may refetch
  })
}
```

**When `selectedNode` or `selectedDate` changes, `queryKey` changes → React Query automatically re-fetches.** This is the React equivalent of `switchMap` in RxJS.

### Using the query in a component (`src/pages/quick-facts/SummaryPage.tsx`)

```tsx
export function SummaryPage() {
  // The actual page enriches period-selected cards with status and ETA metadata.
  const summaryQuery = useEnrichedSummaryCards()

  // Three states: loading, error, success
  if (summaryQuery.isLoading) return <Skeleton />
  if (summaryQuery.isError)   return <ErrorBanner />

  const cards = summaryQuery.data
  return <div>{cards.map(c => <SummaryCard card={c} />)}</div>
}
```

Angular equivalent with `async` pipe:
```html
<ng-container *ngIf="summaryCards$ | async as cards; else loading">
  <app-summary-card *ngFor="let c of cards" [card]="c" />
</ng-container>
```

| TanStack Query | Angular + RxJS |
|----------------|---------------|
| `queryKey` | Observable identity / memoization key |
| `enabled` | `combineLatest([loaded$, ...]).pipe(switchMap(...))` |
| `queryFn` | `httpClient.get(...)` call |
| `isLoading` | `loading$` BehaviorSubject |
| `isError` | `error$` BehaviorSubject |
| `data` | value from `async` pipe |
| `staleTime: 0` | data remains cached but is immediately stale and eligible for refetch |
| Retry config in `QueryClient` | `retryWhen()` operator |

`summaryCards` and `detailCard` may return `{ WTD, YDAY }`, with each period
containing an array or `{ cards, sortBy }`. `usePeriodCards` normalizes the
response and selects an available period; changing period uses already-fetched
data rather than adding the period to the HTTP request. Do not render raw
period objects as arrays or silently turn an unsupported response into an
apparently successful empty page.

---

## 10. Custom Hooks — Extracted Logic

**Angular equivalent:** Service methods / utility functions

In Angular you extract logic into services. In React you extract stateful logic into **custom hooks** — functions whose names start with `use`.

### `useFilterTree` — triggers when the filter context initialises

```ts
// src/hooks/useFilterTree.ts (simplified concept)
export function useFilterTree() {
  const { initTree } = useFilter()

  useQuery({
    queryKey: ['sqf', 'universal-filter'],
    queryFn: getUniversalFilter,
    onSuccess: (data) => initTree(data),   // calls FilterContext.initTree once data arrives
  })
}
```

Called once inside `FilterBar`:
```tsx
export function FilterBar() {
  useFilterTree()   // ← starts the API call, calls initTree on success
  const { treeNodes, selectedNode } = useFilter()  // ← reads the result
  ...
}
```

Angular equivalent:
```typescript
@Component({ ... })
export class FilterBarComponent implements OnInit {
  constructor(private filterService: FilterService) {}
  ngOnInit() {
    this.filterService.loadTree().subscribe(data => this.filterService.initTree(data))
  }
}
```

### Rules for hooks

1. **Only call hooks at the top level** — not inside `if`, loops, or nested functions
2. **Only call hooks inside React function components or other custom hooks**
3. A custom hook is just a function that uses other hooks — there's no decorator or registration

---

## 11. The Full Data Flow — End to End

Here's what happens when you open `/quick-facts/summary` and change the location:

```
1. main.tsx mounts <BrowserRouter> → <QueryClientProvider> → <App>

2. App.tsx renders:
   <AuthProvider>          ← provides user & logout
     <AppShell>            ← renders SideNav + MobileNav
       <Routes>
         /quick-facts → <ProtectedRoute><QuickFactsLayout /></ProtectedRoute>

3. QuickFactsLayout renders:
   <FilterProvider>        ← creates selectedNode/selectedDate state
     <FilterBar />         ← calls useFilterTree() → GET /api/sqf/getUniversalFilterGeneric
     <Outlet />            ← renders SummaryPage

4. FilterBar receives API response:
   → initTree(rawData) is called
   → tree is flattened, selectedNode defaults to first selectable node
   → isLoaded becomes true
   → URL gets ?code=WW001&date=2026-06-30

5. SummaryPage watches isLoaded:
   useSummaryCards() → queryKey includes selectedNode.code
   → enabled: isLoaded = true
   → GET /api/sqf/summaryCards/1/2026-06-30/WW001
   → data arrives → cards render

6. User changes location dropdown:
   → setSelectedNode(newNode) called
   → URL updates to ?code=NEW001
   → queryKey changes: ['sqf', 'summary-cards', ..., 'NEW001', ...]
   → React Query sees new key → GET /api/sqf/summaryCards/1/2026-06-30/NEW001
   → new cards render
```

---

## 12. Layout Architecture

### The shell structure

```
AppShell
├── SideNav        (position: fixed, desktop only — CSS `display: none` on mobile)
├── MobileNav      (position: fixed, mobile only — CSS `display: none` on desktop)
│   ├── <header>   app bar
│   └── <nav>      slide-in drawer
└── <div.main>     (margin-left: 56px on desktop, padding-top: 56px on mobile)
    └── children
        └── QuickFactsLayout (for /quick-facts routes)
            ├── FilterBar  (position: sticky, below mobile app bar)
            ├── <Outlet>   (SummaryPage, DetailsPage or TrendPage)
            └── <footer>
```

### CSS variable layout system

Instead of JS calculations for offsets, CSS custom properties do it automatically:

```css
/* globals.css */
:root {
  --sidenav-width: 56px;       /* desktop */
  --mob-appbar-height: 0px;    /* desktop */
}

@media (max-width: 767px) {
  :root {
    --sidenav-width: 0px;      /* mobile: no side nav */
    --mob-appbar-height: 56px; /* mobile: show top bar */
  }
}
```

```css
/* AppShell.module.css */
.main {
  margin-left: var(--sidenav-width);    /* auto: 56px desktop, 0 mobile */
  padding-top: var(--mob-appbar-height); /* auto: 0 desktop, 56px mobile */
}

/* FilterBar.module.css */
.filterBar {
  position: sticky;
  top: calc(var(--mob-appbar-height) + var(--page-bar-height));
}
```

`PageBar` was removed in the August layout changes. `QuickFactsLayout` sets
`--page-bar-height: 0px`; the retained variable must not be mistaken for a
rendered tab bar.

**Why `sticky` not `fixed`?** `position: fixed` escapes the document flow and needs manual `left: 56px` to avoid the sidenav. `position: sticky` sticks within its parent's scroll container — which already has the correct `margin-left` applied by AppShell. Much simpler.

### SideNav — CSS-only expansion

The sidenav expands from 56px → 290px using only CSS `:hover`:

```css
.sidenav {
  width: 56px;
  overflow: hidden;
  transition: width 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

.sidenav:hover { width: 290px; }

/* Labels are opacity:0, fade in when sidenav expands */
.itemLabel {
  opacity: 0;
  transition: opacity 280ms;
}
.sidenav:hover .itemLabel { opacity: 1; }
```

The React state `menuOpen` (for the user popup) adds a class to force the expanded state:
```tsx
<nav className={`${styles.sidenav} ${menuOpen ? styles.sidenavExpanded : ''}`}>
```

This prevents the popup from being clipped when the user's cursor leaves the sidenav.

---

## 13. Testing — Vitest vs Jest/Jasmine

**Angular equivalent:** Jasmine + Karma or Jest

### Test setup

```ts
// vitest.config.ts — equivalent of karma.conf.js
// globals: true means no need to import describe/it/expect
// jsdom: simulates a browser DOM in Node.js
```

### Component test example (`SideNav.test.tsx`)

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import { SideNav } from './SideNav'

// Test wrapper — provides Router + Auth context
function renderNav(path = '/quick-facts') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <SideNav />
      </MemoryRouter>
    </AuthProvider>
  )
}

it('renders all four nav items', () => {
  renderNav()
  expect(screen.getByText('Daily')).toBeTruthy()
  expect(screen.getByText('Weekly')).toBeTruthy()
})

it('shows user menu when user row is clicked', () => {
  renderNav()
  fireEvent.click(screen.getByTestId('sidenav-user-trigger'))
  expect(screen.getByText('Log out')).toBeTruthy()
})
```

| Angular test | React test |
|--------------|------------|
| `TestBed.configureTestingModule({ declarations, providers })` | Wrap with `<AuthProvider><MemoryRouter>` |
| `fixture.debugElement.query(By.css('.name'))` | `screen.getByText('name')` |
| `fixture.detectChanges()` | Not needed — React renders synchronously in tests |
| `(nativeElement as HTMLElement).click()` | `fireEvent.click(element)` |
| `@Input()` in test | Pass as prop: `<MyComponent card={mockCard} />` |
| `jasmine.createSpy()` | `vi.fn()` |

**Key difference:** Angular requires `TestBed` setup. React Testing Library renders the real component directly — no mocking of the framework. The philosophy is "test what the user sees", not implementation details.

### Running tests

```bash
npm test           # watch mode
npx vitest run     # CI / one-shot (equivalent of ng test --watch=false)
npx vitest run src/components/layout/SideNav/SideNav.test.tsx  # single file
```

---

## 14. TypeScript in React vs Angular

Angular is built with TypeScript at its core. React is optional-TypeScript. This app uses TypeScript throughout.

### File extensions

| Extension | Purpose |
|-----------|---------|
| `.tsx` | TypeScript + JSX (components, pages) |
| `.ts` | TypeScript only (hooks, utils, types, API) |

### Interfaces vs Angular models

```ts
// src/types/sqf.types.ts
export interface ISQFMetricCard {
  cardName: string
  cardTitle?: string
  infoNumbers?: ISQFInfoNumber[]
  hidden?: boolean
  seq?: number
}
```

Exactly the same as Angular interfaces — no framework-specific differences here.

### Generic components

```tsx
// TypeScript generics work the same way:
interface Props<T> {
  items: T[]
  renderItem: (item: T) => ReactNode
}
```

### `tsconfig.app.json` — React-specific settings

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",          // enables JSX transform
    "moduleResolution": "bundler" // Vite-compatible resolution
  }
}
```

---

## Quick Reference Card

| Angular | React (this app) |
|---------|-----------------|
| `app.module.ts` / `main.ts` | `main.tsx` |
| `@NgModule` providers | `<Provider>` components in `main.tsx` |
| `@Component` class | `function MyComponent()` |
| `template` / `templateUrl` | JSX returned from function |
| `styleUrls` | `import styles from './X.module.css'` |
| `@Input()` | function parameter (prop) |
| `@Output() EventEmitter` | callback prop: `onSelect: (v) => void` |
| `<ng-content>` | `{children}` prop |
| `<ng-container *ngIf>` | `{condition && <div />}` |
| `*ngFor="let x of list; trackBy"` | `{list.map(x => <div key={x.id} />)}` |
| `[class.active]` | `` className={`item ${active ? 'active' : ''}`} `` |
| `(click)` | `onClick` |
| `RouterModule.forRoot(routes)` | `<BrowserRouter><Routes>` |
| `<router-outlet>` | `<Outlet />` |
| `routerLink` | `<NavLink to="...">` or `<Link to="...">` |
| `ActivatedRoute.params` | `useParams()` |
| `ActivatedRoute.queryParams` | `useSearchParams()` |
| `CanActivate` guard | `<ProtectedRoute>` component |
| `@Injectable` service | Custom hook (`useMyService`) |
| `BehaviorSubject` | `useState` |
| `async` pipe | `query.data` from TanStack Query |
| `HttpClient.get<T>()` | `axios.get<T>()` |
| `ngOnInit` | `useEffect(() => {}, [])` |
| `ngOnDestroy` | `return () => cleanup()` inside `useEffect` |
| `ngOnChanges` | `useEffect(() => {}, [dep])` |
| `@ViewChild` | `useRef<HTMLElement>(null)` |
| Jasmine/Karma | Vitest + React Testing Library |
| `ng serve` | `npm run dev` (Vite) |
| `ng build` | `npm run build` |
| `proxy.conf.json` | `server.proxy` in `vite.config.ts` |
| `environment.ts` | `import.meta.env.VITE_*` |
