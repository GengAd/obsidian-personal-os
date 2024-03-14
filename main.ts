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
			name:"Start work",
			callback:()=>{
				this.startWork.findNextFile();
			}
		});
		this.addCommand({
			id:"start-process",
			name:"Start process",
			callback:()=>{
				this.startProcess.findNextFile();
			}
		});
		this.addCommand({
			id:"set-focus",
			name:"Set focus",
			callback:()=>{
				this.startWork.setManuallyFocus();
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
				this.taskFailer.failTask();
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
	}
}