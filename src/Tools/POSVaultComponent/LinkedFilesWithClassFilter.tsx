/** @jsxImportSource preact */
// Datacore runtime provides `dc` globally in Obsidian, but for reusability, accept app/dc as props.

interface LinkedFilesWithClassFilterProps {
  app: any;
  dc: any;
}

export const LinkedFilesWithClassFilter = ({ app, dc }: LinkedFilesWithClassFilterProps) => {
  const current = dc.useCurrentFile();
  const [selectedClasses, setSelectedClasses] = dc.useState([]);
  const [nameFilter, setNameFilter] = dc.useState('');
  const [depthMode, setDepthMode] = dc.useState('direct');
  const [activeTab, setActiveTab] = dc.useState('supports');
  const [page, setPage] = dc.useState(1);
  const itemsPerPage = 15;

  if (!current) return <dc.Text style={{ color: 'var(--text-warning)', textAlign: 'center' }}>⚠️ Could not load current file.</dc.Text>;
  const allPages = dc.useQuery('@page');
  const currentPath = current.$path;

  // Find transitive links up to depth 5
  function findTransitiveLinks(startPath: string, type: 'supports' | 'undermines', visited = new Set<string>(), depth = 0): typeof allPages {
    if (depth > 5 || visited.has(startPath)) return [];
    visited.add(startPath);
    const direct = allPages.filter((file: any) => {
      const fm = file.$frontmatter || {};
      const vals = fm[type]?.value ?? [];
      return vals.some((l: any) => l?.path === startPath);
    });
    const deeper = direct.flatMap((f: any) => findTransitiveLinks(f.$path, type, visited, depth + 1));
    return [...direct, ...deeper];
  }

  // Memoized: get linked files for the current tab and depth mode
  const files = dc.useMemo(() => (
    depthMode === 'tree'
      ? findTransitiveLinks(currentPath, activeTab)
      : allPages.filter((file: any) => {
          const fm = file.$frontmatter || {};
          const vals = fm[activeTab]?.value ?? [];
          return vals.some((l: any) => l?.path === currentPath);
        })
  ), [depthMode, currentPath, allPages, activeTab]);

  // Extract class from frontmatter, handling the specific frontmatter object structure
  function extractClass(file: any): string {
    if (!file.$frontmatter) return '';
    const classField = Object.keys(file.$frontmatter)
      .find(key => key.toLowerCase() === 'class');
    if (!classField) return '';
    const classValue = file.$frontmatter[classField];
    if (typeof classValue === 'string') {
      if (classValue.startsWith('[[') && classValue.endsWith(']]')) {
        return classValue.substring(2, classValue.length - 2);
      }
      return classValue;
    }
    if (classValue && typeof classValue === 'object') {
      if (classValue.raw && typeof classValue.raw === 'string') {
        const match = classValue.raw.match(/\[\[(.*?)\]\]/);
        if (match && match[1]) return match[1];
        return classValue.raw;
      }
      if (classValue.value) {
        if (typeof classValue.value === 'object' && classValue.value.path) {
          const pathParts = classValue.value.path.split('/');
          return pathParts[pathParts.length - 1].replace('.md', '');
        }
        if (typeof classValue.value === 'string') {
          return classValue.value;
        }
      }
      if (classValue.path) {
        const pathParts = classValue.path.split('/');
        return pathParts[pathParts.length - 1].replace('.md', '');
      }
    }
    return '';
  }

  // Memoized: class counts for filter dropdown
  const classCounts = dc.useMemo(() => files.reduce((acc: Record<string, number>, f: any) => {
    const fileClass = extractClass(f);
    if (fileClass) {
      acc[fileClass] = (acc[fileClass] || 0) + 1;
    }
    return acc;
  }, {}), [files]);

  // Memoized: available classes for filter dropdown
  const availableClasses = dc.useMemo(() => Object.keys(classCounts).sort().filter((c: any) => !selectedClasses.includes(c)), [classCounts, selectedClasses]);

  // Memoized: filtered files by class and name
  const filtered = dc.useMemo(() => files.filter((f: any) => {
    const fileClass = extractClass(f);
    const matchesClass = selectedClasses.length === 0 || (fileClass && selectedClasses.includes(fileClass));
    const matchesName = !nameFilter || f.$name.toLowerCase().includes(nameFilter.toLowerCase());
    return matchesClass && matchesName;
  }), [files, selectedClasses, nameFilter]);

  // Memoized: sorted files by name
  const sorted = dc.useMemo(() => [...filtered].sort((a: any, b: any) => a.$name.localeCompare(b.$name)), [filtered]);

  // Memoized: paginated files
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const pageFiles = dc.useMemo(() => sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage), [sorted, page, itemsPerPage]);

  return (
    <dc.Stack style={{ gap: '16px', width: '100%' }}>
      {/* Header and tab toggle */}
      <dc.Group>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8, width: '100%' }}>
          <dc.Text style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', flex: 1 }}>Impacting List</dc.Text>
          <dc.Group style={{ gap: 0 }}>
            <dc.Button
              style={{
                background: activeTab === 'supports' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                color: activeTab === 'supports' ? 'var(--text-on-accent)' : 'var(--text-normal)',
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                fontWeight: activeTab === 'supports' ? 700 : 400,
                boxShadow: 'none',
                border: '1px solid var(--background-modifier-border)',
                padding: '6px 18px',
                minWidth: 0
              }}
              onClick={() => { if (activeTab !== 'supports') { setPage(1); setSelectedClasses([]); setNameFilter(''); } setActiveTab('supports'); }}
            >Supporting</dc.Button>
            <dc.Button
              style={{
                background: activeTab === 'undermines' ? 'var(--background-modifier-error)' : 'var(--background-secondary)',
                color: activeTab === 'undermines' ? 'var(--text-on-accent)' : 'var(--text-normal)',
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                fontWeight: activeTab === 'undermines' ? 700 : 400,
                boxShadow: 'none',
                border: '1px solid var(--background-modifier-border)',
                padding: '6px 18px',
                minWidth: 0
              }}
              onClick={() => { if (activeTab !== 'undermines') { setPage(1); setSelectedClasses([]); setNameFilter(''); } setActiveTab('undermines'); }}
            >Undermining</dc.Button>
          </dc.Group>
        </div>
      </dc.Group>
      {/* Filters row */}
      <dc.Group>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 6 }}>
          <dc.Textbox
            placeholder="Search notes..."
            value={nameFilter}
            onChange={(e: any) => { setNameFilter(e.target.value); setPage(1); }}
            style={{ flex: '1 1 180px', maxWidth: 300, padding: '4px 8px' }}
          />
          <select
            aria-label="Add class filter"
            style={{ flex: '1 1 180px', maxWidth: 200, padding: '4px 8px', borderRadius: 4, marginTop:2, background: 'var(--background-secondary)', color: 'var(--text-normal)', border: '1px solid var(--background-modifier-border)' }}
            value=""
            onChange={(e: any) => {
              const cls = e.target.value;
              if (cls && !selectedClasses.includes(cls)) {
                setSelectedClasses([...selectedClasses, cls]);
                setPage(1);
                e.target.value = "";
              }
            }}
          >
            <option value="" disabled>Add class filter...</option>
            {availableClasses.map((c: any) => (
              <option key={c} value={c}>{c} ({classCounts[c]})</option>
            ))}
          </select>
          <select
            aria-label="Depth mode"
            style={{ flex: '1 1 180px', maxWidth: 180, padding: '4px 8px', borderRadius: 4, marginTop:2, background: 'var(--background-secondary)', color: 'var(--text-normal)', border: '1px solid var(--background-modifier-border)' }}
            value={depthMode}
            onChange={(e: any) => { setDepthMode(e.target.value as any); setPage(1); }}
          >
            <option value="direct">Direct descendants</option>
            <option value="tree">Full tree (max depth 5)</option>
          </select>
        </div>
      </dc.Group>
      {/* Selected Classes as pills, below filters */}
      {selectedClasses.length > 0 && (
        <dc.Group>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, width: '100%' }}>
            {selectedClasses.map((cls: any) => (
              <div 
                key={cls} 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  background: 'var(--background-secondary-alt)', 
                  border: '1px solid var(--background-modifier-border)', 
                  borderRadius: 16, 
                  padding: '4px 12px', 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: 'var(--text-normal)',
                  transition: 'background-color 0.15s ease',
                  cursor: 'default',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span>{cls}</span>
                <span
                  style={{ 
                    marginLeft: 6, 
                    color: 'var(--text-faint)', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    textAlign: 'center',
                    lineHeight: '15px',
                    borderRadius: '50%',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedClasses(selectedClasses.filter((c: any) => c !== cls))}
                  title={`Remove ${cls} filter`}
                  onMouseOver={(e: any) => { e.target.style.backgroundColor = 'var(--background-modifier-hover)'; e.target.style.color = 'var(--text-normal)'; }}
                  onMouseOut={(e: any) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-faint)'; }}
                >×</span>
              </div>
            ))}
          </div>
        </dc.Group>
      )}
      {/* List with order numbers */}
      <dc.Stack style={{ gap: '8px', marginTop: '8px' }}>
        {pageFiles.length ? pageFiles.map((file: any, idx: number) => {
          const fileClass = extractClass(file);
          // Supercharged link props
          const linkProps = (() => {
            let linkClass = '';
            let linkTags = '';
            const fm = file.$frontmatter || {};
            if (fm.class) {
              linkClass = fm.class.raw ?? fm.class.value ?? fm.class;
            }
            if (fm.tags?.value) {
              linkTags = Array.isArray(fm.tags.value) ? fm.tags.value.join(',') : fm.tags.value;
            }
            const path = file.$path;
            return {
              href: path,
              className: 'internal-link data-link-icon data-link-icon-after data-link-text',
              'data-href': path,
              'data-type': 'file',
              'data-link-path': path,
              'data-link-class': linkClass,
              'data-link-tags': linkTags,
              target: '_blank',
              rel: 'noopener nofollow',
              style: {
                '--data-link-Class': linkClass,
                '--data-link-path': path,
              } as any,
              onClick: (e: any) => {
                const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;
                if (!isMobile) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (app && app.workspace && path) {
                    app.workspace.openLinkText(path, '', false);
                  }
                }
              },
            };
          })();
          return (
            <div
              key={file.$path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--background-primary)',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
                padding: '8px 12px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onClick={() => app.workspace.openLinkText(file.$path, '', false)}
            >
              <span style={{ color: 'var(--text-faint)', fontWeight: 600, minWidth: 24, textAlign: 'right' }}>{(page - 1) * itemsPerPage + idx + 1}.</span>
              {fileClass && (
                <span style={{
                  background: 'var(--background-accent)',
                  color: 'var(--text-on-accent)',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  marginRight: '6px',
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--background-modifier-border)',
                }}>{fileClass}</span>
              )}
              <a {...linkProps}>
                {file.$name}
              </a>
            </div>
          );
        }) : (
          <dc.Text style={{ textAlign: 'center', padding: '1rem' }}>No results found.</dc.Text>
        )}
      </dc.Stack>
      <dc.Group>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: 12, width: '100%' }}>
          <dc.Button style={{ padding: '4px 12px' }} disabled={page <= 1} onClick={() => setPage((p: number) => p - 1)}>←</dc.Button>
          <span style={{ margin: '0 1rem', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          <dc.Button style={{ padding: '4px 12px' }} disabled={page >= totalPages} onClick={() => setPage((p: number) => p + 1)}>→</dc.Button>
        </div>
      </dc.Group>
    </dc.Stack>
  );
};