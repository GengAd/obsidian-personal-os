/** @jsxImportSource preact */
import { h } from "preact";
import { App } from "obsidian";
import { getRequirementProgress } from "../DcUtils";

interface RequirementProgressBarProps {
  app: App;
  dc: any;
  file?: any; // If not provided, use current file
  style?: any;
}

export function RequirementProgressBar({ app, dc, file, style }: RequirementProgressBarProps) {
  const currentFile = dc.useCurrentFile();
  const targetFile = file || currentFile;
  if (!targetFile?.$path) return null;

  const { total, completed, percentage } = getRequirementProgress(dc, targetFile);

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#ff4d4d";
    if (percentage < 70) return "#ffcc00";
    return "#4caf50";
  };

  return (
    <dc.Stack style={{ gap: "8px", ...style }}>
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
            width: `${percentage}%`,
            backgroundColor: getProgressColor(percentage),
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
              background:
                "linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)",
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
          {percentage}%
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
      <div
        style={{
          fontSize: "14px",
          color: "var(--text-normal)",
          textAlign: "center",
        }}
      >
        {completed} / {total} requirements met
      </div>
    </dc.Stack>
  );
}
