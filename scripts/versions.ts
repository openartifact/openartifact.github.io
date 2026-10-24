// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export interface Release {
  /** Minor line, the URL segment: v0.8 */
  minor: string
  /** Newest stable tag of that line: v0.8.1 */
  tag: string
}

const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/

/**
 * The newest stable tag of each of the last `keep` minor lines, newest first.
 * Pre-releases (v1.0.0-rc.1) and non-version tags are ignored.
 */
export function pickReleases(tags: string[], keep = 5): Release[] {
  const newest = new Map<string, { v: [number, number, number]; tag: string }>()

  for (const tag of tags) {
    const m = STABLE.exec(tag)
    if (!m) continue
    const v: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])]
    const minor = `v${m[1]}.${m[2]}`
    const cur = newest.get(minor)
    if (!cur || v[2] > cur.v[2]) newest.set(minor, { v, tag })
  }

  return [...newest.entries()]
    .sort(([, a], [, b]) => b.v[0] - a.v[0] || b.v[1] - a.v[1])
    .slice(0, keep)
    .map(([minor, { tag }]) => ({ minor, tag }))
}
