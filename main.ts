import { Plugin, MarkdownView, WorkspaceLeaf, TFile } from 'obsidian';
import PersonalOSSettings from './src/Component/Settings/SettingsTab';
import Engage from 'src/Component/Engage';
import EngageCurrentFile from 'src/Component/EngageCurrentFile';
import StartProcess from 'src/Component/StartProcess';
import ContextGraph from 'src/Component/ContextGraph';
import XpFeedback from 'src/Component/XpFeedback';
import TaskFailer from 'src/Component/TaskFailer';
import SnoozeModal from 'src/Modal/SnoozeModal';
import RandomSnoozeModal from 'src/Modal/RandomSnoozeModal';
import ChangelogModal from 'src/Modal/ChangelogModal';
import ProfileView from 'src/View/ProfileView';
import ProgressBar from 'src/Component/ProgressBar';
import Calendar from 'src/Component/Calendar';
import Timeline from 'src/Component/Timeline';
import POSVaultFunctions from 'src/Tools/POSVaultFunctions';


export default class PersonalOS extends Plugin {
	settings: PersonalOSSettings;
	engage: Engage;
	engageCurrentFile: EngageCurrentFile;
	startProcess: StartProcess;
	graph: ContextGraph;
	taskFailer: TaskFailer;
	hideTasks: boolean;
	xpFeedback: XpFeedback | null;
	functions: POSVaultFunctions;
	profile: ProfileView;
	async onload(){	
		if(customElements.get('progress-bar') == null)
        	customElements.define('progress-bar', ProgressBar);
		this.hideTasks = false;
		this.app.workspace.onLayoutReady(async () => {
			this.settings = new PersonalOSSettings(this.app, this);
			await this.settings.loadSettings();
			this.functions = new POSVaultFunctions(this.app, this.settings.configFolder);
			this.addSettingTab(this.settings);
			this.checkForUpdate();
			this.graph = new ContextGraph(this.app, this.settings.officePages, {multi:true, type:"mixed", allowSelfLoops:true});
			this.taskFailer = new TaskFailer(this.app, this.graph);
			this.engage = new Engage(this.app, this.settings.randomEvents, this.graph, this.settings.configFolder, this.settings.probabilityRandomEvents);
			this.engageCurrentFile = new EngageCurrentFile(this.app);
			this.startProcess = new StartProcess(this.app, this.graph, this.settings.inboxPages, this.settings.configFolder);
			if(this.settings.toggleXp){
				this.xpFeedback = new XpFeedback(this.app);
				this.registerEvent(this.app.metadataCache.on('changed', (f: TFile) =>this.xpFeedback!.displayXpEarned(f, this.profile.display)));
			}
			this.registerMarkdownCodeBlockProcessor("Calendar", (source, el, ctx) => {
				// Parse the source to extract parameters
					const lines = source.split('\n');
					const input: {[name: string]: string} = {};
					const regex = /^\s*(\w+)\s*:\s*(.*)$/;
					lines.forEach(line => {
						const match = line.match(regex);
						if (match) {
							const key = match[1].trim();
							const value = match[2].trim();
							input[key] = value;
						}
					});
					el.parentElement?.classList.remove('markdown-rendered');
				// Create a new Calendar instance and call displayCalendar
				new Calendar(this.app).displayCalendar(input, el.createEl('div'));
			});
			this.registerMarkdownCodeBlockProcessor("Taskido", (source, el, ctx) => {
				// Parse the source to extract parameters
					const lines = source.split('\n');
					const input: {[name: string]: string} = {};
					const regex = /^\s*(\w+)\s*:\s*(.*)$/;
					lines.forEach(line => {
						const match = line.match(regex);
						if (match) {
							const key = match[1].trim();
							const value = match[2].trim();
							input[key] = value;
						}
					});
					el.parentElement?.classList.remove('markdown-rendered');
				// Create a new Calendar instance and call displayCalendar
				new Timeline(this.app).createTimeline(input, el.createEl('div'));
			});
			this.loadCommands();
			this.registerView('Profile View', (leaf: WorkspaceLeaf) => (this.profile = new ProfileView(leaf, this)));
		});
	}
	manageToggle = () => {
		if(this.settings.toggleXp && !this.xpFeedback){
			this.xpFeedback = new XpFeedback(this.app);
			this.registerEvent(this.app.metadataCache.on('changed', (f: TFile) =>this.xpFeedback!.displayXpEarned(f, this.profile.display)));
		}else if(!this.settings.toggleXp && this.xpFeedback){
			this.app.metadataCache.off('changed', this.xpFeedback.displayXpEarned);
			this.xpFeedback = null;
		}
	}

	loadCommands = () =>{
		this.addCommand({
			id:"start-work",
			name:"Engage",
			callback:()=>{
				this.engage.findNextFile();
			}
		});
		this.addCommand({
			id:"start-work-current-file",
			name:"Engage Current File",
			callback:()=>{
				this.engageCurrentFile.findNextFile();
			}
		});
		this.addCommand({
			id:"start-process",
			name:"Process",
			callback:()=>{
				this.startProcess.findNextFile();
			}
		});
		this.addCommand({
			id:"set-focus",
			name:"Set focus",
			callback:()=>{
				this.engage.setManuallyFocus();
			}
		});
		this.addCommand({
			id:"reload-graph",
			name:"Reload graph",
			callback: ()=>{
				this.graph.reload();
			}
		});
		this.addCommand({
			id:"auto-fail-tasks",
			name:"Auto fail current file",
			callback: ()=>{
				this.taskFailer.failTask(null, true);
			}
		});
		this.addCommand({
			id:"auto-fail-wip-tasks",
			name:"Auto fail work in progress files",
			callback: ()=>{
				this.taskFailer.autoFailVaultTask();
			}
		});
		this.addCommand({
			id:"snooze-tasks",
			name:"Delay file dates",
			callback:()=>{
				new SnoozeModal(this.app).open();
			}
		});
		this.addCommand({
			id:"random-snooze-tasks",
			name:"Generate delayed date",
			callback:()=>{
				new RandomSnoozeModal(this.app).open();
			}
		});
		this.addCommand({
			id:"toggle-task-hider",
			name:"Toggle actions hider",
			callback:()=>{
				this.hideTasks = !this.hideTasks;
				document.body.toggleClass('hide-finished-tasks', this.hideTasks);
				if(this.hideTasks)
					document.body.toggleClass('no-animation', true);
					requestAnimationFrame(() =>{
						document.body.toggleClass('no-animation', false);
					});
			}
		});
		
		this.addCommand({
			id:"insert-time-emoji",
			name:"Insert time emoji",
			callback:()=>{
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					const editor = activeView.editor;
					const cursor = editor.getCursor();
					editor.replaceRange('⌚', cursor);
					editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
				}
			}
		});

		this.addCommand({
			id:"profileview",
			name:"Profile View",
			callback:async ()=>{
				await this.app.workspace.getRightLeaf(false)!.setViewState({
					type: 'Profile View',
					active: true,
				  });
				  this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType('Profile View')[0]);
			}
		});
	}
	checkForUpdate = () => {
		if(this.settings.enableChangelog && this.manifest.version != this.settings.currentVersion){
			new ChangelogModal(this.app).open();
			this.settings.currentVersion = this.manifest.version;
			this.settings.saveSettings();
		}
	}
}