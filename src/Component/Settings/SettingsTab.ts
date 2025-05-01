import { App, PluginSettingTab, Setting } from 'obsidian';
import confetti from 'canvas-confetti';
import PersonalOS from 'main';
import StringSetting  from './StringSetting';
import ListSetting from './ListSetting';
import { createSVGAndLink } from 'src/Tools/Utils';

export default class PersonalOSSettings extends PluginSettingTab {
	plugin: PersonalOS;
    randomEvents: string[] = [];
    recurringSubjects: string[] = [];
	officePages: string[] = [];
	inboxPages: string[] = [];
	configFolder: string = '';
	probabilityRandomEvents: number = 10;
	currentVersion: string = '1.0.0';
	enableChangelog: boolean = true;
	toggleXp: boolean = false;

	constructor(app: App, plugin: PersonalOS) {
		super(app, plugin);
		this.plugin = plugin;
	}
    loadSettings = async () => {
        await this.plugin.loadData().then((data: any) => {
            this.randomEvents = data.randomEvents || [];
            this.recurringSubjects = data.recurringSubjects || [];
			this.officePages = data.officePages || [];
			this.inboxPages = data.inboxPages || [];
			this.configFolder = data.configFolder || '';
			this.probabilityRandomEvents = data.probabilityRandomEvents || 10;
			this.currentVersion = data.currentVersion || '1.0.0';
			this.enableChangelog = data.enableChangelog || true;
			this.toggleXp = data.toggleXp || false;
        }).catch((error: any) => {
            console.error('Failed to load settings:', error);
        });
    }
	getSettings = () => ({
		randomEvents: this.randomEvents,
		recurringSubjects: this.recurringSubjects,
		officePages: this.officePages,
		inboxPages: this.inboxPages,
		configFolder: this.configFolder,
		probabilityRandomEvents: this.probabilityRandomEvents,
		currentVersion: this.currentVersion,
		enableChangelog: this.enableChangelog,
		toggleXp: this.toggleXp
	})
	saveSettings = async () => {
		await this.plugin.saveData(this.getSettings());
		this.plugin.graph.setOfficePages(this.officePages);
		this.plugin.startProcess.setInboxPages(this.inboxPages);
		this.plugin.startProcess.setConfigFolder(this.configFolder);
		this.plugin.functions.setConfigFolder(this.configFolder);
		this.plugin.engage.setConfigFolder(this.configFolder);
		this.plugin.engage.setTags(this.randomEvents);
		this.plugin.engage.setProbabilityRandomEvent(this.probabilityRandomEvents);
		this.plugin.manageToggle();
	}
	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		let links = containerEl.createEl('div');
		links.setAttr('style', 'display: flex; justify-content: space-between; width: 100%;');
		
