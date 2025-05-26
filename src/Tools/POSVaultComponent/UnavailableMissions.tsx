/** @jsxImportSource preact */
import { App } from "obsidian";
import { h } from "preact";
import { useState } from "preact/hooks";
import { RequirementProgressBar } from "./RequirementProgressBar";
import { getRequirementItems, verifyRequirement } from "../DcUtils";

interface UnavailableMissionsProps {
  app: App;
  dc: any;
  handleTemplateSelect?: (template: any) => void;
}

export function UnavailableMissions({ app, dc, handleTemplateSelect }: UnavailableMissionsProps) {
  const pos = (app as any).plugins.plugins["personal-os"];
  const missionTemplateFolder = pos?.settings?.missionTemplateFolder;
  const workInProgressFoldersSafe = Array.isArray(pos?.graph?.officePages) ? pos.graph.officePages : [];
  const instrumentalFoldersSafe = Array.isArray(pos?.settings?.instrumentalFolders) ? pos.settings.instrumentalFolders : [];
  const [selectedTemplate, setSelectedTemplate] = dc.useState(null);
  const [isDetailView, setIsDetailView] = dc.useState(false);
  const [ready, setReady] = dc.useState(false);

  // Poll for plugin settings
  dc.useEffect(() => {
    if (ready) return;
    const interval = setInterval(() => {
      const pos = (app as any).plugins.plugins["personal-os"];
      if (
        Array.isArray(pos?.graph?.officePages) &&
        Array.isArray(pos?.settings?.instrumentalFolders) &&
        (pos.graph.officePages.length > 0 || pos.settings.instrumentalFolders.length > 0)
      ) {
        setReady(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [ready]);

  const handleTemplateSelectInternal = (template: any) => {
    setSelectedTemplate(template);
    setIsDetailView(true);
    handleTemplateSelect?.(template);
  };

  const handleBackToGrid = () => setIsDetailView(false);

  const getImagePath = (path: string) => {
    if (!path) return null;
    const file = app.vault.getFileByPath(path);
    return file ? app.vault.getResourcePath(file) : null;
  };

  const getSectionTitle = (item: any) => {
    let current = item;
    while (current && current.$typename !== "Section") {
      current = current.$parent;
    }
    return current?.$title;
  };

  const checkTemplateAvailability = (template: any) => {
    const items = getRequirementItems(dc, template);
    return items.length > 0 && items.every((item: any) => verifyRequirement(dc, item));
  };

  const getProgress = (template: any) => {
    const items = getRequirementItems(dc, template);
    const total = items.length;
    const done = items.filter((item: any) => verifyRequirement(dc, item)).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  // Use missionTemplateFolder if set, otherwise return no missions
  let missionTemplates: any[] = [];
  if (missionTemplateFolder && typeof missionTemplateFolder === "string" && missionTemplateFolder.length > 0) {
    missionTemplates = dc.useQuery(`
      @page and path("${missionTemplateFolder}")
      and $frontmatter.contains("class")
      and $frontmatter["class"].raw = "[[Mission-Template]]"
    `);
  }

  // Precompute all files generated from templates (for template completion logic)
  const allFilesWithTemplate = dc.useQuery(`
    @page and $frontmatter.contains("from template")
    and $frontmatter["from template"].value
  `);

  // Gather all requirement items for all templates
  const requirementItemsByTemplate = (missionTemplates || []).map((template: any) => {
    const items = dc.useQuery(`@list-item and $file="${template.$path}"`).filter((item: any) => {
      let current = item;
      while (current) {
        if (current.$typename === "Section" && typeof current.$title === "string" && current.$title.trim() === "Requirements") {
          return true;
        }
        current = current.$parent;
      }
      return false;
    });
    return { template, items };
  });

  // Gather all unique linked file paths
  const allLinkedPaths: string[] = [];
  requirementItemsByTemplate.forEach(({ items }) => {
    items.forEach((item: any) => {
      const link = item.$links?.[0];
      if (link && !allLinkedPaths.includes(link.path)) {
        allLinkedPaths.push(link.path);
      }
    });
  });

  // Call dc.useFile for each unique path at the top level
  const allLinkedFiles = allLinkedPaths.map(path => dc.useFile(path));

  // Build a map from path to file
  const linkedFileMap: Record<string, any> = {};
  allLinkedPaths.forEach((path, idx) => {
    linkedFileMap[path] = allLinkedFiles[idx];
  });

  // Filter unavailable templates using only precomputed data
  const unavailableTemplates = requirementItemsByTemplate.filter(({ template, items }) => {
    // Exclude if the template has a completed on value
    if (template?.$frontmatter?.["completed on"]?.value != null) return false;
    if (items.length === 0) return false;
    return !items.every((item: any) => verifyRequirement(dc, item));
  }).map(({ template }) => template);

  const formatDifficulty = (difficulty: any) =>
    !difficulty || isNaN(difficulty) ? "Unknown" : difficulty > 5 ? "☠️" : "⭐".repeat(difficulty);

  const DetailView = () => {
    const template = selectedTemplate;
    if (!template) return null;

    const imagePath = template.$frontmatter?.image?.value?.path;
    const imageUrl = imagePath ? getImagePath(imagePath) : null;

    return (
      <dc.Stack style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
        background: 'var(--background-primary)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        gap: '24px'
      }}>
        <dc.Group style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          width: '100%'
        }}>
          <dc.Button
            onClick={handleBackToGrid}
            style={{
              padding: '8px 0',
              marginLeft: 0,
              marginRight: '16px',
              background: 'var(--interactive-accent)',
              color: 'var(--text-on-accent)',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              minWidth: '80px',
              boxShadow: 'none'
            }}
          >
            ← Back
          </dc.Button>
          <dc.Text style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--text-normal)',
            flexGrow: 1,
            textAlign: 'right'
          }}>
            {selectedTemplate?.$name}
          </dc.Text>
        </dc.Group>
        {imageUrl && (
          <div style={{
            width: '100%',
            height: '300px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'var(--background-secondary)',
            position: 'relative'
          }}>
            <img
              src={imageUrl}
              alt={selectedTemplate.$name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
            />
          </div>
        )}
        <dc.Group style={{ gap: '12px' }}>
          <dc.Text style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            background: 'var(--background-secondary)',
            padding: '6px 12px',
            borderRadius: '4px'
          }}>
            Difficulty: {formatDifficulty(selectedTemplate?.$frontmatter?.difficulty?.value)}
          </dc.Text>
        </dc.Group>
        <dc.Stack style={{ gap: '8px' }}>
          <dc.Text style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            Unlock Progress
          </dc.Text>
          <RequirementProgressBar app={app} dc={dc} file={template} />
        </dc.Stack>
        {selectedTemplate && selectedTemplate.$sections?.some((section: any) => section.$title?.toLowerCase() === 'requirements') && (
          <dc.LinkEmbed
            link={{
              path: selectedTemplate.$path,
              subpath: "Requirements",
              type: "header"
            }}
            inline={true}
          />
        )}
        {selectedTemplate && selectedTemplate.$sections?.some((section: any) => {
          const title = section.$title?.toLowerCase().replace(/[#].*$/,'').trim();
          return title === 'description' || title === 'mission overview';
        }) && (
          <dc.LinkEmbed
            link={{
              path: selectedTemplate.$path,
              subpath: selectedTemplate.$sections.find((section: any) => {
                const title = section.$title?.toLowerCase().replace(/[#].*$/,'').trim();
                return title === 'description' || title === 'mission overview';
              })?.$title || 'Mission Overview',
              type: "header"
            }}
            inline={true}
            titleOverride="Mission Overview"
          />
        )}
        <style>
          {`
            @keyframes progress-bar-stripes {
              from {
                background-position: 1rem 0;
              }
              to {
                background-position: 0 0;
              }
            }
          `}
        </style>
      </dc.Stack>
    );
  };

  // Show loading until folders are available
  if (!ready) {
    return (
      <dc.Stack>
        <dc.Text style={{ color: "var(--text-warning)", textAlign: "center" }}>
          Loading mission folders...
        </dc.Text>
      </dc.Stack>
    );
  }
  if (missionTemplateFolder && typeof missionTemplateFolder === "string" && missionTemplateFolder.length === 0) {
    return (
      <dc.Stack>
        <dc.Text style={{ color: "var(--text-error)", textAlign: "center" }}>
          No mission folders configured.
        </dc.Text>
      </dc.Stack>
    );
  }

  return (
    <dc.Stack style={{
      width: '100%',
      padding: '20px',
      gap: '32px'
    }}>
      <dc.Text style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: 'var(--text-normal)',
        textAlign: 'center'
      }}>
        Unavailable Missions
      </dc.Text>
      {isDetailView ? (
        <DetailView />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 10px'
        }}>
          {unavailableTemplates.map((template) => {
            const imagePath = template.$frontmatter?.image?.value?.path;
            const imageUrl = imagePath ? getImagePath(imagePath) : null;
            return (
              <div
                key={template.$path}
                onClick={() => handleTemplateSelectInternal(template)}
                style={{
                  background: 'var(--background-primary)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--background-modifier-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '180px'
                }}
              >
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  flexGrow: 1
                }}>
                  <dc.Text style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--text-normal)',
                    lineHeight: '1.3'
                  }}>
                    {template.$name}
                  </dc.Text>
                  <dc.Stack style={{ gap: '8px' }}>
                    <dc.Text style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      textAlign: 'center'
                    }}>
                      Unlock Progress
                    </dc.Text>
                    <RequirementProgressBar app={app} dc={dc} file={template} style={{ height: '8px', margin: 0 }} />
                  </dc.Stack>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </dc.Stack>
  );
}