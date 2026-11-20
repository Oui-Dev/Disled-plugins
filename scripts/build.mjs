// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 The Disled contributors

// Builds what GitHub Pages publishes, in dist/: a zip a plugin, named by its
// id and version, and index.json, which the publish workflow then signs with
// the catalog key. For each plugin, the index gives its manifest, and the
// size, the SHA-256 and the fingerprint that Disled checks before the
// approval of the user.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprint, manifestOf, pluginIds, ROOT, sha256, zip, zipFiles } from './lib.mjs';

/** The version of the index, which Disled reads. */
const SCHEMA = 1;

const dist = join(ROOT, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'zips'), { recursive: true });

const plugins = pluginIds().map((id) => {
  const files = zipFiles(id);
  const manifest = manifestOf(files);
  const bytes = zip(files);
  writeFileSync(join(dist, 'zips', `${id}-${manifest.version}.zip`), bytes);
  return { manifest, size: bytes.length, sha256: sha256(bytes), fingerprint: fingerprint(files) };
});
writeFileSync(join(dist, 'index.json'), `${JSON.stringify({ schema: SCHEMA, plugins })}\n`);
console.log(plugins.map(({ manifest }) => `${manifest.id} ${manifest.version}`).join('\n'));
