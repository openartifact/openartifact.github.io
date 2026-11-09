// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Builds the whole site into _site/:
//   /            landing page
//   /latest/     docs of the newest release tag (what readers should use)
//   /dev/        docs of the checkout given as --oa (main, not released yet)
//   /vX.Y/       docs of the newest stable tag of each older minor line; the
//                newest minor line redirects to /latest/
//   /versions.json  read by the version switcher and the 404 page at run time
//
// Every version is its own build. The landing page and /latest/ must build;
// a failing /dev/ or older version is reported and skipped, so a mistake in the
// docs of main never keeps a release from being published.
//
// Usage: bun scripts/build.ts --oa <openartifact checkout> [--keep 5]
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { siteOrigin } from '../.vitepress/env'
import { redirectPage, redirectTree } from './redirect'
import { pickReleases } from './versions'

const { values } = parseArgs({
  options: { oa: { type: 'string' }, keep: { type: 'string', default: '5' } },
})
if (!values.oa) throw new Error('--oa <openartifact checkout> is required')

const oa = resolve(values.oa)
const out = resolve('_site')
const origin = process.env.OA_SITE_ORIGIN ?? siteOrigin
const siteRoot = `${(process.env.OA_SITE_BASE ?? '/').replace(/\/?$/, '/')}`

function run(cmd: string[], env: Record<string, string> = {}, cwd?: string): string {
  const p = Bun.spawnSync(cmd, { env: { ...process.env, ...env }, cwd, stdout: 'pipe', stderr: 'inherit' })
  if (p.exitCode !== 0) throw new Error(`${cmd.join(' ')} failed with ${p.exitCode}`)
  return p.stdout.toString()
}

function build(env: Record<string, string>): void {
  run(['bunx', '--bun', 'vitepress', 'build'], env)
}

const failures: { name: string; error: string }[] = []

/** Builds one docs version; a failure is recorded and the half-written output removed. */
function tryBuild(name: string, env: Record<string, string>): boolean {
  console.log(`::group::build ${name}`)
  try {
    build(env)
    return true
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    failures.push({ name, error })
    rmSync(join(out, name), { recursive: true, force: true })
    console.log(`::warning title=docs ${name} not published::${error}`)
    return false
  } finally {
    console.log('::endgroup::')
  }
}

rmSync(out, { recursive: true, force: true })

const tags = run(['git', '-C', oa, 'tag', '--list', 'v*']).split('\n').filter(Boolean)
const releases = pickReleases(tags, Number(values.keep))
const sha = run(['git', '-C', oa, 'rev-parse', '--short=7', 'HEAD']).trim()
const [newest, ...older] = releases

console.log(`releases: ${releases.map((r) => `${r.minor}=${r.tag}`).join(' ') || 'none'}`)

const scratch = mkdtempSync(join(tmpdir(), 'oa-docs-'))

/** The tag's own tree: docs, installCommands.ts and every file the docs link to. */
function extract(tag: string): string {
  const dir = join(scratch, tag)
  mkdirSync(dir)
  const tar = Bun.spawnSync(['sh', '-c', `git -C "$OA" archive "$TAG" | tar -x -C "$DIR"`], {
    env: { ...process.env, OA: oa, TAG: tag, DIR: dir },
    stderr: 'inherit',
  })
  if (tar.exitCode !== 0) throw new Error(`git archive ${tag} failed`)
  return dir
}

/**
 * Builds the web UI of a checkout in demo mode (in-browser fixture backend, no server) for /demo/.
 * Releases older than the demo mode have no build:demo script; a failure is reported and the
 * landing page keeps its screenshots.
 */
function buildDemo(srcDir: string): string | undefined {
  const web = join(srcDir, 'web')
  const pkg = join(web, 'package.json')
  if (!existsSync(pkg) || !JSON.parse(readFileSync(pkg, 'utf8')).scripts?.['build:demo']) return undefined
  console.log('::group::build demo')
  try {
    run(['bun', 'install', '--frozen-lockfile'], {}, web)
    run(['bun', 'run', 'build:demo'], { OA_DEMO_BASE: `${siteRoot}demo/` }, web)
    return join(web, 'dist-demo')
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    failures.push({ name: 'demo', error })
    console.log(`::warning title=demo not published::${error}`)
    return undefined
  } finally {
    console.log('::endgroup::')
  }
}

