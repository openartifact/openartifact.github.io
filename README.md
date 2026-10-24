<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# openartifact.github.io

Source of <https://openartifact.github.io/>: the OpenArtifact landing page and the versioned documentation, built with [VitePress](https://vitepress.dev).

The documentation text is **not** in this repository. It lives in [`docs/`](https://github.com/openartifact/openartifact/tree/main/docs) of openartifact/openartifact, versioned with the code, and stays readable on GitHub. This repository holds the theme, navigation, landing page, version switcher and the Pages workflow.

| URL | Content |
|---|---|
| `/` | Landing page (`landing/`) |
| `/latest/` | Docs of openartifact/openartifact `main` |
| `/vX.Y/` | Docs of the newest stable tag of each of the last 5 minor lines |
| `/versions.json` | List read by the version switcher at run time, so old versions offer new releases |
| `/helm-charts/` | Not built here: the Helm chart repository (openartifact/helm-charts, its own Pages site) |

## Build

```sh
bun install --frozen-lockfile
bun test
bun run build --oa ../openartifact   # a checkout of openartifact/openartifact with its tags; writes _site/
bun run preview                      # http://localhost:4173 (OA_SITE_ORIGIN=http://localhost:4173 bun run build ... to make absolute links local)
```

`scripts/build.ts` builds the landing page, `latest` from the checkout as it is, and each release from `git archive <tag>` of that checkout. Releases are built with the current theme and sidebar and tolerate dead links (an old page may link to a file that moved later); `latest` fails the build on a dead link. `.vitepress/links.ts` rewrites links that leave `docs/` (`../README.md`, `../../internal/...`) to the GitHub file or directory at the built ref and fails when the target is missing.

To build one docs version, use the environment variables documented in `.vitepress/env.ts`:

```sh
OA_TARGET=docs OA_SRC_DIR=../openartifact bun run build:docs
```

The docs pages are rendered in place from `docs/`; pages missing in an older release are skipped in its sidebar. The `ClientSnippets` component imports `web/src/lib/installCommands.ts` from the same checkout, so the docs and the web UI share one source for client snippets.

## Deploy

`.github/workflows/pages.yml` builds and publishes with GitHub Pages (Settings, Pages, source: GitHub Actions) on:

- push to `main` of this repository,
- push to the `rebuild` branch: openartifact/openartifact's `docs-site-trigger.yml` force-pushes one trigger commit there (a copy of `main` plus `rebuild.txt` naming the source commit) when `docs/` or `web/src/lib/installCommands.ts` changes on its `main` or a `v*.*.*` tag is pushed. This uses a write deploy key (title `openartifact-docs-trigger`, on this repository) whose private half is the secret `SITE_DEPLOY_KEY` there; the `github-pages` environment allows the `rebuild` branch,
- manual dispatch,
- a fallback poll every 15 minutes, which covers a missing or revoked key and failed triggers: the `check` job compares `scripts/fingerprint.sh` (the last commit of openartifact/openartifact touching `docs/` or `web/src/lib/installCommands.ts`, plus the release tags) with `source.txt` of the deployed site and rebuilds only when they differ. The poll needs no secret. GitHub disables scheduled workflows of a repository without commits for 60 days; re-enable it in the Actions tab or push a commit.

## Brand

Logos in `brand/` are copied unmodified from [openartifact/brand](https://github.com/openartifact/brand) (CC-BY-SA-4.0); colours and type in `.vitepress/theme/style.css` follow its tokens.

## License

Code and this README: AGPL-3.0-or-later. Brand assets: CC-BY-SA-4.0. REUSE compliant (`reuse lint`).
