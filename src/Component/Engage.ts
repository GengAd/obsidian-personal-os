import { getAPI } from 'obsidian-dataview';
import { sortTimes, fileNotArchived, IsDueTime, IsDueDayWithoutTime, IsDueDayButNotTime, IsNextPage } from '../Tools/Utils';
import { parseTags } from '../Tools/Utils';
import { App, Notice, moment, TFolder, TFile, Platform } from 'obsidian';
import ContextGraph from './ContextGraph';
export default class Engage{
    app: App;
    dv: any;
    listOfFilesWTime: any;
    listOfFilesDueWithout: any;
    listOfFilesNext: any;
    focus: any;
    currentFile: any;
    dueDay: string;
    nextDay: string;
    randomEvents: string[];
    graph: ContextGraph;
    configFolder: string;
    probabilityRandomEvent: number;
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
        new Notice('⚔️');
        this.listOfFilesWTime = this.graph.office.where(fileNotArchived).where(IsDueTime);
        if(this.listOfFilesWTime.length == 0){
            this.listOfFilesDueWithout = this.graph.office.where(fileNotArchived).where(IsDueDayWithoutTime);
            if(this.listOfFilesDueWithout.length > 0){
                this.setFocus(this.listOfFilesDueWithout);
            }else if(this.dueDay != moment().format('YYYY-MM-DD') && this.graph.office.where(fileNotArchived).where(IsDueDayButNotTime).length == 0){
                this.dueDay = moment().format('YYYY-MM-DD');
                const donePage = this.app.vault.getAbstractFileByPath(`${this.configFolder}Due Done.md`);
                if(!donePage){
                    await this.app.vault.create(`${this.configFolder}Due Done.md`, `- [x] Dues done ✅ ${this.dueDay}`);
                }else if(donePage instanceof TFile){
                    this.app.vault.process(donePage, (content)=> `${content}\n- [x] Dues done ✅ ${this.dueDay}`);
                }
                this.currentFile = this.dv.page(`${this.configFolder}Due Done.md`)!;
            }else{
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
                    this.focus = this.dv.page(`${this.configFolder}Done.md`)!;
                }else if(this.nextDay != moment().format('YYYY-MM-DD')){
                    const waitPage = this.app.vault.getAbstractFileByPath(`${this.configFolder}Wait.md`)!;
                    if(!waitPage)
                        await this.app.vault.create(`${this.configFolder}Wait.md`, ``);
                    this.currentFile = this.dv.page(`${this.configFolder}Wait.md`)!;
                    this.focus = this.dv.page(`${this.configFolder}Wait.md`)!;
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
        let randomFile = this.focus?this.focus:listOfFiles[Math.floor(Math.random() * listOfFiles.length)];

        if (listOfPriorityFiles.length > 0) {
            randomFile = this.focus?this.focus:listOfPriorityFiles[Math.floor(Math.random() * listOfPriorityFiles.length)];
        } 

        this.focus = null;
        const parents = this.graph.getParents(randomFile.file.path);
        for(let i = parents.length - 1 ; i > 0; i--){
            if(listOfFiles.find((p:any)=>p.file.path == parents[i])){
                this.focus = listOfFiles.find((p:any)=>p.file.path == parents[i]);
                break;
            }
        }
        if(!this.focus) this.focus = randomFile;
        if(this.currentFile == this.focus && !listOfFiles.find((p:any)=>p == this.currentFile)){
            this.focus = null;
            this.setFocus(listOfFiles);
            return;
        }
        if(currentFocus != this.focus && Math.random() * 100 < this.probabilityRandomEvent){
            if(!this.setRandomEvent())
                this.setCurrentFile(listOfPriorityFiles);
        }else
            this.setCurrentFile(listOfPriorityFiles);
    }
    setCurrentFile = (listOfFiles: any) =>{
        const childs = this.graph.getChilds(this.focus.file.path);
        if(childs.length == 0) this.currentFile = this.focus;
        else{
            let maxDepth = -1;
            let index: string = "";
            for(let i in childs){
                if(childs[i].depth > maxDepth && listOfFiles.find((p:any)=>p.file.path==childs[i].path)){
                    maxDepth = childs[i].depth;
                    index = i;
                }
            }
            if(index != "") this.currentFile = listOfFiles.find((p:any)=>p.file.path==childs[index].path);
            else if(listOfFiles.find((p:any)=>p.file.path == this.focus.file.path)) this.currentFile = this.focus;
            else {
                this.focus = null;
                this.setFocus(listOfFiles);
            }
        }
    }
    openCurrentFile = async () =>{
        if(this.currentFile){
            //@ts-ignore
            if(Platform.isMobile && this.currentFile.workspace && this.app.internalPlugins.getPluginById('workspaces').instance.workspaces[`${this.currentFile.workspace} Mobile`] ){
                //@ts-ignore
                await this.app.internalPlugins.getEnabledPluginById('workspaces').saveWorkspace('OSPrevious');
                //@ts-ignore
                await this.app.internalPlugins.getPluginById('workspaces').instance.loadWorkspace(`${this.currentFile.workspace} Mobile`);
                //@ts-ignore
            }else if(!Platform.isMobile && this.currentFile.workspace && this.app.internalPlugins.getPluginById('workspaces').instance.workspaces[this.currentFile.workspace] ){
                //@ts-ignore
                await this.app.internalPlugins.getEnabledPluginById('workspaces').saveWorkspace('OSPrevious');
                //@ts-ignore
                await this.app.internalPlugins.getPluginById('workspaces').instance.loadWorkspace(this.currentFile.workspace);
            }else {
                this.app.workspace.openLinkText(this.currentFile.file.path, this.currentFile.file.path, false);
            }
        }
    }
    setRandomEvent = () =>{
        const pages = this.dv.pages(parseTags(this.randomEvents));
        const totalWeight = pages.values.reduce((acc:any, page:any)=>acc + (page.Weight||1), 0);
        if(totalWeight == 0) return false;
        const random = Math.random() * totalWeight;
        if(random == 0){
            for(let page of pages)
                if(!page.Weight || page.Weight > 0){
                    this.currentFile = page; 
                    this.focus = page;
                    return true;
                }
        }
        let cumulWeight = 0;
        for(let page of pages){
            cumulWeight += page.Weight || 1;
            if(random <= cumulWeight){
                this.currentFile = page;
                this.focus = page;
                return true;
            }
        }
        this.currentFile = pages[pages.length-1];
        this.focus = pages[pages.length-1];
        return true;
    }
    setTags = (randomEvents: string[]) =>{
        this.randomEvents = randomEvents;
    }
}