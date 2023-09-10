# Obsidian Cardify Plugin

This is a plugin to separate contents in a markdown, assign links to each separated content, and create subsequent markdowns to store the link. The objective is to make it easier to incorporate markdown contents as cards in canvas.

Cardify has these basic functionalities
- Selection of separator (currently only supports two new lines or ---).
- Detect whether an internal link exists in the content, if not assign automatically.
- Create a markdown for each separated content (while preserving the frontmatter).
	- Give an index for the created page based on the position of the separated contents.
	- Extract comment from content to use as title for the created page	
- Create a folder to store the created markdown.
- (to remove) Registers a global click event and output 'click' to the console.
- (to remove) Registers a global interval which logs 'setInterval' to the console.

Planned functionalities
- Switch for toggling function to automatically assign internal links.
- List of regex arranged in order of priority to use as title of the created markdown.

## How to use
1. Upon installation, a dice icon will be visible on the ribbon.
2. Navigate to the markdown file you want to Cardify.
3. Clicking the dice icon will generate a folder named the same as the active file and store created markdowns in it.
**Note:** Currently, the plugin will change the content of the markdown when inserting internal link. If the spacing of the document is important, do not use this plugin for now. In the future there will be an option to choose whether you want to modify content of existing files.

## Acknowledgements
This plugin is built using [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin) as a template.

### Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

### API Documentation

See https://github.com/obsidianmd/obsidian-api
