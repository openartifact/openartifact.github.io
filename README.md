<!--
SPDX-FileCopyrightText: The OpenArtifact Authors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

# openartifact.github.io

Source of <https://openartifact.github.io/>: the OpenArtifact landing page and the versioned documentation, built with [VitePress](https://vitepress.dev).

The documentation text is **not** in this repository. It lives in [`docs/`](https://github.com/openartifact/openartifact/tree/main/docs) of openartifact/openartifact, versioned with the code, and stays readable on GitHub. This repository holds the theme, navigation, landing page, version switcher and the Pages workflow.

| URL | Content |
|---|---|
| `/` | Landing page (`landing/`): quick start and format list of the latest release |
| `/latest/` | Docs of the newest release tag of openartifact/openartifact. This is what readers should use |
| `/dev/` | Docs of `main`, not released yet; every page carries an "Unreleased docs" banner and is not indexed |
| `/vX.Y/` | Docs of the newest stable tag of each older minor line, among the last 5 minor lines. `/vX.Y/` of the newest minor line redirects to `/latest/`; a minor line that is no longer published redirects to the oldest one that is |
| `/versions.json` | List read by the version switcher and the 404 page at run time, so old versions offer new releases |
| `/sitemap.xml`, `/robots.txt` | Landing page and `/latest/` only; other versions are `noindex` |
| `/helm-charts/` | Not built here: the Helm chart repository (openartifact/helm-charts, its own Pages site) |

## Build

```sh
bun install --frozen-lockfile
OA_SRC_DIR=../openartifact bun test      # unit tests; the sidebar test needs the docs checkout
bun run build --oa ../openartifact       # a checkout of openartifact/openartifact with its tags; writes _site/
bun scripts/check-links.ts               # every link and #anchor of _site/
bun run preview                          # http://localhost:4173 (OA_SITE_ORIGIN=http://localhost:4173 bun run build ... to make absolute links local)
```

`scripts/build.ts` builds each version on its own:

- the landing page and `latest` (from `git archive` of the newest release tag) must build, or the run fails;
- `dev` is the checkout as it is; a failing `dev` or older version is reported (a warning annotation and the job summary) and left out, so a mistake in the docs of `main` never keeps a release from being published.

Releases are built with the current theme and sidebar and tolerate dead links (an old page may link to a file that moved later). `.vitepress/links.ts` rewrites links that leave `docs/` (`../README.md`, `../../internal/...`) to the GitHub file or directory at the built ref and fails when the target is missing; links to a `README.md` inside `docs/` become the directory URL.

The docs are written for GitHub, so heading ids follow GitHub's rules (`.vitepress/slug.ts`): `#the-public-url-and-base_url` and `#0150` work on the site as they do on GitHub.

To build one docs version, use the environment variables documented in `.vitepress/env.ts`:

```sh
OA_TARGET=docs OA_VERSION=dev OA_SRC_DIR=../openartifact bun run build:docs
```

The docs pages are rendered in place from `docs/`; pages missing in an older release are skipped in its sidebar. The `ClientSnippets` component imports `web/src/lib/installCommands.ts` from the same checkout, so the docs and the web UI share one source for client snippets.

### Sidebar

`.vitepress/sidebar.ts` holds the order and the labels. A docs page that is not listed there is still shown, at the end of the group of its directory, so no page is unreachable. CI runs `scripts/sidebar.test.ts` with `OA_STRICT_SIDEBAR=1` against `main` of openartifact/openartifact and fails until the page has an entry: add it, with a label, to the matching group.

### Link check

`scripts/check-links.ts` reads the built HTML of every version and checks that each internal link, image, stylesheet and script exists and that each `#anchor` is the id of an element on its page. VitePress only checks that the linked page exists in the source, so this catches README targets and anchors that differ between GitHub and the site.

- CI (`ci.yml`) fails on a broken reference in any version except `dev`, which only warns: its docs are fixed in openartifact/openartifact.
- The Pages workflow reports broken references as warnings and still publishes.
- `scripts/known-broken-links.txt` lists broken anchors in released docs that cannot be edited any more. Remove a line when the version that has it is no longer published.

## Deploy

`.github/workflows/pages.yml` builds and publishes with GitHub Pages (Settings, Pages, source: GitHub Actions) on:

- push to `main` of this repository,
- push to the `rebuild` branch: openartifact/openartifact's `docs-site-trigger.yml` force-pushes one trigger commit there (a copy of `main` plus `rebuild.txt` naming the source commit) when `docs/`, `web/src/lib/installCommands.ts` or `web/src/lib/clientsetup.generated.ts` changes on its `main` or a `v*.*.*` tag is pushed. This uses a write deploy key (title `openartifact-docs-trigger`, on this repository) whose private half is the secret `SITE_DEPLOY_KEY` there; the `github-pages` environment allows the `rebuild` branch,
- manual dispatch,
- a fallback poll every 15 minutes, which covers a missing or revoked key and failed triggers: the `check` job compares `scripts/fingerprint.sh` (the last commit of openartifact/openartifact touching those paths, plus the release tags) with `source.txt` of the deployed site, fetched past the Pages cache, and rebuilds only when they differ. The poll needs no secret. GitHub disables scheduled workflows of a repository without commits for 60 days; re-enable it in the Actions tab or push a commit.

The fingerprint written to `source.txt` is computed from the checkout that is built (`scripts/fingerprint.sh oa`), before the build. A docs commit that lands during the build is therefore not recorded as published, and the next poll rebuilds.

## Brand

Logos in `brand/` are copied unmodified from [openartifact/brand](https://github.com/openartifact/brand) (CC-BY-SA-4.0); colours and type in `.vitepress/theme/style.css` follow its tokens.

## License

Code and this README: AGPL-3.0-or-later. Brand assets: CC-BY-SA-4.0. REUSE compliant (`reuse lint`).
