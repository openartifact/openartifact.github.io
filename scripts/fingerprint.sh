#!/usr/bin/env bash
# SPDX-FileCopyrightText: The OpenArtifact Authors
#
# SPDX-License-Identifier: AGPL-3.0-or-later

# Prints a fingerprint of everything the published docs are built from: the last
# commit of openartifact/openartifact that touched docs/ or the client snippets
# the docs render (installCommands.ts and the template file it imports), and the
# release tags. Pages is rebuilt only when it differs from the fingerprint of the
# deployed site (source.txt), so the 15-minute poll is cheap.
#
#   fingerprint.sh            what the repository is now, from the GitHub API
#                             (needs GH_TOKEN; the workflow's token is enough, the repository is public)
#   fingerprint.sh <checkout> what the given checkout contains: run it on the checkout
#                             that is about to be built, before the build, so the value
#                             names the inputs of the site even when a commit lands meanwhile
#
# Both forms print the same value for the same state of the repository.
set -euo pipefail

repo=openartifact/openartifact
checkout=${1:-}

if [ -n "$checkout" ]; then
  last_commit() { git -C "$checkout" log -1 --format=%H -- "$1"; }
  tags() { git -C "$checkout" for-each-ref --format=$'%(objectname)\t%(refname)' 'refs/tags/v*' | sort -k2; }
else
  last_commit() { gh api "repos/$repo/commits?path=$1&per_page=1" --jq '.[0].sha'; }
  tags() { git ls-remote --tags --refs "https://github.com/$repo" 'v*' | sort -k2; }
fi

{
  echo "docs $(last_commit docs)"
  echo "snippets $(last_commit web/src/lib/installCommands.ts)"
  echo "templates $(last_commit web/src/lib/clientsetup.generated.ts)"
  tags
} | sha256sum | cut -d' ' -f1
