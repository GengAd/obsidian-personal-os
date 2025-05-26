import { ItemView } from 'obsidian';
import { h, render } from 'preact';
import { MissionDownloadComponent } from './MissionDownloadComponent';
import { requestUrl } from 'obsidian';

export default class MissionDownloadView extends ItemView {
    _unmount: (() => void) | null = null;
    missions: any = {};

    getViewType(): string {
        return 'Mission Download View';
    }
    getDisplayText(): string {
        return 'Mission Download';
    }

    getIcon(): string{
        return 'rocket';
    }
    
    async onOpen() {
        const { contentEl } = this;
        if (typeof this._unmount === 'function') this._unmount();
        contentEl.empty();
        loadMissionsFromWeb().then((missions) => {
            this.missions = missions;
        });
        contentEl.innerHTML = `<h1>Work in Progress - Coming soon</h1>`;
        const unmount = render(
            h(MissionDownloadComponent, {
               missions: this.missions,
               app: this.app,
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


const loadMissionsFromWeb = async () => {
    const response = await requestUrl('https://example.com/missions');
    if (response.status < 200 || response.status >= 300) {
        throw new Error('Network response was not ok');
    }
    const data = response.json;
    return data;
}