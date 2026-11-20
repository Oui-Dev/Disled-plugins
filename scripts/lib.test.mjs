// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 The Disled contributors

// The fingerprints of the index are those that Disled computes for its
// approval: the same vector as the test of Disled,
// app/src-tauri/src/plugins/scan.rs, the_catalog_computes_the_same_fingerprints.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fingerprint, zip } from './lib.mjs';

const files = [
  { path: 'LICENSE', bytes: Buffer.from('MIT\n') },
  { path: 'plugin.json', bytes: Buffer.from('{"api":1}\n') },
  { path: 'src/index.js', bytes: Buffer.from('console.log("hello");\n') },
];

test('the fingerprint is the one of Disled', () => {
  assert.equal(
    fingerprint(files),
    'ef3eb752bc5272b03e048c7b0967d67b4598f2fdd874635d73929dc1a9f8390a',
  );
});

test('the same files make the same zip', () => {
  assert.deepEqual(zip(files), zip(files.map((file) => ({ ...file }))));
});
