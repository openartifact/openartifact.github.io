// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Heading ids the way GitHub makes them. The docs are written for GitHub
 * (`#the-public-url-and-base_url`, `#0150`), so the site must produce the same
 * anchors or those links land at the top of the page.
 *
 * Lower-case, drop everything except letters, numbers, marks, `_`, `-` and
 * spaces, then turn each space into `-`. Repeated headings get `-1`, `-2`
 * from markdown-it-anchor, as on GitHub.
 */
export function ghSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_\- ]/gu, '')
    .replace(/ /g, '-')
}
