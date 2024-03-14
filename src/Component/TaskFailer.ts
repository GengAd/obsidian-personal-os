import { App, TFile, moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import { parseTasksToCancel } from '../Tools/Utils';
import ContextGraph from './ContextGraph';
import { isTaskFailed } from '../Tools/Utils';

export default class TaskFailer {
    app: App;
    dv: any;
    graph: ContextGraph;
    constructor(app: App, graph: ContextGraph){
        this.app = app;
        this.graph = graph;
        this.dv = getAPI(app);
    }
    autoFailVaultTask = async () => {
        for(let task of this.graph.office.file.tasks.where(isTaskFailed)){
            const file = this.app.vault.getAbstractFileByPath(task.path);
            if(file instanceof TFile)
                this.failTask(file);
        }
    }
    failTask = async (file?: TFile) =>{
        if(!file) file = this.app.workspace.getActiveFile()!;
        let hasReccuringTasks = false;
        await this.app.vault.process(file, (fileContent: string)=>{
            const fileTasks = parseTasksToCancel(fileContent);
            const today = moment().set({hour:0,minute:0,second:0,millisecond:0});
            for(let task of fileTasks){
                if(task.dueDate && moment(task.dueDate).isBefore(today)){
                    let updatedTask = task.task.replace('[ ]', '[-]') + ` ❌ ${task.dueDate}`;
                    let tempTask = task.task;
                    if(task.reccuringType != "none"){
                        hasReccuringTasks = true;
                        const nextDueDate = moment(task.dueDate);
                        const nextScheduledDate = task.scheduledDate ? moment(task.scheduledDate) : undefined;
                        const nextStartDate = task.startDate ? moment(task.startDate) : undefined;
                        nextDueDate.add(task.reccuringNumber, task.reccuringType+"s" as moment.unitOfTime.DurationConstructor);
                        tempTask = tempTask.replace(task.dueDate, nextDueDate.format("YYYY-MM-DD"));
                        if(nextScheduledDate){ 
                            nextScheduledDate.add(task.reccuringNumber, task.reccuringType+"s" as moment.unitOfTime.DurationConstructor);
                            tempTask = tempTask.replace(task.scheduledDate!, nextScheduledDate.format("YYYY-MM-DD"));
                        }
                        if(nextStartDate){
                             nextStartDate.add(task.reccuringNumber, task.reccuringType+"s" as moment.unitOfTime.DurationConstructor);
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
        if(hasReccuringTasks) this.failTask(file);
    }
    
}