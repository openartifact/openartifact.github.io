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
  tagline: Run one Go binary with PostgreSQL and serve every package format your teams use, with access control, SSO and security scanning built in.
  image:
    light: /brand/openartifact-mark-color.svg
    dark: /brand/openartifact-mark-color-dark.svg
    alt: OpenArtifact logo
  actions:
    - theme: brand
      text: Get started
      link: /latest/getting-started/installation
      target: _self
    - theme: alt
      text: Documentation
      link: /latest/
      target: _self
    - theme: alt
      text: GitHub
      link: https://github.com/openartifact/openartifact

features:
  - title: Native package formats
    details: Publish and install with the tools you already use. Every format is served on the URL its client expects, listed below.
  - title: Hosted, proxy and group
    details: Host your own packages, mirror upstream registries and keep serving cached copies when they are down, merge repositories behind one URL, and replicate between sites.
  - title: Access control
    details: Give users, groups and projects the access they need with permission targets and API tokens. Sign in with OIDC or SAML.
  - title: Supply chain security
    details: Scan every upload for vulnerabilities, secrets and licenses, block flagged artifacts with quarantine, and export CycloneDX or SPDX SBOMs, signed attestations and Dependency-Track pushes.
  - title: Operable
    details: Store blobs on a filesystem, S3, GCS, Azure or an OCI registry, move cold data between tiers, and recover from backups or to a point in time. Prometheus metrics, webhooks and an audit log are included.
  - title: Free software
    details: AGPL-3.0-or-later and REUSE compliant. Automate with the REST API, the oa CLI (with Nexus and Artifactory import) and an optional MCP server.
---
