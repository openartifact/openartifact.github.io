#!/usr/bin/env bash
# SPDX-FileCopyrightText: The OpenArtifact Authors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

# Prints a fingerprint of everything the published docs are built from: the last
# commit of openartifact/openartifact that touched docs/ (or the shared client
# snippets) and the release tags. Pages is rebuilt only when it differs from the
# fingerprint of the deployed site (source.txt), so the 15-minute poll is cheap.
# Needs GH_TOKEN (the workflow's GITHUB_TOKEN is enough: the source repo is public).
set -euo pipefail

repo=openartifact/openartifact

last_commit() {
  gh api "repos/$repo/commits?path=$1&per_page=1" --jq '.[0].sha'
}

{
  echo "docs $(last_commit docs)"
  echo "snippets $(last_commit web/src/lib/installCommands.ts)"
  git ls-remote --tags --refs "https://github.com/$repo" 'v*' | sort -k2
} | sha256sum | cut -d' ' -f1
