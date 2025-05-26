/** @jsxImportSource preact */

interface OntologyTreeViewerProps {
  dc: any;
  app: any;
}

export function OntologyTreeViewer({ dc, app }: OntologyTreeViewerProps) {
  const { useState, useEffect, useMemo } = dc;
  
  // State for the component
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [rootNodesOnly, setRootNodesOnly] = useState(false);
  const [treeLayout, setTreeLayout] = useState('vertical'); // 'vertical' or 'horizontal'
  
  let ontologyFolder = '';
  try {
    const pos = app?.plugins?.plugins?.["personal-os"];
    ontologyFolder = pos?.settings?.ontologyFolder || '';
  } catch {}
  
  // Styles
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
    toggleButton: {
      padding: '6px 12px',
      borderRadius: '4px',
      backgroundColor: 'var(--background-primary)',
      color: 'var(--text-normal)',
      border: '1px solid var(--background-modifier-border)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    activeToggleButton: {
      backgroundColor: 'var(--interactive-accent)',
      color: 'var(--text-on-accent)',
      border: `1px solid var(--interactive-accent)`,
    },
    treeContainer: {
      marginTop: '16px',
      display: 'flex',
      overflowX: 'auto',
    },
    verticalTree: {
      width: '100%',
    },
    horizontalTree: {
      display: 'flex',
      flexDirection: 'row',
      overflowX: 'auto',
      padding: '20px 0',
    },
    themeSelector: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid var(--background-modifier-border)',
      backgroundColor: 'var(--background-primary)',
      color: 'var(--text-normal)',
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
    horizontalNodeContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '0 8px',
      position: 'relative',
    },
    horizontalChildrenContainer: {
      display: 'flex',
      marginTop: '20px',
      position: 'relative',
    },
    horizontalConnector: {
      position: 'absolute',
      left: '50%',
      width: '1px',
      height: '20px',
      backgroundColor: 'var(--background-modifier-border)',
      top: '-20px',
    },
    horizontalConnectorWrapper: {
      position: 'relative',
      height: '20px',
      width: '100%',
    },
    horizontalChildConnector: {
      position: 'absolute',
      top: '-10px',
      left: '0',
      right: '0',
      height: '1px',
      backgroundColor: 'var(--background-modifier-border)',
    },
    statsContainer: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      fontSize: '0.9em',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '150px',
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
    },
    hierarchyStats: {
      marginTop: '12px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '12px',
    },
    statCard: {
      padding: '12px',
      backgroundColor: 'var(--background-primary)',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '24px',
      height: '24px',
      padding: '0 6px',
      borderRadius: '12px',
      backgroundColor: 'var(--interactive-accent)',
      color: 'var(--text-on-accent)',
      fontSize: '0.8em',
      fontWeight: 'bold',
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
    // For loading animation
    loadingSpinner: {
      display: 'inline-block',
      width: '24px',
      height: '24px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTopColor: 'var(--interactive-accent)',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '10px',
    },
    '@keyframes spin': {
      to: { transform: 'rotate(360deg)' }
    }
  };
  
  // Use Datacore to query ontology files in the selected folder
  const query = ontologyFolder
    ? `@page and path("${ontologyFolder}")`
    : '';
  const ontologyPages = ontologyFolder ? dc.useQuery(query) : [];
  // Map pages to file-like objects for tree building
  const ontologyFiles = ontologyPages.map((page: any) => {
    // Get parent from frontmatter (support link or string)
    let parent: string | null = null;
    const parentField = page.$frontmatter?.parent?.value;
    if (parentField) {
      if (typeof parentField === 'object' && parentField.path) {
        parent = parentField.path;
      } else if (typeof parentField === 'string') {
        parent = parentField;
      }
    }
    // Use the first heading as title if available, else file name
    let title = page.$title || page.$name;
    // Always use $path for the node path
    const node = {
      path: page.$path,
      name: page.$name,
      title,
      parent,
      $frontmatter: page.$frontmatter,
      frontmatter: page.frontmatter, // in case Datacore provides this
    };
    return node;
  });
  
  // Map node name to original page object for link rendering
  const pageByName: Record<string, any> = {};
  ontologyPages.forEach((page: any) => {
    pageByName[page.$name] = page;
  });
  
  // Collapse to root nodes only (default and when search is cleared)
  function collapseToRootNodes() {
    setExpandedNodes({}); // Collapse everything, including root nodes
  }
  // On load and when ontologyFiles change, collapse to root nodes
  useEffect(() => {
    if (!ontologyFiles.length) return;
    collapseToRootNodes();
  }, [ontologyFolder, ontologyFiles.length]);
  
  // Build the tree structure
  const { tree, rootNodes, stats } = useMemo(() => {
    type Node = {
      path: string;
      name: string;
      title: string;
      parent: string | null;
      children: Node[];
      error?: string;
    };
    // Build nodeMap keyed by path
    const nodeMap: Record<string, Node> = {};
    const rootNodes: Node[] = [];
    ontologyFiles.forEach((file: any) => {
      nodeMap[file.path] = {
        ...file,
        children: [],
      };
    });
    ontologyFiles.forEach((file: any) => {
      let parentKey: string | null = null;
      if (file.parent) {
        // Try to match parent by path
        if (nodeMap[file.parent]) {
          parentKey = file.parent;
        } else {
          // Try to find by name
          const byName = Object.values(nodeMap).find(n => n.name === file.parent);
          if (byName) parentKey = byName.path;
        }
      }
      if (parentKey && nodeMap[parentKey]) {
        nodeMap[parentKey].children.push(nodeMap[file.path]);
      } else {
        rootNodes.push(nodeMap[file.path]);
      }
    });
    // Sort all children arrays by name
    const sortNodeChildren = (node: Node) => {
      node.children.sort((a: Node, b: Node) => a.name.localeCompare(b.name));
      node.children.forEach(sortNodeChildren);
    };
    rootNodes.sort((a: Node, b: Node) => a.name.localeCompare(b.name));
    rootNodes.forEach(sortNodeChildren);
    // Calculate hierarchy statistics
    const stats = {
      totalNodes: ontologyFiles.length,
      rootNodes: rootNodes.length,
      maxDepth: 0,
      nodesByDepth: {} as Record<number, number>,
    };
    // Calculate depth
    const calculateDepth = (node: Node, depth: number = 0) => {
      stats.maxDepth = Math.max(stats.maxDepth, depth);
      stats.nodesByDepth[depth] = (stats.nodesByDepth[depth] || 0) + 1;
      node.children.forEach((child: Node) => {
        calculateDepth(child, depth + 1);
      });
    };
    rootNodes.forEach((node: Node) => {
      calculateDepth(node);
    });
    return { tree: { children: rootNodes }, rootNodes, stats };
  }, [ontologyFiles]);
  
  // Helper: find all ancestors for a given node name
  function findAncestors(nodeName: string, nodeMap: Record<string, any>): string[] {
    const ancestors: string[] = [];
    let current = nodeMap[nodeName];
    while (current && current.parent && nodeMap[current.parent]) {
      ancestors.push(current.parent);
      current = nodeMap[current.parent];
    }
    return ancestors;
  }
  
  // Filter tree to only show hierarchy for found elements (and their ancestors)
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) {
      return tree;
    }
    const term = searchTerm.toLowerCase();
    // Recursively filter nodes, keeping only those that match or have matching descendants
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
    const filteredRootNodes = tree.children.map(filterNode).filter(Boolean);
    return { children: filteredRootNodes };
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
  
  // Collapse all nodes except roots
  const collapseAll = () => {
    collapseToRootNodes(); // This will setExpandedNodes({}) and collapse everything
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
    // Directly use the node's frontmatter (since these are page objects)
    let linkClass = '';
    let linkTags = '';
    // Try both $frontmatter and frontmatter
    const fm = file.$frontmatter || file.frontmatter;
    if (fm?.class) {
      linkClass = fm.class.raw ?? fm.class.value ?? fm.class;
    }
    if (fm?.tags?.value) {
      linkTags = Array.isArray(fm.tags.value) ? fm.tags.value.join(',') : fm.tags.value;
    }
    // Use both .path and .$path for compatibility
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
        // Mobile/desktop logic from SubjectLists
        const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;
        if (!isMobile) {
          e.preventDefault();
          e.stopPropagation();
          if (app && app.workspace && path) {
            app.workspace.openLinkText(path, '', false);
          }
        }
        // On mobile, allow default link behavior
      },
    };
  }
  
  // Render a node and its children recursively (vertical layout)
  const renderTreeNode = (node: any, depth: number = 0, isLastChild: boolean = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.name];
    const isRoot = depth === 0;
    // Determine background color based on depth and theme
    const getNodeBackground = () => {
      return 'var(--background-secondary)';
    };
    return (
      <div key={node.path} style={styles.nodeContainer}>
        {/* Connector line to parent (if not a root node) */}
        {depth > 0 && (
          <div style={styles.connectorLine}></div>
        )}
        {/* Expand/collapse button for nodes with children */}
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
        {/* Node item (card) */}
        <div
          style={{
            ...styles.node,
            backgroundColor: getNodeBackground(),
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onClick={(e: any) => {
            // Only toggle if not clicking the link
            if (e.target.tagName === 'A') return;
            if (hasChildren) {
              toggleNode(node.name);
            }
          }}
        >
          {/* Supercharged link for node name */}
          <a {...getLinkProps(pageByName[node.name] || node)}>{highlightText(node.name)}</a>
          {hasChildren && (
            <span style={styles.nodeCount}>({node.children.length})</span>
          )}
        </div>
        {/* Child nodes */}
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
  
  // Statistics display (Hierarchy Distribution only)
  const renderStats = () => {
    return (
      <div style={styles.statsContainer}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Hierarchy Distribution</div>
        <div style={styles.hierarchyStats}>
          {Object.entries(stats.nodesByDepth).map(([depth, count]: [string, any]) => (
            <div key={depth} style={styles.statCard}>
              <div style={{ ...styles.badge,
                backgroundColor: depth === '0'
                  ? 'var(--interactive-accent)'
                  : 'var(--interactive-accent)'
              }}>
                {count}
              </div>
              <span>Level {parseInt(depth) + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render the loading state
  const renderLoading = () => (
    <div style={styles.loadingContainer}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={styles.loadingSpinner}></div>
        <div>Loading ontology files...</div>
      </div>
    </div>
  );
  
  // Render error state
  const renderError = () => (
    <div style={{ 
      color: 'var(--text-error)', 
      padding: '16px', 
      backgroundColor: 'var(--background-secondary)',
      borderRadius: '8px',
      marginTop: '16px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error</div>
      <div>{error}</div>
    </div>
  );
  
  // When searching, expand all ancestors of matches (and the matches themselves)
  useEffect(() => {
    if (!searchTerm.trim()) return;
    // Build a nodeMap for lookup (by path)
    const nodeMap: Record<string, any> = {};
    ontologyFiles.forEach((file: any) => {
      nodeMap[file.path] = file;
    });
    const term = searchTerm.toLowerCase();
    const matches = ontologyFiles.filter((file: any) =>
      file.name.toLowerCase().includes(term) ||
      (file.title && file.title.toLowerCase().includes(term))
    );
    const expanded: Record<string, boolean> = { ...expandedNodes };
    matches.forEach((file: any) => {
      let current = file;
      const ancestors: string[] = [];
      while (current && current.parent && nodeMap[current.parent]) {
        expanded[nodeMap[current.parent].name] = true; // expand by name for UI
        ancestors.push(nodeMap[current.parent].name);
        current = nodeMap[current.parent];
      }
      expanded[file.name] = true;
    });
    setExpandedNodes(expanded);
  }, [searchTerm]);
  
  if (!ontologyFolder) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)' }}>
        Please select an Ontology Folder in the settings to view the ontology tree.
      </div>
    );
  }
  
  const nodesToRender = rootNodesOnly ? 
    { children: filteredTree.children } : 
    filteredTree;
  
  return (
    <div style={styles.container}>
      <div style={styles.controlsContainer}>
        <input
          type="text"
          placeholder="Search ontology..."
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
      
      {renderStats()}
      
      <div style={styles.verticalTree}>
        <div style={{ padding: '12px 0' }}>
          {filteredTree.children.map((node: any, index: number) =>
            renderTreeNode(
              node,
              0,
              index === filteredTree.children.length - 1
            )
          )}
        </div>
      </div>
    </div>
  );
}

