---
# SPDX-FileCopyrightText: The OpenArtifact Authors
#
# SPDX-License-Identifier: AGPL-3.0-or-later
layout: home
title: OpenArtifact
titleTemplate: Self-hosted artifact repository

hero:
  name: OpenArtifact
  text: Self-hosted artifact repository for many package formats
  tagline: One Go binary, embedded web UI, PostgreSQL. Hosted, proxy and group repositories with RBAC, SSO and security scanning.
  image:
    light: /brand/openartifact-mark-color.svg
    dark: /brand/openartifact-mark-color-dark.svg
    alt: OpenArtifact logo
  actions:
    - theme: brand
      text: Get started
      link: https://openartifact.github.io/latest/getting-started/installation
    - theme: alt
      text: Documentation
      link: https://openartifact.github.io/latest/
    - theme: alt
      text: GitHub
      link: https://github.com/openartifact/openartifact

features:
  - title: Native package formats
    details: npm, PyPI, Maven, Docker/OCI, Helm, Debian, RPM, Go, Cargo, NuGet, RubyGems, Conda, Conan, Ivy, sbt and raw files, each on the URL its client expects.
  - title: Hosted, proxy and group
    details: Mirror upstreams with serve-stale, merge repositories behind one URL, and replicate hosted repositories between sites.
  - title: Access control
    details: Users, groups, permission targets and API tokens, SSO through OIDC and SAML, and projects that own repositories.
  - title: Supply chain security
    details: CycloneDX and SPDX SBOMs, vulnerability, secret and license scanning, quarantine, Dependency-Track, signed and attested releases.
  - title: Operable
    details: Filesystem, S3, GCS, Azure or OCI blob storage with tiering and replication, backups, point-in-time recovery, Prometheus metrics, webhooks and an audit log.
  - title: Free software
    details: AGPL-3.0-or-later, REUSE compliant. REST API with an OpenAPI spec, an oa CLI with Nexus and Artifactory import, and an optional MCP server.
---
