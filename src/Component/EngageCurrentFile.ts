import { getAPI, DataviewApi } from 'obsidian-dataview';
import { sortTimes, sortDueDates, isNotArchived, IsDueTime, IsDueDayWithoutTime, IsNextPage, IsNextDue, isLate, sortDue, fileDueOnly, fileNotArchived, IsScheduleDayWithoutTime } from '../Tools/Utils';
import { App, Notice} from 'obsidian';
export default class EngageCurrentFile{
    app: App;
    dv: DataviewApi;
    listOfLateFiles: any;
    listOfFilesWTime: any;
    listOfFilesDueWithout: any;
    listOfFilesScheduleWithout:any;
    listOfFilesNext: any;
    listOfFilesNextDue: any;
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
        // fallback to highest parent if nothing is found
        if (!this.listOfChildFiles || this.listOfChildFiles.length === 0) {
            this.currentFile = this.focus; 
            this.openCurrentFile();
            return;
        }
        if((this.listOfLateFiles = this.listOfChildFiles.where(isNotArchived).where(isLate)).length > 0){
            this.setCurrentFile(this.listOfLateFiles);
            this.currentFile._isLate = true;
        }else {
            if((this.listOfFilesWTime = this.listOfChildFiles.where(isNotArchived).where(IsDueTime)).length == 0){
                if((this.listOfFilesDueWithout = this.listOfChildFiles.where(isNotArchived).where(IsDueDayWithoutTime)).length > 0){
                    this.setCurrentFile(this.listOfFilesDueWithout);
                }else if((this.listOfFilesScheduleWithout = this.listOfChildFiles.where(isNotArchived).where(IsScheduleDayWithoutTime)).length > 0){
                    this.setCurrentFile(this.listOfFilesScheduleWithout)
                }else if((this.listOfFilesNextDue = this.listOfChildFiles.where(isNotArchived).where(IsNextDue).sort((p: { taskFound: { due: any; }; }) => p.taskFound?.due, 'asc')).length > 0){
                    let i = this.listOfFilesNextDue.length - 1;
                    for(let file of this.listOfFilesNextDue){
                        file.priority = i;
                        i--;
                    }
                    this.setCurrentFile(this.listOfFilesNextDue);
                }else if((this.listOfFilesNext = this.listOfChildFiles.where(isNotArchived).where(IsNextPage)).length > 0){
                    this.setCurrentFile(this.listOfFilesNext);
                } else {
                    // No due/scheduled/next files found among children.
                }
            }else if(this.listOfFilesWTime.length > 1){
                    this.listOfFilesWTime.values.sort(sortTimes);
                    this.currentFile = this.listOfFilesWTime[0];   
            }else {
                this.currentFile = this.listOfFilesWTime[0];
            }
        }
        //  fallback to any child if nothing else matched
        if (!this.currentFile && this.listOfChildFiles.length > 0) {
            this.currentFile = this.focus;
        }
        this.openCurrentFile();
    }
    setFocus = () => {
        this.focus = null;
        this.currentFile = null;
    
        const activePath = this.app.workspace.getActiveFile()?.path;
        const activePage = this.dv.page(activePath);
        if (!activePage) return;
    
        // 1. Try children of current file
        const children = this.dv.pages().where((p: any) =>
            p['Handled By']?.path === activePage.file.path && !p.Archived
        );
    
        if (children.length > 0) {
            this.focus = activePage;
            this.listOfChildFiles = children;
            return;
        }
    
        // 2. Try siblings (children of parent)
        const parentPath = activePage['Handled By']?.path;
        const parentPage = parentPath ? this.dv.page(parentPath) : null;
    
        if (parentPage) {
            const siblings = this.dv.pages().where((p: any) =>
                p['Handled By']?.path === parentPage.file.path && !p.Archived
            );
    
            if (siblings.length > 0) {
                this.focus = parentPage;
                this.listOfChildFiles = siblings;
                return;
            }
    
            // 3. Fallback to showing the parent itself
            this.focus = parentPage;
            this.listOfChildFiles = []; // ✅ No children
            return;
        }
    
        // 4. No parent — fallback to current page itself
        this.focus = activePage;
        this.listOfChildFiles = [];
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
    /*
    openCurrentFile = async () =>{
        if(this.currentFile){
            if(this.currentFile != this.focus)
                new Notice(`⚔️ ${this.currentFile.taskFound?.text} ⚔️`);
            else
                new Notice('There is no more files left to engage');
            this.app.workspace.openLinkText(this.currentFile.file.path, this.currentFile.file.path, false);
        }else{
            new Notice('There is no more files left to engage');
            this.focus = null;
        }
    }*/
        openCurrentFile = async () => {
            if (this.currentFile) {
                const isLate = this.currentFile._isLate;
                const hasTask = this.currentFile.taskFound;
        
                if (this.currentFile != this.focus) {
                    if (isLate) {
                        new Notice('⏰ This file is late, please re-schedule it');
                    } else if (hasTask?.text) {
                        new Notice(`⚔️ ${hasTask.text} ⚔️`);
                    } else if (hasTask) {
                        new Notice('🪓 This file needs processing');
                    } else {
                        new Notice('Opened file, but no task found.');
                    }
                    // Always try to open the file if a path exists
                    if (this.currentFile.file?.path) {
                        this.app.workspace.openLinkText(this.currentFile.file.path, this.currentFile.file.path, false);
                    }
                } else {
                    new Notice('No actions found. Showing parent.');
                    if (this.currentFile.file?.path) {
                        this.app.workspace.openLinkText(this.currentFile.file.path, this.currentFile.file.path, false);
                    }
                }
            } else {
                new Notice('There is no more files left to engage');
            }
        }
}