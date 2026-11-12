// React counterpart of Angular's prebuild.js. Reads the per-BU env-config.json (decrypted from
// ../configs/env-config-$PROJECT_ID.json.enc by the root cloudbuild.yaml) and writes only frontend values
// to .env.production.local so Vite embeds them. Backend secrets in the file are never copied.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = process.env.ENV_CONFIG_PATH || path.join(root, 'env-config.json')
const outputPath = path.join(root, '.env.production.local')

const defaults = {
  BUCKET_URL: './assets',
  SITE_TITLE: 'Insights Portal',
  PORTAL: 'SI',
  GCP_CLIENT_ID: '',
  GCP_API_KEY: '',
}

let envConfig = {}
try {
  envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
} catch {
  console.log(`React - no readable ${path.basename(configPath)}, using defaults`)
}

const value = (key) => {
  if (!envConfig[key]) {
    console.log(`React - ${key} missing in env-config.json, using default`)
    return defaults[key]
  }
  return envConfig[key]
}

const siteTitle = value('SITE_TITLE')
const portal = value('PORTAL')
// add trailing slash if missing (same rule as Angular)
const bucketUrl = String(value('BUCKET_URL')).replace(/\/?(\?|#|$)/, '/$1')
// Angular's './assets/' default is relative to its index.html; React serves bundled defaults from /assets/
const resolvedBucketUrl = bucketUrl.startsWith('./') ? '/' + bucketUrl.slice(2) : bucketUrl

const lines = [
  `VITE_BUCKET_URL=${resolvedBucketUrl}`,
  `VITE_SITE_TITLE=${siteTitle}`,
  `VITE_PORTAL=${portal}`,
  `VITE_GOOGLE_CLIENT_ID=${value('GCP_CLIENT_ID')}`,
  `VITE_GOOGLE_API_KEY=${value('GCP_API_KEY')}`,
]
fs.writeFileSync(outputPath, lines.join('\n') + '\n')

console.log(`React - theme setup complete, BUCKET_URL: ${resolvedBucketUrl} SITE_TITLE: ${siteTitle} PORTAL: ${portal}`)
