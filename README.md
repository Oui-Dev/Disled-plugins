# Disled plugins

The catalog of plugins of [Disled](https://github.com/Oui-Dev/Disled), the
USB status light: plugins that let another program drive the lamp, which
the maintainers review at every version. Disled 3.0 and later install them
from the **Catalog** tab of their integrations window.

| Plugin | What it does |
|---|---|
| [Claude Code](plugins/claude-code/) | The lamp shows whether Claude Code works, waits for you, or is done. |

## Install a plugin

In Disled, open the integrations window (mode button of the popup, **Manage
integrations**), then the **Catalog** tab, and choose **Install**. Disled
then asks, as for any plugin, whether you allow what the plugin will be
able to do. Its README says what else it needs, such as a block to paste
into the settings of its program.

A new version shows as **Update** in the same tab. Since its files change,
Disled asks for your approval again.

## How the catalog is published

At every change of `main`, the [publish workflow](.github/workflows/publish.yml)
builds, on [GitHub Pages](https://oui-dev.github.io/Disled-plugins/):

- `zips/<id>-<version>.zip`: the files of each plugin, and the
  [license](LICENSE) of the repository;
- `index.json`: the manifest of each plugin, and the size, the SHA-256 and
  the fingerprint of its zip and files;
- `index.json.sig`: the signature of the index with the catalog key.

Disled reads the index only when its Catalog tab opens. It refuses an index
that the catalog key did not sign, and a zip whose size, SHA-256 or files
differ from the index, before it asks for the approval of the user. The
catalog key is not the update key of Disled.

## Add a plugin

Read [CONTRIBUTING.md](CONTRIBUTING.md), then open a pull request with a
folder in `plugins/`. The plugin API is in the
[docs of Disled](https://github.com/Oui-Dev/Disled/tree/main/docs/plugins).

## For the maintainers

The publish workflow signs the index with the catalog key, minisign key
`474E5F10EC4C34E3`, from the secrets `CATALOG_SIGNING_KEY` (the private key)
and `CATALOG_SIGNING_KEY_PASSWORD` (its password). Disled holds its public
half in `CATALOG_KEY`, in `app/src-tauri/src/plugins/catalog.rs`. Keep a
backup of the private key and its password outside the computer and out of
every repository: a new key means a new release of Disled, and its earlier
versions would read the catalog as not signed. GitHub Pages publishes from
GitHub Actions (Settings › Pages › Source).

## License

Every plugin of the catalog is under the [MIT license](LICENSE).
