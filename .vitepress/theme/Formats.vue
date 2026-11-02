<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { appLink } from '../apps'
import type { OaTheme } from './oa'

// Names and pages come from the format matrix of the docs this page links to.
const { theme } = useData()
const oa = computed(() => theme.value.oa as OaTheme)
</script>

<template>
  <section v-if="oa.formats.length" class="oa-section" aria-labelledby="formats-title">
    <div class="oa-inner">
      <h2 id="formats-title">Package formats</h2>
      <p>Each one is served on the URL its client expects.</p>
      <ul>
        <li v-for="f in oa.formats" :key="f.name">
          <a v-bind="appLink(oa, `${oa.siteRoot}latest/formats/${f.page}`)">{{ f.name }}</a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
p {
  margin: 4px 0 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

a {
  display: block;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  text-decoration: none;
}

a:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
