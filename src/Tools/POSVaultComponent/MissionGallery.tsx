/** @jsxImportSource preact */
import { h } from "preact";
import { AvailableMissions } from "./AvailableMissions";
import { UnavailableMissions } from "./UnavailableMissions";
import { App } from "obsidian";

interface Props {
  app: App;
  dc: any;
}

export function MissionGallery({ app, dc }: Props) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--background-secondary)",
        padding: "20px",
      }}
    >
      <dc.Stack style={{ gap: "32px" }}>
        <AvailableMissions app={app} dc={dc} />
        <UnavailableMissions app={app} dc={dc} />
      </dc.Stack>
    </div>
  );
}
