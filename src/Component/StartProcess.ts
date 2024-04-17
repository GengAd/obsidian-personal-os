import { getAPI } from 'obsidian-dataview';
import { isLate, isOpenNoTask,isNotArchived,fileNotArchived } from '../Tools/Utils';
import { App, moment, TFolder, TFile } from 'obsidian';
import ContextGraph from './ContextGraph';
export default class StartProcess{
    app: App;
    dv: any;
    graph: ContextGraph;
    inboxPages: string[] | undefined;
    configFolder: string;
    constructor(app: App, graph: ContextGraph, inboxPages: string[], configFolder: string){
        this.app = app;
        this.dv = getAPI(app);
        this.graph = graph;
        this.setInboxPages(inboxPages);
        this.setConfigFolder(configFolder);
    }
    setInboxPages = (inboxPages: string[]) => {
        const filteredPages = inboxPages.filter(p=>this.app.vault.getAbstractFileByPath(p) instanceof TFolder);
        this.inboxPages = filteredPages.length > 0 ? filteredPages : undefined;
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
        const inbox = this.inboxPages ? this.dv.pages(`${this.inboxPages.map(el => `"${el}"`).join(' or ')}`).sort((p: any) => p.file.mtime,'asc').limit(3) : [];
        const openNoTask = this.graph.office.where(isNotArchived).where(isOpenNoTask).sort ((p: any) => p.file.mtime,'asc').limit(3);
        let path = "", length = 0;
        if((length = late.length)>0){
            path = late[Math.floor(Math.random() * length)].file.path;
        }else if((length = inbox.length)>0){
            path = inbox[Math.floor(Math.random() * length)].file.path;
        }else if((length = openNoTask.length)>0){
            path = openNoTask[Math.floor(Math.random() * length)].file.path;
        }
        if(path === ''){
            let donePage = this.app.vault.getAbstractFileByPath(`${this.configFolder}Process Done.md`);
            const done = `- [x] Done ✅ ${moment().format('YYYY-MM-DD')}\n`;
            if(!donePage){
                donePage = await this.app.vault.create(`${this.configFolder}Process Done.md`, done);
            }else if(donePage instanceof TFile && !(await this.app.vault.cachedRead(donePage)).includes(done, 0))
                this.app.vault.process(donePage, (content)=> done + content);
            path = donePage.path;
        }
        this.app.workspace.openLinkText(path, path, false);
    }
}