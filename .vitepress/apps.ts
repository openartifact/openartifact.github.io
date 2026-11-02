// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// The site is several VitePress apps on one origin: the landing page at the root
// and every docs version under its own prefix (/latest/, /dev/, /v0.15/). Each app
// only knows its own pages. VitePress' client router intercepts every same-origin
// link, so a link into another app is looked up in the wrong app and renders its
// 404 page, although the URL is served fine.
//
// The router leaves links that carry a `target` attribute alone (router.js:
// `link.hasAttribute('target')`), so the browser does a full page load. This
// module decides which links are cross-app and gives them `target="_self"`; the
// config (nav, page frontmatter) and the theme components all go through it, and
// scripts/apps.test.ts checks the built HTML. No file imports node modules: the
// theme components use it in the browser too.

/** Where an app lives: the site root and its version prefix ('' for the landing page). */
export interface AppScope {
  siteRoot: string
  version: string
  /** The site's origin (https://openartifact.github.io), to recognise absolute links to the site */
  origin?: string
}

/** The URL path prefix the app owns; the landing page owns the root page only. */
function owns(scope: AppScope, path: string): boolean {
  return scope.version ? path.startsWith(`${scope.siteRoot}${scope.version}/`) : path === scope.siteRoot
}

/** True for a link to a page of the same site that another app serves. */
export function isCrossApp(scope: AppScope, href: string): boolean {
  // Absolute URLs (other sites, mailto:) are the router's business, and `//host` is one.
  if (!href.startsWith(scope.siteRoot) || href.startsWith('//')) return false
  const path = href.replace(/[?#].*$/, '')
  return !owns(scope, path)
}

/** Attributes for an anchor: `target="_self"` when the link leaves the app. */
export function appLink(scope: AppScope, href: string): { href: string; target?: '_self' } {
  return isCrossApp(scope, href) ? { href, target: '_self' } : { href }
}

/**
 * The page path a link written in the config or in frontmatter ends up at. The theme
 * puts the app's base in front of a path-absolute link (`/guide` in /dev/ is /dev/guide);
 * an absolute URL of this site is its path as it is. Other URLs are none of our business.
 */
function configPath(scope: AppScope, link: string): string | undefined {
  if (scope.origin && link.startsWith(scope.origin)) return link.slice(scope.origin.length)
  if (!link.startsWith('/') || link.startsWith('//')) return undefined
  return `${scope.siteRoot}${scope.version ? `${scope.version}/` : ''}${link.slice(1)}`
}

/** The same for links given as `{ link, target }` objects (nav items, hero actions, features). */
export function withTarget<T extends { link?: string; target?: string }>(scope: AppScope, item: T): T {
  if (!item.link || item.target !== undefined) return item
  const path = configPath(scope, item.link)
  return path !== undefined && isCrossApp(scope, path) ? { ...item, target: '_self' } : item
}

type NavLike = { link?: string; target?: string; items?: NavLike[] }

/** Marks every cross-app entry of a nav tree. */
export function navTargets<T extends NavLike>(scope: AppScope, items: T[]): T[] {
  return items.map((i) => {
    const item = withTarget(scope, i)
    return item.items ? { ...item, items: navTargets(scope, item.items) } : item
  })
}

/** Marks the hero actions and feature links of a page's frontmatter. */
export function frontmatterTargets(scope: AppScope, fm: Record<string, any>): void {
  if (Array.isArray(fm.hero?.actions)) fm.hero.actions = fm.hero.actions.map((a: any) => withTarget(scope, a))
  if (Array.isArray(fm.features)) fm.features = fm.features.map((f: any) => withTarget(scope, f))
}
