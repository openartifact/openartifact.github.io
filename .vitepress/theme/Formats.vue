<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { appLink } from '../apps'
import type { OaTheme } from './oa'

// Names, pages and repository types come from the format matrix of the docs this page links to.
const { theme } = useData()
const oa = computed(() => theme.value.oa as OaTheme)
</script>

<template>
  <section v-if="oa.formats.length" class="oa-section" aria-labelledby="formats-title">
    <div class="oa-inner">
      <h2 id="formats-title">{{ oa.formats.length }} package formats</h2>
      <p class="oa-lead">Each one is served on the URL its client expects.</p>
      <ul>
        <li v-for="f in oa.formats" :key="f.name">
          <a v-bind="appLink(oa, `${oa.siteRoot}latest/formats/${f.page}`)">
            <span class="name">{{ f.name }}</span>
            <span class="types">{{ f.types.join(' · ') }}</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

a {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  text-decoration: none;
  transition: border-color 0.15s;
}

a:hover {
  border-color: var(--vp-c-brand-1);
}

.name {
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
}

a:hover .name {
  color: var(--vp-c-brand-1);
}

.types {
  color: var(--vp-c-text-2);
  font-size: 12px;
}
</style>
