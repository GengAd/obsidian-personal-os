/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";

interface MissionProgressBarProps {
  missionFile?: any;
  app: App;
  dc: any; 
}

export const MissionProgressBar = ({ missionFile: providedMissionFile, app, dc }: MissionProgressBarProps) => {
  
  const currentFile = dc.useCurrentFile();
  const missionFile = providedMissionFile || currentFile;
  const [hasRebuilt, setHasRebuilt] = dc.useState(false);

  dc.useEffect(() => {
    if (missionFile || hasRebuilt || providedMissionFile) return;
    if (app.workspace.activeLeaf && typeof (app.workspace.activeLeaf as any).rebuildView === 'function') {
      (app.workspace.activeLeaf as any).rebuildView();
      setHasRebuilt(true);
    }
  }, [missionFile, hasRebuilt, providedMissionFile]);

  if (!missionFile?.$path) return null;

  const getSectionTitle = (listItem: any): string | undefined => {
    let current = listItem;
    while (current && current.$typename !== "Section") {
      current = current.$parent;
    }
    // Normalize the title: remove tags (e.g., #Hide), trim whitespace
    if (typeof current?.$title === "string") {
      // Remove tags (e.g., #Hide) and trim
      return current.$title.replace(/#.*/g, "").trim();
    }
    return current?.$title;
  };

  let listItems: any[] = [];
  try {
    listItems = dc.useQuery(`@list-item and $file="${missionFile.$path}"`);
  } catch (error) {
    console.warn("Error querying list items:", error);
    return null;
  }

  const outlineItems = listItems.filter((item: any) => getSectionTitle(item) === "Outline");

  let allFilesWithTemplate: any[] = [];
  try {
    allFilesWithTemplate = dc.useQuery(`
      @page and $frontmatter.contains("from template")
      and $frontmatter["from template"].value
      and $frontmatter.contains("supports")
      and $frontmatter.supports.value
    `);
  } catch (error) {
    console.warn("Error querying files with template:", error);
    return null;
  }

  const isTemplateGenerated = (templatePath: string, supportsPath: string) => {
    return allFilesWithTemplate.find((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      const supports = file.$frontmatter?.supports?.value;
      if (!fromTemplate?.path || fromTemplate.path !== templatePath) return false;
      if (!Array.isArray(supports)) return false;
      return supports.some((s: any) => s?.path === supportsPath);
    });
  };

  const calculateProgress = (items: any[], parentPath: string | null = null) => {
    let totalTemplates = 1;
    let completedTemplates = 0;

    if (missionFile.$frontmatter?.archived?.value === true) {
      completedTemplates += 1;
    }

    const processItem = (item: any, currentParentPath: string | null) => {
      const link = item.$links?.[0];
      if (!link) return;

      const templatePath = link.path;
      const generatedFile = isTemplateGenerated(templatePath, currentParentPath || missionFile.$path);

      if (generatedFile) {
        const genItems = dc.useQuery(`@list-item and $file="${generatedFile.$path}"`);
        const genOutlineItems = genItems.filter((i: any) => getSectionTitle(i) === "Outline");
        totalTemplates += 1;
        if (generatedFile.$frontmatter?.archived?.value === true) completedTemplates += 1;
        genOutlineItems.forEach((i: any) => processItem(i, generatedFile.$path));
      } else {
        totalTemplates += 1;
        const tempItems = dc.useQuery(`@list-item and $file="${templatePath}"`);
        const tempOutlineItems = tempItems.filter((i: any) => getSectionTitle(i) === "Outline");
        tempOutlineItems.forEach((i: any) => processItem(i, currentParentPath));
      }
    };

    items.forEach((i: any) => processItem(i, parentPath));
    return { totalTemplates, completedTemplates };
  };

  const { totalTemplates, completedTemplates } = calculateProgress(outlineItems);
  const progressPercentage = totalTemplates > 0 ? Math.round((completedTemplates / totalTemplates) * 100) : 0;

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#ff4d4d";
    if (percentage < 70) return "#ffcc00";
    return "#4caf50";
  };

  return (
    <dc.Stack style={{ gap: "16px" }}>
      <div
        style={{
          width: "100%",
          backgroundColor: "var(--background-secondary)",
          borderRadius: "8px",
          overflow: "hidden",
          height: "20px",
          margin: "10px 0",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercentage}%`,
            backgroundColor: getProgressColor(progressPercentage),
            transition: "width 0.3s ease, background-color 0.3s ease",
            borderRadius: "8px",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              background: "linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)",
              opacity: 0.5,
              animation: "progress-bar-stripes 1s linear infinite",
            }}
          />
        </div>
        <span
          style={{
            position: "absolute",
            color: "white",
            fontWeight: "bold",
            zIndex: 1,
          }}
        >
          {progressPercentage}%
        </span>
      </div>
      <style>
        {`
          @keyframes progress-bar-stripes {
            from { background-position: 1rem 0; }
            to { background-position: 0 0; }
          }
        `}
      </style>
    </dc.Stack>
  );
};
