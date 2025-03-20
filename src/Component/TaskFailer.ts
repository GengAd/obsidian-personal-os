import { App, TFile, moment } from 'obsidian';
import { getAPI, DataviewApi } from 'obsidian-dataview';
import { parseTasksToCancel } from '../Tools/Utils';
import ContextGraph from './ContextGraph';
import { isTaskFailed } from '../Tools/Utils';

export default class TaskFailer {
    app: App;
    dv: DataviewApi;
    graph: ContextGraph;
    constructor(app: App, graph: ContextGraph){
        this.app = app;
        this.graph = graph;
        this.dv = getAPI(app);
    }
    autoFailVaultTask = async () => {
        this.graph.reload();
        for(let task of this.graph.office.file.tasks.where(isTaskFailed)){
            const file = this.app.vault.getAbstractFileByPath(task.path);
            if(file instanceof TFile)
                this.failTask(file);
        }
    }
    failTask = async (file?: TFile | null, failToday?: boolean) =>{
        if(!file) file = this.app.workspace.getActiveFile()!;
        let hasReccuringTasks = false;
        await this.app.vault.process(file, (fileContent: string)=>{
            const fileTasks = parseTasksToCancel(fileContent);
            const today = moment().set({hour:0,minute:0,second:0,millisecond:0});
            for(let task of fileTasks){
                let isBefore;
                if(failToday)
                    isBefore = moment(task.dueDate).isSameOrBefore(today);
                else
                    isBefore = moment(task.dueDate).isBefore(today)
                if(task.dueDate && isBefore){
                    let updatedTask = task.task.replace('[ ]', '[-]') + ` ❌ ${task.dueDate}`;
                    let tempTask = task.task;
                    if(Object.keys(task.rrules).length > 0){
                        hasReccuringTasks = true;
                        const nextDueDate = task.dueDate ? moment(task.rrules.due.after(moment.utc(task.dueDate).toDate())) : undefined;
                        const nextScheduledDate = task.scheduledDate ? moment(task.rrules.scheduled.after(moment.utc(task.scheduledDate).toDate())) : undefined;
                        const nextStartDate = task.startDate ? moment(task.rrules.start.after(moment.utc(task.startDate).toDate())) : undefined;
                        if(nextDueDate){
                            tempTask = tempTask.replace(task.dueDate!, nextDueDate.format("YYYY-MM-DD"));
                        }
                        if(nextScheduledDate){ 
                            tempTask = tempTask.replace(task.scheduledDate!, nextScheduledDate.format("YYYY-MM-DD"));
                        }
                        if(nextStartDate){
                            tempTask = tempTask.replace(task.startDate!, nextStartDate.format("YYYY-MM-DD"));
                        }
                        updatedTask = `${tempTask}\n${updatedTask}`;
                    }else{
                        if(task.scheduledDate)
                            tempTask = tempTask.replace(`⏳ ${task.scheduledDate}`,"");
                        updatedTask = `${tempTask.replace("📅","⏳")}\n${updatedTask}`;
                    }
                    fileContent = fileContent.replace(task.task, updatedTask);
                }
            }
            return fileContent;
        });
        if(hasReccuringTasks) this.failTask(file, failToday);
    }
    
}