import { useState, useRef, useEffect } from 'preact/hooks';
import { TFolder } from 'obsidian';
import { FolderSuggester } from './Suggesters/FolderSuggester';

interface StringSettingProps {
  value: string;
  onChange: (value: string) => void;
  name: string;
  description: string;
  placeholder?: string;
  app?: any;
  showFolderSuggest?: boolean;
}

export default function StringSetting({
  value,
  onChange,
  name,
  description,
  placeholder = '',
  app,
  showFolderSuggest = false,
}: StringSettingProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let suggester: FolderSuggester | null = null;
    if (showFolderSuggest && app && inputRef.current) {
      suggester = new FolderSuggester(app, inputRef.current);
    }
    return () => {
      if (suggester) suggester.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFolderSuggest, app, inputRef.current]);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{name}</div>
      <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{description}</div>
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        placeholder={placeholder}
        style={{ width: '100%', padding: 4 }}
        onInput={e => {
          onChange((e.target as HTMLInputElement).value);
        }}
      />
    </div>
  );
} 