// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2026 The Disled contributors

// What the check and the build share: the plugins of the repository, their
// files as their zip holds them, the fingerprint that Disled computes for
// its approval, and the zip itself.

import { createHash } from 'node:crypto';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const PLUGINS = join(ROOT, 'plugins');
/** The schema of the manifests, from Disled, which a test keeps true to the app. */
export const SCHEMA_URL =
  'https://raw.githubusercontent.com/Oui-Dev/Disled/main/docs/plugins/plugin.schema.json';
/** The index that the catalog publishes, which Disled reads. */
export const INDEX_URL = 'https://oui-dev.github.io/Disled-plugins/index.json';
/** The license of every plugin, which each zip carries. */
const LICENSE = 'LICENSE';

/** The ids of the plugins: the folders of plugins/. */
export function pluginIds() {
  return readdirSync(PLUGINS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

/** The files of the folder of a plugin, by their path inside it with `/`. Links are refused, as Disled refuses them. */
export function folderFiles(id) {
  const files = [];
  const walk = (folder, prefix) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(folder, entry.name);
      if (lstatSync(full).isSymbolicLink()) {
        throw new Error(`${id}: ${path} is a link, which Disled refuses`);
      }
      if (entry.isDirectory()) {
        walk(full, path);
      } else {
        files.push({ path, bytes: readFileSync(full) });
      }
    }
  };
  walk(join(PLUGINS, id), '');
  return files;
}

/** The files of the zip of a plugin: its folder and the license of the repository, sorted by path as bytes, as Disled sorts them. */
export function zipFiles(id) {
  const files = folderFiles(id).filter((file) => file.path !== LICENSE);
  files.push({ path: LICENSE, bytes: readFileSync(join(ROOT, LICENSE)) });
  return files.sort((a, b) => Buffer.compare(Buffer.from(a.path), Buffer.from(b.path)));
}

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * The fingerprint that Disled computes for the approval: the SHA-256 of one
 * line per file, sorted by path, made of the path, a NUL, the size, a NUL,
 * the SHA-256 of the content and a newline (Disled: docs/plugins/README.md).
 */
export function fingerprint(files) {
  const list = createHash('sha256');
  for (const { path, bytes } of files) {
    list.update(`${path}\0${bytes.length}\0${sha256(bytes)}\n`);
  }
  return list.digest('hex');
}

/** The zip of a plugin, the same bytes for the same files: entries in order, all dated 1980-01-01. */
export function zip(files) {
  const date = new Date(1980, 0, 1);
  const entries = {};
  for (const { path, bytes } of files) {
    entries[path] = [new Uint8Array(bytes), { level: 9, mtime: date }];
  }
  return Buffer.from(zipSync(entries));
}

/** The manifest among the files of a plugin. */
export function manifestOf(files) {
  const file = files.find((candidate) => candidate.path === 'plugin.json');
  if (!file) {
    throw new Error('no plugin.json');
  }
  return JSON.parse(file.bytes.toString('utf8'));
}

/** A JSON document of the network, none when it cannot be reached. */
export async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'disled-plugins-ci' } });
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`);
  }
  return response.json();
}
