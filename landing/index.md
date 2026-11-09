---
# SPDX-FileCopyrightText: The OpenArtifact Authors
#
# SPDX-License-Identifier: AGPL-3.0-or-later
layout: home
title: OpenArtifact
titleTemplate: Self-hosted artifact repository

hero:
  name: OpenArtifact
  text: One artifact repository for every package format
  tagline: A single Go binary on PostgreSQL. Host, proxy and group packages with the clients your teams already use, with SSO, access control and supply-chain scanning built in.
  image:
    light: /brand/openartifact-mark-color.svg
    dark: /brand/openartifact-mark-color-dark.svg
    alt: OpenArtifact logo
  actions:
    - theme: brand
      text: Get started
      link: /latest/getting-started/installation
    - theme: alt
      text: Documentation
      link: /latest/
    - theme: alt
      text: GitHub
      link: https://github.com/openartifact/openartifact

features:
  - title: Native clients
    details: npm, pip, mvn, docker, helm, cargo and the rest publish and install against the URL they expect.
  - title: Hosted, proxy, group
    details: Publish your own packages, cache upstream registries and keep serving when they are down, merge both behind one URL, replicate between sites.
  - title: Access control
    details: Projects, groups and permission targets. OIDC and SAML sign-in, scoped API tokens, public repositories for anonymous reads.
  - title: Supply chain
    details: Vulnerability, secret and license scans on upload, quarantine, CycloneDX and SPDX SBOMs, VEX and signed attestations.
  - title: Operations
    details: Filesystem, S3, GCS, Azure or OCI storage with tiering, backups and point-in-time recovery. Prometheus metrics, webhooks, audit log.
  - title: Free software
    details: AGPL-3.0-or-later. REST API, the oa CLI with Nexus and Artifactory import, and an MCP server.
---
