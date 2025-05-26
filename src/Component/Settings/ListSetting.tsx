import { useState, useRef, useEffect } from 'preact/hooks';
import { FolderSuggester } from './Suggesters/FolderSuggester';

interface ListSettingProps {
  value: (string | { [key: string]: string })[];
  onChange: (list: (string | { [key: string]: string })[]) => void;
  name: string;
  description: string;
  columns?: number;
  columnLabels?: string[];
  placeholders?: string[];
  showFolderSuggest?: boolean | boolean[];
  app?: any | any[];
  disableFirstFolderSuggest?: boolean;
}

export default function ListSetting({
  value,
  onChange,
  name,
  description,
  columns = 1,
  columnLabels = [],
  placeholders = ["Enter the element to add"],
  showFolderSuggest = false,
  app,
  disableFirstFolderSuggest = false,
}: ListSettingProps) {
  const [inputs, setInputs] = useState<string[]>(Array(columns).fill(""));
  const inputRefs = Array.from({ length: columns }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    const suggesters: FolderSuggester[] = [];
    for (let i = 0; i < columns; i++) {
      if (disableFirstFolderSuggest && i === 0) continue;
      const suggest = Array.isArray(showFolderSuggest) ? showFolderSuggest[i] : showFolderSuggest;
      const appVal = Array.isArray(app) ? app[i] : app;
      const inputEl = inputRefs[i].current;
      if (suggest && appVal && inputEl) {
        const suggester = new FolderSuggester(appVal, inputEl);
        suggesters.push(suggester);
      }
    }
    return () => {
      suggesters.forEach(s => s.close());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, showFolderSuggest, app, ...inputRefs.map(ref => ref.current)]);

  const handleAdd = () => {
    if (columns === 1) {
      if (!inputs[0]) return;
      onChange([...value, inputs[0]]);
      setInputs([""]);
    } else {
      const obj: { [key: string]: string } = {};
      for (let i = 0; i < columns; i++) {
        obj[i] = inputs[i] || "";
      }
      onChange([...value, obj]);
      setInputs(Array(columns).fill(""));
    }
  };

  const moveItem = (i: number, dir: 1 | -1) => {
    const newList = [...value];
    const j = i + dir;
    if (j < 0 || j >= newList.length) return;
    [newList[i], newList[j]] = [newList[j], newList[i]];
    onChange(newList);
  };

  const removeItem = (i: number) => {
    const newList = [...value];
    newList.splice(i, 1);
    onChange(newList);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontWeight: 600, marginBottom: 4, fontSize: '1.1em' }}>{name}</h2>
      <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{description}</div>
      {columns > 1 && columnLabels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
          {columnLabels.map((label, i) => (
            <span key={i} style={{ flex: 1, minWidth: 100, marginRight: 8 }}>{label}</span>
          ))}
          <span style={{ width: 32 }}></span>
          <span style={{ width: 32 }}></span>
          <span style={{ width: 32 }}></span>
        </div>
      )}
      <div>
        {value.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            {typeof item === 'string' ? (
              <span style={{ flex: 1 }}>{item}</span>
            ) : (
              <>
                {Array.from({ length: columns }).map((_, col) => (
                  <span
                    style={{
                      flex: 1,
                      minWidth: 100,
                      marginRight: 8
                    }}
                    key={col}
                  >
                    {item[col]}
                  </span>
                ))}
              </>
            )}
            <span style={{ width: 32 }}>
              <button
                disabled={i === 0}
                onClick={() => moveItem(i, -1)}
                title="Move up"
              >↑</button>
            </span>
            <span style={{ width: 32 }}>
              <button
                disabled={i === value.length - 1}
                onClick={() => moveItem(i, 1)}
                title="Move down"
              >↓</button>
            </span>
            <span style={{ width: 32 }}>
              <button
                style={{ color: 'red' }}
                onClick={() => removeItem(i)}
                title="Remove"
              >✕</button>
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <input
            key={i}
            ref={(() => {
              const suggest = disableFirstFolderSuggest && i === 0
                ? false
                : (Array.isArray(showFolderSuggest) ? showFolderSuggest[i] : showFolderSuggest);
              return suggest ? inputRefs[i] : undefined;
            })()}
            type="text"
            placeholder={placeholders[i] || ''}
            value={inputs[i] || ''}
            onInput={e => {
              const newInputs = [...inputs];
              newInputs[i] = (e.target as HTMLInputElement).value;
              setInputs(newInputs);
            }}
            style={{ flex: 1, minWidth: 100, marginRight: 8 }}
          />
        ))}
        <span style={{ width: 32 }}>
          <button onClick={handleAdd} style={{ minWidth: 32 }}>+</button>
        </span>
        <span style={{ width: 32 }}></span>
        <span style={{ width: 32 }}></span>
      </div>
    </div>
  );
} 