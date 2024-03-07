import { Notice, Plugin, moment } from 'obsidian';
import PersonalOSSettings from './src/Component/Settings/SettingsTab';
import StartWork from 'src/Component/StartWork';
import StartProcess from 'src/Component/StartProcess';
import ContextGraph from 'src/Component/ContextGraph';
import TaskFailer from 'src/Component/TaskFailer';
import SnoozeModal from 'src/Modal/SnoozeModal';


export default class PersonalOS extends Plugin {
	settings: PersonalOSSettings;
	startWork: StartWork;
	startProcess: StartProcess;
	graph: ContextGraph;
	taskFailer: TaskFailer;
	async onload(){	
		this.app.workspace.onLayoutReady(async () => {
			this.settings = new PersonalOSSettings(this.app, this);
			await this.settings.loadSettings();
			this.addSettingTab(this.settings);
			this.graph = new ContextGraph(this.app, this.settings.officePages, {multi:true, type:"mixed", allowSelfLoops:true});
			this.taskFailer = new TaskFailer(this.app, this.graph);
			this.startWork = new StartWork(this.app, this.settings.randomEvents, this.graph, this.settings.configFolder, this.settings.probabilityRandomEvents);
			this.startProcess = new StartProcess(this.app, this.graph, this.settings.inboxPages, this.settings.configFolder);
			this.loadCommands();
		});
    }
	loadCommands = () =>{
		this.addCommand({
			id:"start-work",
			name:"Start Work",
			callback:()=>{
				this.startWork.findNextFile();
			}
		});
		this.addCommand({
			id:"start-process",
			name:"Start Process",
			callback:()=>{
				this.startProcess.findNextFile();
			}
		});
		this.addCommand({
			id:"set-focus",
			name:"Set Focus",
			callback:()=>{
				this.startWork.setManuallyFocus();
			}
		});
		this.addCommand({
			id:"reload-graph",
			name:"Reload Graph",
			callback: ()=>{
				this.graph.reload();
			}
		});
		this.addCommand({
			id:"fail-tasks",
			name:"Auto Fail Current File",
			callback: ()=>{
				this.taskFailer.failTask();
			}
		});
		this.addCommand({
			id:"auto-fail-tasks",
			name:"Auto Fail Work in Progress Files",
			callback: ()=>{
				this.taskFailer.autoFailVaultTask();
			}
		});
		this.addCommand({
			id:"snooze-tasks",
			name:"Snooze Tasks",
			callback:()=>{
				new SnoozeModal(this.app).open();
			}
		});
	}
}