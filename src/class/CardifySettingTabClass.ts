import {App, PluginSettingTab, Setting} from "obsidian";
import Cardify from "../main";

export default class CardifySettingTab extends PluginSettingTab {
	plugin: Cardify;

	constructor(app: App, plugin: Cardify) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Set separator for cards')
			.setDesc('Select the separator used to separate cards in one markdown file')
			.addDropdown(dropDown => {
				dropDown.addOption('empty line', 'empty line');
				dropDown.addOption('---', '---');
				dropDown.setValue(this.plugin.settings.separatorName)
				dropDown.onChange(async (value) => {
					this.plugin.settings.separatorName = value;
					switch (value) {
						case 'empty line':
							this.plugin.settings.separator = '\n{2,}'
							break;
						case '---':
							this.plugin.settings.separator = '\n+---\\s*(?:\n+|\n*?)'
							break;
					}
					await this.plugin.saveSettings();
				})
			})
	}
}