const versions: { name: string; label: string; minor?: string }[] = []

try {
  const latestDir = newest ? extract(newest.tag) : oa
  const latestEnv = { OA_LATEST: newest?.tag ?? '' }

  // The web UI demo of the release; the landing page embeds it when it built.
  const demo = buildDemo(latestDir)

  // Landing first: its build owns the root of _site, the docs builds add subdirectories.
  // It lists the formats of the release it links to.
  build({ OA_TARGET: 'landing', OA_SRC_DIR: latestDir, OA_DEMO: demo ? '1' : '', ...latestEnv })
  if (demo) cpSync(demo, join(out, 'demo'), { recursive: true })

  // Old tags are built with today's theme and sidebar: their pages may link to
  // files that moved later, which must not block publishing.
  if (newest) {
    build({
      OA_TARGET: 'docs',
      OA_VERSION: 'latest',
      OA_LABEL: newest.tag,
      OA_SRC_DIR: latestDir,
      OA_REF: newest.tag,
      OA_LENIENT: '1',
      ...latestEnv,
    })
    versions.push({ name: 'latest', label: `latest (${newest.tag})`, minor: newest.minor })
  } else {
    // No release yet: main is all there is.
    build({ OA_TARGET: 'docs', OA_VERSION: 'latest', OA_LABEL: 'main', OA_SRC_DIR: oa, OA_REF: 'main' })
    versions.push({ name: 'latest', label: `latest (main ${sha})` })
  }

  if (newest) {
    const ok = tryBuild('dev', { OA_TARGET: 'docs', OA_VERSION: 'dev', OA_LABEL: 'dev', OA_SRC_DIR: oa, OA_REF: 'main', ...latestEnv })
    if (ok) versions.push({ name: 'dev', label: `dev (main ${sha})` })
  }

  for (const r of older) {
    const ok = tryBuild(r.minor, {
      OA_TARGET: 'docs',
      OA_VERSION: r.minor,
      OA_SRC_DIR: extract(r.tag),
      OA_REF: r.tag,
      OA_LENIENT: '1',
      ...latestEnv,
    })
    if (ok) versions.push({ name: r.minor, label: `${r.minor} (${r.tag.slice(1)})` })
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

// The newest minor line is served as /latest/: its old /vX.Y/ URLs redirect there page by page.
if (newest) {
  const n = redirectTree(origin, siteRoot, out, newest.minor, 'latest')
  console.log(`${newest.minor}: ${n} redirects to /latest/`)
}

// When the development build failed, /dev/ sends readers to /latest/ instead of a 404.
if (newest && !existsSync(join(out, 'dev'))) {
  mkdirSync(join(out, 'dev'))
  writeFileSync(join(out, 'dev', 'index.html'), redirectPage(`${siteRoot}latest/`))
}

writeFileSync(join(out, 'versions.json'), `${JSON.stringify(versions, null, 2)}\n`)

// One sitemap for the pages worth indexing: the landing page and /latest/.
const urls = (file: string): string[] =>
  existsSync(file) ? [...readFileSync(file, 'utf8').matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]) : []
const latestMap = join(out, 'latest', 'sitemap.xml')
const entries = [...urls(join(out, 'sitemap.xml')), ...urls(latestMap)]
rmSync(latestMap, { force: true })
writeFileSync(
  join(out, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>\n`,
)
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}${siteRoot}sitemap.xml\n`)
// Served by Pages as-is: no Jekyll processing of _-prefixed files.
writeFileSync(join(out, '.nojekyll'), '')

console.log(`built ${versions.length} doc versions into ${out}: ${versions.map((v) => v.name).join(' ')}`)
if (failures.length > 0) {
  const text = failures.map((f) => `- ${f.name === 'demo' ? 'the web UI demo' : `docs ${f.name}`} was not published: ${f.error}`).join('\n')
  console.log(text)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Not published\n\n${text}\n`)
}
