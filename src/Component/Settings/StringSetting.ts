import { Setting } from 'obsidian';
export default class StringSettings extends Setting {
    constructor(containerEl: HTMLElement, saveSettings: ()=> Promise<void>, onChange: (value: string) => void, name: string, desc: string, value: string, placeHolder: string = ''){
        super(containerEl)
        this.setName(name)
            .setDesc(desc)
            .addText(text => text
                .setValue(value)
                .setPlaceholder(placeHolder)
                .onChange(async (value) => {
                    onChange(value)
                    await saveSettings();
                }))
    }
}