// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ClientSnippets from './ClientSnippets.vue'
import LandingSearch from './LandingSearch.vue'
import SearchHandoff from './SearchHandoff.vue'
import Screenshots from './Screenshots.vue'
import VersionSwitcher from './VersionSwitcher.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(LandingSearch),
      'nav-bar-content-after': () => [h(SearchHandoff), h(VersionSwitcher)],
      'home-features-after': () => h(Screenshots),
    }),
  enhanceApp({ app }) {
    app.component('ClientSnippets', ClientSnippets)
  },
}
