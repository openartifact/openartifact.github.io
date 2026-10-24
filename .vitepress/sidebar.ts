// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DefaultTheme } from 'vitepress'

type Entry = [text: string, page: string]

// Diátaxis-shaped navigation over the docs tree. Pages are listed by their
// path under docs/ (README.md is the directory index); a page that does not
// exist in the checked-out version is skipped, so old releases build with the
// same sidebar.
const groups: { text: string; items: Entry[] }[] = [
  {
    text: 'Getting started',
    items: [
      ['Overview', 'README'],
      ['Installation', 'getting-started/installation'],
      ['Configuration', 'getting-started/configuration'],
      ['Upgrading', 'getting-started/upgrading'],
    ],
  },
  {
    text: 'Formats',
    items: [
      ['Format matrix', 'formats/README'],
      ['Client setup', 'formats/client-setup'],
      ['Maven', 'formats/maven'],
      ['npm', 'formats/npm'],
      ['PyPI', 'formats/pypi'],
      ['Docker / OCI', 'formats/docker'],
      ['Helm', 'formats/helm'],
      ['Debian', 'formats/debian'],
      ['RPM', 'formats/rpm'],
      ['Go', 'formats/go'],
      ['Cargo', 'formats/cargo'],
      ['NuGet', 'formats/nuget'],
      ['RubyGems', 'formats/rubygems'],
      ['Conda', 'formats/conda'],
      ['Conan', 'formats/conan'],
      ['Ivy and sbt', 'formats/ivy-sbt'],
      ['Raw', 'formats/raw'],
    ],
  },
  {
    text: 'Repositories',
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
    items: [
      ['Authentication', 'security/authentication'],
      ['Single sign-on', 'security/sso'],
      ['RBAC', 'security/rbac'],
      ['Projects', 'security/projects'],
      ['Scanning', 'security/scanning'],
      ['SBOM and VEX', 'security/sbom'],
      ['Dependency-Track', 'security/dependency-track'],
      ['License metadata', 'security/licenses'],
      ['Signing', 'security/signing'],
      ['Threat model', 'security/threat-model'],
    ],
  },
  {
    text: 'Operations',
    items: [
      ['Storage', 'operations/storage'],
      ['Storage tiers', 'operations/storage-tiering'],
      ['Blob replication', 'operations/replication'],
      ['Backup', 'operations/backup'],
      ['Federation', 'operations/federation'],
      ['Disaster recovery', 'operations/disaster-recovery'],
      ['PostgreSQL PITR', 'operations/postgres-pitr'],
      ['Rebuild from storage', 'operations/rebuild-from-storage'],
      ['Monitoring', 'operations/monitoring'],
      ['Webhooks', 'operations/webhooks'],
      ['Performance', 'operations/performance'],
    ],
  },
  {
    text: 'Integrations',
    items: [
      ['CLI', 'integrations/cli'],
      ['Declarative configuration', 'integrations/declarative'],
      ['MCP server', 'integrations/mcp'],
      ['REST API', 'integrations/api'],
      ['AI analysis', 'integrations/ai-analysis'],
      ['yap', 'integrations/yap'],
    ],
  },
  {
    text: 'Reference',
    items: [
      ['Overview', 'reference/README'],
      ['Configuration keys', 'reference/config'],
      ['Metrics', 'reference/metrics'],
      ['CLI commands', 'reference/cli'],
      ['REST API', 'reference/api/README'],
    ],
  },
  { text: 'Design', items: [['Federated repositories', 'design/federation']] },
  { text: 'Migration', items: [['From Nexus / Artifactory', 'migration/nexus-artifactory']] },
  {
    text: 'Development',
    items: [
      ['Development guide', 'development/README'],
      ['Architecture', 'development/architecture'],
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

export function buildSidebar(docsDir: string): DefaultTheme.Sidebar {
  const sidebar: DefaultTheme.SidebarItem[] = []

  for (const g of groups) {
    const items: DefaultTheme.SidebarItem[] = g.items
      .filter(([, page]) => existsSync(join(docsDir, `${page}.md`)))
      .map(([text, page]) => ({ text, link: pageLink(page) }))
    if (items.length === 0) continue

    if (g.text === 'Reference') {
      const api = apiPages(docsDir)
      const idx = items.findIndex((i) => i.link === '/reference/api/')
      if (idx >= 0 && api.length > 0) {
        items[idx] = { text: 'REST API', link: '/reference/api/', collapsed: true, items: api }
      }
    }

    sidebar.push({ text: g.text, collapsed: true, items })
  }

  return sidebar
}
