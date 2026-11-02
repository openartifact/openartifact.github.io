// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { expect, test } from 'bun:test'
import { ghSlug } from '../.vitepress/slug'

test('slugs match the ids GitHub gives', () => {
  expect(ghSlug('The public URL and BASE_URL')).toBe('the-public-url-and-base_url')
  expect(ghSlug('0.15.0')).toBe('0150')
  expect(ghSlug('OIDC_CONFIG')).toBe('oidc_config')
  expect(ghSlug('GitHub OAuth2 (github.com and Enterprise Server)')).toBe('github-oauth2-githubcom-and-enterprise-server')
  expect(ghSlug('Empty a repository’s trash')).toBe('empty-a-repositorys-trash')
  expect(ghSlug('Conan 1.x')).toBe('conan-1x')
})
