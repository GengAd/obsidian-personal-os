import { App, TFile } from "obsidian";

function getSectionTitle(listItem: any): string | undefined {
  let current = listItem;
  while (current && current.$typename !== "Section") {
    current = current.$parent;
  }
  if (typeof current?.$title === "string") {
    return current.$title.replace(/#.*/g, "").trim();
  }
  return current?.$title;
}

export async function processRewards(app: App, currentFile: any, listItems: any[]) {
  try {
    // Robust current file resolution
    let fileToUse = currentFile;
    if (!fileToUse) {
      const activeFile = app.workspace.getActiveFile();
      if (activeFile) {
        // Try to get the Datacore file object for the active file
        if (typeof window !== 'undefined' && (window as any).dc) {
          const dc = (window as any).dc;
          fileToUse = dc.query?.(`@file and $path=\"${activeFile.path}\"`)[0] || null;
        }
      }
    }
    if (!fileToUse) {
      console.error("No active file found");
      return;
    }

    const rewardListItems = listItems.filter((item) => getSectionTitle(item) === "Rewards");
    if (rewardListItems.length === 0) {
      console.log("No rewards found to process");
      return;
    }

    for (const listItem of rewardListItems) {
      try {
        const link = listItem.$links?.[0];
        if (!link || !link.path) continue;

        const targetFile = app.vault.getAbstractFileByPath(link.path);
        if (!targetFile || !("path" in targetFile)) continue;

        const listLevel = listItem.$infields?.level?.value;

        if (listLevel !== undefined) {
          await app.fileManager.processFrontMatter(targetFile as TFile, (frontmatter) => {
            const currentLevel = frontmatter["Level"] || 0;
            if (listLevel > currentLevel) {
              frontmatter["Level"] = listLevel;
              console.log(`✨ Updated ${link.path} to Level ${listLevel}`);
            }
          });
        } else {
          await app.fileManager.processFrontMatter(targetFile as TFile, (frontmatter) => {
            if (!frontmatter["Completed On"]) {
              frontmatter["Completed On"] = new Date().toISOString().slice(0, 10);
              console.log(`✅ Marked ${link.path} as completed`);
            }
          });
        }

        const content = await app.vault.read(fileToUse);
        const lines = content.split("\n");
        const lineNumber = listItem.$line + 1;

        if (
          lineNumber > 0 &&
          lineNumber <= lines.length &&
          !lines[lineNumber - 1].includes("✔️")
        ) {
          lines[lineNumber - 1] += " ✔️";
          await app.vault.modify(fileToUse, lines.join("\n"));
        }
      } catch (error: any) {
        console.error(`Failed to process reward:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("Failed to process rewards:", error.message);
  }
}
