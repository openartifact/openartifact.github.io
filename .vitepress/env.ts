// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Build parameters, all from the environment so one config builds the landing
// page, the latest docs and every release's docs.
//
//   OA_TARGET     landing | docs                         (default docs)
//   OA_VERSION    docs version: latest, dev or vX.Y      (default latest)
//                 latest = newest release, dev = main (unreleased)
//   OA_LABEL      what the version is called in titles   (default: the version; for latest the tag, v0.16.1)
//   OA_LATEST     tag served as latest, for the banner and landing page (default: none)
//   OA_SRC_DIR    checkout of openartifact/openartifact for this version
//   OA_REF        git ref used in GitHub links           (default main)
//   OA_SITE_BASE  URL path the site root is served at    (default /)
//   OA_LENIENT    1 tolerates dead links (old releases built with today's theme)
//   OA_OUT_DIR    output directory                       (default _site/<version> or _site)
import { resolve } from 'node:path'

export const repoSlug = 'openartifact/openartifact'
export const siteOrigin = 'https://openartifact.github.io'

const siteBase = (process.env.OA_SITE_BASE ?? '/').replace(/\/?$/, '/')

export const env = {
  target: process.env.OA_TARGET === 'landing' ? 'landing' : 'docs',
  version: process.env.OA_VERSION ?? 'latest',
  label: process.env.OA_LABEL,
  latest: process.env.OA_LATEST ?? '',
  srcDir: resolve(process.env.OA_SRC_DIR ?? '../openartifact'),
  ref: process.env.OA_REF ?? 'main',
  siteBase,
  lenient: process.env.OA_LENIENT === '1',
  outDir: process.env.OA_OUT_DIR,
}

export const isLanding = env.target === 'landing'
export const docsDir = resolve(env.srcDir, 'docs')
/** URL path the built pages are served under. */
export const base = isLanding ? siteBase : `${siteBase}${env.version}/`

/** latest = newest release; dev = main, not released yet; anything else is an older minor line. */
export const kind: 'landing' | 'latest' | 'dev' | 'old' = isLanding
  ? 'landing'
  : env.version === 'latest' || env.version === 'dev'
    ? env.version
    : 'old'
