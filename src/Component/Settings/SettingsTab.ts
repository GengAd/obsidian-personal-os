import { PluginSettingTab } from 'obsidian';
import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import SettingsTabComponent from './SettingsTabComponent';

export default class PersonalOSSettings extends PluginSettingTab {
	plugin: any;

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		function SettingsTabWrapper({ plugin }: { plugin: any }) {
			const [settings, setSettings] = useState(plugin.settings);
			useEffect(() => {
				const update = () => setSettings({ ...plugin.settings });
				plugin.onSettingsChange(update);
				return () => {
					// No unsubscribe logic for now
				};
			}, []);
			return h(SettingsTabComponent, {
				plugin,
				settings,
				updateSetting: plugin.updateSetting.bind(plugin),
					});
		}

		render(h(SettingsTabWrapper, { plugin: this.plugin }), containerEl);
	}

	hide(): void {
		render(null, this.containerEl);
	}
}
