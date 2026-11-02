// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { appLink, frontmatterTargets, isCrossApp, navTargets } from '../.vitepress/apps'
import { appOf, checkSite, parsePage } from './check-links'

const landing = { siteRoot: '/', version: '' }
const dev = { siteRoot: '/', version: 'dev' }

test('links into another app are cross-app, links inside the app are not', () => {
  expect(isCrossApp(landing, '/latest/formats/npm')).toBe(true)
  expect(isCrossApp(landing, '/dev/#x')).toBe(true)
  expect(isCrossApp(landing, '/v0.15/')).toBe(true)
  expect(isCrossApp(landing, '/')).toBe(false)
  expect(isCrossApp(landing, '/?q=a#b')).toBe(false)
  expect(isCrossApp(dev, '/')).toBe(true)
  expect(isCrossApp(dev, '/latest/')).toBe(true)
  expect(isCrossApp(dev, '/dev/formats/npm')).toBe(false)
  expect(isCrossApp(dev, '/dev/')).toBe(false)
  // Not path-absolute links of this site: the router or the browser handle them.
  expect(isCrossApp(landing, 'https://github.com/openartifact/openartifact')).toBe(false)
  expect(isCrossApp(landing, '//example.org/latest/')).toBe(false)
  expect(isCrossApp(dev, 'formats/npm')).toBe(false)
  expect(isCrossApp({ siteRoot: '/site/', version: '' }, '/site/latest/')).toBe(true)
  expect(isCrossApp({ siteRoot: '/site/', version: '' }, '/site/')).toBe(false)
})

test('appLink, nav and frontmatter get target=_self only for cross-app links', () => {
  expect(appLink(landing, '/latest/')).toEqual({ href: '/latest/', target: '_self' })
  expect(appLink(dev, '/dev/a')).toEqual({ href: '/dev/a' })
  expect(
    navTargets(landing, [
      { text: 'Docs', link: '/latest/' },
      { text: 'More', items: [{ text: 'Dev', link: '/dev/' }, { text: 'GitHub', link: 'https://github.com/x' }] },
    ]),
  ).toEqual([
    { text: 'Docs', link: '/latest/', target: '_self' },
    {
      text: 'More',
      items: [{ text: 'Dev', link: '/dev/', target: '_self' }, { text: 'GitHub', link: 'https://github.com/x' }],
    },
  ])
  // Config links are below the app's base: `/guide` in /dev/ stays there, the site URL leaves.
  const docs = { siteRoot: '/', version: 'dev', origin: 'https://x.test' }
  expect(
    navTargets(docs, [
      { text: 'Home', link: 'https://x.test/' },
      { text: 'Guide', link: '/getting-started/installation' },
      { text: 'Releases', link: 'https://github.com/x/releases' },
    ]),
  ).toEqual([
    { text: 'Home', link: 'https://x.test/', target: '_self' },
    { text: 'Guide', link: '/getting-started/installation' },
    { text: 'Releases', link: 'https://github.com/x/releases' },
  ])
  const fm = { hero: { actions: [{ text: 'a', link: '/latest/x' }, { text: 'b', link: 'https://x.test' }] } }
  frontmatterTargets(landing, fm)
  expect(fm.hero.actions).toEqual([{ text: 'a', link: '/latest/x', target: '_self' }, { text: 'b', link: 'https://x.test' }])
})

test('the page scan flags cross-app anchors without target', () => {
  const page = (url: string, links: string) => parsePage(url, `<div id="app">${links}</div>`)
  expect(appOf('/')).toBe('landing')
  expect(appOf('/v0.15/a')).toBe('v0.15')
  expect(page('/', '<a href="/latest/a">x</a><a href="/latest/b" target="_self">y</a><a href="/">z</a>').untargeted).toEqual([
    '/latest/a',
  ])
  expect(page('/404', '<a href="/latest/">x</a>').untargeted).toEqual(['/latest/'])
  expect(page('/dev/a', '<a href="/">x</a><a href="/dev/b">y</a><a href="/versions.json">z</a>').untargeted).toEqual(['/'])
  // Redirect pages have no router.
  expect(parsePage('/v0.15/a', '<a href="/latest/a">x</a>').untargeted).toEqual([])
})

// Builds the landing page and two docs apps with the real config and scans the HTML.
// Needs the docs checkout (OA_SRC_DIR, ../openartifact by default).
const src = resolve(process.env.OA_SRC_DIR ?? '../openartifact')
const have = existsSync(join(src, 'docs'))
if (process.env.OA_STRICT_SIDEBAR === '1' && !have) throw new Error(`the build test needs the docs checkout: ${src}/docs does not exist`)

test.skipIf(!have)(
  'every cross-app anchor of the built pages carries target=_self',
  () => {
    const out = mkdtempSync(join(tmpdir(), 'oa-apps-'))
    try {
      const build = (env: Record<string, string>): void => {
        const p = Bun.spawnSync(['bunx', '--bun', 'vitepress', 'build'], {
          env: { ...process.env, OA_SRC_DIR: src, OA_LENIENT: '1', OA_LATEST: 'v9.9.9', ...env },
          stdout: 'pipe',
          stderr: 'pipe',
        })
        if (p.exitCode !== 0) throw new Error(`vitepress build failed: ${p.stderr.toString()}${p.stdout.toString()}`)
      }
      build({ OA_TARGET: 'landing', OA_OUT_DIR: out })
      build({ OA_TARGET: 'docs', OA_VERSION: 'dev', OA_OUT_DIR: join(out, 'dev') })
      build({ OA_TARGET: 'docs', OA_VERSION: 'v0.1', OA_OUT_DIR: join(out, 'v0.1') })

      // The scan must not pass for lack of links: the landing page links to the formats, hero buttons and nav.
      const index = readFileSync(join(out, 'index.html'), 'utf8')
      const anchors = [...index.matchAll(/<a\b[^>]*\bhref="\/(?:latest|dev)\/[^"]*"[^>]*>/g)].map((m) => m[0])
      expect(anchors.length).toBeGreaterThan(10)
      expect(anchors.filter((a) => !/\btarget="_self"/.test(a))).toEqual([])
      expect(readFileSync(join(out, 'dev', 'index.html'), 'utf8')).toMatch(/<a\b[^>]*\bhref="\/latest\/"[^>]*target="_self"/)

      const report = checkSite(out, [], new Set())
      const problems = [...report.byVersion.values()].flat().filter((p) => p.why.includes('target='))
      expect(problems).toEqual([])
    } finally {
      rmSync(out, { recursive: true, force: true })
    }
  },
  300_000,
)
