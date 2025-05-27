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
import MindSweepView from 'src/View/MindSweepView';
import MissionDownloadView from 'src/View/MissionDownloadView';
import ProgressBar from 'src/Component/ProgressBar';
import Calendar from 'src/Component/Calendar';
import Timeline from 'src/Component/Timeline';
import POSVaultFunctions from 'src/Tools/POSVaultFunctions';
import { POSVaultDcFunctions } from 'src/Tools/POSVaultDcFunctions';
import MoveFolder from 'src/Component/MoveFolder';


export default class PersonalOS extends Plugin {
	settings: {[key: string]: any};
	settingsListeners: (() => void)[] = [];
	engage: Engage;
	engageCurrentFile: EngageCurrentFile;
	startProcess: StartProcess;
	graph: ContextGraph;
	taskFailer: TaskFailer;
	hideTasks: boolean;
	xpFeedback: XpFeedback | null = null;
	functions: POSVaultFunctions;
	dcFunctions : POSVaultDcFunctions;
	profile: ProfileView;
	moveFolder: MoveFolder;
	settingsTab: PersonalOSSettings;
	async onload(){	
		if(customElements.get('progress-bar') == null)
        	customElements.define('progress-bar', ProgressBar);
		this.hideTasks = false;
		this.app.workspace.onLayoutReady(async () => {
			this.settings = await this.loadData() || {};
			if (this.settings.buffFolder === undefined) this.settings.buffFolder = "";
			if (this.settings.debuffFolder === undefined) this.settings.debuffFolder = "";
			if (this.settings.displayMoveNotice === undefined) this.settings.displayMoveNotice = true;
			if (this.settings.missionDestinationFolder === undefined) this.settings.missionDestinationFolder = "";
			if (this.settings.ontologyFolder === undefined) this.settings.ontologyFolder = "";
			this.settingsTab = new PersonalOSSettings(this.app, this);
			this.addSettingTab(this.settingsTab);
			this.checkForUpdate();
			this.functions = new POSVaultFunctions(this.app, this.settings.configFolder);
			this.dcFunctions = new POSVaultDcFunctions(this.app);
			this.graph = new ContextGraph(this.app, this.settings.officePages, {multi:true, type:"mixed", allowSelfLoops:true});
			this.taskFailer = new TaskFailer(this.app, this.graph, this.settings.instrumentalFolders);
			this.engage = new Engage(this.app, this.settings.randomEvents, this.graph, this.settings.configFolder, this.settings.probabilityRandomEvents);
			this.engageCurrentFile = new EngageCurrentFile(this.app);
			this.startProcess = new StartProcess(this.app, this.graph, this.settings.inboxPages, this.settings.instrumentalFolders,this.settings.configFolder);
			this.moveFolder = new MoveFolder(this.app, this.settings.excludedFolders, this.settings.specificRouting, this.settings.displayMoveNotice);
			this.manageToggle();
			this.registerMarkdownCodeBlockProcessor("Calendar", (source, el, ) => {
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
			this.registerMarkdownCodeBlockProcessor("Taskido", (source, el, ) => {
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
			this.registerView('Mind Sweep View', (leaf: WorkspaceLeaf) => new MindSweepView(leaf));
			this.registerView('Mission Download View', (leaf: WorkspaceLeaf) => new MissionDownloadView(leaf));
		});
	}
	manageToggle = () => {
		if(this.settings.toggleXp && !this.xpFeedback){
			this.xpFeedback = new XpFeedback(this.app);
			this.registerEvent(this.app.metadataCache.on('changed', this.callDisplayXpEarned));
		}else if(!this.settings.toggleXp && this.xpFeedback){
			this.app.metadataCache.off('changed', this.callDisplayXpEarned);
			this.xpFeedback = null;
		}
		if(this.settings.automaticMove){
			this.registerEvent(this.app.metadataCache.on('changed', this.moveFolder.move));
		}else{
			this.app.metadataCache.off('changed', this.moveFolder.move);
		}
		if(this.settings.automaticTemplate){
			this.registerEvent(this.app.metadataCache.on('changed', this.moveFolder.applyTemplate));
		}else{
			this.app.metadataCache.off('changed', this.moveFolder.applyTemplate);
		}
	}

	callDisplayXpEarned = (f: TFile) => 
		this.xpFeedback!.displayXpEarned(f, undefined);
	loadCommands = () =>{
		this.addCommand({
			id:"start-work",
			name:"Engage",
			icon:"target",
			callback:()=>{
				this.engage.findNextFile();
			}
		});
		this.addCommand({
			id:"start-work-current-file",
			name:"Engage Current File",
			icon:"focus",
			callback:()=>{
				this.engageCurrentFile.findNextFile();
			}
		});
		this.addCommand({
			id:"start-process",
			name:"Process",
			icon:"axe",
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
			icon:"alarm-clock-minus",
			callback: ()=>{
				this.taskFailer.failTask(null, true);
			}
		});
		this.addCommand({
			id:"auto-fail-wip-tasks",
			name:"Auto fail work in progress files",
			icon:"circle-off",
			callback: ()=>{
				this.taskFailer.autoFailVaultTask();
			}
		});
		this.addCommand({
			id:"snooze-tasks",
			name:"Delay file dates",
			icon:"moon",
			callback:()=>{
				new SnoozeModal(this.app).open();
			}
		});
		this.addCommand({
			id:"random-snooze-tasks",
			name:"Generate delayed date",
			icon:"moon-star",
			callback:()=>{
				new RandomSnoozeModal(this.app).open();
			}
		});
		this.addCommand({
			id:"toggle-task-hider",
			name:"Toggle actions hider",
			icon:"list-checks",
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
			icon:"watch",
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
			icon:"shield-user",
			callback:async ()=>{
				await this.app.workspace.getRightLeaf(false)!.setViewState({
					type: 'Profile View',
					active: true,
				  });
				  this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType('Profile View')[0]);
			}
		});

		this.addCommand({
			id:"mind-sweep",
			name:"Mind Sweep",
			icon:"brain-circuit",
			callback:async ()=>{
				await this.app.workspace.getLeaf(true)!.setViewState({
					type: 'Mind Sweep View',
					active: true,
				  });
				  this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType('Mind Sweep View')[0]);
			}
		});

		this.addCommand({
			id:"mission-download",
			name:"Mission Download",
			icon:"cloud-download",
			callback:async ()=>{
				await this.app.workspace.getLeaf(true)!.setViewState({
					type: 'Mission Download View',
					active: true,
				  });
				  this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType('Mission Download View')[0]);
			}
		});

		this.addCommand({
			id: 'move-folder',
			name: 'Move file to folder',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					new MoveFolder(this.app, [], [{}]).move(activeFile);
				}
			}
		});

