/** @jsxImportSource preact */
import { h } from "preact";
import { App, TFile } from "obsidian";

interface GenerateAllTemplatesButtonProps {
  app: App;
  dc: any;
  buttonText?: string;
}

export const GenerateAllTemplatesButton = ({ app, dc, buttonText = "Generate All Templates" }: GenerateAllTemplatesButtonProps) => {
  // Helper to get the section title for a list item
  const getSectionTitle = (listItem: any): string | undefined => {
    let current = listItem;
    while (current && current.$typename !== "Section") {
      current = current.$parent;
    }
    if (typeof current?.$title === "string") {
      return current.$title.replace(/#[^\s]+/g, '').trim();
    }
    return current?.$title;
  };

  const currentFile = dc.useCurrentFile();
  // Only call useQuery at the top level, never in async/effect
  const listItems = currentFile && currentFile.$path
    ? dc.useQuery(`@list-item and $file="${currentFile.$path}"`)
    : [];
  const templateItems = listItems.filter((item: any) => getSectionTitle(item) === "Templates");

  const [status, setStatus] = dc.useState(null);
  const [loading, setLoading] = dc.useState(false);
  const [allGenerated, setAllGenerated] = dc.useState(false);
  const [noTemplates, setNoTemplates] = dc.useState(false);

  // Helper to check if a line is already checked
  const isChecked = (line: string) => line.includes("✔️");

  // On mount or when currentFile or templateItems change, check if all template lines are checked
  dc.useEffect(() => {
    if (!currentFile || !currentFile.$path) {
      setNoTemplates(false);
      setAllGenerated(false);
      return;
    }
    if (!templateItems.length) {
      setNoTemplates(true);
      setAllGenerated(false);
      return;
    } else {
      setNoTemplates(false);
    }
    // Check if all template lines are checked
    const fileObj = app.vault.getAbstractFileByPath(currentFile.$path);
    if (!fileObj) return;
    app.vault.read(fileObj as TFile).then(content => {
      const lines = content.split("\n");
      const unchecked = templateItems.filter((item: any) => {
        const lineNumber = item.$line + 1;
        return lineNumber > 0 && lineNumber <= lines.length && !isChecked(lines[lineNumber - 1]);
      });
      setAllGenerated(unchecked.length === 0);
    });
  }, [currentFile, listItems, templateItems, loading]);

  const handleGenerateAll = async () => {
    setLoading(true);
    setStatus(null);
    try {
      if (!currentFile || !currentFile.$path) throw new Error('No active file found');
      if (!templateItems.length) {
        setNoTemplates(true);
        return;
      }
      const fileObj = app.vault.getAbstractFileByPath(currentFile.$path);
      if (!fileObj) throw new Error('Could not find file in vault');
      let content = await app.vault.read(fileObj as TFile);
      let lines = content.split("\n");
      // Get Templater and destination folder
      const templater = (app as any).plugins.plugins['templater-obsidian'];
      if (!templater) throw new Error('Templater plugin not found');
      const tp = templater.templater.current_functions_object;
      const pos = (app as any).plugins.plugins["personal-os"];
      const missionDestinationFolder = pos?.settings?.missionDestinationFolder;
      let destinationFolder: any = undefined;
      if (missionDestinationFolder && typeof missionDestinationFolder === "string" && missionDestinationFolder.length > 0) {
        const folderPath = missionDestinationFolder.replace(/\/$/, "");
        const foundFolder = app.vault.getAbstractFileByPath(folderPath);
        if (foundFolder) destinationFolder = foundFolder;
        else destinationFolder = undefined;
      }
      let createdCount = 0;
      for (const item of templateItems) {
        const lineNumber = item.$line + 1;
        if (lineNumber <= 0 || lineNumber > lines.length) continue;
        if (isChecked(lines[lineNumber - 1])) continue;
        const templateLink = item.$links?.[0];
        if (!templateLink?.path) continue;
        const templatePath = templateLink.path;
        const templateName = templatePath.split('/').pop()?.replace('.md', '') || '';
        const templateFile = tp.file.find_tfile(templatePath);
        if (!templateFile) continue;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await tp.file.create_new(templateFile, `${templateName}-${timestamp}`, false, destinationFolder === undefined ? undefined : destinationFolder);
        // Add checkmark to the line
        if (!isChecked(lines[lineNumber - 1])) {
          lines[lineNumber - 1] += " ✔️";
        }
        createdCount++;
      }
      // Write back the modified lines if any were changed
      await app.vault.modify(fileObj as TFile, lines.join("\n"));
      setStatus(`Created ${createdCount} file${createdCount === 1 ? '' : 's'} from templates.`);
    } catch (error: any) {
      setStatus(error.message || 'Failed to generate templates.');
    } finally {
      setLoading(false);
    }
  };

  if (noTemplates) {
    return (
      <dc.Text style={{ marginTop: '12px', color: 'var(--text-warning)', fontWeight: 500 }}>
        No templates found in the Templates section.
      </dc.Text>
    );
  }
  if (allGenerated) {
    return (
      <dc.Text style={{ marginTop: '12px', color: 'var(--text-success)', fontWeight: 500 }}>
        All templates have been generated
      </dc.Text>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
      <dc.Button
        onClick={handleGenerateAll}
        disabled={loading || !currentFile}
        style={{
          background: 'var(--interactive-accent)',
          color: 'var(--text-on-accent)',
          borderRadius: '6px',
          border: 'none',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: 'none',
          padding: '8px 16px',
          cursor: loading ? 'wait' : 'pointer',
          minWidth: '180px',
        }}
      >
        {loading ? 'Generating...' : buttonText}
      </dc.Button>
      {status && (
        <dc.Text style={{ marginTop: '12px', color: status.startsWith('Created') ? 'var(--text-success)' : 'var(--text-error)', fontWeight: 500 }}>
          {status}
        </dc.Text>
      )}
    </div>
  );
};
