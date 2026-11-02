<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useData } from 'vitepress'
import { appLink } from '../apps'
import type { OaTheme } from './oa'

// The release number and the commands come from the build, so the page names the
// version it links to. The steps are those of getting-started/installation.
const { theme } = useData()
const oa = computed(() => theme.value.oa as OaTheme)
const tag = computed(() => oa.value.latest)

const commands = computed(() =>
  [
    `git clone ${tag.value ? `--branch ${tag.value} ` : ''}https://github.com/openartifact/openartifact.git`,
    'cd openartifact',
    'cp docker/.env.example docker/.env',
    '# set POSTGRES_PASSWORD, OPENARTIFACT_SECRET_KEY and AUTH_HMAC_KEY in docker/.env',
    'OPENARTIFACT_RUNTIME=distroless make docker-up',
  ].join('\n'),
)

const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(commands.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // Clipboard blocked: the text is still selectable.
  }
}
</script>

<template>
  <section class="oa-section" aria-labelledby="quickstart-title">
    <div class="oa-inner">
      <div class="head">
        <h2 id="quickstart-title">Run it in a minute</h2>
        <a v-if="tag" class="release" :href="`https://github.com/openartifact/openartifact/releases/tag/${tag}`">
          Latest release {{ tag }}
        </a>
      </div>
      <div class="code">
        <button type="button" class="copy" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
        <pre><code>{{ commands }}</code></pre>
      </div>
      <p>
        Then open <code>http://localhost:8080</code> and sign in as <code>admin</code>; the first password is in the
        server log. Kubernetes, binaries and all options are in the
        <a v-bind="appLink(oa, `${oa.siteRoot}latest/getting-started/installation`)">installation guide</a>.
      </p>
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

.release {
  font-size: 14px;
  font-weight: 500;
}

.code {
  margin: 12px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

pre {
  margin: 0;
  padding: 4px 16px 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.7;
}

code {
  font-family: var(--vp-font-family-mono);
}

.copy {
  display: block;
  margin: 8px 8px 0 auto;
  padding: 2px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.copy:hover {
  border-color: var(--vp-c-brand-1);
}

p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 24px;
}

p code {
  font-size: 13px;
}
</style>
