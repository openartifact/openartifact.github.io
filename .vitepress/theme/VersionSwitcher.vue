<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

interface Version {
  name: string
  label: string
}

const { theme } = useData()
const oa = computed(() => theme.value.oa as { siteRoot: string; version: string })
const versions = ref<Version[]>([])

// The list is fetched at run time so every published version, including the
// oldest, offers the releases that came after it.
onMounted(async () => {
  if (!oa.value.version) return
  try {
    const res = await fetch(`${oa.value.siteRoot}versions.json`, { cache: 'no-cache' })
    if (res.ok) versions.value = (await res.json()) as Version[]
  } catch {
    // Offline or local preview: keep the current version only.
  }
})

const options = computed<Version[]>(() => {
  const current = oa.value.version
  if (versions.value.some((v) => v.name === current)) return versions.value
  return [{ name: current, label: current }, ...versions.value]
})

async function go(e: Event) {
  const target = (e.target as HTMLSelectElement).value
  const { siteRoot, version } = oa.value
  const here = `${siteRoot}${version}/`
  const rest = window.location.pathname.startsWith(here) ? window.location.pathname.slice(here.length) : ''
  const same = `${siteRoot}${target}/${rest}${window.location.hash}`
  // Land on the same page when the other version has it, on its index otherwise.
  const ok = await fetch(`${siteRoot}${target}/${rest}`, { method: 'HEAD' })
    .then((r) => r.ok)
    .catch(() => false)
  window.location.assign(ok ? same : `${siteRoot}${target}/`)
}
</script>

<template>
  <label v-if="oa.version" class="version-switcher">
    <span class="sr-only">Documentation version</span>
    <select :value="oa.version" aria-label="Documentation version" @change="go">
      <option v-for="v in options" :key="v.name" :value="v.name">{{ v.label }}</option>
    </select>
  </label>
</template>

<style scoped>
.version-switcher {
  display: flex;
  align-items: center;
  margin-left: 12px;
}

select {
  appearance: auto;
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 500;
}

select:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
