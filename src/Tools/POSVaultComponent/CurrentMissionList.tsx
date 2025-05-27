/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";
import { MissionProgressBar } from "./MissionProgressBar";
import { getPageExcludedFolderQuery } from "../DcUtils";

interface CurrentMissionListProps {
  app: App;
  dc: any;
}

export const CurrentMissionList = ({ app, dc }: CurrentMissionListProps) => {
  const workInProgressFolders = (app as any).plugins.plugins["personal-os"].graph.officePages;

  const folderQuery = getPageExcludedFolderQuery(workInProgressFolders);
  const missions = dc.useQuery(`
    @page${folderQuery ? " and " + folderQuery : ""}
    and $frontmatter.contains("class")
    and $frontmatter["class"].raw = "[[Mission]]"
  `);

  const formatDifficulty = (difficulty: number) => {
    if (!difficulty || isNaN(difficulty)) return null;
    return difficulty > 5 ? "☠️" : "⭐".repeat(difficulty);
  };

  const getImagePath = (path: string) => {
    if (!path || typeof path !== "string") return null;
    try {
      const file = app.vault.getFileByPath(path);
      return file ? app.vault.getResourcePath(file) : null;
    } catch {
      return null;
    }
  };

  return (
    <dc.Stack style={{ width: "100%", padding: "20px", gap: "32px" }}>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "var(--text-normal)",
          textAlign: "center",
        }}
      >
        Current Missions
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 10px",
        }}
      >
        {missions.map((mission: any) => {
          const imagePath = mission.$frontmatter?.image?.value?.path;
          const difficulty = mission.$frontmatter?.difficulty?.value;
          const imageUrl = imagePath ? getImagePath(imagePath) : null;
          const difficultyStars = formatDifficulty(difficulty);

          return (
            <div
              key={mission.$path}
              style={{
                background: "var(--background-primary)",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "1px solid var(--background-modifier-border)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: "280px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "160px",
                  position: "relative",
                  backgroundColor: "var(--background-secondary)",
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={mission.$name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  flexGrow: 1,
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "var(--text-normal)",
                    lineHeight: "1.3",
                  }}
                >
                  {mission.$name}
                </div>

                <MissionProgressBar app={app} dc={dc} missionFile={mission} />

                {difficultyStars && (
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--text-muted)",
                        padding: "4px 8px",
                        background: "var(--background-secondary)",
                        borderRadius: "4px",
                      }}
                    >
                      {difficultyStars}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </dc.Stack>
  );
};
