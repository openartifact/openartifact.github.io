// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import type { DefaultTheme } from 'vitepress'

type Entry = [text: string, page: string]

// Navigation over the docs tree: the order and the labels. Pages are listed by
// their path under docs/ (README.md is the directory index). A page that does
// not exist in the checked-out version is skipped, so old releases build with
// the same sidebar. A page that exists but is not listed here is appended to the
// group of its directory (see `unlistedPages`), so no page is ever unreachable;
// scripts/sidebar.test.ts makes CI ask for a proper place and label.
const groups: { text: string; dir: string; open?: boolean; items: Entry[] }[] = [
  {
    text: 'Getting started',
    dir: 'getting-started',
    open: true,
    items: [
      ['Overview', 'README'],
      ['Installation', 'getting-started/installation'],
      ['Your first repository', 'getting-started/first-repository'],
      ['Configuration', 'getting-started/configuration'],
      ['Web UI', 'getting-started/web-ui'],
      ['Language', 'getting-started/language'],
      ['Upgrading', 'getting-started/upgrading'],
    ],
  },
  {
    text: 'Formats',
    dir: 'formats',
    items: [
      ['Format matrix', 'formats/README'],
      ['Client setup', 'formats/client-setup'],
      ['Alpine (apk)', 'formats/apk'],
      ['Ansible', 'formats/ansible'],
      ['Arch Linux (pacman)', 'formats/pacman'],
      ['Cargo', 'formats/cargo'],
      ['Composer', 'formats/composer'],
      ['Conan', 'formats/conan'],
      ['Conda', 'formats/conda'],
      ['Debian', 'formats/debian'],
      ['Docker / OCI', 'formats/docker'],
      ['Go', 'formats/go'],
      ['Helm', 'formats/helm'],
      ['Hugging Face', 'formats/huggingface'],
      ['Ivy and sbt', 'formats/ivy-sbt'],
      ['Maven', 'formats/maven'],
      ['Nix', 'formats/nix'],
      ['npm', 'formats/npm'],
      ['NuGet', 'formats/nuget'],
      ['PyPI', 'formats/pypi'],
      ['Raw', 'formats/raw'],
      ['RPM', 'formats/rpm'],
      ['RubyGems', 'formats/rubygems'],
      ['Terraform / OpenTofu', 'formats/terraform'],
    ],
  },
  {
    text: 'Repositories',
    dir: 'repositories',
    items: [
      ['Hosted, proxy and group', 'repositories/hosted-proxy-group'],
      ['Cleanup and quotas', 'repositories/cleanup-and-quotas'],
      ['Trash', 'operations/trash'],
      ['Properties', 'repositories/properties'],
      ['Release bundles', 'repositories/release-bundles'],
    ],
  },
  {
    text: 'Security',
    dir: 'security',
    items: [
      ['Authentication', 'security/authentication'],
      ['Single sign-on', 'security/sso'],
      ['RBAC', 'security/rbac'],
      ['Projects', 'security/projects'],
      ['Scanning', 'security/scanning'],
      ['Scanner setup', 'security/scanner-setup'],
      ['Local OSV mirror', 'security/osv-mirror'],
      ['Security findings', 'security/findings'],
      ['KEV and EPSS signals', 'security/exploit-signals'],
      ['SBOM and VEX', 'security/sbom'],
      ['Dependency-Track', 'security/dependency-track'],
      ['License metadata', 'security/licenses'],
      ['Signing', 'security/signing'],
      ['Threat model', 'security/threat-model'],
    ],
  },
  {
    text: 'Operations',
    dir: 'operations',
    items: [
      ['Storage', 'operations/storage'],
      ['Storage tiers', 'operations/storage-tiering'],
      ['Blob replication', 'operations/replication'],
      ['Scaling and roles', 'operations/scaling'],
      ['Backup', 'operations/backup'],
      ['Federation', 'operations/federation'],
      ['Disaster recovery', 'operations/disaster-recovery'],
      ['PostgreSQL PITR', 'operations/postgres-pitr'],
      ['Rebuild from storage', 'operations/rebuild-from-storage'],
      ['Monitoring', 'operations/monitoring'],
      ['Webhooks', 'operations/webhooks'],
      ['Audit log retention', 'operations/audit-retention'],
      ['Branding', 'operations/branding'],
      ['Performance', 'operations/performance'],
    ],
  },
  {
    text: 'Integrations',
    dir: 'integrations',
    items: [
      ['CLI', 'integrations/cli'],
      ['CI integration', 'integrations/ci'],
      ['Declarative configuration', 'integrations/declarative'],
      ['MCP server', 'integrations/mcp'],
      ['REST API', 'integrations/api'],
      ['AI analysis', 'integrations/ai-analysis'],
      ['yap', 'integrations/yap'],
    ],
  },
  {
    text: 'Reference',
    dir: 'reference',
    items: [
      ['Overview', 'reference/README'],
      ['Configuration keys', 'reference/config'],
      ['Metrics', 'reference/metrics'],
      ['CLI commands', 'reference/cli'],
      ['REST API', 'reference/api/README'],
    ],
  },
  {
    text: 'Design',
    dir: 'design',
    items: [
      ['Federated repositories', 'design/federation'],
      ['Format plugins', 'design/format-plugins'],
    ],
  },
  {
    text: 'Migration',
    dir: 'migration',
    items: [
      ['From Nexus / Artifactory', 'migration/nexus-artifactory'],
      ['From an older OpenArtifact', 'migration/openartifact'],
    ],
  },
  {
    text: 'Development',
    dir: 'development',
    items: [
      ['Development guide', 'development/README'],
      ['Architecture', 'development/architecture'],
      ['Adding a format', 'development/adding-a-format'],
      ['Testing', 'development/testing'],
      ['Fuzzing', 'development/fuzzing'],
      ['CI and releases', 'development/ci-and-releases'],
      ['Translations', 'development/translations'],
      ['Documentation style', 'development/docs-style'],
    ],
  },
]

