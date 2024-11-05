import { getAPI } from 'obsidian-dataview';
import { parseTasks } from 'src/Tools/Utils';
import { App, Notice, TFile, Plugin} from 'obsidian';
export default class XpFeedback{
    app: App;
    dv: any;
    currentFile: TFile | null;
    currentFileContent: string;
    constructor(app: App){
        this.app = app;
        this.dv = getAPI(app);
        this.currentFile = null;
    }
    displayXpEarned = (file : TFile) => {
        if(file != this.app.workspace.getActiveFile()) return;
        if(this.currentFile != file){
            this.app.vault.cachedRead(file).then((content) => {
                this.currentFileContent = content;
            });
            this.currentFile = file;
            return;
        }
        this.app.vault.cachedRead(file).then((content) => {
            let previousTasks = parseTasks(this.currentFileContent);
            let currentTasks = parseTasks(content);
            for(let task of currentTasks){
                if(task.done && !previousTasks.find((t)=>t.task == task.task && t.done)){
                    let dvFile = this.dv.page(file.path);
                    let coef = dvFile['✳️'] || 1;
                    let match = task.task.match(/✳️::(\d+)/);
                    let coefTask = match ? parseInt(match[1]) : 1;
                    new Notice(`✨ ${10*coef*coefTask} XP`);
                    break;
                }
            }
            this.currentFileContent = content;
        });
    }
   
}