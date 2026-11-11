import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)))
const documents = new Set(['README.md'])
const errors = []
let checkedLinks = 0

function addMarkdown(directory) {
  const absolute = path.join(root, directory)
  if (!existsSync(absolute)) return
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.md')) documents.add(path.join(directory, entry.name))
  }
}

function addScopedGuides(directory) {
  const absolute = path.join(root, directory)
  if (!existsSync(absolute)) return
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(directory, entry.name)
    if (entry.isDirectory()) addScopedGuides(relative)
    else if (entry.isFile() && entry.name === 'AGENTS.md') documents.add(relative)
  }
}

addMarkdown('')
addMarkdown('.github')
addMarkdown('docs')
addMarkdown('docs/decisions')
addScopedGuides('src')

// Keep line numbers while excluding fenced examples from links and headings.
function prose(text) {
  let fence
  return text.split('\n').map(line => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined
      return ''
    }
    if (marker) {
      fence = marker[1]
      return ''
    }
    return line
  })
}

const anchorCache = new Map()
function anchors(file) {
  if (anchorCache.has(file)) return anchorCache.get(file)
  const result = new Set()
  for (const line of prose(readFileSync(file, 'utf8'))) {
    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/)
    if (!heading) continue
    const base = heading[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
      .replace(/\s/g, '-')
    let slug = base
    let suffix = 0
    while (result.has(slug)) slug = `${base}-${++suffix}`
    result.add(slug)
  }
  anchorCache.set(file, result)
  return result
}

function checkLink(file, line, destination) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) return
  checkedLinks++
  const location = `${file}:${line}`
  let decoded
  try {
    decoded = decodeURIComponent(destination)
  } catch (error) {
    if (!(error instanceof URIError)) throw error
    errors.push(`${location}: invalid URL encoding in ${destination}`)
    return
  }
  const hash = decoded.indexOf('#')
  const fragment = hash < 0 ? '' : decoded.slice(hash + 1)
  const pathname = (hash < 0 ? decoded : decoded.slice(0, hash)).split('?')[0]
  const target = pathname.startsWith('/')
    ? path.resolve(root, pathname.slice(1))
    : path.resolve(root, path.dirname(file), pathname || path.basename(file))
  const relative = path.relative(root, target)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    errors.push(`${location}: link outside repository: ${destination}`)
  } else if (!existsSync(target)) {
    errors.push(`${location}: missing target ${destination}`)
  } else if (fragment && target.endsWith('.md') && statSync(target).isFile() && !anchors(target).has(fragment)) {
    errors.push(`${location}: missing heading ${destination}`)
  }
}

for (const file of [...documents].sort()) {
  const absolute = path.join(root, file)
  if (!existsSync(absolute)) {
    errors.push(`${file}: missing documentation entry point`)
    continue
  }
  const lines = prose(readFileSync(absolute, 'utf8'))
  for (const [index, original] of lines.entries()) {
    const line = original.replace(/(`+)[\s\S]*?\1/g, '')
    const reference = line.match(/^\s{0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/)
    if (reference) {
      checkLink(file, index + 1, reference[1] ?? reference[2])
      continue
    }
    for (const match of line.matchAll(/!?\[[^\]\n]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g)) {
      checkLink(file, index + 1, match[1] ?? match[2])
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`Documentation check failed: ${errors.length} error(s).`)
  process.exitCode = 1
} else {
  console.log(`Documentation check passed: ${documents.size} documents, ${checkedLinks} local links.`)
}
