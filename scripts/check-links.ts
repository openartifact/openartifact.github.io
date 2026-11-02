// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Checks the built site: every internal link, image, stylesheet and script of
// every page must exist, and every #anchor must be the id of an element of the
// page it points to. VitePress only checks that a linked page exists in the
// source; it does not see anchors or links that break when README.md becomes a
// directory index.
//
// Usage: bun scripts/check-links.ts [_site] [--warn dev] [--known scripts/known-broken-links.txt] [--external helm-charts]
//   --warn      versions whose broken links only warn (default dev: a mistake in the docs of
//               main is fixed in the docs repository); `*` warns for all, nothing fails
//   --known     broken targets of released docs that cannot be fixed any more (see the file);
//               they are not reported, anything else breaks the run
//   --external  first path segments served by other sites (not part of _site)
//
// It also checks that every link from one VitePress app to another (landing page,
// /latest/, /dev/, /vX.Y/) carries a `target` attribute: without it the app's client
// router handles the click and shows its own 404 page (.vitepress/apps.ts).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, posix, resolve } from 'node:path'
import { parseArgs } from 'node:util'

export interface Problem {
  /** Page the reference is on, as a URL path */
  page: string
  ref: string
  /** Last path segment and anchor of the target: upgrading#050-unreleased */
  target: string
  why: string
}