		this.addCommand({
			id: 'apply-template',
			name: 'Apply template',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					new MoveFolder(this.app, [], [{}]).applyTemplate(activeFile);
				}
			}
		});
	}
	async checkForUpdate() {
		if(this.settings.enableChangelog && this.manifest.version != this.settings.currentVersion){
			//new ChangelogModal(this.app).open();
			this.settings.currentVersion = this.manifest.version;
			await this.saveData(this.settings);
		}
	}

	async updateSetting(key: string, value: any) {
		this.settings = { ...this.settings, [key]: value };
		await this.saveData(this.settings);
		this.settingsListeners.forEach(cb => cb());
		this.graph.setOfficePages(this.settings.officePages);
		this.startProcess.setInboxPages(this.settings.inboxPages);
		this.startProcess.setInstrumentalFolders(this.settings.instrumentalFolders);
		this.startProcess.setConfigFolder(this.settings.configFolder);
		this.functions.setConfigFolder(this.settings.configFolder);
		this.engage.setConfigFolder(this.settings.configFolder);
		this.moveFolder.setExculdedFolders(this.settings.excludedFolders);
		this.moveFolder.setSpecificRouting(this.settings.specificRouting);
		this.moveFolder.displayMoveNotice = this.settings.displayMoveNotice;
		this.engage.setTags(this.settings.randomEvents);
		this.engage.setProbabilityRandomEvent(this.settings.probabilityRandomEvents);
		this.manageToggle();
	}

	onSettingsChange(cb: () => void) {
		this.settingsListeners.push(cb);
	}
}