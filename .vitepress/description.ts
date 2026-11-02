// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'

const MAX = 200

/** Plain text of an inline token: text and code, no markup, images or HTML. */
function inlineText(tok: Token): string {
  let out = ''
  for (const c of tok.children ?? []) {
    if (c.type === 'text' || c.type === 'code_inline') out += c.content
    else if (c.type === 'softbreak' || c.type === 'hardbreak') out += ' '
  }
  return out.replace(/\s+/g, ' ').trim()
}

/** Cuts at a word boundary and adds an ellipsis only when something was cut. */
export function clip(text: string, max = MAX): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, '')}…`
}

/** First paragraph outside lists, quotes and tables, as plain text. */
export function firstParagraph(tokens: Token[]): string {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'paragraph_open' || tokens[i].level !== 0) continue
    const text = inlineText(tokens[i + 1])
    if (text) return clip(text)
  }
  return ''
}

/**
 * Pages without a `description` front matter get their first paragraph as the
 * meta description, so search snippets and link previews differ per page.
 */
export function describePages(md: MarkdownIt): void {
  md.core.ruler.push('oa-description', (state) => {
    const fm = state.env?.frontmatter
    if (!fm || fm.description) return
    const text = firstParagraph(state.tokens)
    if (text) fm.description = text
  })
}
