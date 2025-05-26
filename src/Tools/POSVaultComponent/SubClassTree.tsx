/** @jsxImportSource preact */

interface SubClassTreeProps {
  dc: any;
  app: any;
}

export function SubClassTree({ dc, app }: SubClassTreeProps) {
  const { useState, useEffect, useMemo } = dc;
  const currentFile = dc.useCurrentFile();
  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  let ontologyFolder = '';
  try {
    const pos = app?.plugins?.plugins?.["personal-os"];
    ontologyFolder = pos?.settings?.ontologyFolder || '';
  } catch {}

  // Styles (copied from OntologyTreeViewer)
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

  // Query all ontology pages in the folder
  const query = ontologyFolder ? `@page and path("${ontologyFolder}")` : '';
  const ontologyPages = ontologyFolder ? dc.useQuery(query) : [];
  // Map pages to file-like objects for tree building
  const ontologyFiles = ontologyPages.map((page: any) => {
    let parent: string | null = null;
    const parentField = page.$frontmatter?.parent?.value;
    if (parentField) {
      if (typeof parentField === 'object' && parentField.path) {
        parent = parentField.path;
      } else if (typeof parentField === 'string') {
        parent = parentField;
      }
    }
    let title = page.$title || page.$name;
    const node = {
      path: page.$path,
      name: page.$name,
      title,
      parent,
      $frontmatter: page.$frontmatter,
      frontmatter: page.frontmatter,
    };
    return node;
  });

  // Map node name to original page object for link rendering
  const pageByName: Record<string, any> = {};
  ontologyPages.forEach((page: any) => {
    pageByName[page.$name] = page;
  });

  // Build a node map for fast lookup
  const nodeMap: Record<string, any> = {};
  ontologyFiles.forEach((file: any) => {
    nodeMap[file.path] = { ...file, children: [] };
  });
  ontologyFiles.forEach((file: any) => {
    let parentKey: string | null = null;
    if (file.parent) {
      if (nodeMap[file.parent]) {
        parentKey = file.parent;
      } else {
        const byName = Object.values(nodeMap).find(n => n.name === file.parent);
        if (byName) parentKey = byName.path;
      }
    }
    if (parentKey && nodeMap[parentKey]) {
      nodeMap[parentKey].children.push(nodeMap[file.path]);
    }
  });

  // Find the current file node
  const currentPath = currentFile?.$path;
  const rootNode = currentPath && nodeMap[currentPath] ? nodeMap[currentPath] : null;

  // Recursively collect all descendants of a node
  function collectDescendants(node: any): any[] {
    if (!node) return [];
    return node.children.map((child: any) => ({
      ...child,
      children: collectDescendants(child)
    }));
  }

  // Build the tree rooted at the current file
  const tree = useMemo(() => {
    if (!rootNode) return { children: [] };
    return { children: collectDescendants(rootNode) };
  }, [rootNode, ontologyFiles.length]);

  // Filter tree to only show hierarchy for found elements (and their ancestors)
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) {
      return tree;
    }
    const term = searchTerm.toLowerCase();
    function filterNode(node: any): any | null {
      const nameMatches = node.name.toLowerCase().includes(term);
      const titleMatches = node.title && node.title.toLowerCase().includes(term);
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

  // Toggle node expansion
  const toggleNode = (nodeName: string) => {
    setExpandedNodes((prev: Record<string, boolean>) => ({
      ...prev,
      [nodeName]: !prev[nodeName],
    }));
  };

  // Expand all nodes
  const expandAll = () => {
    const expanded: Record<string, boolean> = {};
    const addAllNodes = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        expanded[node.name] = true;
        addAllNodes(node.children);
      });
    };
    addAllNodes(tree.children);
    setExpandedNodes(expanded);
  };

  // Collapse all nodes
  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Highlight search terms in text
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

  // Helper to get supercharged link props (from SubjectLists)
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

  // Render a node and its children recursively (vertical layout)
  const renderTreeNode = (node: any, depth: number = 0, isLastChild: boolean = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.name];
    return (
      <div key={node.path} style={styles.nodeContainer}>
        {depth > 0 && (
          <div style={styles.connectorLine}></div>
        )}
        {hasChildren && (
          <div
            style={styles.expandCollapseIcon}
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              toggleNode(node.name);
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
              toggleNode(node.name);
            }
          }}
        >
          <a {...getLinkProps(pageByName[node.name] || node)}>{highlightText(node.name)}</a>
          {hasChildren && (
            <span style={styles.nodeCount}>({node.children.length})</span>
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
    // Build a nodeMap for lookup (by path)
    const nodeMap: Record<string, any> = {};
    const addToMap = (node: any) => {
      nodeMap[node.path] = node;
      (node.children || []).forEach(addToMap);
    };
    tree.children.forEach(addToMap);
    const term = searchTerm.toLowerCase();
    // Find all matches
    const matches: any[] = [];
    Object.values(nodeMap).forEach((node: any) => {
      if (node.name?.toLowerCase().includes(term) || (node.title && node.title.toLowerCase().includes(term))) {
        matches.push(node);
      }
    });
    const expanded: Record<string, boolean> = { ...expandedNodes };
    matches.forEach((node: any) => {
      let current = node;
      while (current && current.parent && nodeMap[current.parent]) {
        expanded[nodeMap[current.parent].name] = true;
        current = nodeMap[current.parent];
      }
      expanded[node.name] = true;
    });
    setExpandedNodes(expanded);
  }, [searchTerm]);

  // If no ontology folder or no current file, show message
  if (!ontologyFolder) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        Please select an Ontology Folder in the settings to view the subclass tree.
      </div>
    );
  }
  if (!currentFile) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        No current file selected.
      </div>
    );
  }

  // If no descendants, show message
  const hasDescendants = filteredTree.children && filteredTree.children.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.controlsContainer}>
        <input
          type="text"
          placeholder="Search child classes..."
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
              No child classes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
