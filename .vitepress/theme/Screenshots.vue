<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { withBase } from 'vitepress'

const shots = [
  { file: 'dashboard.png', alt: 'Dashboard: repository counts, repositories by format, recent activity' },
  { file: 'repositories.png', alt: 'Repository list filtered by format' },
  { file: 'repository.png', alt: 'npm repository with published package versions' },
]
</script>

<template>
  <section class="oa-section" aria-labelledby="shots-title">
    <div class="oa-inner shots">
      <h2 id="shots-title">A look at the web UI</h2>
      <figure v-for="s in shots" :key="s.file">
        <img :src="withBase(`/screenshots/${s.file}`)" :alt="s.alt" loading="lazy" />
      </figure>
    </div>
  </section>
</template>

<style scoped>
.shots {
  display: grid;
  gap: 24px;
}

figure {
  margin: 0;
}

img {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>
