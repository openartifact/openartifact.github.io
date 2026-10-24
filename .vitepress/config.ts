// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type DefaultTheme, type HeadConfig } from 'vitepress'
import { base, docsDir, env, isLanding, repoSlug, siteOrigin } from './env'
import { repoLinks } from './links'
import { buildSidebar } from './sidebar'

const origin = process.env.OA_SITE_ORIGIN ?? siteOrigin
const siteRoot = `${origin}${env.siteBase}`
const github = `https://github.com/${repoSlug}`
const outDir = env.outDir ?? (isLanding ? '_site' : `_site/${env.version}`)
// Copied from openartifact/brand social/; served from the landing build's root.
const socialImage = `${siteRoot}brand/openartifact-social-dark.png`

const nav: DefaultTheme.NavItem[] = isLanding
  ? [
      { text: 'Documentation', link: `${siteRoot}latest/` },
      { text: 'Releases', link: `${github}/releases` },
    ]
  : [
      { text: 'Home', link: siteRoot },
      { text: 'Guide', link: '/getting-started/installation', activeMatch: '/getting-started/' },
      { text: 'Formats', link: '/formats/', activeMatch: '/formats/' },
      { text: 'Reference', link: '/reference/', activeMatch: '/reference/' },
      { text: 'Releases', link: `${github}/releases` },
    ]

const robotsNoindex: HeadConfig = ['meta', { name: 'robots', content: 'noindex' }]

export default defineConfig({
  title: 'OpenArtifact',
  description: 'Self-hosted artifact repository for 16 package formats.',
  lang: 'en-US',
  base,
  srcDir: isLanding ? 'landing' : docsDir,
  outDir,
  cacheDir: `.vitepress/cache/${isLanding ? 'landing' : env.version}`,
  cleanUrls: true,
  // README.md is the directory index on GitHub and on the site.
  rewrites: isLanding
    ? undefined
    : {
        'README.md': 'index.md',
        ':a/README.md': ':a/index.md',
        ':a/:b/README.md': ':a/:b/index.md',
      },
  // Example URLs in the docs (http://localhost:8080) are not links to check.
  ignoreDeadLinks: env.lenient || [/^https?:\/\/(localhost|127\.0\.0\.1)/],
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}brand/openartifact-mark-color.svg` }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${base}brand/openartifact-mark-color-32.png` }],
    // Only the latest docs are indexed; release docs are reached through the switcher.
    ...(isLanding || env.version === 'latest' ? [] : [robotsNoindex]),
    // Link previews (Slack, LinkedIn, X, ...): the repository's GitHub social preview
    // only covers github.com links, the site needs its own tags. Absolute URLs required.
    ['meta', { property: 'og:site_name', content: 'OpenArtifact' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: socialImage }],
    ['meta', { property: 'og:image:width', content: '1280' }],
    ['meta', { property: 'og:image:height', content: '640' }],
    ['meta', { property: 'og:image:alt', content: 'OpenArtifact' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: socialImage }],
  ],
  markdown: {
    config: (md) => repoLinks(md),
  },
  vite: {
    // The shared installCommands.ts sits in a checkout whose web/tsconfig.json extends
    // packages that are not installed here; a string tsconfigRaw skips the lookup.
    esbuild: { tsconfigRaw: '{}' },
    resolve: {
      // The docs render the same client snippets as the web UI.
      alias: [
        { find: '@oa/install', replacement: join(env.srcDir, 'web/src/lib/installCommands.ts') },
        // The markdown lives in another checkout, outside this repo's node_modules.
        { find: /^vue(\/.*)?$/, replacement: `${resolve('node_modules/vue')}$1` },
      ],
    },
    server: { fs: { allow: [resolve('.'), env.srcDir] } },
  },
  themeConfig: {
    logo: {
      light: '/brand/openartifact-horizontal-color.svg',
      dark: '/brand/openartifact-horizontal-color-dark.svg',
      alt: 'OpenArtifact',
    },
    siteTitle: false,
    nav,
    sidebar: isLanding ? undefined : buildSidebar(docsDir),
    socialLinks: [{ icon: 'github', link: github }],
    // The landing page has nothing to index; its search (LandingSearch.vue) hands queries to the latest docs.
    search: isLanding ? undefined : { provider: 'local' },
    editLink: isLanding
      ? undefined
      : {
          pattern: `${github}/edit/main/docs/:path`,
          text: 'Edit this page on GitHub',
        },
    outline: { level: [2, 3] },
    footer: {
      message: 'Free software under the AGPL-3.0-or-later.',
      copyright: 'Copyright The OpenArtifact Authors',
    },
    // Read by the theme components.
    // @ts-expect-error custom theme keys
    oa: { siteRoot: env.siteBase, version: isLanding ? '' : env.version, ref: env.ref },
  },
  transformHead({ pageData, title, description }) {
    const path = pageData.relativePath.replace(/(^|\/)(index|README)\.md$/, '$1').replace(/\.md$/, '')
    const url = `${origin}${base}${path}`
    return [
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    ] satisfies HeadConfig[]
  },
  buildEnd(cfg) {
    // Logos come from the brand repo (copied into brand/); neither they nor the
    // product screenshots sit in a VitePress public dir, so ship them next to the pages.
    mkdirSync(cfg.outDir, { recursive: true })
    cpSync(resolve('brand'), join(cfg.outDir, 'brand'), { recursive: true })
    const shots = join(env.srcDir, 'docs', 'assets', 'screenshots')
    if (isLanding && existsSync(shots)) cpSync(shots, join(cfg.outDir, 'screenshots'), { recursive: true })
  },
})
