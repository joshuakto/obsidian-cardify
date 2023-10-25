import {Editor, MarkdownView, normalizePath, Notice, Plugin, setIcon, TFile} from 'obsidian';
import {
	addMissingInternalLink,
	generateRandomKey,
	parseCardBlock,
	parseMDFile,
	removeUnsuitableCharacters
} from "./helper";
import {LinkedBlock} from "./type";
import CardifySettingTab from "./class/CardifySettingTabClass";
import CardifySettings from "./interface/ICardifySettings";

const DEFAULT_SETTINGS: CardifySettings = {
	separatorName: 'empty line',
	separator: '\n{2,}', // by default, card are separated by 2 or more new line symbols
}
export default class Cardify extends Plugin {
	settings: CardifySettings;
	statusBarItemEl: HTMLElement;

	async createNewFileContent(content: string, activeFilePath: string): Promise<Array<LinkedBlock>|null> {
		const rSeparator = new RegExp(this.settings.separator)
		const cardBlocks: Array<string> = content.split(rSeparator);
		const nonEmptyBlocks: Array<string> = cardBlocks.filter(
			(block: string): boolean => block.trim().length > 0
		)
		return nonEmptyBlocks.map(
			(block: string): LinkedBlock => {
				return parseCardBlock(block, activeFilePath);
			});
	}
	
	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('combine', 'Cardify', async (evt: MouseEvent) => {
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
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				new Notice('Unable to get active view, place cursor on file content to get active view.')
				return null
			}
			const editor = activeView.editor;

			const activeFileBaseName: string = activeFile.basename
			const parentDir:string = activeFile.parent? activeFile.parent.path : ''


			// create folder to store generated md if folder does not exist yet
			const parentFolder: string = parentDir==='/'? '/' : (parentDir + '/')
			const generatedFolder: string = parentFolder + activeFileBaseName + '-cardify-generated/'

			// extract file frontmatter and content from file content
			const fileContent: string = editor.getValue();
			const {frontMatter, content}: {frontMatter: string | null, content: string} = parseMDFile(fileContent);

			// edit content to add missing internal link
			const frontMatterString: string = frontMatter? frontMatter : '';
			const linkedContent: string = addMissingInternalLink(content, this.settings.separator)

			// add internal link to blocks if a link is not detected for a block (link is in the form of \n^<id>)
			editor.setValue(frontMatterString + linkedContent)

			// parse file content from activeFile into separate md files
			const newFileContent = await this.createNewFileContent(linkedContent, activeFile.path);
			if (!newFileContent || newFileContent.length===0) {return new Notice('No new content');}

			// make sure folder exists to store the generated md files storing the linked content
			if (!await this.app.vault.adapter.exists(generatedFolder)) {
				await this.app.vault.createFolder(generatedFolder);
			}

			// write parsed content into new md files
			let createdFiles = 0 // to keep track of created files
			const createdContent = newFileContent.map(async (lb: LinkedBlock, idx: number) => {
				const filename: string = lb.title === '' ? idx.toString() : idx.toString() + '-' + lb.title
				const filepath: string = normalizePath(removeUnsuitableCharacters(generatedFolder + '/' + filename + '.md'));
				if (await this.app.vault.adapter.exists(filepath)) {
					new Notice(filepath + ' already exists, skipped overwriting it.')
				} else {
					createdFiles++
					return await this.app.vault.create(filepath, lb.link)
				}
			})
			await Promise.all(createdContent)
			createdFiles > 0 && new Notice(createdFiles + ' new files stored in ' + generatedFolder)
		});
		ribbonIconEl.addClass('cardify-ribbon-class');
		setIcon(ribbonIconEl, 'copy-plus')

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		this.statusBarItemEl = this.addStatusBarItem();

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'insert-internal-link',
			name: 'Insert internal link',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('^' + generateRandomKey());
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CardifySettingTab(this.app, this));


		// This adds a function that update the status bar everytime the editor changes
		this.registerEvent(this.app.workspace.on('editor-change', async () => {
			const activeFile: TFile | null = this.app.workspace.getActiveFile()
			if (activeFile === null ) {
				new Notice('Cannot get active file.')
				return null
			}
			if (activeFile.extension !== 'md') {
				new Notice('Active file is not a markdown file.')
				return null
			}
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				new Notice('Cannot get active view of type MarkdownView.')
				return null
			}
			const editor = activeView.editor;
			const fileContent: string = editor.getValue();
			const {content}: {frontMatter: string | null, content: string} = parseMDFile(fileContent);
			const gSeparator = new RegExp(this.settings.separator, 'g');
			const blocks: Array<string> = content.split(gSeparator);
			const nonEmptyBlocks: Array<string> = blocks.filter(
				(block: string): boolean => block.trim().length > 0
			)
			const statusBarText = nonEmptyBlocks.length.toString() + ' cards';
			this.statusBarItemEl.setText(statusBarText);
		}));
	}

	onunload() {}

	async loadSettings() {
		this.settings = DEFAULT_SETTINGS
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
