// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Format {
  /** Name as the format matrix writes it: "Arch Linux (pacman)" */
  name: string
  /** Page under docs/formats/ without extension: pacman */
  page: string
}

/**
 * The formats of a docs version, read from the matrix in docs/formats/README.md
 * (`| Name | `id` | ... | [page](page.md) |`), so the landing page never lists
 * fewer or more formats than the documentation it links to.
 */
export function listFormats(docsDir: string): Format[] {
  const file = join(docsDir, 'formats', 'README.md')
  if (!existsSync(file)) return []
  return parseFormatMatrix(readFileSync(file, 'utf8'))
}

export function parseFormatMatrix(markdown: string): Format[] {
  const out: Format[] = []
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').map((c) => c.trim())
    // ['', name, `id`, url, types, upload, [page](page.md), '']
    if (cells.length < 8 || !/^`[a-z0-9-]+`$/.test(cells[2])) continue
    const page = /\]\(([a-z0-9-]+)\.md\)/.exec(cells[cells.length - 2])
    if (page) out.push({ name: cells[1], page: page[1] })
  }
  return out
}
