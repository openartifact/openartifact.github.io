<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { withBase } from 'vitepress'

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
      <h2 id="shots-title">The web UI</h2>
      <p class="oa-lead">Repositories, packages, scan findings and settings, in light and dark themes.</p>
      <div class="shots">
        <figure v-for="s in shots" :key="s.file">
          <img :src="withBase(`/screenshots/${s.file}`)" :alt="s.alt" loading="lazy" />
          <figcaption>{{ s.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
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
