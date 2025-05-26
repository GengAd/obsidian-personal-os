/** @jsxImportSource preact */

interface MetaClassTreeProps {
  dc: any;
  app: any;
  level: number; // Level of parent class to use for filtering
}

export function MetaClassTree({ dc, app, level }: MetaClassTreeProps) {
  const { useState, useMemo, useEffect } = dc;
  const currentFile = dc.useCurrentFile();
  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRelations, setActiveRelations] = useState({ supports: true, undermines: true });

  // Get ontology folder from plugin settings
  let ontologyFolder = '';
  try {
    const pos = app?.plugins?.plugins?.["personal-os"];
    ontologyFolder = pos?.settings?.ontologyFolder || '';
  } catch {}

  // --- Styles (copied from SubClassTree) ---
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '100%',
      padding: '8px',
      fontFamily: 'var(--font-interface)'
    },
    controlsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      alignItems: 'center',
      marginBottom: '8px',
      backgroundColor: 'var(--background-secondary)',
      padding: '12px',
      borderRadius: '8px',
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid var(--background-modifier-border)',
      backgroundColor: 'var(--background-primary)',
    },
    button: {
      padding: '6px 12px',
      borderRadius: '4px',
      backgroundColor: 'var(--interactive-accent)',
      color: 'var(--text-on-accent)',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    nodeContainer: {
      position: 'relative',
      margin: '4px 0',
      padding: '4px 0 4px 20px',
    },
    childrenContainer: {
      position: 'relative',
      marginLeft: '25px',
      paddingLeft: '15px',
      borderLeft: '1px solid var(--background-modifier-border)',
    },
    node: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      borderRadius: '6px',
      color: 'var(--text-on-accent)',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 1,
    },
    expandCollapseIcon: {
      position: 'absolute',
      left: '0px',
      top: '12px',
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: 'var(--background-primary)',
      border: '1px solid var(--background-modifier-border)',
      color: 'var(--text-muted)',
      fontSize: '10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      zIndex: 2,
    },
    connectorLine: {
      position: 'absolute',
      top: '20px',
      left: '-15px',
      width: '15px',
      height: '1px',
      backgroundColor: 'var(--background-modifier-border)',
    },
    searchHighlight: {
      backgroundColor: '#ffeb3b',
      padding: '0 2px',
      borderRadius: '2px',
      color: '#000000',
    },
    nodeCount: {
      marginLeft: '6px',
      color: 'var(--text-on-accent)',
      fontSize: '0.85em',
      opacity: 0.9,
    },
    verticalTree: {
      width: '100%',
    },
  };

  // --- Helper: Extract class path from a file's frontmatter ---
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
        return match[1];
      }
      return null;
    }
    return null;
  }

  // --- Helper: Build class hierarchy from ontology pages ---
  const ontologyPages = ontologyFolder ? dc.useQuery(`@page and path("${ontologyFolder}")`) : [];
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

  // --- Helper: Find ancestor class at a given level ---
  function getAncestorClassPath(startPath: string, level: number): string | null {
    let current = classMap[startPath];
    let currentLevel = 0;
    while (current && currentLevel < level) {
      if (!current.parent || !classMap[current.parent]) break;
      current = classMap[current.parent];
      currentLevel++;
    }
    return current ? current.path : null;
  }

  // --- Helper: Find all subclasses (descendants) of a class ---
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

  // --- Get current file's class and ancestor class at the given level ---
  const currentClassPath = extractClassPath(currentFile);
  const ancestorClassPath = currentClassPath ? getAncestorClassPath(currentClassPath, level) : null;
  const allowedClassPaths = ancestorClassPath ? getDescendantClassPaths(ancestorClassPath) : new Set();

  // --- Query all pages in the vault (excluding ontology folder) ---
  const allPages = dc.useQuery('@page');
  const filteredPages = allPages.filter((file: any) => {
    // Exclude ontology folder
    if (ontologyFolder && file.$path.startsWith(ontologyFolder)) return false;
    // Must have a class in allowedClassPaths
    const fileClassPath = extractClassPath(file);
    return fileClassPath && allowedClassPaths.has(fileClassPath);
  });

  // --- Helper: Extract class name for pill display (like LinkedFilesWithClassFilter) ---
  function extractClassName(file: any): string {
    if (!file.$frontmatter) return '';
    const classField = Object.keys(file.$frontmatter).find(key => key.toLowerCase() === 'class');
    if (!classField) return '';
    const classValue = file.$frontmatter[classField];
    if (classValue && typeof classValue === 'object' && classValue.value && classValue.value.path) {
      // Use the last part of the path as class name
      const pathParts = classValue.value.path.split('/');
      return pathParts[pathParts.length - 1].replace('.md', '');
    }
    if (typeof classValue === 'string') {
      const match = classValue.match(/\[\[(.*?)\]\]/);
      if (match && match[1]) return match[1];
      return classValue;
    }
    return '';
  }

  // --- Helper: Find all files that impact the current file or its descendants ---
  function findImpactingFiles(rootPath: string, visited = new Set<string>()): any[] {
    if (visited.has(rootPath)) return [];
    visited.add(rootPath);
    // Find files that have any active relation linking to rootPath
    const direct = filteredPages.filter((file: any) => {
      let found = false;
      if (activeRelations.supports) {
        const rels = file.$frontmatter?.supports?.value || [];
        if (rels.some((l: any) => l?.path === rootPath)) found = true;
      }
      if (activeRelations.undermines) {
        const rels = file.$frontmatter?.undermines?.value || [];
        if (rels.some((l: any) => l?.path === rootPath)) found = true;
      }
      return found;
    });
    // Recursively find files that impact these
    const deeper = direct.flatMap((f: any) => findImpactingFiles(f.$path, visited));
    return [...direct, ...deeper];
  }

  // --- Build the tree: root is current file, children are impacting files (recursively) ---
  const tree = useMemo(() => {
    if (!currentFile || !currentFile.$path) return { children: [] };
    function buildNode(path: string, visited = new Set<string>(), parentPath: string | null = null): any {
      const nodeFile = allPages.find((f: any) => f.$path === path);
      if (!nodeFile) return null;
      // Find direct children (impacting files)
      const children = filteredPages.filter((file: any) => {
        let found = false;
        if (activeRelations.supports) {
          const rels = file.$frontmatter?.supports?.value || [];
          if (rels.some((l: any) => l?.path === path)) found = true;
        }
        if (activeRelations.undermines) {
          const rels = file.$frontmatter?.undermines?.value || [];
          if (rels.some((l: any) => l?.path === path)) found = true;
        }
        return found;
      });
      // Ensure $name, $path, and $parent are present for rendering and search expansion
      const node = {
        ...nodeFile,
        $name: nodeFile.$name || nodeFile.name || nodeFile.title || nodeFile.path,
        $path: nodeFile.$path || nodeFile.path,
        $parent: parentPath,
        children: children.map((child: any) => buildNode(child.$path, new Set([...visited, path]), path))
      };
      return node;
    }
    // Instead of showing the root node, show only its direct children as top-level nodes
    const topLevelFiles = filteredPages.filter((file: any) => {
      let found = false;
      if (activeRelations.supports) {
        const rels = file.$frontmatter?.supports?.value || [];
        if (rels.some((l: any) => l?.path === currentFile.$path)) found = true;
      }
      if (activeRelations.undermines) {
        const rels = file.$frontmatter?.undermines?.value || [];
        if (rels.some((l: any) => l?.path === currentFile.$path)) found = true;
      }
      return found;
    });
    const children = topLevelFiles.map((file: any) => buildNode(file.$path, new Set(), null));
    return { children };
  }, [currentFile, filteredPages.length, searchTerm, level, activeRelations]);

  // --- Filter tree by search term ---
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) {
      return tree;
    }
    const term = searchTerm.toLowerCase();
    function filterNode(node: any): any | null {
      const nameMatches = node.$name?.toLowerCase().includes(term);
      const titleMatches = node.$title && node.$title.toLowerCase().includes(term);
      const filteredChildren = (node.children || []).map(filterNode).filter(Boolean);
      if (nameMatches || titleMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    }
    const filteredChildren = tree.children.map(filterNode).filter(Boolean);
    return { children: filteredChildren };
  }, [tree, searchTerm]);

  // --- UI: Expand/collapse logic ---
  const toggleNode = (nodeName: string) => {
    setExpandedNodes((prev: Record<string, boolean>) => ({
      ...prev,
      [nodeName]: !prev[nodeName],
    }));
  };
  const expandAll = () => {
    const expanded: Record<string, boolean> = {};
    const addAllNodes = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        expanded[node.$name] = true;
        addAllNodes(node.children || []);
      });
    };
    addAllNodes(tree.children);
    setExpandedNodes(expanded);
  };
  const collapseAll = () => {
    setExpandedNodes({});
  };

  // --- UI: Highlight search terms ---
  const highlightText = (text: string) => {
    if (!searchTerm.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part: string, i: number) =>
          part.toLowerCase() === searchTerm.toLowerCase() ?
            <span key={i} style={styles.searchHighlight}>{part}</span> :
            part
        )}
      </>
    );
  };

  // --- UI: Supercharged link props ---
  function getLinkProps(file: any) {
    let linkClass = '';
    let linkTags = '';
    const fm = file.$frontmatter || file.frontmatter;
    if (fm?.class) {
      linkClass = fm.class.raw ?? fm.class.value ?? fm.class;
    }
    if (fm?.tags?.value) {
      linkTags = Array.isArray(fm.tags.value) ? fm.tags.value.join(',') : fm.tags.value;
    }
    const path = file.$path;
    const name = file.$name;
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

  // --- UI: Render tree node ---
  const renderTreeNode = (node: any, depth: number = 0, isLastChild: boolean = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.$name];
    const linkProps = getLinkProps(node);
    const className = extractClassName(node);
    // Extract level from frontmatter if present
    let levelValue: string | number | undefined = undefined;
    if (node.$frontmatter && node.$frontmatter.level && node.$frontmatter.level.value != null) {
      levelValue = node.$frontmatter.level.value;
    }
    return (
      <div key={node.$path} style={styles.nodeContainer}>
        {depth > 0 && (
          <div style={styles.connectorLine}></div>
        )}
        {hasChildren && (
          <div
            style={styles.expandCollapseIcon}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              toggleNode(node.$name);
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? '−' : '+'}
          </div>
        )}
        <div
          style={{
            ...styles.node,
            backgroundColor: 'var(--background-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={(e: any) => {
            if (e.target.tagName === 'A') return;
            if (hasChildren) {
              toggleNode(node.$name);
            }
          }}
        >
          {className && (
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
            }}>{className}</span>
          )}
          <a {...linkProps}>{highlightText(node.$name)}</a>
          {hasChildren && (
            <span style={styles.nodeCount}>({node.children.length})</span>
          )}
          {levelValue !== undefined && (
            <span style={{
              background: 'var(--background-secondary-alt)',
              color: 'var(--text-muted)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 500,
              marginLeft: '8px',
              whiteSpace: 'nowrap',
              border: '1px solid var(--background-modifier-border)',
            }}>lvl {levelValue}</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div style={styles.childrenContainer}>
            {node.children.map((child: any, index: number) =>
              renderTreeNode(
                child,
                depth + 1,
                index === node.children.length - 1
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // Expand all ancestors of matches when searching (like OntologyTree)
  useEffect(() => {
    if (!searchTerm.trim()) return;
    // Build a nodeMap for lookup (by $path)
    const nodeMap: Record<string, any> = {};
    const addToMap = (node: any) => {
      nodeMap[node.$path] = node;
      (node.children || []).forEach(addToMap);
    };
    tree.children.forEach(addToMap);
    const term = searchTerm.toLowerCase();
    // Find all matches
    const matches: any[] = [];
    Object.values(nodeMap).forEach((node: any) => {
      if (node.$name?.toLowerCase().includes(term) || (node.$title && node.$title.toLowerCase().includes(term))) {
        matches.push(node);
      }
    });
    const expanded: Record<string, boolean> = { ...expandedNodes };
    matches.forEach((node: any) => {
      let current = node;
      while (current && current.$parent && nodeMap[current.$parent]) {
        expanded[nodeMap[current.$parent].$name] = true;
        current = nodeMap[current.$parent];
      }
      expanded[node.$name] = true;
    });
    setExpandedNodes(expanded);
  }, [searchTerm]);

  // --- UI: Empty/error states ---
  if (!currentFile) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        No current file selected.
      </div>
    );
  }
  if (!ancestorClassPath) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        Could not determine ancestor class at level {level}.
      </div>
    );
  }
  const hasDescendants = filteredTree.children && filteredTree.children.length > 0;

  // --- UI: Render ---
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', flex: 1 }}>Impacting Tree</span>
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            style={{
              ...styles.button,
              background: activeRelations.supports ? 'var(--interactive-accent)' : 'var(--background-secondary)',
              color: activeRelations.supports ? 'var(--text-on-accent)' : 'var(--text-normal)',
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              fontWeight: activeRelations.supports ? 700 : 400,
              boxShadow: 'none',
              minWidth: 0
            }}
            onClick={() => setActiveRelations((r: { supports: boolean; undermines: boolean }) => ({ ...r, supports: !r.supports }))}
          >Supporting</button>
          <button
            style={{
              ...styles.button,
              background: activeRelations.undermines ? 'var(--background-modifier-error)' : 'var(--background-secondary)',
              color: activeRelations.undermines ? 'var(--text-on-accent)' : 'var(--text-normal)',
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              fontWeight: activeRelations.undermines ? 700 : 400,
              boxShadow: 'none',
              minWidth: 0
            }}
            onClick={() => setActiveRelations((r: { supports: boolean; undermines: boolean }) => ({ ...r, undermines: !r.undermines }))}
          >Undermining</button>
        </div>
      </div>
      <div style={styles.controlsContainer}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            placeholder="Search supporting/undermining files..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.currentTarget.value)}
            style={styles.searchInput}
          />
          <button
            onClick={expandAll}
            style={styles.button}
            aria-label="Expand All"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={styles.button}
            aria-label="Collapse All"
          >
            Collapse All
          </button>
        </div>
      </div>
      <div style={styles.verticalTree}>
        <div style={{ padding: '12px 0' }}>
          {hasDescendants ? (
            filteredTree.children.map((node: any, index: number) =>
              renderTreeNode(
                node,
                0,
                index === filteredTree.children.length - 1
              )
            )
          ) : (
            <div style={{ color: 'var(--text-muted)', padding: '16px' }}>
              No supporting/undermining files
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
