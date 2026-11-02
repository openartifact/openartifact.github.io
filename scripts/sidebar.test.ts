// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildSidebar, docsPages, unlistedPages } from '../.vitepress/sidebar'

// The docs live in another repository: point OA_SRC_DIR at a checkout of it.
// CI sets OA_STRICT_SIDEBAR=1, where a missing checkout or an unlisted page fails.
// The deploy workflow runs without it: a page added to the docs meanwhile is still
// listed (under its directory's group), it just waits for a proper place.
const strict = process.env.OA_STRICT_SIDEBAR === '1'
const docs = resolve(process.env.OA_SRC_DIR ?? '../openartifact', 'docs')

if (strict && !existsSync(docs)) throw new Error(`OA_STRICT_SIDEBAR=1 needs the docs checkout: ${docs} does not exist`)

const have = existsSync(docs)

test.skipIf(!strict || !have)('every docs page has an entry in sidebar.ts', () => {
  expect(unlistedPages(docs)).toEqual([])
})

test.skipIf(!have)('the sidebar links every docs page exactly once', () => {
  const links: string[] = []
  const walk = (items: { link?: string; items?: unknown[] }[]): void => {
    for (const i of items) {
      if (i.link) links.push(i.link)
      if (i.items) walk(i.items as typeof items)
    }
  }
  walk(buildSidebar(docs) as { link?: string; items?: unknown[] }[])

  expect(new Set(links).size).toBe(links.length)
  const want = docsPages(docs).map((p) => (p === 'README' ? '/' : `/${p.replace(/\/?README$/, '/')}`))
  for (const w of want) expect(links).toContain(w)
})
