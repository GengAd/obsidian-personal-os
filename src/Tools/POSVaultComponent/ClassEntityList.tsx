/** @jsxImportSource preact */

interface ClassEntityListProps {
  app: any;
  dc: any;
}

export const ClassEntityList = ({ app, dc }: ClassEntityListProps) => {
  const current = dc.useCurrentFile();
  const [selectedClasses, setSelectedClasses] = dc.useState([]);
  const [nameFilter, setNameFilter] = dc.useState('');
  const [page, setPage] = dc.useState(1);
  const itemsPerPage = 15;

  // Get ontology folder from plugin settings
  let ontologyFolder = '';
  try {
    const pos = app?.plugins?.plugins?.["personal-os"];
    ontologyFolder = pos?.settings?.ontologyFolder || '';
  } catch {}

  if (!ontologyFolder) {
    return <dc.Text style={{ color: 'var(--text-warning)', textAlign: 'center' }}>⚠️ Please select an Ontology Folder in the settings.</dc.Text>;
  }
  if (!current) {
    return <dc.Text style={{ color: 'var(--text-warning)', textAlign: 'center' }}>⚠️ Could not load current file.</dc.Text>;
  }

  // Query all ontology pages (classes)
  const ontologyPages = dc.useQuery(`@page and path("${ontologyFolder}")`);
  // Build a map: path -> node { path, name, parent, ... }
  const classMap: Record<string, any> = {};
  ontologyPages.forEach((page: any) => {
    let parent: string | undefined = undefined;
    const parentField = page.$frontmatter?.parent?.value;
    if (parentField) {
      if (typeof parentField === 'object' && parentField.path) {
        parent = parentField.path;
      } else if (typeof parentField === 'string') {
        parent = parentField;
      }
    }
    classMap[page.$path] = {
      path: page.$path,
      name: page.$name,
      parent,
      $frontmatter: page.$frontmatter,
      $name: page.$name,
    };
  });

  // Find all descendant class paths of the current file (including itself)
  function getDescendantClassPaths(startPath: string): Set<string> {
    const descendants = new Set<string>();
    function dfs(path: string) {
      descendants.add(path);
      for (const node of Object.values(classMap)) {
        if (node.parent === path && !descendants.has(node.path)) {
          dfs(node.path);
        }
      }
    }
    dfs(startPath);
    return descendants;
  }
  const descendantClassPaths = dc.useMemo(() => getDescendantClassPaths(current.$path), [ontologyPages, current.$path]);

  // Query all pages in the vault
  const allPages = dc.useQuery('@page');

  // Extract class path from a file's frontmatter
  function extractClassPath(file: any): string | null {
    if (!file.$frontmatter) return null;
    const classField = Object.keys(file.$frontmatter).find(key => key.toLowerCase() === 'class');
    if (!classField) return null;
    const classValue = file.$frontmatter[classField];
    if (classValue && typeof classValue === 'object' && classValue.value && classValue.value.path) {
      return classValue.value.path;
    }
    if (typeof classValue === 'string') {
      // Try to parse [[...]]
      const match = classValue.match(/\[\[(.*?)\]\]/);
      if (match && match[1]) {
        // Try to find ontology page with that name
        const found = ontologyPages.find((p: any) => p.$name === match[1]);
        return found ? found.$path : null;
      }
      return null;
    }
    return null;
  }

  // Filter files: must have a class property that links to current or a descendant class
  const files = dc.useMemo(() => allPages.filter((file: any) => {
    const classPath = extractClassPath(file);
    return classPath && descendantClassPaths.has(classPath);
  }), [allPages, descendantClassPaths]);

  // Extract class name for display
  function extractClassName(file: any): string {
    if (!file.$frontmatter) return '';
    const classField = Object.keys(file.$frontmatter).find(key => key.toLowerCase() === 'class');
    if (!classField) return '';
    const classValue = file.$frontmatter[classField];
    if (classValue && typeof classValue === 'object' && classValue.value && classValue.value.path) {
      // Find ontology page by path
      const found = ontologyPages.find((p: any) => p.$path === classValue.value.path);
      return found ? found.$name : '';
    }
    if (typeof classValue === 'string') {
      const match = classValue.match(/\[\[(.*?)\]\]/);
      if (match && match[1]) return match[1];
      return classValue;
    }
    return '';
  }

  // Class counts for filter dropdown
  const classCounts = dc.useMemo(() => files.reduce((acc: Record<string, number>, f: any) => {
    const fileClass = extractClassName(f);
    if (fileClass) {
      acc[fileClass] = (acc[fileClass] || 0) + 1;
    }
    return acc;
  }, {}), [files]);

  // Available classes for filter dropdown
  const availableClasses = dc.useMemo(() => Object.keys(classCounts).sort().filter((c: any) => !selectedClasses.includes(c)), [classCounts, selectedClasses]);

  // Filtered files by class and name
  const filtered = dc.useMemo(() => files.filter((f: any) => {
    const fileClass = extractClassName(f);
    const matchesClass = selectedClasses.length === 0 || (fileClass && selectedClasses.includes(fileClass));
    const matchesName = !nameFilter || f.$name.toLowerCase().includes(nameFilter.toLowerCase());
    return matchesClass && matchesName;
  }), [files, selectedClasses, nameFilter]);

  // Sorted files by name
  const sorted = dc.useMemo(() => [...filtered].sort((a: any, b: any) => a.$name.localeCompare(b.$name)), [filtered]);

  // Paginated files
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const pageFiles = dc.useMemo(() => sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage), [sorted, page, itemsPerPage]);

  // Supercharged link props (from SubjectLists/OntologyTree)
  function getLinkProps(file: any) {
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
  }

  return (
    <dc.Stack style={{ gap: '16px', width: '100%' }}>
      <dc.Group>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginBottom: 8, width: '100%' }}>
          <dc.Text style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', flex: 1 }}>Class Entities</dc.Text>
        </div>
      </dc.Group>
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
        </div>
      </dc.Group>
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
      <dc.Stack style={{ gap: '8px', marginTop: '8px' }}>
        {pageFiles.length ? pageFiles.map((file: any, idx: number) => {
          const fileClass = extractClassName(file);
          const linkProps = getLinkProps(file);
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
