import { Setting } from 'obsidian';
import SettingTab from './SettingsTab';

export default class ListItemSetting extends Setting {
    constructor(
        div: HTMLElement,
        list: (string | {[key: string]: string})[], 
        item: string | {[key: string]: string}, 
        i: number,
        update: (list:  (string | {[key: string]: string})[]) => void,
        saveSettings: () => void,
        settings: SettingTab
    ) {
        super(div);
        this.setClass('max-width');

        if (typeof item === 'string') {
            this.setName(item);
        }

        if (typeof item === 'object') {
            Object.entries(item).forEach(([, value]) => {
                this.addText((text) => {
                    text.setValue(value as string);
                    text.setDisabled(true);
                });
            });
        }

        this.addButton((button: any) => {
            button.onClick(() => {
                if (i == list.length - 1) return;
                const nextEl = list[i + 1];
                list[i + 1] = item;
                list[i] = nextEl;
                update(list);
                saveSettings();
                settings.display();
            });
            button.setIcon('down-arrow-with-tail');
            button.setTooltip('Move down');
        });

        this.addButton((button: any) => {
            button.onClick(() => {
                if (i == 0) return;
                const prevEl = list[i - 1];
                list[i - 1] = item;
                list[i] = prevEl;
                update(list);
                saveSettings();
                settings.display();
            });
            button.setIcon('up-arrow-with-tail');
            button.setTooltip('Move up');
        });

        this.addButton((button: any) => {
            button.onClick(() => {
                list.splice(i, 1);
                update(list);
                saveSettings();
                settings.display();
            });
            button.setIcon('cross');
            button.setTooltip('Remove element');
        });
    }
}