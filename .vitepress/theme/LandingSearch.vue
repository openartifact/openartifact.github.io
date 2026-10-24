<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useData } from 'vitepress'

// The landing page has no search index of its own worth searching: the query is
// handed to the latest docs, where SearchHandoff.vue opens their local search with it.
const { theme } = useData()
const oa = computed(() => theme.value.oa as { siteRoot: string; version: string })

const dialog = ref<HTMLDialogElement>()
const input = ref<HTMLInputElement>()
const query = ref('')

async function open() {
  dialog.value?.showModal()
  await nextTick()
  input.value?.focus()
  input.value?.select()
}

function close() {
  dialog.value?.close()
}

function submit() {
  window.location.assign(`${oa.value.siteRoot}latest/?q=${encodeURIComponent(query.value.trim())}`)
}

// Backdrop clicks land on the <dialog> itself, clicks inside on its children.
function onDialogClick(e: MouseEvent) {
  if (e.target === dialog.value) close()
}

function isEditing(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement
  return el.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
}

// Same shortcuts as the docs search: Ctrl/Cmd+K and /.
function onKey(e: KeyboardEvent) {
  if (dialog.value?.open) return
  if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isEditing(e))) {
    e.preventDefault()
    void open()
  }
}

const landing = computed(() => !oa.value.version)

onMounted(() => {
  if (landing.value) window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="landing" class="landing-search">
    <!-- Same markup and classes as the default theme's search button, so it looks like the docs one. -->
    <button type="button" class="DocSearch DocSearch-Button" aria-label="Search the documentation" @click="open">
      <span class="DocSearch-Button-Container">
        <span class="vp-icon DocSearch-Search-Icon"></span>
        <span class="DocSearch-Button-Placeholder">Search</span>
      </span>
      <span class="DocSearch-Button-Keys">
        <kbd class="DocSearch-Button-Key"></kbd>
        <kbd class="DocSearch-Button-Key">K</kbd>
      </span>
    </button>

    <dialog ref="dialog" class="landing-search-dialog" aria-label="Search the documentation" @click="onDialogClick">
      <form class="landing-search-form" @submit.prevent="submit">
        <input
          ref="input"
          v-model="query"
          type="search"
          class="landing-search-input"
          placeholder="Search the documentation"
          aria-label="Search the documentation"
          autocomplete="off"
          spellcheck="false"
        />
        <p class="landing-search-hint"><kbd>Enter</kbd> to search the latest docs <kbd>Esc</kbd> to close</p>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
.landing-search {
  display: flex;
  align-items: center;
}

@media (min-width: 768px) {
  .landing-search {
    flex-grow: 1;
    padding-left: 24px;
  }
}

@media (min-width: 960px) {
  .landing-search {
    padding-left: 32px;
  }
}

.landing-search-dialog {
  width: min(560px, calc(100vw - 32px));
  margin: 12vh auto auto;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  box-shadow: var(--vp-shadow-5);
}

.landing-search-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.landing-search-form {
  padding: 12px;
}

.landing-search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 16px;
}

.landing-search-input:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

.landing-search-hint {
  margin: 10px 2px 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.landing-search-hint kbd {
  padding: 1px 5px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  font-family: var(--vp-font-family-base);
  font-size: 12px;
}
</style>
