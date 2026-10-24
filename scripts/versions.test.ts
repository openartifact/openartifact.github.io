// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { pickReleases } from './versions'

test('newest patch of each minor, newest minor first, capped', () => {
  const tags = ['v0.2.0', 'v0.3.0', 'v0.4.0', 'v0.4.1', 'v0.5.0', 'v0.5.1', 'v0.6.0', 'v0.7.0', 'v0.8.0', 'v0.8.1']
  expect(pickReleases(tags)).toEqual([
    { minor: 'v0.8', tag: 'v0.8.1' },
    { minor: 'v0.7', tag: 'v0.7.0' },
    { minor: 'v0.6', tag: 'v0.6.0' },
    { minor: 'v0.5', tag: 'v0.5.1' },
    { minor: 'v0.4', tag: 'v0.4.1' },
  ])
})

test('compares numerically, ignores pre-releases and other tags', () => {
  const tags = ['v1.2.9', 'v1.2.10', 'v1.3.0-rc.1', 'nightly', 'v1.10.0', 'v1.9.0']
  expect(pickReleases(tags, 3)).toEqual([
    { minor: 'v1.10', tag: 'v1.10.0' },
    { minor: 'v1.9', tag: 'v1.9.0' },
    { minor: 'v1.2', tag: 'v1.2.10' },
  ])
})

test('no tags, no releases', () => {
  expect(pickReleases([])).toEqual([])
})
