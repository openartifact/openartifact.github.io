// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/** The `themeConfig.oa` object set in config.ts. */
export interface OaTheme {
  siteRoot: string
  /** latest, dev, vX.Y; empty on the landing page */
  version: string
  kind: 'landing' | 'latest' | 'dev' | 'old'
  /** Version as titles show it: v0.16.1, dev, v0.15 */
  label: string
  /** Release served as latest: v0.16.1 */
  latest: string
  ref: string
  formats: { name: string; page: string; types: string[] }[]
}

/** One entry of /versions.json. */
export interface VersionEntry {
  name: string
  label: string
  /** Minor line served under this name as well: latest is v0.16 */
  minor?: string
}

/**
 * Where the page the reader is on lives in another version: the same page when
 * that version has it, the version's index otherwise.
 */
export async function samePage(oa: OaTheme, target: string): Promise<string> {
  const here = `${oa.siteRoot}${oa.version}/`
  const rest = window.location.pathname.startsWith(here) ? window.location.pathname.slice(here.length) : ''
  const ok = await fetch(`${oa.siteRoot}${target}/${rest}`, { method: 'HEAD' })
    .then((r) => r.ok)
    .catch(() => false)
  return ok ? `${oa.siteRoot}${target}/${rest}${window.location.hash}` : `${oa.siteRoot}${target}/`
}
