/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";

interface OpenCurrentButtonProps {
  app: App;
  dc: any;
  buttonText?: string;
}

export const OpenCurrentButton = ({ app, dc, buttonText = "Open Current File" }: OpenCurrentButtonProps) => {
  const [currentFile, setCurrentFile] = dc.useState(() => dc.currentFile?.() || dc.useCurrentFile?.() || null);

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

  const handleOpenFile = () => {
    if (currentFile?.$path) {
      app.workspace.openLinkText(currentFile.$path, '', false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
      <dc.Button
        onClick={handleOpenFile}
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
        }}
      >
        {buttonText}
      </dc.Button>
    </div>
  );
};
