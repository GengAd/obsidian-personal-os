import { App, ItemView, TFile, WorkspaceLeaf, Plugin, moment } from 'obsidian';
import { getAPI } from 'obsidian-dataview';
import PersonalOS from '../../main';
import { calculateTotalPoints, currentLevelBasedOnXp, totalXpToTargetLevel, xpForNextLevel } from '../Tools/Utils';


export default class ProfileView extends ItemView {
    plugin: PersonalOS;
    dv: any;
    constructor(leaf: WorkspaceLeaf, plugin: PersonalOS){
        super(leaf);
        this.plugin = plugin;
        this.dv = getAPI(plugin.app);
    }
    getViewType(): string {
        return 'Profile View';
    }
    getDisplayText(): string {
        return 'Profile View';
    }
    getIcon(): string{
        return 'circle-user';
    }
    onOpen = async () =>{
        this.display();
    }

    display = () =>{
        const { contentEl } = this;
        const mastery = () =>
            this.dv.pages('"3.Competences" AND (#Competence)')
                .filter((p: any) => p.Level !== undefined) // Ensure the "Level" property exists
                .array() // Convert DataArray to a standard array
                .reduce((sum: number, p: any) => sum + p.Level, 0); // Sum the "Level" values
        contentEl.empty();
        let imgURL = "";
        const imgPath = this.app.vault.getFileByPath(`${this.plugin.settings.configFolder}/Avatar.png`);
        if(imgPath instanceof TFile)
            imgURL = this.app.vault.getResourcePath( imgPath );
        
        const {differencialXp, xpRequired, level} = this.plugin.functions.getCurrentLevelXP();
        contentEl.innerHTML = `
            <div class="profile-view"> 
                <div class="profile-view-avatar">
                    <img src="${imgURL}" alt="Avatar"/>
                </div>
                <div class="profile-view-level">
                    <h1>Level ${level}</h1>
                </div>
                <div class="profile-view-mastery">
                    <h1>Mastery ${mastery()}</h1>
                </div>
                <div class="profile-view-progress">
                    <progress-bar value="${Math.round((differencialXp / xpRequired) * 100)}" style="width=50%;"/>
                    <p>${differencialXp} / ${xpRequired} xp</p>
                </div>
            </div>
        `;
    }
}

