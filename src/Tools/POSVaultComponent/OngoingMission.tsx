/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";
import { MissionProgressBar } from "./MissionProgressBar";
import { AvailableMissions } from "./AvailableMissions";
import { getPageExcludedFolderQuery } from "../DcUtils";

interface OngoingMissionProps {
  app: App;
  dc: any;
}

export const OngoingMission = ({ app, dc }: OngoingMissionProps) => {
  const pos = (app as any).plugins.plugins["personal-os"];
  // Always ensure these are arrays
  const workInProgressFoldersSafe = Array.isArray(pos?.graph?.officePages) ? pos.graph.officePages : [];
  const instrumentalFoldersSafe = Array.isArray(pos?.settings?.instrumentalFolders) ? pos.settings.instrumentalFolders : [];

  // Only add the path() filter if there are folders
  const missionFolderFilter = workInProgressFoldersSafe.length > 0
    ? `(${workInProgressFoldersSafe.map((f: string) => `path("${f}")`).join(" or ")}) and `
    : "";

  const folderQuery = getPageExcludedFolderQuery(workInProgressFoldersSafe);
  let missions: any[] = [];
  if (workInProgressFoldersSafe.length > 0) {
    missions = dc.useQuery(`
      @page${folderQuery ? " and " + folderQuery : ""}
      and $frontmatter.contains("class")
      and $frontmatter["class"].raw = "[[Mission]]"
      and !Archived
    `);
  }

  // Combine both folder arrays and filter out duplicates
  const allTemplateFolders = Array.from(new Set([
    ...workInProgressFoldersSafe,
    ...instrumentalFoldersSafe
  ]));

  // Only add the path() filter if there are folders
  const folderFilter = allTemplateFolders.length > 0
    ? `(${allTemplateFolders.map((f: string) => `path("${f}")`).join(" or ")}) and `
    : "";

  let missionTemplates: any[] = [];
  if (allTemplateFolders.length > 0) {
    missionTemplates = dc.useQuery(`
      @page and ${folderFilter}$frontmatter.contains("class")
      and $frontmatter["class"].raw = "[[Mission-Template]]"
    `);
  }

  const sortedMissions = [...missions].sort((a, b) => {
    const aDue = a.$frontmatter?.["due date"]?.value;
    const bDue = b.$frontmatter?.["due date"]?.value;
    if (aDue && bDue) return new Date(aDue).getTime() - new Date(bDue).getTime();
    if (aDue) return -1;
    if (bDue) return 1;
    return new Date(a.$created).getTime() - new Date(b.$created).getTime();
  });

  const ongoingMission = sortedMissions[0];

  return (
    <dc.Stack style={{ gap: "24px", padding: "20px" }}>
      {ongoingMission ? (
        <div
          style={{
            background: "var(--background-primary)",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid var(--background-modifier-border)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {(() => {
            const imagePath = ongoingMission.$frontmatter?.image?.value?.path;
            const difficulty = ongoingMission.$frontmatter?.difficulty?.value;
            const dueDate = ongoingMission.$frontmatter?.["due date"]?.value;
            const description = ongoingMission.$frontmatter?.description?.value;
            const formatDifficulty = (d: number) =>
              !d || isNaN(d) ? null : d > 5 ? "☠️" : "⭐".repeat(d);
            const getImagePath = (path: string) => {
              try {
                const file = app.vault.getFileByPath(path);
                return file ? app.vault.getResourcePath(file) : null;
              } catch {
                return null;
              }
            };
            const imageUrl = imagePath ? getImagePath(imagePath) : null;
            const difficultyStars = formatDifficulty(difficulty);
            return (
              <>
                {imageUrl && (
                  <div style={{ height: "200px", backgroundColor: "var(--background-secondary)" }}>
                    <img
                      src={imageUrl}
                      alt={ongoingMission.$name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-normal)" }}>
                    {ongoingMission.$name}
                  </div>
                  {description && (
                    <div style={{ fontSize: "16px", color: "var(--text-normal)" }}>
                      {description}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {difficultyStars && (
                      <span
                        style={{
                          fontSize: "16px",
                          color: "var(--text-muted)",
                          padding: "6px 12px",
                          background: "var(--background-secondary)",
                          borderRadius: "6px",
                        }}
                      >
                        {difficultyStars}
                      </span>
                    )}
                    {dueDate && (
                      <span
                        style={{
                          fontSize: "16px",
                          color: "var(--text-muted)",
                          padding: "6px 12px",
                          background: "var(--background-secondary)",
                          borderRadius: "6px",
                        }}
                      >
                        Due: {new Date(dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <MissionProgressBar missionFile={ongoingMission} app={app} dc={dc} />
                  {ongoingMission.$sections?.some((s: any) => s.$title?.toLowerCase() === "goal") && (
                    <dc.LinkEmbed
                      link={{ path: ongoingMission.$path, subpath: "Goal", type: "header" }}
                      inline={true}
                    />
                  )}
                  <dc.Button
                    onClick={() => app.workspace.openLinkText(ongoingMission.$path, "", false)}
                    style={{
                      width: "100%",
                      padding: "12px 24px",
                      background: "var(--interactive-accent)",
                      color: "var(--text-on-accent)",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    Continue Mission
                  </dc.Button>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <AvailableMissions app={app} dc={dc} />
      )}
    </dc.Stack>
  );
};
