# Contributing a plugin

A plugin of the catalog runs on the computers of people who trust the
review: every version of every plugin goes through a pull request that a
maintainer reads in full. This page says what a plugin needs to pass.

## A plugin

One folder, `plugins/<id>/`, named by the id of its manifest:

- `plugin.json`, the [manifest](https://github.com/Oui-Dev/Disled/blob/main/docs/plugins/manifest.md),
  with its `$schema`;
- `README.md`, for its users: what it does, what it needs, how to set it
  up, as [the one of Claude Code](plugins/claude-code/README.md) does;
- the sources of its program, if it has one.

## The rules

- **MIT.** Every plugin is under the [MIT license](LICENSE) of the
  repository, which each zip carries: no license file in the folder. A pull
  request offers its files under that license.
- **Sources only.** The review reads everything that runs: no binary, no
  minified or generated code, no dependency to install. A program uses the
  standard library of its runtime, or readable code of its folder.
- **A runtime that the user installs.** The command of `run` starts with
  `node`, `deno`, `bun`, `python3`, `python` or `pwsh`; the README says
  which one, and from which version.
- **What it does, in the open.** The description and the README say every
  thing that the plugin does beyond the lamp: a file it writes, a program
  it starts, and above all the network, which a plugin uses only when its
  README says why.
- **Its own data in its data folder.** A program writes only in
  `DISLED_PLUGIN_DATA`, never in its own folder.
- **A new version for new files.** Any change of the files of a plugin
  raises its `version`, in [SemVer](https://semver.org): Disled offers an
  update only for a later version.
- 200 files and 1 MiB at most, with paths in ASCII.

## The checks

Each pull request runs `npm test` and `npm run check`: the manifest against
the [schema of Disled](https://github.com/Oui-Dev/Disled/blob/main/docs/plugins/plugin.schema.json),
what a schema cannot see (the states that the rules and `idle` name), and
the rules above. The summary of the job lists what each new or changed
plugin asks for. Run them before you push:

```sh
npm ci
npm test
npm run check
```

`SCHEMA_FILE=../Disled/docs/plugins/plugin.schema.json npm run check`
checks against the schema of a clone of Disled.

Then try the plugin: zip its folder and choose **Import a plugin** in the
integrations window of Disled, or copy the folder into the plugins folder.

## The review

A maintainer reads every file, and checks that:

- the capabilities are those that the plugin needs, and no more;
- the program does what the description says, and nothing else;
- nothing reaches the network, the files of the user or other programs
  without the README saying so;
- the README tells a user what to expect, in plain words.
