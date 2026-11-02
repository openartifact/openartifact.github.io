// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { createMarkdownRenderer } from 'vitepress'
import { clip, firstParagraph } from '../.vitepress/description'
import { readmeToIndex } from '../.vitepress/links'

test('the first paragraph is the description, as plain text', async () => {
  const md = await createMarkdownRenderer('.', {}, '/')
  const tokens = md.parse('<!-- SPDX -->\n\n# Title\n\nUse **this** page with `code` and [a link](x.md).\n\nSecond.', {})
  expect(firstParagraph(tokens)).toBe('Use this page with code and a link.')
})

test('long text is cut at a word with an ellipsis', () => {
  const text = `${'word '.repeat(80)}end`
  const out = clip(text, 50)
  expect(out.length).toBeLessThanOrEqual(51)
  expect(out.endsWith('…')).toBe(true)
  expect(clip('short')).toBe('short')
})

test('README targets become directory urls', () => {
  expect(readmeToIndex('formats/README.md')).toBe('formats/')
  expect(readmeToIndex('../development/README.md')).toBe('../development/')
  expect(readmeToIndex('README.md')).toBe('./')
  expect(readmeToIndex('formats/npm.md')).toBe('formats/npm.md')
  expect(readmeToIndex('MYREADME.md')).toBe('MYREADME.md')
})
