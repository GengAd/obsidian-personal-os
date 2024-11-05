import { getAPI } from 'obsidian-dataview';
import { sortTimes, isNotArchived, IsDueTime, IsDueDayWithoutTime, IsNextPage } from '../Tools/Utils';
import { App, Notice} from 'obsidian';
export default class EngageCurrentFile{
    app: App;
    dv: any;
    listOfFilesWTime: any;
    listOfFilesDueWithout: any;
    listOfFilesNext: any;
    listOfChildFiles: any;
    focus: any;
    currentFile: any;
    constructor(app: App){
        this.app = app;
        this.dv = getAPI(app);
    }
    findNextFile = async () =>{
        this.setFocus();
        this.listOfFilesWTime = this.listOfChildFiles.where(isNotArchived).where(IsDueTime);
        if(this.listOfFilesWTime.length == 0){
            this.listOfFilesDueWithout = this.listOfChildFiles.where(isNotArchived).where(IsDueDayWithoutTime);
            this.listOfFilesNext = this.listOfChildFiles.where(isNotArchived).where(IsNextPage);
            if(this.listOfFilesDueWithout.length > 0){
                this.setCurrentFile(this.listOfFilesDueWithout);
            }else if(this.listOfFilesNext.length > 0){
                this.setCurrentFile(this.listOfFilesNext);
            }
        }else if(this.listOfFilesWTime.length > 1){
                this.listOfFilesWTime.values.sort(sortTimes);
                this.currentFile = this.listOfFilesWTime[0];   
        }
        this.openCurrentFile();
    }
    setFocus = () =>{
        if(!this.focus || this.dv.page(this.app.workspace.getActiveFile()?.path)['Handled By']?.path != this.focus.file.path)
            this.app.workspace.getActiveFile() ? this.focus = this.dv.page(this.app.workspace.getActiveFile()!.path) : null;
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