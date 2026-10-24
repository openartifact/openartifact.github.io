<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
// The same module the web UI uses for its connect panel and the MCP
// client_setup tool counterpart (internal/clientsetup).
import { clientSetup, repoBaseUrl } from '@oa/install'

const formats = [
  ['maven', 'Maven'],
  ['npm', 'npm'],
  ['pypi', 'PyPI'],
  ['docker', 'Docker / OCI'],
  ['helm', 'Helm'],
  ['deb', 'Debian (APT)'],
  ['rpm', 'RPM (YUM/DNF)'],
  ['go', 'Go modules'],
  ['cargo', 'Cargo'],
  ['nuget', 'NuGet'],
  ['rubygems', 'RubyGems'],
  ['conda', 'Conda'],
  ['conan', 'Conan'],
  ['ivy', 'Ivy'],
  ['sbt', 'sbt'],
  ['raw', 'Raw'],
] as const

const props = defineProps<{ format?: string }>()
const format = ref(props.format ?? 'npm')
const origin = ref('https://artifacts.example.com')
const repo = ref('my-repo')

const url = computed(() => repoBaseUrl(format.value, origin.value.replace(/\/+$/, ''), repo.value || 'my-repo'))
const clients = computed(() => clientSetup(format.value, origin.value.replace(/\/+$/, ''), repo.value || 'my-repo'))
</script>

<template>
  <div class="client-snippets">
    <div class="fields">
      <label>
        Format
        <select v-model="format">
          <option v-for="[id, label] in formats" :key="id" :value="id">{{ label }}</option>
        </select>
      </label>
      <label>
        Server URL
        <input v-model="origin" type="url" spellcheck="false" />
      </label>
      <label>
        Repository
        <input v-model="repo" type="text" spellcheck="false" />
      </label>
    </div>

    <p>
      Repository URL: <code>{{ url }}</code>
    </p>

    <div v-for="c in clients" :key="c.client" class="client">
      <h3>{{ c.client }}</h3>
      <p>Configure (create the token under <strong>Account → Tokens</strong>):</p>
      <pre><code>{{ c.configure }}</code></pre>
      <template v-if="c.publish">
        <p>Publish:</p>
        <pre><code>{{ c.publish }}</code></pre>
      </template>
    </div>
  </div>
</template>

<style scoped>
.fields {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin: 16px 0;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
}

input,
select {
  padding: 6px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 400;
}

pre {
  margin: 8px 0 16px;
  padding: 12px 16px;
  overflow-x: auto;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  font-size: 13px;
  line-height: 1.6;
}

.client h3 {
  margin: 24px 0 4px;
  font-size: 18px;
}
</style>
