# Install and use these plugins

Choose a plugin in the [catalog](../README.md#plugins), then follow the steps for your platform. In Codex and Claude Code, adding the marketplace makes its plugins available; install each plugin you want to use.

Prefer a printable version? See the [one-page quick start (PDF)](https://raw.githubusercontent.com/courtney-chapman/tools-public/main/docs/plugin-quick-start.pdf).

## ChatGPT (web)

1. Open [Releases](https://github.com/courtney-chapman/tools-public/releases), choose the latest plugin release, and download that plugin's ZIP.
2. In ChatGPT, open **Plugins → Add**, drag in the ZIP (or select it), and click **Install**. The plugin appears under **Personal plugins**.
3. Start a chat. Describe your task or mention the plugin with `@`.

In a managed workspace, upload options can depend on your permissions. If personal ZIP upload is unavailable, ask your administrator about **Admin console → Plugins → Add → Upload plugin**. [ChatGPT upload guidance](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt)

## Codex (desktop or CLI)

1. In a terminal, add this repository as a marketplace:

   ```bash
   codex plugin marketplace add courtney-chapman/tools-public
   ```

2. Browse the plugins with `codex plugin list --marketplace tools-public`, or open **Plugins** in Codex (`/plugins` in the CLI).
3. Install the one you want. For example:

   ```bash
   codex plugin add procurement-market-research@tools-public
   ```

4. Start a new chat and describe the task. [Codex marketplace guidance](https://developers.openai.com/plugins/build/plugins)

## Claude Code

1. In Claude Code, add this repository as a marketplace:

   ```text
   /plugin marketplace add courtney-chapman/tools-public
   ```

2. Install a plugin from the catalog. For example:

   ```text
   /plugin install procurement-market-research@tools-public
   ```

3. Start a new session and describe the task. [Claude Code marketplace guidance](https://code.claude.com/docs/en/plugin-marketplaces)
