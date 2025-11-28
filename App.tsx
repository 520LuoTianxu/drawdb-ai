
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  Panel,
  MarkerType,
  useReactFlow,
  EdgeLabelRenderer,
  getRectOfNodes,
  useOnSelectionChange
} from 'reactflow';
import { 
    Download, 
    Upload, 
    Layout, 
    Code, 
    Search,
    Database,
    PlusCircle,
    Undo2,
    Redo2,
    Image as ImageIcon,
    Keyboard,
    Languages,
    FolderOpen,
    Save,
    Sparkles
} from 'lucide-react';
import { toPng } from 'html-to-image';

import TableNode from './components/TableNode';
import { ImportModal } from './components/ImportModal';
import { EditorPanel } from './components/EditorPanel';
import { RelationshipModal } from './components/RelationshipModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ExportModal } from './components/ExportModal';
import { ProjectManager } from './components/ProjectManager';
import { AiModal } from './components/AiModal';
import { Button } from './components/ui/Button';
import { parseDDL, generateSQL } from './services/sqlParser';
import { getLayoutedElements } from './services/layoutService';
import { storage } from './services/storage';
import { TableData, EditorState, Cardinality, HistoryState, Project } from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ToastProvider, useToast } from './context/ToastContext';

// Register custom node
const nodeTypes = {
  table: TableNode,
};

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [editor, setEditor] = useState<EditorState>({ isOpen: false, tableId: null });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Project State
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(0);
  
  // Refs for auto-save race condition prevention
  const currentProjectRef = useRef<Project | null>(null);
  const currentProjectIdRef = useRef<string | null>(null);

  const { t, language, setLanguage } = useLanguage();
  const { addToast } = useToast();

  // Relationship Modal State
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [showRelModal, setShowRelModal] = useState(false);

  // History for Undo/Redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  
  const reactFlowInstance = useReactFlow();

  // --- Initialization ---
  useEffect(() => {
    // Attempt to load the most recent project on mount
    const init = async () => {
        try {
            const projects = await storage.getAllProjects();
            if (projects.length > 0) {
                // Load most recent
                loadProject(projects[0]);
            } else {
                // Create a default new project
                const newProject: Project = {
                  id: crypto.randomUUID(),
                  name: 'Untitled Project',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  nodes: [],
                  edges: [],
                  version: 1
                };
                await storage.saveProject(newProject);
                loadProject(newProject);
            }
        } catch (e) {
            console.error("Failed to initialize DB", e);
        }
    };
    init();
  }, []);

  // --- Sync Refs ---
  useEffect(() => {
    currentProjectRef.current = currentProject;
    currentProjectIdRef.current = currentProject?.id || null;
  }, [currentProject]);

  // --- Auto Save Logic ---
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const projectIdSnapshot = currentProjectRef.current?.id;
    if (!projectIdSnapshot) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
        // GUARD: Check if the current project ID has changed (switch or delete)
        if (currentProjectIdRef.current !== projectIdSnapshot) {
            setIsSaving(false);
            return;
        }

        const projectMeta = currentProjectRef.current;
        if (!projectMeta) return;

        const updatedProject: Project = {
            ...projectMeta,
            nodes: nodes,
            edges: edges,
            updatedAt: Date.now()
        };
        
        try {
            await storage.saveProject(updatedProject);
            if (currentProjectIdRef.current === projectIdSnapshot) {
                setCurrentProject(updatedProject); 
                setLastSaved(Date.now());
            }
        } catch (e) {
            console.error("Auto save failed", e);
        } finally {
            if (currentProjectIdRef.current === projectIdSnapshot) {
                setIsSaving(false);
            }
        }
    }, 1500); // Save after 1.5s of inactivity

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [nodes, edges]);

  const loadProject = (project: Project) => {
      setHistory([]);
      setFuture([]);
      setCurrentProject(project);
      setNodes(project.nodes || []);
      setEdges(project.edges || []);
      setProjectManagerOpen(false);
      setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 100);
  };
  
  const handleProjectDelete = useCallback((projectId: string) => {
      if (currentProjectRef.current && currentProjectRef.current.id === projectId) {
          if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = null;
          }
          setIsSaving(false);

          const newProject: Project = {
              id: crypto.randomUUID(),
              name: 'Untitled Project',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              nodes: [],
              edges: [],
              version: 1
          };
          
          setCurrentProject(newProject);
          setNodes([]);
          setEdges([]);
          setHistory([]);
          setFuture([]);
      }
  }, [setNodes, setEdges]);

  const handleUpdateProjectName = async (name: string) => {
      if (!currentProject) return;
      const updated = { ...currentProject, name, updatedAt: Date.now() };
      setCurrentProject(updated);
      await storage.saveProject(updated);
  };

  // --- History Management ---
  const saveToHistory = useCallback(() => {
    setHistory(prev => {
        const newState = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
        const newHistory = [...prev, newState].slice(-50); 
        return newHistory;
    });
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      const newHistory = history.slice(0, history.length - 1);
      
      setFuture(prev => [{ nodes, edges }, ...prev]);
      setHistory(newHistory);
      setNodes(previous.nodes);
      setEdges(previous.edges);
  }, [history, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
      if (future.length === 0) return;
      const next = future[0];
      const newFuture = future.slice(1);
      
      setHistory(prev => [...prev, { nodes, edges }]);
      setFuture(newFuture);
      setNodes(next.nodes);
      setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);
  
  const withHistory = (fn: () => void) => {
      saveToHistory();
      fn();
  };

  // --- Handlers ---
  const onConnect = useCallback(
    (params: Connection) => {
        setPendingConnection(params);
        setShowRelModal(true);
    },
    []
  );

  const confirmRelationship = (cardinality: Cardinality) => {
      if (!pendingConnection) return;
      const label = cardinality; 
      withHistory(() => {
          setEdges((eds) => addEdge({
            ...pendingConnection, 
            type: 'default',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            label: label,
            labelStyle: { fill: '#94a3b8', fontWeight: 700, fontSize: 12 },
            labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          }, eds));
      });
      setShowRelModal(false);
      setPendingConnection(null);
  };

  const handleImportDDL = useCallback((sql: string) => {
    withHistory(() => {
        const { nodes: newNodes, edges: newEdges } = parseDDL(sql);
        if (newNodes.length > 0) {
            const layouted = getLayoutedElements(newNodes, newEdges);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
            addToast(t('toast_import_success'), 'success');
        } else {
            addToast(t('toast_import_fail'), 'error');
        }
    });
  }, [setNodes, setEdges, addToast, t]);

  const handleAiGeneratedSQL = useCallback((sql: string) => {
    withHistory(() => {
        const { nodes: newNodes, edges: newEdges } = parseDDL(sql);
        
        if (newNodes.length === 0) {
            addToast(t('toast_ai_fail'), 'error');
            return;
        }

        const layouted = getLayoutedElements(newNodes, newEdges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
        addToast(t('toast_ai_success'), 'success');
        setTimeout(() => reactFlowInstance.fitView({ padding: 0.2, duration: 800 }), 100);
    });
  }, [setNodes, setEdges, reactFlowInstance, addToast, t]);

  const handleAutoLayout = useCallback(() => {
    withHistory(() => {
        const layouted = getLayoutedElements(nodes, edges);
        setNodes([...layouted.nodes]);
        setEdges([...layouted.edges]);
        setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 50);
    });
  }, [nodes, edges, setNodes, setEdges, reactFlowInstance]);

  const handleExportSQL = () => {
      const sql = generateSQL(nodes);
      const blob = new Blob([sql], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.name || 'database'}_schema.sql`;
      a.click();
      URL.revokeObjectURL(url);
      addToast(t('toast_export_success'), 'success');
  };

  const performExport = useCallback((config: { autoLayout: boolean; backgroundColor: string }) => {
     setExportModalOpen(false);
     const runExport = async () => {
        const currentNodes = reactFlowInstance.getNodes();
        if (currentNodes.length === 0) return;

        const nodesBounds = getRectOfNodes(currentNodes);
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) return;

        const margin = 50;
        const width = nodesBounds.width + margin * 2;
        const height = nodesBounds.height + margin * 2;

        try {
            const dataUrl = await toPng(viewport, {
                backgroundColor: config.backgroundColor,
                width: width,
                height: height,
                style: {
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `translate(${-(nodesBounds.x - margin)}px, ${-(nodesBounds.y - margin)}px)`,
                },
                pixelRatio: 2,
            });
            const a = document.createElement('a');
            a.download = `${currentProject?.name || 'er-diagram'}-${Date.now()}.png`;
            a.href = dataUrl;
            a.click();
            addToast(t('toast_export_success'), 'success');
        } catch (err) {
            console.error('Export failed', err);
        }
     };

     if (config.autoLayout) {
         withHistory(() => {
            const layouted = getLayoutedElements(nodes, edges);
            setNodes([...layouted.nodes]);
            setEdges([...layouted.edges]);
            
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
                setTimeout(runExport, 300);
            }, 50);
         });
     } else {
         runExport();
     }
  }, [nodes, edges, setNodes, setEdges, reactFlowInstance, withHistory, currentProject, addToast, t]);

  const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
      setEditor({ isOpen: true, tableId: node.id });
  };

  const handleUpdateTable = (id: string, newData: TableData) => {
      withHistory(() => {
          setNodes((nds) => nds.map((node) => {
              if (node.id === id) {
                  return { ...node, data: newData };
              }
              return node;
          }));
      });
      setEditor({ isOpen: false, tableId: null });
  };
  
  const handleDuplicateTable = (id: string, data: TableData) => {
      const newNodeId = `node-${Date.now()}`;
      const originalNode = nodes.find(n => n.id === id);
      if (!originalNode) return;

      const offset = 50;
      const newNode: Node<TableData> = {
          id: newNodeId,
          type: 'table',
          position: { 
              x: originalNode.position.x + offset, 
              y: originalNode.position.y + offset 
          },
          data: {
              ...data,
              label: `${data.label}_copy`,
              columns: data.columns.map(col => ({
                  ...col,
                  id: `${newNodeId}-${col.name}` // Ensure unique handles
              }))
          },
          selected: true
      };

      withHistory(() => {
          setNodes(nds => [...nds.map(n => ({...n, selected: false})), newNode]);
      });
      setEditor({ isOpen: false, tableId: null });
      addToast(t('toast_copy_success'), 'success');
  };
  
  const handleAddTable = () => {
      const id = `node-${Date.now()}`;
      const newNode: Node<TableData> = {
          id,
          position: { 
              x: -reactFlowInstance.getViewport().x + Math.random() * 100 + 100, 
              y: -reactFlowInstance.getViewport().y + Math.random() * 100 + 100
          },
          type: 'table',
          data: {
              label: 'New_Table',
              columns: [
                  { id: `${id}-id`, name: 'id', type: 'INT', isPk: true, isFk: false }
              ]
          }
      };
      withHistory(() => {
        setNodes((nds) => nds.concat(newNode));
      });
  };

  // --- Highlighting Logic ---
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  const onNodeMouseEnter = (_: React.MouseEvent, node: Node) => {
      setHoveredNode(node.id);
  };
  const onNodeMouseLeave = () => {
      setHoveredNode(null);
  };

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodeIds(new Set(nodes.map(n => n.id)));
      setSelectedEdgeIds(new Set(edges.map(e => e.id)));
    },
  });

  // Combined Highlight Effect (Hover + Selection)
  useEffect(() => {
    const isHighlightMode = hoveredNode !== null || selectedNodeIds.size > 0 || selectedEdgeIds.size > 0;
    
    const highlightedNodeIds = new Set<string>();
    const highlightedEdgeIds = new Set<string>();

    if (isHighlightMode) {
      // 1. Handle Edge Selection (Explicitly selected edges)
      // When an edge is selected, we highlight the edge and its connected nodes.
      // We do NOT propagate to other edges connected to those nodes.
      if (selectedEdgeIds.size > 0) {
        selectedEdgeIds.forEach(id => {
          highlightedEdgeIds.add(id);
          const edge = edges.find(e => e.id === id);
          if (edge) {
            highlightedNodeIds.add(edge.source);
            highlightedNodeIds.add(edge.target);
          }
        });
      }

      // 2. Handle Node Selection/Hover (Explicitly interacting with nodes)
      // When a node is hovered or selected, we highlight it, its connected edges, 
      // and the nodes at the other end of those edges.
      const rootNodeIds = new Set<string>();
      if (hoveredNode) rootNodeIds.add(hoveredNode);
      selectedNodeIds.forEach(id => rootNodeIds.add(id));

      if (rootNodeIds.size > 0) {
        rootNodeIds.forEach(id => highlightedNodeIds.add(id)); // Highlight the root nodes

        edges.forEach(edge => {
          // If this edge is connected to one of our root nodes
          if (rootNodeIds.has(edge.source) || rootNodeIds.has(edge.target)) {
            highlightedEdgeIds.add(edge.id);
            highlightedNodeIds.add(edge.source);
            highlightedNodeIds.add(edge.target);
          }
        });
      }
    }

    setNodes((nds) => {
      let hasChanges = false;
      const newNodes = nds.map((node) => {
        if (!isHighlightMode) {
          if (node.data.dimmed) {
            hasChanges = true;
            return { ...node, data: { ...node.data, dimmed: false } };
          }
          return node;
        }

        const shouldHighlight = highlightedNodeIds.has(node.id);
        const shouldDim = !shouldHighlight;

        if (!!node.data.dimmed !== shouldDim) {
          hasChanges = true;
          return { ...node, data: { ...node.data, dimmed: shouldDim } };
        }
        return node;
      });
      return hasChanges ? newNodes : nds;
    });

    setEdges((eds) => {
      let hasChanges = false;
      const newEdges = eds.map((edge) => {
        if (!isHighlightMode) {
          if (edge.className !== '') {
            hasChanges = true;
            return { ...edge, className: '' };
          }
          return edge;
        }

        const shouldHighlight = highlightedEdgeIds.has(edge.id);
        const newClass = shouldHighlight ? 'highlighted' : 'dimmed';

        if (edge.className !== newClass) {
          hasChanges = true;
          return { ...edge, className: newClass };
        }
        return edge;
      });
      return hasChanges ? newEdges : eds;
    });

  }, [hoveredNode, selectedNodeIds, selectedEdgeIds, edges, setNodes, setEdges]);

  // --- Search ---
  const handleSearch = (q: string) => {
      setSearchQuery(q);
      if (!q) {
          setNodes(nds => nds.map(n => ({ ...n, selected: false })));
          return;
      }
      
      const target = nodes.find(n => n.data.label.toLowerCase().includes(q.toLowerCase()));
      if (target) {
          setNodes(nds => nds.map(n => ({
              ...n,
              selected: n.id === target.id
          })));
          reactFlowInstance.fitView({ nodes: [target], duration: 800, padding: 2 });
      }
  };
  
  // --- Keyboard Shortcuts ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              undo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              redo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const pendingSourceNode = useMemo(() => nodes.find(n => n.id === pendingConnection?.source), [nodes, pendingConnection]);
  const pendingTargetNode = useMemo(() => nodes.find(n => n.id === pendingConnection?.target), [nodes, pendingConnection]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="w-full h-screen bg-background relative flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-1.5 rounded-lg shadow-lg">
                    <Database className="text-white" size={20} />
                </div>
                <h1 className="font-bold text-lg text-slate-100 tracking-tight hidden md:block">ER-Architect</h1>
            </div>
            
            {/* Project Name Input */}
            {currentProject && (
                <div className="flex items-center gap-2 group">
                   <input 
                      className="bg-transparent text-sm font-semibold text-slate-300 focus:text-white border border-transparent focus:border-slate-700 hover:border-slate-700/50 rounded px-2 py-1 focus:outline-none transition-all w-48"
                      value={currentProject.name}
                      onChange={(e) => handleUpdateProjectName(e.target.value)}
                   />
                   <div className="text-xs text-slate-500 flex items-center gap-1 w-20">
                      {isSaving ? (
                          <><div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-500 border-t-transparent"></div> {t('saving')}</>
                      ) : (
                          <><Save size={12} /> {t('saved')}</>
                      )}
                   </div>
                </div>
            )}
        </div>

        {/* Toolbar Center */}
        <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-border">
            <Button variant="ghost" size="icon" onClick={undo} disabled={history.length === 0} title={t('undo_tooltip')}>
                <Undo2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} title={t('redo_tooltip')}>
                <Redo2 size={16} />
            </Button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <Button variant="ghost" size="icon" onClick={handleAutoLayout} title={t('auto_layout_tooltip')}>
                 <Layout size={16} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setExportModalOpen(true)} title={t('export_png_tooltip')}>
                 <ImageIcon size={16} />
            </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
             <div className="relative group hidden xl:block">
                <Search className="absolute left-2.5 top-1.5 text-slate-500 group-focus-within:text-primary transition-colors" size={16} />
                <input 
                    className="bg-slate-900 border border-slate-700 rounded-full py-1 pl-9 pr-4 text-sm focus:outline-none focus:border-primary w-48 focus:w-64 text-slate-200 transition-all placeholder:text-slate-600"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
             </div>

             <div className="flex items-center gap-2">
                 {/* AI Button */}
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setAiModalOpen(true)} 
                    className="text-purple-300 hover:text-purple-200 hover:bg-purple-900/20 gap-2 border border-purple-500/20"
                    title={t('ai_btn_tooltip')}
                 >
                     <Sparkles size={16} className="text-purple-400" />
                     <span className="hidden lg:inline">{t('ai_title')}</span>
                 </Button>

                 <div className="w-px h-6 bg-slate-700 mx-1 hidden lg:block"></div>

                 <Button variant="ghost" size="sm" onClick={() => setProjectManagerOpen(true)} className="gap-2">
                     <FolderOpen size={16} /> <span className="hidden lg:inline">{t('projects')}</span>
                 </Button>
                 
                 <div className="w-px h-6 bg-slate-700 mx-1 hidden lg:block"></div>

                 <Button variant="ghost" size="icon" onClick={toggleLanguage} title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}>
                     <Languages size={16} />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => setShortcutsModalOpen(true)} title={t('shortcuts_tooltip')}>
                     <Keyboard size={16} />
                 </Button>
                 
                 <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)} title="Import SQL" className="hidden sm:flex">
                     <Upload size={16} className="mr-2" /> {t('import')}
                 </Button>
                 
                 <Button variant="secondary" size="sm" onClick={handleExportSQL} title="Export SQL" className="hidden sm:flex">
                     <Code size={16} className="mr-2" /> {t('export_ddl')}
                 </Button>
                 
                 <Button variant="primary" size="sm" onClick={handleAddTable} className="shadow-blue-500/20 shadow-lg">
                     <PlusCircle size={16} className="mr-2" /> {t('table')}
                 </Button>
             </div>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          className="bg-slate-950"
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={['Backspace', 'Delete']} 
          defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
              style: { strokeWidth: 2 } 
          }}
        >
          <Background color="#1e293b" gap={24} size={1} />
          <Controls className="!bg-surface !border-border !shadow-xl" />
          <MiniMap 
            nodeColor="#475569" 
            maskColor="rgba(15, 23, 42, 0.6)"
            className="!bg-surface !border-border !rounded-lg !overflow-hidden !shadow-xl !bottom-8 !right-8"
            zoomable
            pannable
          />
        </ReactFlow>

        {importModalOpen && (
            <ImportModal 
                onImport={handleImportDDL} 
                onClose={() => setImportModalOpen(false)} 
            />
        )}
        
        {shortcutsModalOpen && (
            <ShortcutsModal onClose={() => setShortcutsModalOpen(false)} />
        )}

        {exportModalOpen && (
            <ExportModal 
                onExport={performExport} 
                onClose={() => setExportModalOpen(false)}
            />
        )}

        {projectManagerOpen && (
            <ProjectManager 
                onClose={() => setProjectManagerOpen(false)}
                onLoadProject={loadProject}
                onDeleteProject={handleProjectDelete}
                currentProjectId={currentProject?.id || null}
            />
        )}

        {aiModalOpen && (
            <AiModal 
                onClose={() => setAiModalOpen(false)}
                onSuccess={handleAiGeneratedSQL}
            />
        )}

        {editor.isOpen && nodes.find(n => n.id === editor.tableId) && (
            <EditorPanel 
                tableId={editor.tableId!}
                data={nodes.find(n => n.id === editor.tableId)!.data}
                onClose={() => setEditor({ isOpen: false, tableId: null })}
                onSave={handleUpdateTable}
                onDuplicate={handleDuplicateTable}
            />
        )}

        {showRelModal && pendingSourceNode && pendingTargetNode && (
            <RelationshipModal
                sourceName={pendingSourceNode.data.label}
                targetName={pendingTargetNode.data.label}
                onConfirm={confirmRelationship}
                onCancel={() => {
                    setShowRelModal(false);
                    setPendingConnection(null);
                }}
            />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}