		createSVGAndLink(
			links,
			'https://github.com/GengAd/obsidian-personal-os',
			`<svg width="48px" height="48px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
			'Ask anything on Github'
		);
		createSVGAndLink(
			links,
			'https://discord.gg/SZrM5ayuTR',
			`<svg width="48px" height="48px" viewBox="-1.5 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"><path d="m13.93 11.4c-.054.633-.582 1.127-1.224 1.127-.678 0-1.229-.55-1.229-1.229s.55-1.229 1.228-1.229c.683.029 1.225.59 1.225 1.277 0 .019 0 .037-.001.056v-.003zm-5.604-1.33c-.688.061-1.223.634-1.223 1.332s.535 1.271 1.218 1.332h.005c.683-.029 1.225-.59 1.225-1.277 0-.019 0-.037-.001-.056v.003c.001-.02.002-.043.002-.067 0-.685-.541-1.243-1.219-1.269h-.002zm12.674-7.598v21.528c-3.023-2.672-2.057-1.787-5.568-5.052l.636 2.22h-13.609c-1.359-.004-2.46-1.106-2.46-2.466 0-.002 0-.004 0-.006v-16.224c0-.002 0-.004 0-.006 0-1.36 1.101-2.462 2.459-2.466h16.081c1.359.004 2.46 1.106 2.46 2.466v.006zm-3.42 11.376c-.042-2.559-.676-4.96-1.77-7.086l.042.09c-.924-.731-2.088-1.195-3.358-1.259l-.014-.001-.168.192c1.15.312 2.15.837 3.002 1.535l-.014-.011c-1.399-.769-3.066-1.222-4.839-1.222-1.493 0-2.911.321-4.189.898l.064-.026c-.444.204-.708.35-.708.35.884-.722 1.942-1.266 3.1-1.56l.056-.012-.12-.144c-1.284.065-2.448.529-3.384 1.269l.012-.009c-1.052 2.036-1.686 4.437-1.728 6.982v.014c.799 1.111 2.088 1.826 3.543 1.826.041 0 .082-.001.123-.002h-.006s.444-.54.804-.996c-.866-.223-1.592-.727-2.093-1.406l-.007-.01c.176.124.468.284.49.3 1.209.672 2.652 1.067 4.188 1.067 1.191 0 2.326-.238 3.36-.668l-.058.021c.528-.202.982-.44 1.404-.723l-.025.016c-.526.703-1.277 1.212-2.144 1.423l-.026.005c.36.456.792.972.792.972.033.001.072.001.111.001 1.461 0 2.755-.714 3.552-1.813l.009-.013z"/></svg>`,
			'Join Discord server'
		);
		createSVGAndLink(
			links,
			'https://discord.gg/SZrM5ayuTR',
			`<svg width="48px" height="48px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M232 64L280 64 280 214 277 270 300 242 356 189 388 221 256 353 124 221 156 189 212 242 235 270 232 214 232 64ZM64 400L448 400 448 448 64 448 64 400Z"/></svg>`,
			'Download vault template'
		);
		new ListSetting(this, this.saveSettings, (list: string[])=>this.inboxPages=list, containerEl.createEl('div'), this.inboxPages,
			'Inbox folders', 'Enter the path of your inbox folders');
		new ListSetting(this, this.saveSettings, (list: string[])=>this.officePages=list, containerEl.createEl('div'), this.officePages,
			'Work in Progress folders', 'Enter the path of your work in progress folders');
		new Setting(containerEl).setName('Config folder').setHeading();
		new StringSetting(containerEl, this.saveSettings, (value: string) => this.configFolder = value, 
			'Config folder', 'Enter the path of your config folder', this.configFolder, 'Leave empty to set as root');
		new ListSetting(this, this.saveSettings,(list: string[])=>this.randomEvents=list, containerEl.createEl('div'), this.randomEvents, 'Engage random events',
			'Add a new tag for random event');
		new Setting(containerEl)
				.setName('Probability of random events')
				.addText(text => text
					.setValue(this.probabilityRandomEvents.toString())
					.setPlaceholder('0')
					.onChange((value: string) => {
						this.probabilityRandomEvents = parseInt(value) || 0;
						this.saveSettings();
					}));
		containerEl.createEl('h3', {text: 'Technical settings'});
		new Setting(containerEl)
			.setName('Enable changelog popups')
			.setDesc('Display a popup with the informations of the new version when the plugin is updated')
			.addToggle((toggle) => {
				toggle.setValue(this.enableChangelog)
					.onChange(value => {
						this.enableChangelog = value;
						this.saveSettings();
					});
			});
			new Setting(containerEl)
			.setName('Enable XP earned notification')
			.setDesc('Display a notification with XP earned when a task is completed')
			.addToggle((toggle) => {
				toggle.setValue(this.toggleXp)
					.onChange(value => {
						this.toggleXp = value;
						this.saveSettings();
					});
			});


			const button = containerEl.createEl('button', {text: 'Buy me a coffee ❤️'});
			button.setAttr('style', `
				background-color: #4CAF50; 
				border: none;
				color: white;
				text-align: center;
				text-decoration: none;
				display: inline-block;
				font-size: 16px;
			`);
			button.addEventListener('click', async () => {
				const canvas = document.createElement('canvas');
				document.body.appendChild(canvas);
				canvas.setAttr('style', `
					position: fixed;
					width: 100vw;
					height: 100vh;
					top: 0;
					left: 0;
					pointer-events: none;
					z-index: 9999;`);
				const confetto = confetti.create(canvas, {
					resize: true,
					useWorker: true,
				});
				const pos = button.getBoundingClientRect();
				await confetto({
					particleCount: 200,
					startVelocity: 30,
					spread: 360,
					angle: 90,
					drift: 0,
					ticks: 100,
					origin: {
						x: (pos.x + pos.width / 2) / window.innerWidth,
						y: (pos.y + pos.height / 2) / window.innerHeight,
					},
					colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#8f00ff'],
				});
				canvas.remove();
				window.open('https://www.buymeacoffee.com/swandyos', '_blank');
			});
	}
}
