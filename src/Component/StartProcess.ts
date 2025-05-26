import { getAPI, DataviewApi } from 'obsidian-dataview';
import { isLate, isOpenNoTask,isNotArchived,fileNotArchived, isNotCompletedOrCancelled } from '../Tools/Utils';
import { App, moment, TFolder, TFile, Notice } from 'obsidian';
import ContextGraph from './ContextGraph';
export default class StartProcess{
    app: App;
    dv: DataviewApi;
    graph: ContextGraph;
    inboxPages: string[] | undefined;
    instrumentalFolders: string[] | undefined;
    configFolder: string;
    constructor(app: App, graph: ContextGraph, inboxPages: string[], instrumentalFolders: string[], configFolder: string){
        this.app = app;
        this.dv = getAPI(app);
        this.graph = graph;
        this.setInboxPages(inboxPages);
        this.setInstrumentalFolders(instrumentalFolders);
        this.setConfigFolder(configFolder);
    }
    setInboxPages = (inboxPages: string[]) => {
        const filteredPages = inboxPages.filter(p=>this.app.vault.getAbstractFileByPath(p) instanceof TFolder);
        this.inboxPages = filteredPages.length > 0 ? filteredPages : undefined;
    }

    setInstrumentalFolders = (instrumentalFolders: string[]) => {
        const filteredFolders = instrumentalFolders.filter(f=>this.app.vault.getAbstractFileByPath(f) instanceof TFolder);
        this.instrumentalFolders = filteredFolders.length > 0 ? filteredFolders : undefined;
    }
    setConfigFolder = (configFolder: string) => {  
        this.configFolder = this.app.vault.getAbstractFileByPath(configFolder || '/') instanceof TFolder ? configFolder : '';
        if(this.configFolder === '/' || this.configFolder === '')
            this.configFolder = '';
        else if(!this.configFolder.endsWith('/'))
            this.configFolder += '/';
    }

    findNextFile = async () =>{
        this.graph.reload();
        const late = this.graph.office.where(fileNotArchived).where(isLate).limit(3);
        const inbox = (this.inboxPages && this.inboxPages.length > 0)
            ? this.dv.pages(`${this.inboxPages.map(el => `"${el}"`).join(' or ')}`).sort((p: any) => p.file.mtime, 'asc').limit(3)
            : [];
        const openNoTask = this.graph.office.where(isNotArchived).where(isOpenNoTask).sort ((p: any) => p.file.mtime,'asc').limit(3);
        const unusedInstrumentals = this.instrumentalFolders ? this.dv.pages(`${this.instrumentalFolders.map(el => `"${el}"`).join(' or ')}`)
            .where(isNotArchived)
            .where((f: any) => !f.Supports && !f.Undermines) 
            : [];
        const unhandledInstrumentals = this.instrumentalFolders ? this.dv.pages(`${this.instrumentalFolders.map(el => `"${el}"`).join(' or ')}`)
            .where(fileNotArchived)
            .where((f: any) => f.file.tasks.where(isNotCompletedOrCancelled).length > 0)
            : [];
        let path = "", length = 0;
        if((length = late.length)>0){
            path = late[Math.floor(Math.random() * length)].file.path;
            new Notice('⏰ This file is late, please re-schedule it ⏰');
        }else if((length = inbox.length)>0){
            path = inbox[Math.floor(Math.random() * length)].file.path;
            new Notice('🪓 This is an Inbox file, please process it 🪓');
        }else if((length = openNoTask.length)>0){
            path = openNoTask[Math.floor(Math.random() * length)].file.path;
            new Notice('🪓 This operational file is not archived, it should contain an action 🪓');
        }else if((length = unusedInstrumentals.length)>0){
            path = unusedInstrumentals[Math.floor(Math.random() * length)].file.path;
            new Notice('🪓 This file should support or undermine another file 🪓');
        }else if((length = unhandledInstrumentals.length)>0){
            path = unhandledInstrumentals[Math.floor(Math.random() * length)].file.path;
            new Notice('🪓 This instrumental file has some associated actions, it should be handled by another file 🪓');
        }
        if(path === ''){
            let donePage = this.app.vault.getAbstractFileByPath(`${this.configFolder}Process Done.md`);
            const done = `\n- [x] Done ✅ ${moment().format('YYYY-MM-DD')}`;
            if(!donePage){
                donePage = await this.app.vault.create(`${this.configFolder}Process Done.md`, done);
            }else if(donePage instanceof TFile && !(await this.app.vault.cachedRead(donePage)).includes(done, 0))
                this.app.vault.process(donePage, (content)=> content+done);
            path = donePage.path;
        }
        this.app.workspace.openLinkText(path, path, false);
    }
}