import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./check-docs.mjs', import.meta.url))

function check(t, files) {
  const root = mkdtempSync(path.join(tmpdir(), 'insights-docs-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const [file, contents] of Object.entries(files)) {
    const target = path.join(root, file)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, contents)
  }
  return spawnSync(process.execPath, [script, root], { encoding: 'utf8' })
}

test('checks maintained docs and nested guides without scanning historical plans', t => {
  const result = check(t, {
    'README.md': '[Guide](docs/guide.md#same-1)\n[Code](src/feature.ts)\n[Asset](docs/a%20b.png)',
    'docs/guide.md': '# Same\n# Same\n',
    'docs/a b.png': '',
    'src/feature.ts': '',
    'src/features/trend/AGENTS.md': '[Root](../../../README.md)',
    'docs/superpowers/plans/old.md': '[Old](missing.ts)',
    'node_modules/example/AGENTS.md': '[Ignored](missing.md)',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /3 documents/)
})

test('reports broken inline links, images and reference destinations', t => {
  const result = check(t, {
    'README.md': '[Missing](missing.ts)\n![Image](missing.png)\n[Ref][contract]\n\n[contract]: docs/missing.md',
  })
  assert.equal(result.status, 1)
  for (const destination of ['missing.ts', 'missing.png', 'docs/missing.md']) {
    assert.ok(result.stderr.includes(destination), result.stderr)
  }
  assert.match(result.stderr, /README.md:\d+/)
})

test('checks heading anchors and ignores fenced examples and external links', t => {
  const result = check(t, {
    'README.md': [
      '# **Hello**, `World`!',
      '# Café',
      '[Self](#hello-world)',
      '[Unicode](#caf%C3%A9)',
      '[External](https://example.test/not-fetched#anything)',
      '[Email](mailto:fixture@example.test)',
      '`[Inline example](missing.md)`',
      '```md',
      '# Fake',
      '[Example](missing.md)',
      '```',
      '[Bad anchor](#fake)',
    ].join('\n'),
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /#fake/)
  assert.doesNotMatch(result.stderr, /missing.md|hello-world|caf%C3%A9/)
})

test('checks reference-style and angle-bracket destinations with titles', t => {
  const result = check(t, {
    'README.md': '[Guide][g]\n\n[g]: <docs/a b.md#heading> "Guide title"\n[Inline](<docs/a b.md#heading> "Title")',
    'docs/a b.md': '# Heading\n',
  })
  assert.equal(result.status, 0, result.stderr)
})

test('reports malformed URL encoding instead of crashing without context', t => {
  const result = check(t, { 'README.md': '[Invalid](docs/%ZZ.md)' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /README.md:1.*encoding/)
})

test('does not report success when the documentation entry point is absent', t => {
  const result = check(t, { 'docs/guide.md': '# Guide' })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /README.md.*missing/)
})
