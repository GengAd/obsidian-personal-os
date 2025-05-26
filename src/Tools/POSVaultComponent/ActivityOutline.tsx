/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";
import { MissionProgressBar } from "./MissionProgressBar";

interface ActivityOutlineProps {
  app: App;
  dc: any;
}

export const ActivityOutline = ({ app, dc }: ActivityOutlineProps) => {
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

  const [currentFile, setCurrentFile] = dc.useState(() => dc.currentFile?.() || dc.useCurrentFile?.() || null);

  const listItems = dc.useQuery(`@list-item and $file="${currentFile.$path}"`);
  const outlineItems = listItems.filter((item: any) => getSectionTitle(item) === "Outline");

  dc.useEffect(() => {
    if (currentFile) return;
    const interval = setInterval(() => {
      const file = dc.currentFile?.() || dc.useCurrentFile?.() || null;
      if (file) {
        setCurrentFile(file);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [currentFile]);

  if (!currentFile) {
    return (
      <dc.Stack spacing={2}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <dc.Text style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-error)' }}>
            No active file found. Please open a file to view activities.
          </dc.Text>
        </div>
      </dc.Stack>
    );
  }

  const allFilesWithTemplate = dc.useQuery(`
    @page and $frontmatter.contains("from template")
    and $frontmatter["from template"].value
    and $frontmatter.contains("supports")
    and $frontmatter.supports.value
  `);

  const isTemplateGenerated = (templatePath: string) => {
    return allFilesWithTemplate.find((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      const supports = file.$frontmatter?.supports?.value;
      if (!fromTemplate?.path || fromTemplate.path !== templatePath) return false;
      if (!Array.isArray(supports)) return false;
      return supports.some((s: any) => s?.path === currentFile.$path);
    });
  };

  const findCurrentActivity = () => {
    for (const item of outlineItems) {
      const templatePath = item.$links?.[0]?.path;
      if (!templatePath) continue;

      const generatedFile = isTemplateGenerated(templatePath);

      if (generatedFile) {
        if (generatedFile.$frontmatter?.archived?.value !== true) {
          return { type: "activity", file: generatedFile, templatePath };
        }
      } else {
        const templateFile = dc.query(`@file and $path="${templatePath}"`)[0];
        return {
          type: "template",
          path: templatePath,
          name: templatePath.split('/').pop().replace('.md', ''),
          file: templateFile
        };
      }
    }
    return null;
  };

  const currentActivity = findCurrentActivity();

  const handleOpenFile = (path: string) => {
    app.workspace.openLinkText(path, '', false);
  };

  const getCleanClassDisplay = (classValue: any) => {
    if (!classValue?.raw) return '';
    return classValue.raw.replace(/\[\[|\]\]/g, '').replace(/-Template$/, '');
  };

  const handleGenerateActivity = async (templatePath: string) => {
    try {
      if (!currentFile) throw new Error('Could not determine current file location');
      const templateName = templatePath?.split('/').pop()?.replace('.md', '') || '';
      const templater = (app as any).plugins.plugins['templater-obsidian'];
      if (!templater) throw new Error('Templater plugin not found');

      const tp = templater.templater.current_functions_object;
      const templateFile = tp.file.find_tfile(templatePath);
      if (!templateFile) throw new Error(`Template file not found: ${templatePath}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Get missionDestinationFolder from settings
      const pos = (app as any).plugins.plugins["personal-os"];
      const missionDestinationFolder = pos?.settings?.missionDestinationFolder;
      let destinationFolder = undefined;
      if (missionDestinationFolder && typeof missionDestinationFolder === "string" && missionDestinationFolder.length > 0) {
        const folderPath = missionDestinationFolder.replace(/\/$/, "");
        destinationFolder = app.vault.getAbstractFileByPath(folderPath);
      }
      const newFile = await tp.file.create_new(templateFile, `${templateName}-${timestamp}`, true, destinationFolder);

      await app.fileManager.processFrontMatter(newFile, (frontmatter: any) => {
        if (!Array.isArray(frontmatter.Supports)) frontmatter.Supports = [];
        const newSupport = `[[${currentFile.$path}|${currentFile.$name}]]`;
        if (!frontmatter.Supports.includes(newSupport)) {
          frontmatter.Supports.push(newSupport);
        }
      });
    } catch (error) {
      // Removed console.error for production cleanliness
    }
  };

  function findGeneratedFileForSlot(templatePath: string, currentFilePath: string) {
    return allFilesWithTemplate.find((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      const supports = file.$frontmatter?.supports?.value;
      return fromTemplate?.path === templatePath && Array.isArray(supports) && supports.some((s: any) => s?.path === currentFilePath);
    });
  }

  // Always map over the current, sorted outlineItems
  const sortedOutlineItems = [...outlineItems].sort((a: any, b: any) => a.$line - b.$line);
  // For each, derive slot data on each render
  const slots = sortedOutlineItems.map((item: any, idx: number) => {
    const templatePath = item.$links?.[0]?.path;
    if (!templatePath) return null;
    const currentFilePath = currentFile?.$path;
    const generatedFile: any = findGeneratedFileForSlot(templatePath, currentFilePath);
    let cardType: any, cardFile: any, cardName: any, cardPath: any;
    if (generatedFile && generatedFile.$frontmatter?.archived?.value !== true) {
      cardType = 'activity';
      cardFile = generatedFile;
      cardName = generatedFile.$name;
      cardPath = generatedFile.$path;
    } else {
      const templateFile: any = dc.query(`@file and $path="${templatePath}"`)[0];
      cardType = 'template';
      cardFile = templateFile;
      cardName = templatePath.split('/').pop().replace('.md', '');
      cardPath = templatePath;
    }
    let tagline: any = null;
    if (cardFile) {
      const allListItems: any = dc.useQuery(`@list-item and $file="${cardFile.$path}"`);
      const taglineItems: any = allListItems.filter((li: any) => getSectionTitle(li)?.toLowerCase() === "tagline");
      if (taglineItems.length > 0) {
        tagline = taglineItems[0]?.$text?.replace(/#[^\s]+/g, '').trim() || null;
      }
    }
    let isCompleted: boolean;
    if (cardType === 'activity') {
      isCompleted = cardFile?.$frontmatter?.archived?.value === true;
    } else if (cardType === 'template') {
      isCompleted = !!(generatedFile && generatedFile.$frontmatter?.archived?.value === true);
    } else {
      isCompleted = false;
    }
    return {
      cardType, cardFile, cardName, cardPath, tagline, templatePath, idx, isCompleted, item
    };
  });
  // Find the first actionable slot in outline order (not completed)
  const firstActionableIdx = slots.findIndex((slot: any) => slot && !slot.isCompleted);
  const allCompleted = slots.filter(Boolean).length > 0 && slots.filter(Boolean).every((slot: any) => slot.isCompleted);

  // Helper to clean mission/template title (remove timestamps like 2025-05-08-1954)
  const getCleanTitle = (title: string) => {
    // Remove timestamps of the form YYYY-MM-DD-HHMM or similar at the end
    return title.replace(/\s*\d{4}-\d{2}-\d{2}-\d{4,}/, '').trim();
  };

  return (
    <dc.Stack spacing={2}>
      {slots.map((slot: any, idx: number) => {
        if (!slot) return null;
        const key = `${currentFile.$path}-${slot.item?.$line ?? idx}-${slot.item?.$links?.[0]?.path || ''}`;
        return (
          <div key={key} style={{ marginBottom: '12px' }}>
            <div
              style={{
                borderRadius: '8px',
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
                  {(slot.cardFile?.$frontmatter?.class?.raw) && (
                    <dc.Text style={{
                      fontSize: '14px',
                      color: idx === firstActionableIdx ? 'var(--text-on-accent)' : 'var(--text-muted)',
                      backgroundColor: idx === firstActionableIdx ? 'var(--interactive-accent)' : 'var(--background-primary)',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      fontWeight: 600,
                      border: 'none',
                      boxShadow: 'none',
                    }}>
                      {getCleanClassDisplay(slot.cardFile.$frontmatter.class)}
                    </dc.Text>
                  )}
                  <dc.Text style={{ fontSize: '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getCleanTitle(slot.cardName)}
                  </dc.Text>
                  {slot.tagline && (
                    <dc.Text style={{ fontSize: '15px', color: 'var(--text-muted)', marginLeft: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
                      {slot.tagline}
                    </dc.Text>
                  )}
                </div>
                {/* Only show the button for the first actionable slot */}
                {idx === firstActionableIdx ? (
                  slot.cardType === 'activity' ? (
                    <dc.Button
                      onClick={() => handleOpenFile(slot.cardFile.$path)}
                      style={{
                        background: 'var(--interactive-accent)',
                        color: 'var(--text-on-accent)',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        boxShadow: 'none',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        minWidth: '80px',
                      }}
                    >
                      Continue activity
                    </dc.Button>
                  ) : (
                    <dc.Button
                      onClick={() => handleGenerateActivity(slot.templatePath)}
                      style={{
                        background: 'var(--interactive-accent)',
                        color: 'var(--text-on-accent)',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        boxShadow: 'none',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        minWidth: '80px',
                      }}
                    >
                      Generate activity
                    </dc.Button>
                  )
                ) : (
                  slot.isCompleted ? (
                    <dc.Text style={{ color: 'var(--text-success)', fontWeight: 'bold', fontSize: '15px', marginLeft: '12px' }}>Completed</dc.Text>
                  ) : null
                )}
              </div>
            </div>
            {/* Progress bar clearly separated below the card, full width, no divider */}
            {idx === firstActionableIdx && slot.cardType === 'activity' && (
              <div style={{ width: '100%', marginTop: '8px', marginBottom: '8px' }}>
                <MissionProgressBar missionFile={slot.cardFile} app={app} dc={dc} />
              </div>
            )}
          </div>
        );
      })}
      {allCompleted && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '12px'
        }}>
          <dc.Text style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-success)' }}>
            All activities have been completed!
          </dc.Text>
        </div>
      )}
    </dc.Stack>
  );
};
