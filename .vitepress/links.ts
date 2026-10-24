// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { existsSync, statSync } from 'node:fs'
import { posix, relative, resolve } from 'node:path'
import type MarkdownIt from 'markdown-it'
import { docsDir, env, repoSlug } from './env'

const SCHEME = /^[a-z][a-z0-9+.-]*:/i

/**
 * Markdown in docs/ links to files outside docs/ (../README.md,
 * ../../internal/...): fine on GitHub, dead on the site. Rewrite those links to
 * the GitHub file or directory at the ref this version was built from, and fail
 * the build when the target does not exist.
 */
export function repoLinks(md: MarkdownIt): void {
  const docsRel = relative(env.srcDir, docsDir).split('\\').join('/')

  md.core.ruler.push('oa-repo-links', (state) => {
    const page: string = state.env?.relativePath ?? ''

    for (const block of state.tokens) {
      for (const tok of block.children ?? []) {
        if (tok.type !== 'link_open') continue
        const href = tok.attrGet('href')
        if (!href || href.startsWith('#') || href.startsWith('/') || SCHEME.test(href)) continue

        const [path, hash = ''] = href.split(/#(.*)/s, 2)
        const target = posix.normalize(posix.join(docsRel, posix.dirname(page), path))
        if (target === '..' || target.startsWith('../')) throw new Error(`${page}: link ${href} leaves the repository`)
        // Pages and assets inside docs/ are resolved by VitePress itself.
        if (target.startsWith(`${docsRel}/`)) continue

        const abs = resolve(env.srcDir, target)
        if (!existsSync(abs)) {
          if (env.lenient) continue
          throw new Error(`${page}: dead link ${href} (no ${target} in the repository)`)
        }

        const kind = statSync(abs).isDirectory() ? 'tree' : 'blob'
        tok.attrSet('href', `https://github.com/${repoSlug}/${kind}/${env.ref}/${target}${hash ? `#${hash}` : ''}`)
      }
    }
  })
}
