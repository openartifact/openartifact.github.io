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
- a daily schedule,
- manual dispatch,
- `repository_dispatch` (`docs-updated`), sent by openartifact/openartifact on pushes to `main` and on release tags. That needs the secret `SITE_DISPATCH_TOKEN` in openartifact/openartifact: a fine-grained token limited to this repository with `Actions: write` and `Contents: read`. Without it the dispatch step is skipped and the daily schedule picks changes up.

## Brand

Logos in `brand/` are copied unmodified from [openartifact/brand](https://github.com/openartifact/brand) (CC-BY-SA-4.0); colours and type in `.vitepress/theme/style.css` follow its tokens.

## License

Code and this README: AGPL-3.0-or-later. Brand assets: CC-BY-SA-4.0. REUSE compliant (`reuse lint`).
