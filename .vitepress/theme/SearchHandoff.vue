<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup lang="ts">
import { nextTick, onMounted } from 'vue'
import { useData } from 'vitepress'

// The landing page's search sends `?q=<query>` to the latest docs. Open the
// default theme's local search with that query and drop the parameter from the URL.
//
// The theme keeps the search box's text in sessionStorage (query persistence) and
// opens the box on Ctrl/Cmd+K; it has no API for either, so both are used as the
// user-facing behaviour they are. Pinned by the vitepress version in package.json.
const FILTER_KEY = 'vitepress:local-search-filter'

const { theme } = useData()

onMounted(async () => {
  // Only the docs have a search index; the landing page hands queries over.
  if (!(theme.value.oa as { version: string }).version) return
  const url = new URL(window.location.href)
  const query = url.searchParams.get('q')
  if (query === null) return

  url.searchParams.delete('q')
  window.history.replaceState(window.history.state, '', url)

  try {
    window.sessionStorage.setItem(FILTER_KEY, query)
  } catch {
    // Storage blocked: the search still opens, just empty.
  }
  // Let the search button register its shortcut handler before triggering it.
  await nextTick()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
})
</script>

<template>
  <span hidden />
</template>
