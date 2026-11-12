# WIQ Store Insights Portal

Recreation of the Angular Store Insights portal in React, with one-to-one
functional and visual parity as the migration goal. Migration is ongoing;
this repository currently contains the frontend only.

```text
projects/
  wiq-si-portal/
    README.md
    configs/             # Existing encrypted per-environment build configuration
    dispatch.yaml        # Existing App Engine API routing
    frontend/            # React application, tests, assets and migration docs
    services/            # Reserved for future backend migrations
cloudbuild.yaml          # Frontend build/deployment pipeline
```

## Development

Use Node 22.13+ or a supported newer LTS release. From the repository root:

```bash
npm --prefix projects/wiq-si-portal/frontend ci
npm --prefix projects/wiq-si-portal/frontend run dev
```

The committed `projects/wiq-si-portal/frontend/.env` sets the public
`VITE_API_URL=/api` for development and production builds. Use an uncommitted
`.env.local` only for personal overrides.

Start the existing authorized Python backend separately on port 8080. The Vite
development server proxies `/api` to that backend; it does not start or
authenticate against it.

```bash
npm --prefix projects/wiq-si-portal/frontend run test:coverage
npm --prefix projects/wiq-si-portal/frontend run build
```

See the [frontend guide](projects/wiq-si-portal/frontend/README.md) for application
details and the [project guide](projects/wiq-si-portal/README.md) for deployment
paths, branches and the repository transition scope.

## Security

Never commit local environment files, decrypted configuration or credentials.
Only encrypted configuration files belong in `configs/`; `VITE_*` values are
public browser configuration, not a place for secrets. See [SECURITY.md](SECURITY.md)
for vulnerability reporting.
