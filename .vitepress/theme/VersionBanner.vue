<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { appLink } from '../apps'
import { samePage, type OaTheme } from './oa'

// Docs of main describe code that is not released; docs of an older minor line
// describe an older release. Both say so above every page and link to the same
// page of the latest release.
const { theme } = useData()
const oa = computed(() => theme.value.oa as OaTheme)
const show = computed(() => oa.value.kind === 'dev' || oa.value.kind === 'old')
const latest = computed(() => oa.value.latest || 'release')

async function toLatest(e: MouseEvent) {
  e.preventDefault()
  window.location.assign(await samePage(oa.value, 'latest'))
}
</script>

<template>
  <aside v-if="show" class="version-banner" :class="oa.kind" role="note">
    <p v-if="oa.kind === 'dev'">
      <strong>Unreleased docs.</strong>
      This is the development version (main). It describes changes that are not in a release yet.
    </p>
    <p v-else>
      <strong>Older docs.</strong>
      This is the documentation of {{ oa.label }}, not the newest release.
    </p>
    <a v-bind="appLink(oa, `${oa.siteRoot}latest/`)" @click="toLatest">Read the {{ latest }} docs</a>
  </aside>
</template>

<style scoped>
.version-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 16px;
  margin: 0 0 24px;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-warning-2, #d97706);
  border-radius: 8px;
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  line-height: 22px;
}

.version-banner.old {
  border-color: var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

p {
  margin: 0;
}

a {
  font-weight: 600;
  white-space: nowrap;
}
</style>
