import { FuzzySuggestModal, App , moment } from "obsidian";
import { getRandomTime } from 'src/Tools/Utils';

interface SnoozeOptions {
    name: string;
    value: number;
}
export default class SnoozeModal extends FuzzySuggestModal<SnoozeOptions> {
    options: SnoozeOptions[];
    constructor(app: App) {
        super(app);
        this.options = [
            { name: "1-4 weeks", value: 0 },
            { name: "1-3 months", value: 1 },
            { name: "3-6 months", value: 2 },
            { name: "6-12 months", value: 3 }
        ];
    }
    getItems(): SnoozeOptions[] {
        return this.options;
    }

    getItemText(item: SnoozeOptions): string {
        return item.name;
    }
    onChooseItem = (item: SnoozeOptions, _: MouseEvent | KeyboardEvent): void  =>{
        if(!this.app.workspace.getActiveFile()) return;
        this.app.vault.process(this.app.workspace.getActiveFile()!, (content: string) => {
            const taskRegex = /- \[[ ]\] (.*?)(?=\r?\n|$)/g;
            const dateRegex = /(🛫|⏳|📅)\s*(\d{4}-\d{2}-\d{2})/g;
            let newContent = content;
            let oldestDate = moment();
            let foundAnyDate = false;
            const allTasks = [...newContent.matchAll(taskRegex)];
            for(const match of allTasks){
                const task = match[0];
                const dates = [...task.matchAll(dateRegex)];
                if(dates && dates.length > 0) {
                    foundAnyDate = true;
                    for(const dateMatch of dates){
                        const dateStr = dateMatch[2];
                        if(moment(dateStr).isBefore(oldestDate))
                            oldestDate = moment(dateStr);
                    }
                }
            }
            if (!foundAnyDate) {
                console.log('[SnoozeModal] No dates found in any tasks. Snooze will not update any dates.');
            }
            let diff = moment().diff(oldestDate, 'days');
            const startDate = moment(oldestDate);
            const endDate = moment(oldestDate);
            if(item.value == 0){
                startDate.add(1, 'weeks');
                endDate.add(4, 'weeks');
            }else if(item.value == 1){
                startDate.add(1, 'months');
                endDate.add(3, 'months');
            }else if(item.value == 2){
                startDate.add(3, 'months');
                endDate.add(6, 'months');
            }else if(item.value == 3){
                startDate.add(6, 'months');
                endDate.add(1, 'years');
            }
            diff += getRandomTime(startDate, endDate).diff(moment(), 'days');
            for(const match of newContent.matchAll(taskRegex)){
                const task = match[0];
                const dates = [...task.matchAll(dateRegex)];
                if(dates && dates.length > 0)
                    for(const dateMatch of dates) {
                        const currentDate = dateMatch[0];
                        const dateStr = dateMatch[2];
                        const newDate = moment(dateStr).add(diff, 'days').format('YYYY-MM-DD');
                        console.log(`Replacing date: ${currentDate} with ${dateMatch[1]} ${newDate}`);
                        newContent = newContent.replace(currentDate, `${dateMatch[1]} ${newDate}`);
                    }
            }
            return newContent;
        });
    }
}