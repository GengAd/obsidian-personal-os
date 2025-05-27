import { App, TFile, moment } from 'obsidian';
import { getAPI, DataviewApi } from 'obsidian-dataview';
import { parseTasksToCancel } from '../Tools/Utils';
import ContextGraph from './ContextGraph';
import { isTaskFailed } from '../Tools/Utils';

export default class TaskFailer {
    app: App;
    dv: DataviewApi;
    graph: ContextGraph;
    instrumentalFolders: string[];
    constructor(app: App, graph: ContextGraph, instrumentalFolders: string[] = []) {
        this.app = app;
        this.graph = graph;
        this.dv = getAPI(app);
        this.instrumentalFolders = instrumentalFolders;
    }
    autoFailVaultTask = () => {
        this.graph.reload();
        this.autoFailPages(this.graph.office);
    }

    autoFailInstrumentalTasks = () => {
        const pages = this.dv.pages(`${this.instrumentalFolders.map(el => `"${el}"`).join(' or ')}`);
        this.autoFailPages(pages);
    }

    autoFailPages = async (pages: any) => {
        if (!pages || !pages.file || !pages.file.tasks) {
            return;
        }
        const failedTasks = pages.file.tasks.where(isTaskFailed);
        for(let task of failedTasks){
            const file = this.app.vault.getAbstractFileByPath(task.path);
            if(file instanceof TFile)
                this.failTask(file);
        }
    }
    failTask = async (file?: TFile | null, failToday: boolean = false) => {
        if (!file) file = this.app.workspace.getActiveFile();
        if (!file) return;
    
        const today = moment().startOf("day");
    
        await this.app.vault.process(file, (fileContent: string) => {
            const fileTasks = parseTasksToCancel(fileContent);
    
            for (const task of fileTasks) {
                if (!task.dueDate) continue;
    
                const dueDate = moment(task.dueDate).startOf("day");
                const shouldFail = dueDate.isBefore(today) || (failToday && dueDate.isSame(today));
    
                // 🔁 RECURRING TASKS
                if (task.rrules.due) {
                    if (!shouldFail) continue;
                    // Always use UTC for all date handling
                    const dueDateUTC = moment.utc(task.dueDate, 'YYYY-MM-DD').startOf('day');
                    const todayUTC = moment.utc(today.format('YYYY-MM-DD'), 'YYYY-MM-DD').startOf('day');
                    const rangeEndUTC = failToday
                        ? todayUTC.clone().endOf('day').toDate()
                        : todayUTC.clone().subtract(1, 'day').endOf('day').toDate();

                    const failedDatesSet = new Set<string>();

                    // Always include current due date if it's due (in UTC)
                    failedDatesSet.add(dueDateUTC.format('YYYY-MM-DD'));

                    const missed = task.rrules.due.between(
                        dueDateUTC.toDate(),
                        rangeEndUTC,
                        true
                    );
                    missed.forEach(d => {
                        failedDatesSet.add(moment.utc(d).format('YYYY-MM-DD'));
                    });
                    if (failedDatesSet.size === 0) continue;

                    const failedDates = Array.from(failedDatesSet).sort().reverse();
                    const newLines: string[] = [];

                    // Calculate the number of missed recurrences
                    const missedCount = failedDates.length;
                    // Sort failedDates ascending (oldest first)
                    const failedDatesSorted = Array.from(failedDatesSet).sort();

                    // Helper to advance a date by n recurrences using a rule (always UTC)
                    function advanceDate(rule: any, original: string, n: number): string {
                        let date = moment.utc(original, 'YYYY-MM-DD').toDate();
                        let result = date;
                        for (let i = 0; i < n; i++) {
                            result = rule.after(result, false) || result;
                        }
                        return moment.utc(result).format('YYYY-MM-DD');
                    }

                    // For each missed instance (i = 0 is oldest, i = missedCount-1 is most recent missed)
                    for (let i = 0; i < missedCount; i++) {
                        let startVal = task.startDate && task.rrules.start ? advanceDate(task.rrules.start, task.startDate, i) : task.startDate;
                        let schedVal = task.scheduledDate && task.rrules.scheduled ? advanceDate(task.rrules.scheduled, task.scheduledDate, i) : task.scheduledDate;
                        let dueVal = task.dueDate && task.rrules.due ? advanceDate(task.rrules.due, task.dueDate, i) : task.dueDate;
                        let failed = task.task.replace('[ ]', '[-]');
                        if (startVal) failed = failed.replace(/(🛫)\s+\d{4}-\d{2}-\d{2}/, `$1 ${startVal}`);
                        if (schedVal) failed = failed.replace(/(⏳)\s+\d{4}-\d{2}-\d{2}/, `$1 ${schedVal}`);
                        if (dueVal) failed = failed.replace(/(📅)\s+\d{4}-\d{2}-\d{2}/, `$1 ${dueVal}`);
                        failed += ` ❌ ${dueVal}`;
                        newLines.unshift(failed); // oldest at bottom
                    }

                    // Next line: advance each field by missedCount recurrences
                    let nextStart = task.startDate && task.rrules.start ? advanceDate(task.rrules.start, task.startDate, missedCount) : task.startDate;
                    let nextSched = task.scheduledDate && task.rrules.scheduled ? advanceDate(task.rrules.scheduled, task.scheduledDate, missedCount) : task.scheduledDate;
                    let nextDue = task.dueDate && task.rrules.due ? advanceDate(task.rrules.due, task.dueDate, missedCount) : task.dueDate;
                    let nextLine = task.task;
                    if (nextStart) nextLine = nextLine.replace(/(🛫)\s+\d{4}-\d{2}-\d{2}/, `$1 ${nextStart}`);
                    if (nextSched) nextLine = nextLine.replace(/(⏳)\s+\d{4}-\d{2}-\d{2}/, `$1 ${nextSched}`);
                    if (nextDue) nextLine = nextLine.replace(/(📅)\s+\d{4}-\d{2}-\d{2}/, `$1 ${nextDue}`);
                    newLines.unshift(nextLine);

                    fileContent = fileContent.replace(task.task, newLines.join("\n"));
                    continue;
                }
    
                // ⛔ NON-RECURRING TASKS
                if (!shouldFail) continue;
    
                const failed = task.task
                    .replace('[ ]', '[-]')
                    .replace(task.dueDate!, task.dueDate!) + ` ❌ ${task.dueDate}`;
    
                const scheduled = task.task
                    .replace(task.dueDate!, task.dueDate!)
                    .replace('📅', '⏳');
    
                const replacement = [scheduled, failed].join("\n");
                fileContent = fileContent.replace(task.task, replacement);
            }
    
            return fileContent;
        });
    };                                        
}