import { App, PluginSettingTab, Setting } from 'obsidian';
import confetti from 'canvas-confetti';
import PersonalOS from 'main';
import StringSetting  from './StringSetting';
import ListSetting from './ListSetting';

export default class PersonalOSSettings extends PluginSettingTab {
	plugin: PersonalOS;
    randomEvents: string[] = [];
    recurringSubjects: string[] = [];
	officePages: string[] = [];
	inboxPages: string[] = [];
	configFolder: string = '';
	probabilityRandomEvents: number = 10;

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
		probabilityRandomEvents: this.probabilityRandomEvents
	})
	saveSettings = async () => {
		await this.plugin.saveData(this.getSettings());
		this.plugin.graph.setOfficePages(this.officePages);
		this.plugin.startProcess.setInboxPages(this.inboxPages);
		this.plugin.startProcess.setConfigFolder(this.configFolder);
		this.plugin.startWork.setConfigFolder(this.configFolder);
		this.plugin.startWork.setTags(this.randomEvents);
		this.plugin.startWork.setProbabilityRandomEvent(this.probabilityRandomEvents);
	}
	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		const button = containerEl.createEl('button', {text: 'Buy me a coffee ❤️'});
		containerEl.createEl('h1', {text: 'Folders'});
		new ListSetting(this, this.saveSettings, (list: string[])=>this.inboxPages=list, containerEl.createEl('div'), this.inboxPages,
			'Inbox folders', 'enter the path of your inbox folders');
		new ListSetting(this, this.saveSettings, (list: string[])=>this.officePages=list, containerEl.createEl('div'), this.officePages,
			'Work in Progress folders', 'enter the path of your office folders');
		containerEl.createEl('h3', {text: 'Config Folder'});
		new StringSetting(containerEl, this.saveSettings, (value: string) => this.configFolder = value, 
			'Config folder', 'enter the path of your config folder', this.configFolder, 'Leave empty to set as root');
		new ListSetting(this, this.saveSettings,(list: string[])=>this.randomEvents=list, containerEl.createEl('div'), this.randomEvents, 'Start Work random events',
			'Add a new tag for random event');
		new Setting(containerEl)
				.setName('Probability of random events')
				.addText(text => text
					.setValue(this.probabilityRandomEvents.toString())
					.setPlaceholder('10')
					.onChange((value: string) => {
						this.probabilityRandomEvents = parseInt(value) || 0;
						this.saveSettings();
					}));
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
