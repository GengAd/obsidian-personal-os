import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { h, render } from 'preact';
import { MindSweepComponent } from './MindSweepComponent';

export default class MindSweepView extends ItemView {
    _unmount: (() => void) | null = null;
    categories: { title: string; triggers: string[] }[] = [];
    isLoading: boolean = true;

    getViewType(): string {
        return 'Mind Sweep View';
    }
    getDisplayText(): string {
        return 'Mind Sweep View';
    }

    getIcon(): string{
        return 'brain-circuit';
    }
    
    async onOpen() {
        const { contentEl } = this;
        if (typeof this._unmount === 'function') this._unmount();
        contentEl.empty();
        this.isLoading = true;
        // Dynamically find config folder from plugin settings if available
        let configFolder = '';
        const appAny = this.app as any;
        if (appAny.plugins && appAny.plugins.plugins) {
            const personalOS = appAny.plugins.plugins['personal-os'];
            if (personalOS && personalOS.settings && personalOS.settings.configFolder) {
                configFolder = personalOS.settings.configFolder;
            }
        }
        if (!configFolder) {
            configFolder = ''; // fallback
        }
        const triggerFilePath = `${configFolder}/Trigger List by Category.md`;
        let categories: { title: string; triggers: string[] }[] = [];
        try {
            const file = this.app.vault.getAbstractFileByPath(triggerFilePath);
            if (file instanceof TFile) {
                const content = await this.app.vault.read(file);
                const sections = content.split('# ');
                sections.shift(); // Remove any content before the first header
                for (const section of sections) {
                    const lines = section.split('\n');
                    const title = lines[0].trim();
                    const triggers = lines.slice(1).map(l => l.replace(/^- /, '').trim()).filter(l => l.length > 0);
                    categories.push({ title, triggers });
                }
            }
        } catch (e) {
            // If file not found or error, categories stays empty
        }
        this.categories = categories;
        this.isLoading = false;
        const unmount = render(
            h(MindSweepComponent, {
                categories: this.categories,
                isLoading: this.isLoading,
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