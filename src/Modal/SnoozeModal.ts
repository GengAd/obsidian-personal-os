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
        const startDate = moment();
        const endDate = moment();
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
        const date = getRandomTime(startDate, endDate);
        this.app.vault.process(this.app.workspace.getActiveFile()!, (content: string) => {
            const taskRegex = /- \[[ ]\] (.*?)(?=\n|$)/g;
            const dateRegex = /(🛫|⏳|📅)\s*(\d{4}-\d{2}-\d{2})/g;
            let newContent = content;
            for(const match of newContent.matchAll(taskRegex)){
                const task = match[0];
                const dates = task.match(dateRegex);
                if(dates && dates.length > 0)
                    for(const currentDate of dates)
                        newContent = newContent.replace(currentDate, `${currentDate.split(' ')[0]} ${date}`);
            }
            return newContent;
        });
    }
}