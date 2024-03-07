import { Setting, Modal, App } from 'obsidian';
import SettingTab from './SettingsTab';
import ListItemSetting from './ListItemSetting';
export default class ListSetting {
    constructor(settings: SettingTab, saveSettings: () => void, update: (list: string[]) => void, div: HTMLElement, list: string[], name: string, desc: string) {
        div.createEl('h3', {text: name});
        new Setting(div)
            .setName(`Add ${name}`)
            .setDesc(desc)
            .addButton((button: any) => {
                button.onClick(()=>{
                    new AddModal(settings.app, (value: string) => {
                        list.push(value);
                        update(list);
                        saveSettings();
                        settings.display()
                    }).open();
                });
                button.setIcon('plus');
                button.setTooltip('Add element');
            });
        list.forEach((element: string, i: number) => {
            new ListItemSetting(div, list, element, i, update, saveSettings, settings);
        });

    }
        
}

class AddModal extends Modal{
    callback: (value: string) => void;
	constructor(app: App, callback: (value: string) => void) {
		super(app);
        this.callback = callback;
	}

	onOpen() {
		const { contentEl } = this;
        contentEl.empty();
        contentEl.innerHTML = `
            <h1>
                Add element
            </h1>
            <input id="input" type="text" placeholder="Enter the element to add">
            <button id="add">Add</button>`;
        const input = contentEl.querySelector("#input") as HTMLInputElement;
        const add = contentEl.querySelector("#add") as HTMLButtonElement;
        const saveElement = () => {
            this.callback(input.value);
            this.close();
        }
        add.onclick = () => {
            saveElement();
        }
        input.onkeydown = (e) => {
            if(e.key == "Enter"){
                saveElement();
            }
        }
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}