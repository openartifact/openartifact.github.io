// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * A static page that sends the reader to `target`. The meta refresh covers
 * readers without scripts; the script keeps the #anchor, which a refresh drops.
 */
export function redirectPage(target: string, canonical = target): string {
  const t = esc(target)
  const c = esc(canonical)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${c}">
<meta http-equiv="refresh" content="0; url=${t}">
<script>location.replace(${JSON.stringify(target)} + location.hash)</script>
</head>
<body><p>This page moved to <a href="${t}">${t}</a>.</p></body>
</html>
`
}

/** Every built page of `dir` as a path relative to it: `a/b.html`, `a/index.html`. */
export function htmlPages(dir: string, rel = ''): string[] {
  const out: string[] = []
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const path = posix.join(rel, e.name)
    if (e.isDirectory()) out.push(...htmlPages(dir, path))
    else if (e.name.endsWith('.html') && path !== '404.html') out.push(path)
  }
  return out
}

/** The URL path of a built page under its version: `a/b.html` is `a/b`, `a/index.html` is `a/`. */
export function pageUrl(file: string): string {
  return file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')
}

/**
 * Makes `from` answer every page of `to` with a redirect to the same page: the
 * newest minor line is served as /latest/, so its /vX.Y/ URLs keep working.
 */
export function redirectTree(origin: string, siteRoot: string, out: string, from: string, to: string): number {
  const pages = htmlPages(join(out, to))
  for (const file of pages) {
    const dest = join(out, from, file)
    mkdirSync(dirname(dest), { recursive: true })
    const target = `${siteRoot}${to}/${pageUrl(file)}`
    writeFileSync(dest, redirectPage(target, `${origin}${target}`))
  }
  return pages.length
}
