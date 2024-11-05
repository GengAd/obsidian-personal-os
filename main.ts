import { Notice, Plugin, moment } from 'obsidian';
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
import ProgressBar from 'src/Component/ProgressBar';


export default class PersonalOS extends Plugin {
	settings: PersonalOSSettings;
	engage: Engage;
	engageCurrentFile: EngageCurrentFile;
	startProcess: StartProcess;
	graph: ContextGraph;
	taskFailer: TaskFailer;
	hideTasks: boolean;
	xpFeedback: XpFeedback | null;
	async onload(){	
        customElements.define('progress-bar', ProgressBar);
		this.hideTasks = false;
		this.app.workspace.onLayoutReady(async () => {
			this.settings = new PersonalOSSettings(this.app, this);
			await this.settings.loadSettings();
			this.addSettingTab(this.settings);
			this.checkForUpdate();
			this.graph = new ContextGraph(this.app, this.settings.officePages, {multi:true, type:"mixed", allowSelfLoops:true});
			this.taskFailer = new TaskFailer(this.app, this.graph);
			this.engage = new Engage(this.app, this.settings.randomEvents, this.graph, this.settings.configFolder, this.settings.probabilityRandomEvents);
			this.engageCurrentFile = new EngageCurrentFile(this.app);
			this.startProcess = new StartProcess(this.app, this.graph, this.settings.inboxPages, this.settings.configFolder);
			if(this.settings.toggleXp){
				this.xpFeedback = new XpFeedback(this.app);
				this.registerEvent(this.app.metadataCache.on('changed', this.xpFeedback.displayXpEarned));
			}
			this.loadCommands();
		});
	}
	manageToggle = () => {
		if(this.settings.toggleXp && !this.xpFeedback){
			this.xpFeedback = new XpFeedback(this.app);
			this.registerEvent(this.app.metadataCache.on('changed', this.xpFeedback.displayXpEarned));
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
			name:"Snooze tasks",
			callback:()=>{
				new SnoozeModal(this.app).open();
			}
		});
		this.addCommand({
			id:"random-snooze-tasks",
			name:"Random snooze tasks",
			callback:()=>{
				new RandomSnoozeModal(this.app).open();
			}
		});
		this.addCommand({
			id:"toggle-task-hider",
			name:"Toggle task hider",
			callback:()=>{
				this.hideTasks = !this.hideTasks;
				document.body.toggleClass('hide-finished-tasks', this.hideTasks);
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