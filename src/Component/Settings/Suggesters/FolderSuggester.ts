import { AbstractInputSuggest, App, TAbstractFile, TFolder } from "obsidian";

export class FolderSuggester extends AbstractInputSuggest<string> {
    private inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl;
    }

    getSuggestions(inputStr: string): Array<string> {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: string[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder.path);
            }
        });

        return folders;
    }

    renderSuggestion(folder: string, el: HTMLElement): void {
        el.setText(folder);
    }

    selectSuggestion(folder: string): void {
        this.inputEl.value = folder;
        this.inputEl.trigger("input");
        this.inputEl.blur();
        this.close();
    }

}