const TAG = /<(a|img|link|script|source|iframe)\b[^>]*>/gi
const ATTR = /\s(?:href|src)=(?:"([^"]*)"|'([^']*)')/i
const ID = /\s(?:id|name)=(?:"([^"]*)"|'([^']*)')/gi
const SKIP = /^(?:[a-z][a-z0-9+.-]*:|\/\/|data:|#?$)/i

function unescapeHtml(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

/** URL path of a built page: `a/index.html` is `/a/`, `a/b.html` is `/a/b`. */
export function urlOf(file: string): string {
  return `/${file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')}`
}

export interface Page {
  url: string
  refs: string[]
  /** Same-site anchors that point into another app and have no `target`; only for VitePress pages */
  untargeted: string[]
  ids: Set<string>
}

const APP = /^\/(latest|dev|v\d+\.\d+)\//

/** The VitePress app that serves a URL path; the root page is the landing app, other paths belong to no app. */
export function appOf(path: string): string {
  return APP.exec(path)?.[1] ?? (path === '/' ? 'landing' : '')
}

/** Router links only: a path-absolute href that is not a file (the router ignores those). */
function routed(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) return false
  const last = href.replace(/[?#].*$/, '').split('/').pop() ?? ''
  return !/\.(?!html$)[a-z0-9]+$/i.test(last)
}

export function parsePage(url: string, html: string): Page {
  const body = html.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
  const refs: string[] = []
  const untargeted: string[] = []
  // Redirect pages and the like run no router; the VitePress mount point marks the others.
  const vitepress = /\sid="app"/.test(body)
  const own = appOf(url.replace(/\/404$/, '/'))
  for (const tag of body.matchAll(TAG)) {
    const m = ATTR.exec(tag[0])
    const ref = m?.[1] ?? m?.[2]
    if (vitepress && /^<a\b/i.test(tag[0]) && ref !== undefined && !/\starget=/i.test(tag[0])) {
      const href = unescapeHtml(ref)
      if (routed(href) && appOf(href.replace(/[?#].*$/, '')) !== own) untargeted.push(href)
    }
    if (ref !== undefined && !SKIP.test(ref)) refs.push(unescapeHtml(ref))
    // A fragment-only link points into the page itself.
    if (ref?.startsWith('#') && ref.length > 1) refs.push(unescapeHtml(ref))
  }
  const ids = new Set<string>()
  for (const m of body.matchAll(ID)) ids.add(unescapeHtml(m[1] ?? m[2]))
  return { url, refs, untargeted, ids }
}

function walk(dir: string, rel = ''): string[] {
  const out: string[] = []
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const path = posix.join(rel, e.name)
    if (e.isDirectory()) out.push(...walk(dir, path))
    else out.push(path)
  }
  return out
}

/** The files a URL path can be served from, the way Pages does. */
function candidates(path: string): string[] {
  const p = decodeURIComponent(path).replace(/^\//, '')
  return p === '' || p.endsWith('/') ? [`${p}index.html`] : [p, `${p}.html`, `${p}/index.html`]
}

export interface Report {
  /** Problems by version: landing, latest, dev, v0.15, ... */
  byVersion: Map<string, Problem[]>
  pages: number
  refs: number
}

export function checkSite(site: string, external: string[] = [], known = new Set<string>()): Report {
  const files = walk(site)
  const exists = new Set(files)
  const pages = new Map<string, Page>()
  for (const f of files) {
    if (f.endsWith('.html')) pages.set(urlOf(f), parsePage(urlOf(f), readFileSync(join(site, f), 'utf8')))
  }
  // A page can be reached as /a/b and /a/b.html; anchors live on the file.
  const idsOf = (file: string): Set<string> | undefined => pages.get(urlOf(file))?.ids

  const byVersion = new Map<string, Problem[]>()
  let refs = 0

  for (const page of pages.values()) {
    const version = /^\/(latest|dev|v\d+\.\d+)\//.test(page.url) ? page.url.split('/')[1] : 'landing'
    const problems = byVersion.get(version) ?? []
    byVersion.set(version, problems)

    for (const href of new Set(page.untargeted)) {
      problems.push({ page: page.url, ref: href, target: href, why: 'link into another app without target="_self": the router shows a 404' })
    }

    for (const ref of page.refs) {
      refs++
      const u = new URL(ref, `http://site${page.url}`)
      if (external.some((e) => u.pathname === `/${e}` || u.pathname.startsWith(`/${e}/`))) continue

      const target = `${u.pathname.replace(/\/$/, '').split('/').pop()}${u.hash}`
      const report = (why: string): void => {
        if (!known.has(target)) problems.push({ page: page.url, ref, target, why })
      }

      const file = candidates(u.pathname).find((c) => exists.has(c))
      if (!file) {
        report('no such file')
        continue
      }
      const hash = decodeURIComponent(u.hash.slice(1))
      if (hash === '' || !file.endsWith('.html')) continue
      const ids = idsOf(file)
      if (ids && !ids.has(hash) && hash !== 'top') report(`no #${hash} on the page`)
    }
  }
  return { byVersion, pages: pages.size, refs }
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    options: {
      warn: { type: 'string', default: 'dev' },
      known: { type: 'string' },
      external: { type: 'string', default: 'helm-charts' },
    },
    allowPositionals: true,
  })
  const site = resolve(positionals[0] ?? '_site')
  if (!existsSync(site) || !statSync(site).isDirectory()) throw new Error(`${site}: no built site (run bun run build first)`)

  const warn = new Set((values.warn ?? '').split(',').filter(Boolean))
  const known = new Set(
    values.known
      ? readFileSync(values.known, 'utf8')
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l !== '' && !l.startsWith('#'))
      : [],
  )
  const report = checkSite(site, (values.external ?? '').split(',').filter(Boolean), known)
  console.log(`checked ${report.pages} pages, ${report.refs} internal references`)

  let failed = false
  for (const [version, problems] of [...report.byVersion].sort(([a], [b]) => a.localeCompare(b))) {
    if (problems.length === 0) {
      console.log(`ok       ${version}`)
      continue
    }
    const level = warn.has('*') || warn.has(version) ? 'warning' : 'error'
    if (level === 'error') failed = true
    console.log(`${level === 'error' ? 'BROKEN  ' : 'warning '} ${version}: ${problems.length} broken references`)
    const unique = new Map(problems.map((p) => [`${p.page} ${p.ref}`, p]))
    for (const p of [...unique.values()].slice(0, 40)) console.log(`  ${p.page} -> ${p.ref} (${p.why})`)
    if (unique.size > 40) console.log(`  ... and ${unique.size - 40} more`)
    console.log(`::${level} title=Broken links in ${version}::${problems.length} broken internal links or anchors in ${version}; see the log`)
  }
  process.exit(failed ? 1 : 0)
}
