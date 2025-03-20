import { getAPI, DataviewApi } from 'obsidian-dataview';
import { sortTimes, isNotArchived, IsDueTime, IsDueDayWithoutTime, IsNextPage, isLate } from '../Tools/Utils';
import { App, Notice} from 'obsidian';
export default class EngageCurrentFile{
    app: App;
    dv: DataviewApi;
    listOfLateFiles: any;
    listOfFilesWTime: any;
    listOfFilesDueWithout: any;
    listOfFilesNext: any;
    listOfChildFiles: any;
    focus: any;
    currentFile: any;
    constructor(app: App){
        this.app = app;
        this.dv = getAPI(app);
        this.focus = null;
    }
    findNextFile = async () =>{
        this.setFocus();
        if((this.listOfLateFiles = this.listOfChildFiles.where(isNotArchived).where(isLate)).length > 0){
            this.setCurrentFile(this.listOfLateFiles);
        }else {
            if((this.listOfFilesWTime = this.listOfChildFiles.where(isNotArchived).where(IsDueTime)).length == 0){
                if((this.listOfFilesDueWithout = this.listOfChildFiles.where(isNotArchived).where(IsDueDayWithoutTime)).length > 0){
                    this.setCurrentFile(this.listOfFilesDueWithout);
                }else if((this.listOfFilesNext = this.listOfChildFiles.where(isNotArchived).where(IsNextPage)).length > 0){
                    this.setCurrentFile(this.listOfFilesNext);
                }
            }else if(this.listOfFilesWTime.length > 1){
                    this.listOfFilesWTime.values.sort(sortTimes);
                    this.currentFile = this.listOfFilesWTime[0];   
            }else {
                this.currentFile = this.listOfFilesWTime[0];
            }
        }
        this.openCurrentFile();
    }
    setFocus = () =>{
        if(this.dv.pages().where((p:any)=> p['Handled By']?.path == this.app.workspace.getActiveFile()?.path && !p.Archived).length > 0)
            this.focus = this.dv.page(this.app.workspace.getActiveFile()!.path);
        if(!this.focus && this.dv.page(this.app.workspace.getActiveFile()?.path)['Handled By'])
            this.focus = this.dv.page(this.dv.page(this.app.workspace.getActiveFile()?.path)['Handled By'].path);
        if(this.focus)
            this.listOfChildFiles = this.dv.pages().where((p:any)=>p['Handled By']?.path == this.focus.file.path);
    }
    setCurrentFile = (listOfFiles: any) =>{
        const maxPriority = listOfFiles.values.reduce((max: number, item: any) => {
            // Check if item.priority exists and is a valid number
            if (typeof item.priority === 'number') {
                return Math.max(max, item.priority);
            }
            // If no valid priority, return the current max
            return max;
        }, 0);
        const listOfPriorityFiles = listOfFiles.values.filter((file: any)=> file.priority == maxPriority);
        if (listOfPriorityFiles.length > 0) {
            this.currentFile = listOfPriorityFiles[Math.floor(Math.random() * listOfPriorityFiles.length)];
        }else {
            this.currentFile = listOfFiles[Math.floor(Math.random() * listOfFiles.length)];
        }
    }
    openCurrentFile = async () =>{
        if(this.currentFile){
            new Notice('⚔️');
            this.app.workspace.openLinkText(this.currentFile.file.path, this.currentFile.file.path, false);
        }else{
            new Notice('There is no more files left to engage');
            this.focus = null;
        }
    }
   
}