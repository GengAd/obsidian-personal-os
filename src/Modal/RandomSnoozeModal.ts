import { FuzzySuggestModal, App , moment, MarkdownView } from "obsidian";
import { getRandomTime } from 'src/Tools/Utils';

interface RandomSnoozeOptions {
    name: string;
    value: number;
}
export default class RandomSnoozeModal extends FuzzySuggestModal<RandomSnoozeOptions> {
    options: RandomSnoozeOptions[];
    constructor(app: App) {
        super(app);
        this.options = [
            { name: "1-4 weeks", value: 0 },
            { name: "1-3 months", value: 1 },
            { name: "3-6 months", value: 2 },
            { name: "6-12 months", value: 3 }
        ];
    }
    getItems(): RandomSnoozeOptions[] {
        return this.options;
    }

    getItemText(item: RandomSnoozeOptions): string {
        return item.name;
    }
    onChooseItem = (item: RandomSnoozeOptions, _: MouseEvent | KeyboardEvent): void  =>{
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
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            const cursor = editor.getCursor();
            editor.replaceRange(getRandomTime(startDate, endDate).format('YYYY-MM-DD'), cursor);
        }
    }
}