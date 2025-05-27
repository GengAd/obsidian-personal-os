/** @jsxImportSource preact */
import { NextAction } from "./NextAction";
import { HandlerActions } from "./HandlerActions";

interface StrategicActivityImediatefocusProps {
  dc: any;
  app: any;
}

export const StrategicActivityImediatefocus = ({ dc, app }: StrategicActivityImediatefocusProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start', width: '100%' }}>
      <div style={{ flex: 7, minWidth: 0 }}>
        <NextAction dc={dc} app={app} />
      </div>
      <div style={{ flex: 3, minWidth: 0 }}>
        <HandlerActions dc={dc} app={app} />
      </div>
    </div>
  );
};
