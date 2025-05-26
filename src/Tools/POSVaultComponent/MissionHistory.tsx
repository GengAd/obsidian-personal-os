/** @jsxImportSource preact */
import { h } from "preact";
import { RequirementProgressBar } from "./RequirementProgressBar";
import { getRequirementProgress } from "../DcUtils";

interface CompletedMissionListProps {
  app: any;
  dc: any;
}

// Helper to extract and format the completion date
function getCompletedOnValue(mission: any): string | null {
  return mission?.$frontmatter?.["completed on"]?.value || null;
}
function getCompletedOnRaw(mission: any): string | null {
  return mission?.$frontmatter?.["completed on"]?.raw || null;
}

export const CompletedMissionList = ({ app, dc }: CompletedMissionListProps) => {
  // Query all pages with class [[Mission]], archived, and a non-empty Completed On date
  const missions = dc.useQuery(`
    @page
    and $frontmatter.contains("class")
    and $frontmatter["class"].raw = "[[Mission]]"
    and $frontmatter.contains("archived")
    and $frontmatter.archived.value = true
    and $frontmatter.contains("completed on")
    and $frontmatter["completed on"].value != null
    and $frontmatter["completed on"].value != ""
  `);

  // Filter and sort by completion date descending (use value for sorting)
  const completedMissions = missions
    .map((m: any) => ({
      ...m,
      completedOnValue: getCompletedOnValue(m),
      completedOnRaw: getCompletedOnRaw(m),
    }))
    .filter((m: any) => m.completedOnValue)
    .sort((a: any, b: any) => (b.completedOnValue || "").localeCompare(a.completedOnValue || ""));

  if (!completedMissions.length) {
    return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No completed missions found.</dc.Text>;
  }

  return (
    <dc.Stack style={{ gap: '16px' }}>
      {completedMissions.map((mission: any) => (
        <div
          key={mission.$path}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
          onClick={() => app.workspace.openLinkText(mission.$path, '', false)}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-success)', fontSize: '1.1em', marginRight: 8 }}>
            ✅ {mission.completedOnRaw || mission.completedOnValue}
          </span>
          <a
            href={mission.$path}
            className="internal-link data-link-icon data-link-icon-after data-link-text"
            data-href={mission.$path}
            data-type="file"
            data-link-path={mission.$path}
            style={{
              // @ts-ignore
              '--data-link-path': mission.$path
            } as any}
            onClick={e => { e.stopPropagation(); app.workspace.openLinkText(mission.$path, '', false); }}
          >
            {mission.$name || mission.$path?.split('/').pop()?.replace(/\.md$/, '') || mission.$path}
          </a>
        </div>
      ))}
    </dc.Stack>
  );
};

interface CompletedMissionTemplateListProps {
  app: any;
  dc: any;
}

export const CompletedMissionTemplateList = ({ app, dc }: CompletedMissionTemplateListProps) => {
  // Get mission template folder from plugin settings
  const pos = (app as any).plugins.plugins["personal-os"];
  const missionTemplateFolder = pos?.settings?.missionTemplateFolder;

  // Query all mission templates
  let missionTemplates: any[] = [];
  if (missionTemplateFolder && typeof missionTemplateFolder === "string" && missionTemplateFolder.length > 0) {
    missionTemplates = dc.useQuery(`
      @page and path("${missionTemplateFolder}")
      and $frontmatter.contains("class")
      and $frontmatter["class"].raw = "[[Mission-Template]]"
    `);
  }

  // Query all activities (pages) with a from template property
  const allActivitiesWithTemplate = dc.useQuery(`
    @page and $frontmatter.contains("from template") and $frontmatter["from template"].value
  `);

  // Helper: is template completed?
  function isTemplateCompleted(template: any): boolean {
    // 1. If Completed On frontmatter exists and is non-empty
    const completedOn = template?.$frontmatter?.["completed on"]?.value;
    if (completedOn && completedOn !== "") return true;
    // 2. If any activity (not the template itself) references this template and is archived
    const referenced = allActivitiesWithTemplate.find((file: any) => {
      const fromTemplate = file.$frontmatter?.["from template"]?.value;
      return (
        fromTemplate?.path === template.$path &&
        file.$path !== template.$path &&
        file.$frontmatter?.archived?.value === true
      );
    });
    if (referenced) return true;
    return false;
  }

  // Filter completed templates
  const completedTemplates = (missionTemplates || []).filter(isTemplateCompleted);

  // Launch again handler (copied from AvailableMissions.tsx)
  const handleLaunchTemplate = async (template: any) => {
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
    } catch (err) {
      // Optionally show error to user
    }
  };

  if (!completedTemplates.length) {
    return <dc.Text style={{ textAlign: 'center', color: 'var(--text-warning)' }}>No completed mission templates found.</dc.Text>;
  }

  return (
    <dc.Stack style={{ gap: '16px' }}>
      {completedTemplates.map((template: any) => (
        <div
          key={template.$path}
          style={{
            background: 'var(--background-primary)',
            borderRadius: '10px',
            border: '1px solid var(--background-modifier-border)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-success)', fontSize: '1.1em', marginRight: 8 }}>
            {template.$name || template.$path?.split('/').pop()?.replace(/\.md$/, '') || template.$path}
          </span>
          <dc.Button
            onClick={() => handleLaunchTemplate(template)}
            style={{
              background: 'var(--interactive-accent)',
              color: 'var(--text-on-accent)',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '15px',
              boxShadow: 'none',
              padding: '8px 16px',
              cursor: 'pointer',
              minWidth: '120px',
            }}
          >
            Launch again
          </dc.Button>
        </div>
      ))}
    </dc.Stack>
  );
};
