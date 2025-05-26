import { TFolder, TFile, App, Notice } from 'obsidian';
import { getAPI } from 'obsidian-dataview';

export default class MoveFolder {
    app: App;
    exculdedFolders: string[];
    specificRouting: {[key: string]: string}[];
    displayMoveNotice: boolean;

    constructor(app: App, exculdedFolders: string[], specificRouting: {[key: string]: string}[], displayMoveNotice: boolean = true) {
        this.app = app;
        this.setExculdedFolders(exculdedFolders);
        this.setSpecificRouting(specificRouting);
        this.displayMoveNotice = displayMoveNotice;
    }

    setExculdedFolders = (exculdedFolders: string[]) => {
        this.exculdedFolders = exculdedFolders;
    }
    setSpecificRouting = (specificRouting: {[key: string]: string}[]) => {
        this.specificRouting = specificRouting;
    }
    move = (file: TFile) => {
        if (file != this.app.workspace.getActiveFile())
            return;
        for(const folder of this.exculdedFolders)
            if (file.path.match(new RegExp(folder)))
                return;

        const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;

        for (const routing of this.specificRouting) {
            const key = routing.property;
            const value = routing.value;

            if (frontmatter && key in frontmatter) {
                let folderName = frontmatter[key];

                try {
                    const regex = new RegExp(value);
                    const match = frontmatter[key].match(regex);
                    if (match) {
                        folderName = match[1];
                    }
                } catch (e) {
                    // ignore invalid regex
                }

                // Find folders
                const foldersFound = this.app.vault
                    .getAllLoadedFiles()
                    .filter((file) => file instanceof TFolder)
                    .filter((folder: TFolder) => {
                        for(const f of this.exculdedFolders) {
                            if (folder.path.match(new RegExp(f)))
                                return false;
                        }
                        return true;
                    })
                    .filter((folder: TFolder) => {
                        const path = folder.path.endsWith("/") ? folder.path.slice(0, -1) : folder.path;
                        if (path.split("/").last() == folderName) {
                            return true;
                        }
                        return false;
                    });

                if (foldersFound.length > 1) {
                    new Notice(`The folder name ${file.name} is in multiple folders, please move it manually`);
                    return;
                } else if (foldersFound.length == 1) {
                    const folderPath = foldersFound[0].path.endsWith("/") ? foldersFound[0].path : foldersFound[0].path + "/";
                    if (file.path.startsWith(folderPath)) {
                        return;
                    }
                    this.app.fileManager.renameFile(file, folderPath + file.name);
                    if (this.displayMoveNotice) {
                        new Notice(`Moved ${file.name} to ${folderName}`);
                    }
                } else {
                    // No folder found
                }
                return;
            }
        }
    }
    applyTemplate = (file: TFile) => {
        if (file != this.app.workspace.getActiveFile())
            return;
        for(const folder of this.exculdedFolders)
            if (file.path.match(new RegExp(folder)))
                return;
        
        const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
        if(frontmatter && Object.keys(frontmatter).length == 1 && frontmatter.Class) {
            const dv = getAPI(this.app);
            const dvFile = dv.page(file.path);
            if(dvFile){
                const classFile = dv.page(dvFile.Class.path)
                if(classFile["From Template"]){
                    const templater = (this.app as any).plugins.plugin['templater-obsidian']?.templater;
                    if(templater)
                        templater.append_template_to_active_file(this.app.vault.getFileByPath(classFile["From Template"].path));
                }
            }
        }
    }
}