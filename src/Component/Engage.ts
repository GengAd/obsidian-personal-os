import { getAPI, DataviewApi } from 'obsidian-dataview';
import { sortTimes, fileNotArchived, IsDueTime, IsDueDayWithoutTime, IsDueDayButNotTime, IsNextPage, IsNextDue, IsScheduleDayWithoutTime,sortDueDates ,sortDue, fileDueOnly } from '../Tools/Utils';
import { parseTags } from '../Tools/Utils';
import { App, Notice, moment, TFolder, TFile, Platform } from 'obsidian';
import ContextGraph from './ContextGraph';
export default class Engage{
    app: App;
    dv: DataviewApi;
    listOfFilesWTime: any;
    listOfFilesDueWithout: any;
    listOfFilesNext: any;
    listOfFilesNextDue: any;
    focus: any;
    currentFile: any;
    dueDay: string;
    nextDay: string;
    randomEvents: string[];
    graph: ContextGraph;
    configFolder: string;
    probabilityRandomEvent: number;
    listOfFilesScheduleWithout: any;
    constructor(app: App, randomEvents: string[], graph: ContextGraph, configFolder: string, probabilityRandomEvent: number){
        this.app = app;
        this.dv = getAPI(app);
        this.dueDay = "";
        this.nextDay = "";
        this.randomEvents = randomEvents;
        this.graph = graph;
        this.setConfigFolder(configFolder);
        this.setProbabilityRandomEvent(probabilityRandomEvent);
    }
    
