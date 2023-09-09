import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import * as path from "path";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

/**
 * Extracts the front matter from the content string.
 *
 * @param {string} content - The content string to extract front matter from.
 * @return {string | null} The front matter if found, otherwise null.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractFrontMatter(content: string): string | null {
	const frontMatterMatch = content.match(/^(---\s*\n[\s\S]*?\n?---)/);
	return frontMatterMatch ? frontMatterMatch[1] : null;
}

type LinkedBlock = {
	title: string,
	link: string
}

/**
 * From the given markdown content, extracts annotation blocks, which are separated by an empty line.
 *
 * @param {string} content - The markdown content to extract annotation blocks from.
 * @return {Array<string>} - An array of extracted annotation blocks.
 */
function extractAnnotationBlocks(content: string): Array<string> {
	const annotationBlocks: Array<string> = content.split("\n\n");
	return annotationBlocks.slice(1);
}

function extractComment(content: string): string {
	const match: RegExpMatchArray | null = content.match('(?<=\n>%%COMMENT%%\n>)(.*?)(?=\n)')
	return match ? match[1] : '';
}

/**
 * Extracts the first internal link from the given content.
 *
 * @param {string} content - The content to extract the link from.
 * @return {string | null} - The extracted link or null if no link is found.
 */
function extractInternalLink(content: string): string | null {
	const match: RegExpMatchArray | null = content.match('(?<=\n\\^)(.*?)(?=\n|$)')
	return match? match[1] : null;
}


export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async createNewFileContent(activeFile: TFile): Promise<Array<LinkedBlock>|null> {
		const currentFile: TFile = this.app.vault.getAbstractFileByPath(activeFile.path) as TFile;
		const fileContent: string = await this.app.vault.read(currentFile);
		/**
		 * Might be useful later
		const frontMatter: string | null = extractFrontMatter(content);
		// notify users if front Matter does not contain annotation-target as a property
		if (!frontMatter || !frontMatter.includes('annotation-target')) {
			new Notice('Active file does not contain annotation-target as file property.')
			return null
		}
		 */
		const annotationBlocks: Array<string> = extractAnnotationBlocks(fileContent);
		const links: Array<LinkedBlock> = annotationBlocks.map(
			(block: string): LinkedBlock => {
				return {
					title: extractComment(block),
					link: '![[' + activeFile.basename + '#^' + extractInternalLink(block) + ']]'
				};
			})
		return links;
	}
	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', async (evt: MouseEvent) => {
			// Check that the active file is a md file
			const activeFile: TFile | null = this.app.workspace.getActiveFile()
			if (activeFile === null ) {
				new Notice('Cannot get active file.')
				return null
			}
			if (activeFile.extension !== 'md') {
				new Notice('Active file is not a markdown file.')
				return null
			}
			const activeFileBaseName: string = path.basename(activeFile.name, '.md')
			const activeDir:string = path.dirname(activeFile.path)

			// create folder to store generated md if folder does not exist yet
			const generatedFolder: string = activeDir + '/' + activeFileBaseName
			if (!await this.app.vault.adapter.exists(generatedFolder)) {
				await this.app.vault.createFolder(generatedFolder);
			}

			// parse file content from activeFile into separate md files
			const newFileContent = await this.createNewFileContent(activeFile);
			if (!newFileContent) {return new Notice('No new content');}

			// write parsed content into new md files
			newFileContent.map(async (lb: LinkedBlock, idx: number) => {
				// extract comment from the content to use as filename
				const filename: string  = lb.title === ''? idx.toString() : idx.toString() + '-' + lb.title
				await this.app.vault.create(generatedFolder + '/' + filename + '.md', lb.link)
				new Notice('New files stored in ' + generatedFolder)
			})
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
