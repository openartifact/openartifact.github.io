// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pageUrl, redirectPage, redirectTree } from './redirect'

test('page urls drop index.html and .html', () => {
  expect(pageUrl('index.html')).toBe('')
  expect(pageUrl('formats/index.html')).toBe('formats/')
  expect(pageUrl('formats/npm.html')).toBe('formats/npm')
})

test('redirect keeps the anchor and escapes the target', () => {
  const html = redirectPage('/latest/a"b')
  expect(html).toContain('location.hash')
  expect(html).toContain('href="/latest/a&quot;b"')
})

test('a minor line mirrors every page of latest except 404', () => {
  const out = mkdtempSync(join(tmpdir(), 'oa-redirect-'))
  mkdirSync(join(out, 'latest', 'formats'), { recursive: true })
  for (const f of ['index.html', '404.html', 'formats/npm.html']) writeFileSync(join(out, 'latest', f), '')
  expect(redirectTree('https://x.test', '/', out, 'v0.16', 'latest')).toBe(2)
  expect(readFileSync(join(out, 'v0.16', 'formats', 'npm.html'), 'utf8')).toContain('/latest/formats/npm')
  const index = readFileSync(join(out, 'v0.16', 'index.html'), 'utf8')
  expect(index).toContain('url=/latest/"')
  expect(index).toContain('rel="canonical" href="https://x.test/latest/"')
})
