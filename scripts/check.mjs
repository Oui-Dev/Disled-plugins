// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 The Disled contributors

// Checks every plugin of the repository, as each pull request does: its
// manifest against the schema of Disled and what a schema cannot see, the
// rules of the catalog (CONTRIBUTING.md), and a new version for new files.
// Writes what each plugin asks for, for the review, in the summary of the
// job.

import { appendFileSync, readFileSync } from 'node:fs';
import Ajv from 'ajv';
import semver from 'semver';
import {
  fetchJson,
  fingerprint,
  folderFiles,
  INDEX_URL,
  manifestOf,
  pluginIds,
  SCHEMA_URL,
  zipFiles,
} from './lib.mjs';

/** The programs that may run a plugin: interpreters of sources, which the user installs. */
const RUNTIMES = ['node', 'deno', 'bun', 'python3', 'python', 'pwsh'];
const MAX_FILES = 200;
const MAX_BYTES = 1024 * 1024;

// SCHEMA_FILE checks against the schema of a clone of Disled instead.
const schema = process.env.SCHEMA_FILE
  ? JSON.parse(readFileSync(process.env.SCHEMA_FILE, 'utf8'))
  : await fetchJson(SCHEMA_URL);
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
// None before the first publication.
const published = await fetchJson(INDEX_URL).catch(() => null);

const problems = [];
const rows = [];
for (const id of pluginIds()) {
  const fail = (text) => problems.push(`${id}: ${text}`);
  let files;
  let manifest;
  try {
    files = folderFiles(id);
    manifest = manifestOf(files);
  } catch (error) {
    fail(error.message);
    continue;
  }

  if (!validate(manifest)) {
    for (const error of validate.errors ?? []) {
      fail(`plugin.json${error.instancePath} ${error.message}`);
    }
  }
  if (manifest.id !== id) {
    fail(`the id ${manifest.id} is not the name of its folder`);
  }
  // The links between fields, which Disled checks and a schema cannot.
  const states = (manifest.states ?? []).map((state) => state.id);
  if (new Set(states).size !== states.length) {
    fail('two states have the same id');
  }
  if (manifest.idle && !states.includes(manifest.idle)) {
    fail(`idle: no state ${manifest.idle}`);
  }
  for (const rule of manifest.events?.rules ?? []) {
    if (rule.state && !states.includes(rule.state)) {
      fail(`events.rules: no state ${rule.state}`);
    }
  }

  // Sources only, which the review reads in full.
  for (const [system, command] of Object.entries(manifest.run ?? {})) {
    if (!RUNTIMES.includes(command?.[0])) {
      fail(`run.${system}: ${command?.[0]} is none of ${RUNTIMES.join(', ')}`);
    }
  }
  let bytes = 0;
  for (const file of files) {
    bytes += file.bytes.length;
    if (file.bytes.includes(0)) {
      fail(`${file.path} is a binary file: the catalog holds sources only`);
    }
    if (!/^[\x20-\x7e]+$/.test(file.path)) {
      fail(`${file.path}: a path in ASCII only`);
    }
    if (/^licen[cs]e/i.test(file.path.split('/').pop())) {
      fail(`${file.path}: every plugin of the catalog is under the MIT license of the repository`);
    }
  }
  if (files.length > MAX_FILES || bytes > MAX_BYTES) {
    fail(`${files.length} files and ${bytes} bytes, past ${MAX_FILES} files or 1 MiB`);
  }
  if (!files.some((file) => file.path === 'README.md')) {
    fail('no README.md');
  }

  // New files, new version: Disled offers an update only for a later one.
  const before = published?.plugins?.find((plugin) => plugin.manifest?.id === id);
  const changed = before && before.fingerprint !== fingerprint(zipFiles(id));
  if (changed && semver.valid(manifest.version) && !semver.gt(manifest.version, before.manifest.version)) {
    fail(`its files changed: raise its version above ${before.manifest.version}`);
  }

  const status = !before ? 'new' : changed ? 'changed' : 'same';
  const command = Object.entries(manifest.run ?? {})
    .map(([system, arguments_]) => `${system}: \`${arguments_.join(' ')}\``)
    .join('<br>');
  rows.push(
    `| ${id} | ${manifest.version} | ${status} | ${(manifest.capabilities ?? []).join(', ')} | ${command} |`,
  );
}

const summary = [
  '## Plugins',
  '',
  'Review every file of a new or changed plugin: what its program does with the permissions of the user, and whether its description says it all.',
  '',
  '| Plugin | Version | Files | Capabilities | Command |',
  '|---|---|---|---|---|',
  ...rows,
  '',
  problems.length ? `## Problems\n\n${problems.map((problem) => `- ${problem}`).join('\n')}` : 'No problem found.',
  '',
].join('\n');
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
console.log(summary);
process.exitCode = problems.length ? 1 : 0;
