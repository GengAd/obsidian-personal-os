/** @jsxImportSource preact */
import { Fragment } from 'preact';
import { getPageFolderQuery } from "../DcUtils";

interface BuffAndDebuffBarProps {
  app: any;
  dc: any;
}

export const BuffBar = ({ app, dc }: BuffAndDebuffBarProps) => {
  let buffDir = "";
  try {
    const pos = app?.plugins?.plugins?.["personal-os"];
    buffDir = pos?.settings?.buffFolder || "";
  } catch {}
  let buffFiles: any[] = [];
  if (buffDir) {
    const folderQuery = getPageFolderQuery([buffDir]);
    buffFiles = dc.useQuery(`@page and ${folderQuery}`);
  } else {
    buffFiles = dc.useQuery(`@page and false`);
  }

  const [buffModules, setBuffModules] = dc.useState({});

  dc.useEffect(() => {
    let cancelled = false;
    async function loadModules() {
      const modules: Record<string, any> = {};
      for (const file of buffFiles || []) {
        try {
          const module = await dc.require(dc.headerLink(file.$path, "Buff"));
          modules[file.$path] = module?.Buff;
        } catch (err) {
          console.error(`[BuffBar] Error in dc.require for ${file.$path}:`, err);
        }
      }
      if (!cancelled) setBuffModules(modules);
    }
    loadModules();
    return () => { cancelled = true; };
  }, [buffFiles, dc]);

  const renderedBuffs = Array.isArray(buffFiles) && buffFiles.length > 0
    ? buffFiles.map((file: any) => {
        const BuffComponent = buffModules[file.$path];
        if (typeof BuffComponent !== "function") return null;
        const buffFile = dc.useFile(file.$path);
        return <BuffComponent key={file.$path} buffFile={buffFile} />;
      }).filter(Boolean)
    : [];

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        display: "flex",
        gap: "1.5rem",
        fontSize: "2.2rem",
        background: "var(--background-secondary)",
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
        width: "100%"
      }}>
        {renderedBuffs.length > 0 ? (
          renderedBuffs
        ) : (
          <dc.Text>No buffs found</dc.Text>
        )}
      </div>
    </div>
  );
};

export const DebuffBar = ({ app, dc }: BuffAndDebuffBarProps) => {
  let debuffDir = "";
  try {
    const pos = app?.plugins?.plugins?.["personal-os"];
    debuffDir = pos?.settings?.debuffFolder || "";
  } catch {}
  let debuffFiles: any[] = [];
  if (debuffDir) {
    const folderQuery = getPageFolderQuery([debuffDir]);
    debuffFiles = dc.useQuery(`@page and ${folderQuery}`);
  } else {
    debuffFiles = dc.useQuery(`@page and false`);
  }

  const [debuffModules, setDebuffModules] = dc.useState({});

  dc.useEffect(() => {
    let cancelled = false;
    async function loadModules() {
      const modules: Record<string, any> = {};
      for (const file of debuffFiles || []) {
        try {
          const module = await dc.require(dc.headerLink(file.$path, "Debuff"));
          modules[file.$path] = module?.Debuff;
        } catch (err) {
          console.error(`[DebuffBar] Error in dc.require for ${file.$path}:`, err);
        }
      }
      if (!cancelled) setDebuffModules(modules);
    }
    loadModules();
    return () => { cancelled = true; };
  }, [debuffFiles, dc]);

  const renderedDebuffs = Array.isArray(debuffFiles) && debuffFiles.length > 0
    ? debuffFiles.map((file: any) => {
        const DebuffComponent = debuffModules[file.$path];
        if (typeof DebuffComponent !== "function") return null;
        const debuffFile = dc.useFile(file.$path);
        return <DebuffComponent key={file.$path} debuffFile={debuffFile} />;
      }).filter(Boolean)
    : [];

  return (
    <div style={{ width: "100%" }}>
      <div style={{
        display: "flex",
        gap: "1.5rem",
        fontSize: "2.2rem",
        background: "var(--background-secondary)",
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
        width: "100%"
      }}>
        {renderedDebuffs.length > 0 ? (
          renderedDebuffs
        ) : (
          <dc.Text>No debuffs found</dc.Text>
        )}
      </div>
    </div>
  );
};