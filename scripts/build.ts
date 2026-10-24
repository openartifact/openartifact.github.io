// SPDX-FileCopyrightText: The OpenArtifact Authors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Builds the whole site into _site/:
//   /            landing page
//   /latest/     docs of the checkout given as --oa (main)
//   /vX.Y/       docs of the newest stable tag of each of the last 5 minor lines
//   /versions.json  read by the version switcher at run time
//
// Usage: bun scripts/build.ts --oa <openartifact checkout> [--keep 5]
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pickReleases } from './versions'

const { values } = parseArgs({
  options: { oa: { type: 'string' }, keep: { type: 'string', default: '5' } },
})
if (!values.oa) throw new Error('--oa <openartifact checkout> is required')

const oa = resolve(values.oa)
const out = resolve('_site')

function run(cmd: string[], env: Record<string, string> = {}, cwd?: string): string {
  const p = Bun.spawnSync(cmd, { env: { ...process.env, ...env }, cwd, stdout: 'pipe', stderr: 'inherit' })
  if (p.exitCode !== 0) throw new Error(`${cmd.join(' ')} failed with ${p.exitCode}`)
  return p.stdout.toString()
}

function build(env: Record<string, string>): void {
  run(['bunx', '--bun', 'vitepress', 'build'], env)
}

rmSync(out, { recursive: true, force: true })

const tags = run(['git', '-C', oa, 'tag', '--list', 'v*']).split('\n').filter(Boolean)
const releases = pickReleases(tags, Number(values.keep))
const sha = run(['git', '-C', oa, 'rev-parse', '--short=7', 'HEAD']).trim()

console.log(`releases: ${releases.map((r) => `${r.minor}=${r.tag}`).join(' ') || 'none'}`)

// Landing first: its build owns the root of _site, the docs builds add subdirectories.
build({ OA_TARGET: 'landing', OA_SRC_DIR: oa })
build({ OA_TARGET: 'docs', OA_VERSION: 'latest', OA_SRC_DIR: oa, OA_REF: 'main' })

const scratch = mkdtempSync(join(tmpdir(), 'oa-docs-'))
try {
  for (const r of releases) {
    // The tag's own tree: docs, installCommands.ts and every file the docs link to.
    const dir = join(scratch, r.tag)
    mkdirSync(dir)
    const tar = Bun.spawnSync(['sh', '-c', `git -C "$OA" archive "$TAG" | tar -x -C "$DIR"`], {
      env: { ...process.env, OA: oa, TAG: r.tag, DIR: dir },
      stderr: 'inherit',
    })
    if (tar.exitCode !== 0) throw new Error(`git archive ${r.tag} failed`)
    // Old tags are built with today's theme and sidebar: their pages may link
    // to files that moved later, which must not block publishing.
    build({ OA_TARGET: 'docs', OA_VERSION: r.minor, OA_SRC_DIR: dir, OA_REF: r.tag, OA_LENIENT: '1' })
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

const versions = [
  { name: 'latest', label: `latest (main ${sha})` },
  ...releases.map((r) => ({ name: r.minor, label: `${r.minor} (${r.tag.slice(1)})` })),
]
writeFileSync(join(out, 'versions.json'), `${JSON.stringify(versions, null, 2)}\n`)
// Served by Pages as-is: no Jekyll processing of _-prefixed files.
writeFileSync(join(out, '.nojekyll'), '')
console.log(`built ${versions.length} doc versions into ${out}`)
