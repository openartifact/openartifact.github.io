// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ClientSnippets from './ClientSnippets.vue'
import Formats from './Formats.vue'
import LandingSearch from './LandingSearch.vue'
import NotFound from './NotFound.vue'
import Quickstart from './Quickstart.vue'
import SearchHandoff from './SearchHandoff.vue'
import Screenshots from './Screenshots.vue'
import VersionBanner from './VersionBanner.vue'
import VersionSwitcher from './VersionSwitcher.vue'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(LandingSearch),
      'nav-bar-content-after': () => [h(SearchHandoff), h(VersionSwitcher)],
      'home-hero-after': () => h(Quickstart),
      'home-features-after': () => [h(Formats), h(Screenshots)],
      'doc-before': () => h(VersionBanner),
      'not-found': () => h(NotFound),
    }),
  enhanceApp({ app }) {
    app.component('ClientSnippets', ClientSnippets)
  },
}
