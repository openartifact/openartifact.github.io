<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import type { OaTheme, VersionEntry } from './oa'

// Pages in a version that does not have them, and versions that were retired,
// end up here. GitHub Pages serves the root 404 page for every unknown path, so
// the landing build's copy is the one readers see; it works out where they were.
const { theme } = useData()
const oa = computed(() => theme.value.oa as OaTheme)
const path = ref('')

const VERSION = /^v(\d+)\.(\d+)$/

const query = computed(() => {
  const last = path.value.replace(/\/+$/, '').split('/').pop() ?? ''
  return decodeURIComponent(last).replace(/\.(html|md)$/, '').replace(/[-_]+/g, ' ')
})

const searchHref = computed(() => `${oa.value.siteRoot}latest/?q=${encodeURIComponent(query.value)}`)

function minor(name: string): [number, number] | undefined {
  const m = VERSION.exec(name)
  return m ? [Number(m[1]), Number(m[2])] : undefined
}

// A /vX.Y/ URL whose minor line is no longer published goes to the oldest
// version that is, on the same page.
onMounted(async () => {
  path.value = window.location.pathname
  const root = oa.value.siteRoot
  if (!path.value.startsWith(root)) return
  const [seg, ...rest] = path.value.slice(root.length).split('/')
  const gone = minor(seg)
  if (!gone) return

  try {
    const res = await fetch(`${root}versions.json`, { cache: 'no-cache' })
    if (!res.ok) return
    const versions = (await res.json()) as VersionEntry[]
    const known = new Set(versions.flatMap((v) => [v.name, v.minor ?? v.name]))
    if (known.has(seg)) return

    const kept = versions.map((v) => minor(v.minor ?? v.name)).filter((m): m is [number, number] => !!m)
    const newest = kept.reduce((a, b) => ((b[0] - a[0] || b[1] - a[1]) > 0 ? b : a), kept[0])
    // Older than everything published: retired. Newer: never existed.
    if (!newest || gone[0] > newest[0] || (gone[0] === newest[0] && gone[1] > newest[1])) return
    const oldest = [...versions].reverse().find((v) => minor(v.name))?.name ?? 'latest'
    window.location.replace(`${root}${oldest}/${rest.join('/')}${window.location.hash}`)
  } catch {
    // Offline: the 404 page below still helps.
  }
})
</script>

<template>
  <div class="not-found">
    <p class="code">404</p>
    <h1>This page does not exist</h1>
    <p v-if="path" class="path">
      <code>{{ path }}</code>
    </p>
    <p>
      It may have moved or been renamed, or it may exist in another version of the docs only. Try the search, or start from
      the documentation.
    </p>
    <ul>
      <li><a :href="searchHref">Search the latest docs for “{{ query || 'artifact' }}”</a></li>
      <li><a :href="`${oa.siteRoot}latest/`">Documentation of the latest release</a></li>
      <li><a :href="`${oa.siteRoot}dev/`">Development docs (unreleased)</a></li>
      <li><a :href="oa.siteRoot">OpenArtifact home</a></li>
    </ul>
  </div>
</template>

<style scoped>
.not-found {
  max-width: 640px;
  margin: 0 auto;
  padding: 96px 24px 128px;
}

.code {
  margin: 0;
  color: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

h1 {
  margin: 4px 0 16px;
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
}

p {
  margin: 0 0 16px;
  color: var(--vp-c-text-2);
  line-height: 26px;
}

.path code {
  word-break: break-all;
}

ul {
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

li {
  padding: 8px 0;
  border-top: 1px solid var(--vp-c-divider);
}

a {
  color: var(--vp-c-brand-1);
  font-weight: 500;
}
</style>
