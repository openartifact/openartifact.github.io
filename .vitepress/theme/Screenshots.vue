<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { appLink } from '../apps'
import type { OaTheme } from './oa'

const { theme } = useData()
const oa = computed(() => theme.value.oa as OaTheme)
const demo = computed(() => `${oa.value.siteRoot}demo/`)

// The first shot spans the row; the others share the next one.
const shots = [
  { file: 'dashboard.png', caption: 'Dashboard', alt: 'Dashboard: repository counts, repositories by format, recent activity' },
  { file: 'repositories.png', caption: 'Repositories', alt: 'Repository list filtered by format' },
  { file: 'repository.png', caption: 'Package versions', alt: 'npm repository with published package versions' },
]
</script>

<template>
  <section class="oa-section" aria-labelledby="shots-title">
    <div class="oa-inner">
      <div class="head">
        <h2 id="shots-title">The web UI</h2>
        <a v-if="oa.demo" class="open" v-bind="appLink(oa, demo)">Open the demo full screen</a>
      </div>
      <p v-if="oa.demo" class="oa-lead">
        The release's web UI running in your browser on sample data. Changes are kept until you reload.
      </p>
      <p v-else class="oa-lead">Repositories, packages, scan findings and settings, in light and dark themes.</p>
      <iframe v-if="oa.demo" class="demo" :src="demo" title="OpenArtifact web UI demo" loading="lazy" />
      <div v-else class="shots">
        <figure v-for="s in shots" :key="s.file">
          <img :src="withBase(`/screenshots/${s.file}`)" :alt="s.alt" loading="lazy" />
          <figcaption>{{ s.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
}

.open {
  font-size: 14px;
  font-weight: 500;
}

.demo {
  display: block;
  width: 100%;
  height: min(760px, 80vh);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-alt);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06);
}

.shots {
  display: grid;
  gap: 24px;
}

@media (min-width: 768px) {
  .shots {
    grid-template-columns: 1fr 1fr;
  }

  figure:first-child {
    grid-column: 1 / -1;
  }
}

figure {
  margin: 0;
}

img {
  display: block;
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06);
}

figcaption {
  margin-top: 8px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>
