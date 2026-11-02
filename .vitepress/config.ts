// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, type DefaultTheme, type HeadConfig } from 'vitepress'
import { frontmatterTargets, navTargets } from './apps'
import { describePages } from './description'
import { base, docsDir, env, isLanding, kind, repoSlug, siteOrigin } from './env'
import { listFormats } from './formats'
import { repoLinks } from './links'
import { buildSidebar } from './sidebar'
import { ghSlug } from './slug'

const origin = process.env.OA_SITE_ORIGIN ?? siteOrigin
const siteRoot = `${origin}${env.siteBase}`
const github = `https://github.com/${repoSlug}`
/** What a docs version is called in titles and the banner: v0.16.1, dev, v0.15. */
const label = env.label ?? (kind === 'latest' && env.latest ? env.latest : env.version)
const outDir = env.outDir ?? (isLanding ? '_site' : `_site/${env.version}`)
// Copied from openartifact/brand social/; served from the landing build's root.
const socialImage = `${siteRoot}brand/openartifact-social-dark.png`

const scope = { siteRoot: env.siteBase, version: isLanding ? '' : env.version, origin }

// The theme puts the app's base in front of a path, so these are paths below this app's
// base; the way out of a docs app is an absolute URL of the site. apps.ts adds target="_self"
// to those that leave the app.
const nav: DefaultTheme.NavItem[] = isLanding
  ? [
      { text: 'Documentation', link: '/latest/', noIcon: true },
      { text: 'Development docs', link: '/dev/', noIcon: true },
      { text: 'Releases', link: `${github}/releases` },
    ]
  : [
      { text: 'Home', link: siteRoot, noIcon: true },
      { text: 'Guide', link: '/getting-started/installation', activeMatch: '/getting-started/' },
      { text: 'Formats', link: '/formats/', activeMatch: '/formats/' },
      { text: 'Reference', link: '/reference/', activeMatch: '/reference/' },
      { text: 'Releases', link: `${github}/releases` },
    ]

// Only /latest/ and the landing page are indexed: dev is unreleased, vX.Y are older.
const indexed = isLanding || kind === 'latest'
const robotsNoindex: HeadConfig = ['meta', { name: 'robots', content: 'noindex' }]

export default defineConfig({
  title: 'OpenArtifact',
  titleTemplate: isLanding ? undefined : `:title | OpenArtifact ${label}`,
  description: 'Self-hosted artifact repository for many package formats.',
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
    ...(indexed ? [] : [robotsNoindex]),
    // Link previews (Slack, LinkedIn, X, ...): the repository's GitHub social preview
    // only covers github.com links, the site needs its own tags. Absolute URLs required.
    ['meta', { property: 'og:site_name', content: 'OpenArtifact' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: socialImage }],
    ['meta', { property: 'og:image:width', content: '1280' }],
    ['meta', { property: 'og:image:height', content: '640' }],
    ['meta', { property: 'og:image:alt', content: 'OpenArtifact: self-hosted artifact repository' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: socialImage }],
  ],
  markdown: {
    // GitHub's heading ids, so the anchors written for GitHub work here too.
    anchor: { slugify: ghSlug },
    headers: { level: [2, 3, 4, 5, 6], slugify: ghSlug },
    toc: { slugify: ghSlug },
    // No PromQL grammar is bundled; YAML colours the metric names and strings well enough.
    languageAlias: { promql: 'yaml' },
    config: (md) => {
      repoLinks(md)
      describePages(md)
    },
  },
  // Page urls are written relative to the base, the hostname has to carry it.
  sitemap: indexed ? { hostname: `${origin}${base}` } : undefined,
  vite: {
    build: { chunkSizeWarningLimit: 2000 },
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
    nav: navTargets(scope, nav),
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
    oa: {
      siteRoot: env.siteBase,
      version: isLanding ? '' : env.version,
      kind,
      label,
      latest: env.latest,
      ref: env.ref,
      // The landing page lists the formats of the docs it links to.
      formats: isLanding ? listFormats(docsDir) : [],
    },
  },
  // Links into another app of the site must not go through this app's router (apps.ts).
  transformPageData(pageData) {
    frontmatterTargets(scope, pageData.frontmatter)
  },
  transformHead({ pageData, title, description }) {
    const path = pageData.relativePath.replace(/(^|\/)(index|README)\.md$/, '$1').replace(/\.md$/, '')
    const url = `${origin}${base}${path}`
    return [
      ...(pageData.relativePath === '404.md' ? [] : [['link', { rel: 'canonical', href: url }] as HeadConfig]),
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
