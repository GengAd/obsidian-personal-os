/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";
import { processRewards } from "./RewardCurrentFile";

interface CompleteActivityProps {
  app: App;
  dc: any;
  markdownText?: string;
  archivedMarkdownText?: string;
}

export const CompleteActivity = ({
  app,
  dc,
  markdownText = "Congratulations on completing this activity!",
  archivedMarkdownText = "You have earned:\n• Experience Points: +100\n• Achievement: \"Task Master\"",
}: CompleteActivityProps) => {
  const [showCompletionCard, setShowCompletionCard] = dc.useState(false);
  const currentFile = dc.useCurrentFile();
  const [hasRebuilt, setHasRebuilt] = dc.useState(false);

  // If currentFile is missing and we haven't rebuilt yet, just rebuild the view once
  dc.useEffect(() => {
    if (currentFile || hasRebuilt) return;
    if (app.workspace.activeLeaf && typeof (app.workspace.activeLeaf as any).rebuildView === 'function') {
      (app.workspace.activeLeaf as any).rebuildView();
      setHasRebuilt(true);
    }
  }, [currentFile, hasRebuilt]);

  const file = currentFile;

  if (!file) {
    return (
      <dc.Stack>
        <dc.Text style={{ color: 'var(--text-warning)', textAlign: 'center' }}>
          Waiting for file context...
        </dc.Text>
      </dc.Stack>
    );
  }

  const listItems = file ? dc.useQuery(`@list-item and $file="${file.$path}"`) : [];

  const isArchived =
    file.$frontmatter?.archived?.value === true ||
    file.$frontmatter?.Archived?.value === true;

  const handleArchive = async () => {
    try {
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        console.error("No active file found");
        return;
      }

      await processRewards(app, file, listItems);

      await app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
        frontmatter["Archived"] = true;
      });
    } catch (error: any) {
      console.error("Failed to complete activity:", error.message);
    }
  };

  if (isArchived) {
    // Find rewards section and images
    const getSectionTitle = (listItem: any): string | undefined => {
      let current = listItem;
      while (current && current.$typename !== "Section") {
        current = current.$parent;
      }
      if (typeof current?.$title === "string") {
        return current.$title.replace(/#.*/g, "").trim();
      }
      return current?.$title;
    };
    const rewardListItems = listItems.filter((item: any) => getSectionTitle(item) === "Rewards");
    // Find reward images and level up
    let hasLevelUp = false;
    const rewardCards: { image: string | undefined, title: string, file: any }[] = [];
    for (const item of rewardListItems) {
      const link = item.$links?.[0];
      if (!link) continue;
      const file = dc.useFile(link.path);
      if (!file) continue;
      // If this reward has a level, only set hasLevelUp, do not add a card for it
      if (item.$infields?.level?.value != null) {
        hasLevelUp = true;
        continue;
      }
      const imagePath = file.$frontmatter?.image?.value?.path;
      rewardCards.push({ image: imagePath, title: file.$name, file });
    }
    // Helper to get image URL
    const getImageUrl = (path: string): string | undefined => {
      if (!path || typeof path !== "string") return undefined;
      try {
        const file = app.vault.getFileByPath(path);
        return file ? app.vault.getResourcePath(file) : undefined;
      } catch {
        return undefined;
      }
    };
    // Level up image asset from config folder's Images directory
    const pos = (app as any).plugins.plugins["personal-os"];
    const imagesFolder = pos.settings.configFolder + "/Images";
    // Try to resolve Level-Up image with common extensions
    const getLevelUpImage = () => {
      const base = imagesFolder + "/Level-Up";
      const exts = [".png", ".jpg", ".jpeg", ".webp"]; // Add more if needed
      for (const ext of exts) {
        const url = getImageUrl(base + ext);
        if (url) return url;
      }
      return undefined;
    };
    const levelUpImage = getLevelUpImage();
    return (
      <dc.Stack style={{ gap: "16px", padding: "16px", backgroundColor: "var(--background-secondary)", borderRadius: "8px" }}>
        <dc.Markdown content={archivedMarkdownText} />
        <div style={{ height: '24px' }} />
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {hasLevelUp && (
            <div style={{
              background: 'var(--background-primary)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              border: '1.5px solid var(--background-modifier-border)',
              padding: '8px',
              width: '240px',
              minHeight: '250px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'default',
              transition: 'box-shadow 0.2s',
            }}>
              {levelUpImage ? (
                <img src={levelUpImage} alt="Skill lvl Up!" style={{ width: '90%', height: '170px', objectFit: 'contain', marginBottom: '16px', marginTop: '8px', pointerEvents: 'none' }} draggable={false} tabIndex={-1} />
              ) : (
                <div style={{ width: '90%', height: '170px', marginBottom: '16px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-secondary)', borderRadius: '8px', fontSize: '60px', color: 'var(--text-faint)' }}>🏆</div>
              )}
              <span style={{ fontWeight: 'bold', color: 'var(--text-normal)', fontSize: '18px', textAlign: 'center' }}>Skill lvl Up!</span>
            </div>
          )}
          {rewardCards.map(({ image, title, file }) => (
            <div
              key={title}
              style={{
                background: 'var(--background-primary)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                border: '1.5px solid var(--background-modifier-border)',
                padding: '8px',
                width: '240px',
                minHeight: '250px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onClick={() => app.workspace.openLinkText(file.$path, '', false)}
            >
              {image && getImageUrl(image) ? (
                <img src={getImageUrl(image)} alt={title} style={{ width: '90%', height: '170px', objectFit: 'contain', marginBottom: '16px', marginTop: '8px', pointerEvents: 'none' }} draggable={false} tabIndex={-1} />
              ) : (
                levelUpImage ? (
                  <img src={levelUpImage} alt="Reward" style={{ width: '90%', height: '170px', objectFit: 'contain', marginBottom: '16px', marginTop: '8px', pointerEvents: 'none' }} draggable={false} tabIndex={-1} />
                ) : (
                  <div style={{ width: '90%', height: '170px', marginBottom: '16px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-secondary)', borderRadius: '8px', fontSize: '60px', color: 'var(--text-faint)' }}>🖼️</div>
                )
              )}
              <span style={{ fontWeight: 'bold', color: 'var(--text-normal)', fontSize: '18px', textAlign: 'center' }}>{title}</span>
            </div>
          ))}
        </div>
      </dc.Stack>
    );
  }

  return (
    <dc.Stack style={{ gap: "16px" }}>
      {!showCompletionCard ? (
        <dc.Button
          onClick={() => setShowCompletionCard(true)}
          style={{
            backgroundColor: "var(--interactive-accent)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            border: "none",
            fontWeight: "bold",
          }}
        >
          Finish this activity
        </dc.Button>
      ) : (
        <dc.Stack style={{ gap: "16px", padding: "16px", backgroundColor: "var(--background-secondary)", borderRadius: "8px" }}>
          <dc.Stack style={{ gap: "8px" }}>
            <dc.Markdown content={markdownText} />
          </dc.Stack>
          <dc.Button
            onClick={handleArchive}
            style={{
              backgroundColor: "var(--interactive-accent)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              border: "none",
              fontWeight: "bold",
            }}
          >
            Obtain Rewards
          </dc.Button>
        </dc.Stack>
      )}
    </dc.Stack>
  );
};
