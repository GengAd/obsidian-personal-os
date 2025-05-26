import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Platform } from 'obsidian';
import ListSetting from './ListSetting';
import StringSetting from './StringSetting';
import confetti from 'canvas-confetti';
import { createSVGAndLink } from 'src/Tools/Utils';

export default function SettingsTabComponent({ plugin, settings, updateSetting }: { plugin: any, settings: any, updateSetting: (key: string, value: any) => void }) {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState(true);
  const isMobile = Platform.isMobile;

  // Defensive: show loading if settings not loaded
  if (!settings) {
    return <div>Loading settings...</div>;
  }

  // Tab definitions
  const tabs = [
    {
      name: 'General',
      render: () => (
        <div>
          <StringSetting
            value={settings.configFolder}
            onChange={value => handleUpdateSetting('configFolder', value)}
            name="Config folder"
            description="Enter the path of your config folder"
            placeholder="Enter the element to add"
            app={plugin.app}
            showFolderSuggest={true}
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <StringSetting
            value={settings.missionTemplateFolder}
            onChange={value => handleUpdateSetting('missionTemplateFolder', value)}
            name="Mission Template Folder"
            description="Enter the path of your mission template folder"
            placeholder="Enter the element to add"
            app={plugin.app}
            showFolderSuggest={true}
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <StringSetting
            value={settings.missionDestinationFolder}
            onChange={value => handleUpdateSetting('missionDestinationFolder', value)}
            name="Mission destination folder"
            description="Enter the path of your mission destination folder"
            placeholder="Select a folder"
            app={plugin.app}
            showFolderSuggest={true}
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <div className="setting-item mod-toggle" style={{ margin: '16px 0' }}>
            <div className="setting-item-info">
              <div className="setting-item-name">Enable changelog popups</div>
              <div className="setting-item-description">Display a popup with the information of the new version when the plugin is updated</div>
            </div>
            <div className="setting-item-control">
              <label className={`checkbox-container${settings.enableChangelog ? ' is-enabled' : ''}`}> 
                <input
                  type="checkbox"
                  checked={settings.enableChangelog}
                  onChange={handleToggle('enableChangelog')}
                  tabIndex={0}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: 'Engage',
      render: () => (
        <div>
          <ListSetting
            value={settings.officePages}
            onChange={list => handleUpdateSetting('officePages', list)}
            name="Excluded folders"
            description="Enter the path of your excluded folders to engage"
            showFolderSuggest={true}
            app={plugin.app}
          />
        </div>
      ),
    },
    {
      name: 'Process',
      render: () => (
        <div>
          <ListSetting
            value={settings.inboxPages}
            onChange={list => handleUpdateSetting('inboxPages', list)}
            name="Inbox folders"
            description="Enter the path of your inbox folders"
            showFolderSuggest={true}
            app={plugin.app}
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <ListSetting
            value={settings.instrumentalFolders}
            onChange={list => handleUpdateSetting('instrumentalFolders', list)}
            name="Supporting folders"
            description="Enter the path of your supporting folders"
            showFolderSuggest={true}
            app={plugin.app}
          />
        </div>
      ),
    },
    {
      name: 'Automations',
      render: () => (
        <div>
          <div className="setting-item mod-toggle" style={{ margin: '0 0 12px 0' }}>
            <div className="setting-item-info">
              <div className="setting-item-name">Enable automatic move of notes</div>
              <div className="setting-item-description">Automatically move notes based on your rules</div>
            </div>
            <div className="setting-item-control">
              <label className={`checkbox-container${settings.automaticMove ? ' is-enabled' : ''}`}> 
                <input
                  type="checkbox"
                  checked={settings.automaticMove}
                  onChange={handleToggle('automaticMove')}
                  tabIndex={0}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <div className="setting-item mod-toggle" style={{ margin: '0 0 12px 0' }}>
            <div className="setting-item-info">
              <div className="setting-item-name">Display successful move notice</div>
              <div className="setting-item-description">Show a notification when a note is successfully moved.</div>
            </div>
            <div className="setting-item-control">
              <label className={`checkbox-container${settings.displayMoveNotice ? ' is-enabled' : ''}`}> 
                <input
                  type="checkbox"
                  checked={settings.displayMoveNotice}
                  onChange={handleToggle('displayMoveNotice')}
                  tabIndex={0}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <div className="setting-item mod-toggle" style={{ margin: '0 0 12px 0' }}>
            <div className="setting-item-info">
              <div className="setting-item-name">Enable automatic apply template on notes</div>
              <div className="setting-item-description">Automatically apply a template based on your rules</div>
            </div>
            <div className="setting-item-control">
              <label className={`checkbox-container${settings.automaticTemplate ? ' is-enabled' : ''}`}> 
                <input
                  type="checkbox"
                  checked={settings.automaticTemplate}
                  onChange={handleToggle('automaticTemplate')}
                  tabIndex={0}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <ListSetting
            value={settings.excludedFolders}
            onChange={list => handleUpdateSetting('excludedFolders', list)}
            name="Excluded folders"
            description="Enter the name or path of your excluded folders"
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <ListSetting
            value={
              (settings.specificRouting || []).map((item: any) =>
                Array.isArray(item)
                  ? { 0: item[0], 1: item[1], 2: item[2] }
                  : typeof item === "object" && item !== null
                  ? { 0: item.property ?? item[0], 1: item.value ?? item[1], 2: item.path ?? item[2] }
                  : item
              )
            }
            onChange={list => handleUpdateSetting('specificRouting', list)}
            name="Specific routing"
            description=""
            columns={3}
            columnLabels={["Name of the property", "Value of the property", "Path of the folder"]}
            placeholders={["Name of the property", "Value of the property", "Path of the folder"]}
            showFolderSuggest={[false, false, true]}
            app={[null, null, plugin.app]}
            disableFirstFolderSuggest={true}
          />
        </div>
      ),
    },
    {
      name: 'Gamification',
      render: () => (
        <div>
          <ListSetting
            value={settings.randomEvents}
            onChange={list => handleUpdateSetting('randomEvents', list)}
            name="Engage random events"
            description="Add a new tag for random event"
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <div className="setting-item" style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
            <div className="setting-item-info" style={{ flex: 1 }}>
              <div className="setting-item-name" style={{ fontWeight: 500 }}>Probability of random events</div>
              <div className="setting-item-description">Set the probability (0-100) for random events to occur</div>
            </div>
            <input
              type="number"
              value={settings.probabilityRandomEvents}
              min={0}
              max={100}
              style={{ width: 60, marginLeft: 8 }}
              onInput={(e: any) => handleUpdateSetting('probabilityRandomEvents', parseInt(e.target.value) || 0)}
            />
          </div>
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <StringSetting
            value={settings.buffFolder}
            onChange={value => handleUpdateSetting('buffFolder', value)}
            name="Buff Folder"
            description="Select the folder for Buffs"
            placeholder="Select a folder"
            app={plugin.app}
            showFolderSuggest={true}
          />
          <hr style={{ border: 'none', borderBottom: '1px solid var(--background-modifier-border)', margin: '12px 0' }} />
          <StringSetting
            value={settings.debuffFolder}
            onChange={value => handleUpdateSetting('debuffFolder', value)}
            name="Debuff Folder"
            description="Select the folder for Debuffs"
            placeholder="Select a folder"
            app={plugin.app}
            showFolderSuggest={true}
          />
          <div className="setting-item mod-toggle" style={{ margin: '16px 0' }}>
            <div className="setting-item-info">
              <div className="setting-item-name">Enable XP earned notification</div>
              <div className="setting-item-description">Display a notification with XP earned when a task is completed</div>
            </div>
            <div className="setting-item-control">
              <label className={`checkbox-container${settings.toggleXp ? ' is-enabled' : ''}`}> 
                <input
                  type="checkbox"
                  checked={settings.toggleXp}
                  onChange={handleToggle('toggleXp')}
                  tabIndex={0}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: 'Ontology',
      render: () => (
        <div>
          <StringSetting
            value={settings.ontologyFolder}
            onChange={value => handleUpdateSetting('ontologyFolder', value)}
            name="Ontology Folder"
            description="Select the folder containing your ontology files"
            placeholder="Select a folder"
            app={plugin.app}
            showFolderSuggest={true}
          />
        </div>
      ),
    },
  ];

  // Tab header
  const TabHeader = () => (
    <nav
      style={{
        display: isMobile ? 'block' : 'flex',
        borderBottom: isMobile ? 'none' : '1px solid var(--background-modifier-border)',
        marginBottom: 16,
      }}
    >
      {tabs.map((tab, idx) => (
        <div
          key={tab.name}
          style={{
            padding: isMobile ? '12px 16px' : '8px 24px',
            cursor: 'pointer',
            background: activeTab === idx ? 'var(--background-secondary)' : (isMobile && activeTab !== idx ? 'none' : 'none'),
            fontWeight: activeTab === idx ? 700 : 400,
            color: 'var(--text-normal)',
            borderBottom: !isMobile && activeTab === idx ? '2px solid var(--interactive-accent)' : 'none',
            borderRadius: isMobile ? 8 : 0,
            marginBottom: isMobile ? 8 : 0,
          }}
          onClick={() => {
            setActiveTab(idx);
            setOpen(false);
          }}
        >
          {tab.name}
        </div>
      ))}
    </nav>
  );

  // Mobile back button
  const MobileBack = () => (
    <div style={{ marginBottom: 16 }}>
      <button
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--interactive-accent)',
          fontSize: 16,
          cursor: 'pointer',
          padding: 0,
        }}
        onClick={() => setOpen(true)}
      >
        ← Back to tabs
      </button>
    </div>
  );

  // Remove duplicate updateSetting and define a new handler
  const handleUpdateSetting = (key: string, value: any) => {
    if (key === 'specificRouting') {
      const normalized = (value || []).map((item: any) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return {
            property: item.property ?? item[0] ?? '',
            value: item.value ?? item[1] ?? '',
            path: item.path ?? item[2] ?? '',
          };
        }
        return item;
      });
      updateSetting('specificRouting', normalized);
      return;
    }
    updateSetting(key, value);
  };

  // Add the unified toggle handler after handleUpdateSetting
  const handleToggle = (key: string) => (e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
    updateSetting(key, e.currentTarget.checked);
  };

  // General section content (moved from removed tab)
  const GeneralSection = (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          width: '100%',
          marginBottom: 8,
          fontSize: 13,
          gap: 8,
        }}
      >
        <div
          ref={(el: HTMLDivElement | null) => {
            if (el && el.childElementCount === 0) {
              createSVGAndLink(
                el,
                'https://github.com/GengAd/obsidian-personal-os',
                `<svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> <span style='margin-left:4px;'>GitHub</span>`,
                ''
              );
              createSVGAndLink(
                el,
                'https://discord.gg/SZrM5ayuTR',
                `<svg width="20px" height="20px" viewBox="-1.5 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"><path d="m13.93 11.4c-.054.633-.582 1.127-1.224 1.127-.678 0-1.229-.55-1.229-1.229s.55-1.229 1.228-1.229c.683.029 1.225.59 1.225 1.277 0 .019 0 .037-.001.056v-.003zm-5.604-1.33c-.688.061-1.223.634-1.223 1.332s.535 1.271 1.218 1.332h.005c.683-.029 1.225-.59 1.225-1.277 0-.019 0-.037-.001-.056v.003c.001-.02.002-.043.002-.067 0-.685-.541-1.243-1.219-1.269h-.002zm12.674-7.598v21.528c-3.023-2.672-2.057-1.787-5.568-5.052l.636 2.22h-13.609c-1.359-.004-2.46-1.106-2.46-2.466 0-.002 0-.004 0-.006v-16.224c0-.002 0-.004 0-.006 0-1.36 1.101-2.462 2.459-2.466h16.081c1.359.004 2.46 1.106 2.46 2.466v.006zm-3.42 11.376c-.042-2.559-.676-4.96-1.77-7.086l.042.09c-.924-.731-2.088-1.195-3.358-1.259l-.014-.001-.168.192c1.15.312 2.15.837 3.002 1.535l-.014-.011c-1.399-.769-3.066-1.222-4.839-1.222-1.493 0-2.911.321-4.189.898l.064-.026c-.444.204-.708.35-.708.35.884-.722 1.942-1.266 3.1-1.56l.056-.012-.12-.144c-1.284.065-2.448.529-3.384 1.269l.012-.009c-1.052 2.036-1.686 4.437-1.728 6.982v.014c.799 1.111 2.088 1.826 3.543 1.826.041 0 .082-.001.123-.002h-.006s.444-.54.804-.996c-.866-.223-1.592-.727-2.093-1.406l-.007-.01c.176.124.468.284.49.3 1.209.672 2.652 1.067 4.188 1.067 1.191 0 2.326-.238 3.36-.668l-.058.021c.528-.202.982-.44 1.404-.723l-.025.016c-.526.703-1.277 1.212-2.144 1.423l-.026.005c.36.456.792.972.792.972.033.001.072.001.111.001 1.461 0 2.755-.714 3.552-1.813l.009-.013z"/></svg> <span style='margin-left:4px;'>Discord</span>`,
                ''
              );
              createSVGAndLink(
                el,
                'https://discord.gg/SZrM5ayuTR',
                `<svg width="20px" height="20px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M232 64L280 64 280 214 277 270 300 242 356 189 388 221 256 353 124 221 156 189 212 242 235 270 232 214 232 64ZM64 400L448 400 448 448 64 448 64 400Z"/></svg> <span style='margin-left:4px;'>Vault Template</span>`,
                ''
              );
              createSVGAndLink(
                el,
                'https://www.buymeacoffee.com/swandyos',
                `<svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 19c1.5 2 10.5 2 12 0M6 19V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12M6 19a6 6 0 0 1-6-6V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a6 6 0 0 1-6 6"/></svg> <span style='margin-left:4px;'>Coffee ❤️</span>`,
                ''
              );
            }
          }}
          style={{ display: 'flex', flexWrap: 'nowrap', gap: 16, flex: 1, minWidth: 0 }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? 8 : 24 }}>
      {GeneralSection}
      {isMobile ? (
        open ? (
          <TabHeader />
        ) : (
          <div>
            <MobileBack />
            {tabs[activeTab].render()}
          </div>
        )
      ) : (
        <div>
          <TabHeader />
          <div style={{ marginTop: 16 }}>{tabs[activeTab].render()}</div>
        </div>
      )}
    </div>
  );
} 
 