    setConfigFolder = (configFolder: string) => {  
        this.configFolder = this.app.vault.getAbstractFileByPath(configFolder || '/') instanceof TFolder ? configFolder : '';
        if(this.configFolder === '/' || this.configFolder === '')
            this.configFolder = '';
        else if(!this.configFolder.endsWith('/'))
            this.configFolder += '/';
    }
    setProbabilityRandomEvent = (probabilityRandomEvent: number) => {
        this.probabilityRandomEvent = probabilityRandomEvent;
    }
    setManuallyFocus = () =>{
        this.focus = this.dv.page(this.app.workspace.getActiveFile()!.path);
    }
    findNextFile = async () =>{
        this.graph.reload();
        this.listOfFilesWTime = this.graph.office.where(fileNotArchived).where(IsDueTime);
        if(this.listOfFilesWTime.length == 0){
            this.listOfFilesDueWithout = this.graph.office.where(fileNotArchived).where(IsDueDayWithoutTime);
            if(this.listOfFilesDueWithout.length > 0){
                this.setFocus(this.listOfFilesDueWithout);
            } else {
                this.listOfFilesScheduleWithout = this.graph.office.where(fileNotArchived).where(IsScheduleDayWithoutTime);
                if(this.listOfFilesScheduleWithout.length > 0){
                    this.setFocus(this.listOfFilesScheduleWithout);
                } else if((this.listOfFilesNextDue = this.graph.office.where(fileNotArchived).where(IsNextDue).sort((p: { taskFound: { due: any; }; }) => p.taskFound?.due, 'asc')).length > 0){
                    let i = this.listOfFilesNextDue.length - 1;
                    for(let file of this.listOfFilesNextDue){
                        file.priority = i;
                        i--;
                    }
                    this.setFocus(this.listOfFilesNextDue);
                } else {
                    this.listOfFilesNext = this.graph.office.where(fileNotArchived).where(IsNextPage);
                    if(this.listOfFilesNext.length > 0){
                        this.setFocus(this.listOfFilesNext);
                    }else if(this.nextDay != moment().format('YYYY-MM-DD') && this.graph.office.where(fileNotArchived).where(IsDueDayButNotTime).length == 0){
                        this.nextDay = moment().format('YYYY-MM-DD')
                        const donePage = this.app.vault.getAbstractFileByPath(`${this.configFolder}Done.md`)!;
                        if(!donePage){
                            await this.app.vault.create(`${this.configFolder}Done.md`, `- [x] Nexts done ✅ ${this.nextDay}`);
                        }else if(donePage instanceof TFile){
                            this.app.vault.process(donePage, (content)=> `${content}\n- [x] Nexts done ✅ ${this.nextDay}`);
                        }
                        this.currentFile = this.dv.page(`${this.configFolder}Done.md`)!;
                        this.currentFile.specialNotice = "done";
                        this.focus = this.dv.page(`${this.configFolder}Done.md`)!;
                    }else if(this.nextDay != moment().format('YYYY-MM-DD')){
                        const waitPage = this.app.vault.getAbstractFileByPath(`${this.configFolder}Wait.md`)!;
                        if(!waitPage)
                            await this.app.vault.create(`${this.configFolder}Wait.md`, ``);
                        this.currentFile = this.dv.page(`${this.configFolder}Wait.md`)!;
                        this.currentFile.specialNotice = "wait";
                        this.focus = this.dv.page(`${this.configFolder}Wait.md`)!;
                    }else {
                        this.currentFile = this.dv.page(`${this.configFolder}Done.md`)!;
                        this.currentFile.specialNotice = "done";
                    }
                }
            }
        }else{
            if(this.listOfFilesWTime.length > 1){
                this.listOfFilesWTime.values.sort(sortTimes);
            }
            this.currentFile = this.listOfFilesWTime[0];
            this.focus = this.currentFile;
        }
        this.openCurrentFile();
    }
    setFocus = (listOfFiles: any) =>{
        const currentFocus = this.focus;
        // Step 1: Handle potential random event
        const shouldTriggerRandomEvent = Math.random() * 100 < this.probabilityRandomEvent;

        if (shouldTriggerRandomEvent && this.setRandomEvent()) {
            // If random event is triggered and set successfully, exit early
            return;
        }
        //const maxPriority = listOfFiles.values.reduce((max: number, item: any) => Math.max(max, item.priority), 0);
        const maxPriority = listOfFiles.values.reduce((max: number, item: any) => {
            // Check if item.priority exists and is a valid number
            if (typeof item.priority === 'number') {
                return Math.max(max, item.priority);
            }
            // If no valid priority, return the current max
            return max;
        }, -2);
        const listOfPriorityFiles = listOfFiles.values.filter((file: any)=> file.priority == maxPriority);
        if (listOfPriorityFiles.length > 0) {
            this.focus = listOfPriorityFiles[Math.floor(Math.random() * listOfPriorityFiles.length)];
        } else{
            this.focus = listOfFiles[Math.floor(Math.random() * listOfFiles.length)];
        }
        /*
        if(currentFocus != this.focus && Math.random() * 100 < this.probabilityRandomEvent){
            if(!this.setRandomEvent())
                this.currentFile = listOfPriorityFiles[Math.floor(Math.random() * listOfPriorityFiles.length)] || this.focus;
        }else*/
        this.currentFile = this.focus;
    }
    openCurrentFile = async () =>{
        if(this.currentFile){
            if(this.currentFile.specialNotice === "randomEvent") {
                new Notice(`🎲 Random event ! 🎲`);
            } else if(this.currentFile.specialNotice === "done") {
                new Notice(`☀️ Gratz ! You're all done for the day ☀️`);
            } else if(this.currentFile.specialNotice === "wait") {
                new Notice(`🌙 There is still some actions later 🌙`);
            } else {
                new Notice(`⚔️ ${this.currentFile.taskFound?.text} ⚔️`);
            }
            if(Platform.isMobile && this.currentFile.workspace && (this.app as any).internalPlugins.getPluginById('workspaces').instance.workspaces[`${this.currentFile.workspace} Mobile`] ){
                await (this.app as any).internalPlugins.getEnabledPluginById('workspaces').saveWorkspace('OSPrevious');
                await (this.app as any).internalPlugins.getPluginById('workspaces').instance.loadWorkspace(`${this.currentFile.workspace} Mobile`);
            }else if(!Platform.isMobile && this.currentFile.workspace && (this.app as any).internalPlugins.getPluginById('workspaces').instance.workspaces[this.currentFile.workspace] ){
                await (this.app as any).internalPlugins.getEnabledPluginById('workspaces').saveWorkspace('OSPrevious');
                await (this.app as any).internalPlugins.getPluginById('workspaces').instance.loadWorkspace(this.currentFile.workspace);
            }else {
                this.app.workspace.openLinkText(this.currentFile.file.path, this.currentFile.file.path, false);
            }
        }
    }
    setRandomEvent = () =>{
        const tags = parseTags(this.randomEvents);
        if (!tags || tags.length === 0) return false;

        const pages = this.dv.pages(tags);
        if (!pages || pages.length === 0) return false;
        
        const totalWeight = pages.values.reduce((acc:any, page:any)=>acc + (page.Weight||1), 0);
        if(totalWeight == 0) return false;
        const random = Math.random() * totalWeight;
        if(random == 0){
            for(let page of pages)
                if(!page.Weight || page.Weight > 0){
                    this.currentFile = page; 
                    this.focus = page;
                    this.currentFile.specialNotice = "randomEvent";
                    return true;
                }
        }
        let cumulWeight = 0;
        for(let page of pages){
            cumulWeight += page.Weight || 1;
            if(random <= cumulWeight){
                this.currentFile = page;
                this.focus = page;
                this.currentFile.specialNotice = "randomEvent";
                return true;
            }
        }
        this.currentFile = pages[pages.length-1];
        this.focus = pages[pages.length-1];
        this.currentFile.specialNotice = "randomEvent";
        return true;
    }
    setTags = (randomEvents: string[]) =>{
        this.randomEvents = randomEvents;
    }
}