/** The URL a docs page is served at (README.md becomes the directory index). */
export function pageLink(page: string): string {
  if (page === 'README') return '/'
  return `/${page.replace(/\/?README$/, '/')}`
}

/** First `# ` heading of a markdown file, or the file name. */
function title(file: string, fallback: string): string {
  const m = /^# (.+)$/m.exec(readFileSync(file, 'utf8'))
  return m ? m[1].trim() : fallback
}

/** One entry per generated REST API page (tags and schemas), under the API index. */
function apiPages(docsDir: string): DefaultTheme.SidebarItem[] {
  const dir = join(docsDir, 'reference', 'api')
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort()
    .map((f) => {
      const slug = f.replace(/\.md$/, '')
      return { text: title(join(dir, f), slug), link: `/reference/api/${slug}` }
    })
}

/** Every docs page as its path under docs/ without `.md`, except the generated REST API pages. */
export function docsPages(docsDir: string): string[] {
  const out: string[] = []
  const walk = (rel: string): void => {
    for (const e of readdirSync(join(docsDir, rel), { withFileTypes: true })) {
      const path = posix.join(rel, e.name)
      if (e.isDirectory()) {
        if (path !== 'reference/api' && path !== 'assets') walk(path)
      } else if (e.name.endsWith('.md')) out.push(path.slice(0, -'.md'.length))
    }
  }
  walk('')
  return out.sort()
}

/** Pages that exist in the checkout but have no entry in `groups`. */
export function unlistedPages(docsDir: string): string[] {
  const listed = new Set(groups.flatMap((g) => g.items.map(([, page]) => page)))
  return docsPages(docsDir).filter((p) => !listed.has(p))
}

/** Group an unlisted page falls into: the group of its directory, a new one for a new directory. */
function groupOf(page: string): { text: string; dir: string } {
  const dir = page.includes('/') ? page.slice(0, page.indexOf('/')) : 'getting-started'
  return groups.find((g) => g.dir === dir) ?? { text: dir.charAt(0).toUpperCase() + dir.slice(1).replace(/-/g, ' '), dir }
}

export function buildSidebar(docsDir: string): DefaultTheme.Sidebar {
  const sections = new Map<string, { open: boolean; items: DefaultTheme.SidebarItem[] }>()

  for (const g of groups) {
    const items: DefaultTheme.SidebarItem[] = g.items
      .filter(([, page]) => existsSync(join(docsDir, `${page}.md`)))
      .map(([text, page]) => ({ text, link: pageLink(page) }))

    if (g.text === 'Reference') {
      const api = apiPages(docsDir)
      const idx = items.findIndex((i) => i.link === '/reference/api/')
      if (idx >= 0 && api.length > 0) {
        items[idx] = { text: 'REST API', link: '/reference/api/', collapsed: true, items: api }
      }
    }
    sections.set(g.text, { open: g.open ?? false, items })
  }

  // Pages nobody has placed yet still show up, under the group of their directory.
  for (const page of unlistedPages(docsDir)) {
    const g = groupOf(page)
    const section = sections.get(g.text) ?? { open: false, items: [] }
    section.items.push({ text: title(join(docsDir, `${page}.md`), page), link: pageLink(page) })
    sections.set(g.text, section)
  }

  return [...sections]
    .filter(([, s]) => s.items.length > 0)
    .map(([text, s]) => ({ text, collapsed: !s.open, items: s.items }))
}
