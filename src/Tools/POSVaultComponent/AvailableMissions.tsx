/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";
import { getRequirementItems, verifyRequirement } from "../DcUtils";
import { RequirementProgressBar } from "./RequirementProgressBar";

interface AvailableMissionsProps {
  app: App;
  dc: any;
  handleTemplateSelect?: (template: any) => void;
}

export const AvailableMissions = ({ app, dc, handleTemplateSelect }: AvailableMissionsProps) => {
  const [selectedTemplate, setSelectedTemplate] = dc.useState(null);
  const [isDetailView, setIsDetailView] = dc.useState(false);
  const [ready, setReady] = dc.useState(false);

  const handleTemplateSelectInternal = (template: any) => {
    setSelectedTemplate(template);
    setIsDetailView(true);
    handleTemplateSelect?.(template);
  };

  const handleBackToGrid = () => setIsDetailView(false);

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

  // Always ensure both folder lists are arrays
  const pos = (app as any).plugins.plugins["personal-os"];
  const missionTemplateFolder = pos?.settings?.missionTemplateFolder;
  const workInProgressFoldersSafe = Array.isArray(pos?.graph?.officePages) ? pos.graph.officePages : [];
  const instrumentalFoldersSafe = Array.isArray(pos?.settings?.instrumentalFolders) ? pos.settings.instrumentalFolders : [];

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

  // Compute all unique linked file paths in a stable order using dc.useMemo
  const allLinkedPaths = dc.useMemo(() => {
    const paths: string[] = [];
    requirementItemsByTemplate.forEach(({ items }) => {
      items.forEach((item: any) => {
        const link = item.$links?.[0];
        if (link && !paths.includes(link.path)) {
          paths.push(link.path);
        }
      });
    });
    return paths;
  }, [requirementItemsByTemplate]);

  // Call dc.useFile for each unique path at the top level, in a stable order
  const allLinkedFiles = [] as any[];
  for (let i = 0; i < allLinkedPaths.length; i++) {
    allLinkedFiles.push(dc.useFile(allLinkedPaths[i]));
  }

  // Build a map from path to file
  const linkedFileMap: Record<string, any> = {};
  allLinkedPaths.forEach((path: string, idx: number) => {
    linkedFileMap[path] = allLinkedFiles[idx];
  });

  // Pure function for requirement check
  function verifyRequirementPure(item: any, linkedPage: any, allFilesWithTemplate: any[]) {
    if (!linkedPage) return false;
    if (item.$infields?.level?.value != null) {
      const required = item.$infields?.level?.value ?? 0;
      const actual = linkedPage.$frontmatter?.level?.value ?? 0;
      return actual >= required;
    }
    const classRaw = linkedPage.$frontmatter?.class?.raw || "";
    if (typeof classRaw === "string" && classRaw.includes("-Template")) {
      return allFilesWithTemplate.some((file: any) => {
        const fromTemplate = file.$frontmatter?.["from template"]?.value;
        return fromTemplate?.path === linkedPage.$path && file.$path !== linkedPage.$path && file.$frontmatter?.archived?.value === true;
      });
    }
    if (linkedPage.$frontmatter?.archived?.value === true) return true;
    if (linkedPage.$frontmatter?.["completed on"]?.value != null) return true;
    return false;
  }

  // Helper to check if a mission template is completed (archived file exists from this template)
  function isMissionTemplateCompletedPure(template: any, allFilesWithTemplate: any[]) {
    return allFilesWithTemplate.some((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      return fromTemplate?.path === template.$path && file.$path !== template.$path && file.$frontmatter?.archived?.value === true;
    });
  }

  // Only show templates that are available and not completed
  const availableTemplates = requirementItemsByTemplate
    .filter(({ template, items }) => {
      // Exclude if the template has a completed on value
      if (template?.$frontmatter?.["completed on"]?.value != null) return false;
      // Available if all requirements are met or there are no requirements
      return items.length === 0 || items.every((item: any) => {
        const link = item.$links?.[0];
        const linkedPage = link ? linkedFileMap[link.path] : null;
        return verifyRequirementPure(item, linkedPage, allFilesWithTemplate);
      });
    })
    .filter(({ template }) => !isMissionTemplateCompletedPure(template, allFilesWithTemplate))
    .map(({ template }) => template);

  const formatDifficulty = (difficulty: number) =>
    !difficulty || isNaN(difficulty) ? "Unknown" : difficulty > 5 ? "☠️" : "⭐".repeat(difficulty);

  const getImagePath = (path: string) => {
    if (!path || typeof path !== "string") return null;
    try {
      const file = app.vault.getFileByPath(path);
      return file ? app.vault.getResourcePath(file) : null;
    } catch {
      return null;
    }
  };

  // Unified requirement check using shared utility
  const checkTemplateAvailability = (template: any): boolean => {
    const items = getRequirementItems(dc, template);
    return items.length === 0 || items.every((item: any) => verifyRequirement(dc, item));
  };

  // Helper to check if a mission template is completed (archived file exists from this template)
  const isMissionTemplateCompleted = (template: any) => {
    return allFilesWithTemplate.some((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      // Ensure the generated file is not the template file itself
      return fromTemplate?.path === template.$path && file.$path !== template.$path && file.$frontmatter?.archived?.value === true;
    });
  };

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

  const DetailView = () => {
    const template = selectedTemplate;
    if (!template) return null;

    const imagePath = template.$frontmatter?.image?.value?.path;
    const imageUrl = imagePath ? getImagePath(imagePath) : null;

    const handleLaunchTemplate = async () => {
      try {
        const templateName = template.$path.split("/").pop().replace(".md", "");
        const templater = (app as any).plugins.plugins["templater-obsidian"];
        if (!templater) throw new Error("Templater not found");

        const tp = templater.templater.current_functions_object;
        const templateFile = tp.file.find_tfile(template.$path);
        if (!templateFile) throw new Error("Template file not found");

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const missionDestinationFolder = pos?.settings?.missionDestinationFolder;
        let newFileName = `${templateName}-${timestamp}`;
        let destinationFolder = undefined;
        if (missionDestinationFolder && typeof missionDestinationFolder === "string" && missionDestinationFolder.length > 0) {
          // Remove trailing slash if present
          const folderPath = missionDestinationFolder.replace(/\/$/, "");
          destinationFolder = app.vault.getAbstractFileByPath(folderPath);
        }
        await tp.file.create_new(templateFile, newFileName, true, destinationFolder);

        setSelectedTemplate(null);
        setIsDetailView(false);
      } catch (err) {
        console.error("Failed to launch template:", err);
      }
    };

    // Add skip mission logic
    const [isSkipping, setIsSkipping] = dc.useState(false);
    const handleSkipMission = async () => {
      setIsSkipping(true);
      try {
        const file = app.vault.getFileByPath(template.$path);
        if (!file) throw new Error("Template file not found");
        const today = new Date().toISOString().slice(0, 10);
        await app.fileManager.processFrontMatter(file, (frontmatter: any) => {
          frontmatter["Completed On"] = today;
        });
        setSelectedTemplate(null);
        setIsDetailView(false);
      } catch (err) {
        console.error("Failed to skip mission:", err);
      } finally {
        setIsSkipping(false);
      }
    };

    return (
      <dc.Stack style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
        background: 'var(--background-primary)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        gap: '24px',
        paddingLeft: 0, paddingRight: 0
      }}>
        <dc.Group style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          width: '100%',
          paddingLeft: 0,
          paddingRight: 0,
          marginLeft: 0,
          marginRight: 0
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
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'var(--text-normal)',
            flexGrow: 1,
            textAlign: 'right'
          }}>
            {selectedTemplate?.$name}
          </div>
        </dc.Group>

        {imageUrl && (
          <div style={{
            width: '100%',
            height: '180px',
            borderRadius: '8px',
            overflow: 'hidden',
            //backgroundColor: 'var(--background-secondary)',
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
          <div style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            //background: 'var(--background-secondary)',
            padding: '6px 12px',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            Difficulty: {formatDifficulty(selectedTemplate?.$frontmatter?.difficulty?.value)}
          </div>
        </dc.Group>

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

        <div style={{ marginTop: '24px' }} />

        <dc.Button
          onClick={handleLaunchTemplate}
          style={{
            width: '100%',
            padding: '12px 0',
            background: 'var(--interactive-accent)',
            color: 'var(--text-on-accent)',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginLeft: 0
          }}
        >
          Launch Mission
        </dc.Button>
        {/* Skip this mission button */}
        <dc.Button
          onClick={handleSkipMission}
          disabled={isSkipping}
          style={{
            width: '100%',
            padding: '12px 0',
            background: 'var(--background-modifier-error)',
            color: 'var(--text-on-accent)',
            borderRadius: '8px',
            border: 'none',
            cursor: isSkipping ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginLeft: 0,
            marginTop: '12px',
            opacity: isSkipping ? 0.7 : 1
          }}
        >
          {isSkipping ? 'Skipping...' : 'Skip this mission'}
        </dc.Button>
      </dc.Stack>
    );
  };

  // Show loading until folders are available
  if (!ready) {
    return (
      <dc.Stack>
        <div style={{ color: "var(--text-warning)", textAlign: "center" }}>
          Loading mission folders...
        </div>
      </dc.Stack>
    );
  }

  return (
    <dc.Stack style={{
      width: '100%',
      padding: '20px',
      gap: '32px'
    }}>
      {!isDetailView && (
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'var(--text-normal)',
          textAlign: 'center'
        }}>
          Available Missions
        </div>
      )}

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
          <style>
            {`
              .mission-card {
                background: var(--background-primary);
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                border: 1px solid var(--background-modifier-border);
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 280px;
              }
        
            `}
          </style>
          {availableTemplates.map((template) => {
            const imagePath = template.$frontmatter?.image?.value?.path;
            const difficulty = template.$frontmatter?.difficulty?.value;
            const imageUrl = imagePath ? getImagePath(imagePath) : null;

            // Tagline extraction logic
            let tagline = null;
            try {
              const allListItems = dc.useQuery(`@list-item and $file="${template.$path}"`);
              const taglineItems = allListItems.filter((li: any) => getSectionTitle(li)?.toLowerCase() === "tagline");
              if (taglineItems.length > 0) {
                tagline = taglineItems[0]?.$text?.replace(/#[^\s]+/g, '').trim() || null;
              }
            } catch {}

            return (
              <div
                key={template.$path}
                className="mission-card"
                onClick={() => handleTemplateSelectInternal(template)}
              >
                <div style={{
                  width: '100%',
                  height: '160px',
                  position: 'relative',
                  //backgroundColor: 'var(--background-secondary)'
                }}>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={template.$name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </div>

                <div style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flexGrow: 1
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--text-normal)',
                    lineHeight: '1.3'
                  }}>
                    {template.$name}
                  </div>
                  {tagline && (
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginTop: '-4px',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontStyle: 'italic',
                    }}>
                      {tagline}
                    </div>
                  )}
                  <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-muted)',
                      padding: '4px 8px',
                      //background: 'var(--background-secondary)',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {formatDifficulty(difficulty)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </dc.Stack>
  );
};
