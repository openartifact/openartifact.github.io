// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { parseFormatMatrix } from '../.vitepress/formats'

test('names, pages and repository types come from the matrix rows only', () => {
  const md = [
    '| Format | Format id | Client URL | Types | Upload | Page |',
    '|---|---|---|---|---|---|',
    '| Arch Linux (pacman) | `pacman` | `HOST/repos/REPO/os/<arch>` | hosted | `PUT /os/<arch>/<pkg>` | [pacman](pacman.md) |',
    '| sbt | `sbt` | `HOST/repos/sbt/REPO` | hosted, proxy, group | `PUT` | [ivy-sbt](ivy-sbt.md) |',
    '| not a format | text | a | b | c | d |',
  ].join('\n')
  expect(parseFormatMatrix(md)).toEqual([
    { name: 'Arch Linux (pacman)', page: 'pacman', types: ['hosted'] },
    { name: 'sbt', page: 'ivy-sbt', types: ['hosted', 'proxy', 'group'] },
  ])
})
