import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { h, render } from 'preact';
import PersonalOS from '../../main';
import ProfileComponent from './ProfileComponent';


export default class ProfileView extends ItemView {
    plugin: PersonalOS;
    _unmount: (() => void) | null = null;
    constructor(leaf: WorkspaceLeaf, plugin: PersonalOS){
        super(leaf);
        this.plugin = plugin;
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
    async onOpen() {
        const { contentEl } = this;
        if (typeof this._unmount === 'function') this._unmount();
        contentEl.empty();
        // Access Datacore API via app.plugins.plugins.datacore.api
        const dc = (this.app as any).plugins?.plugins?.datacore?.api;
        const unmount = render(
            h(ProfileComponent, {
                app: this.app,
                plugin: this.plugin,
                dc,
            }),
            contentEl
        );
        this._unmount = typeof unmount === 'function' ? unmount : null;
    }
    async onClose() {
        const { contentEl } = this;
        contentEl.empty();
        if (typeof this._unmount === 'function') this._unmount();
    }
}

