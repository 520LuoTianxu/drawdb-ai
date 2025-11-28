
import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, Trash2, X, FileText, Clock, ShoppingBag, Newspaper, GraduationCap, LayoutTemplate, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Project } from '../types';
import { storage } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { templates, Template } from '../services/templates';
import { parseDDL } from '../services/sqlParser';
import { getLayoutedElements } from '../services/layoutService';

interface ProjectManagerProps {
  onClose: () => void;
  onLoadProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  currentProjectId: string | null;
}

const iconMap: Record<string, React.FC<any>> = {
  ShoppingBag,
  Newspaper,
  GraduationCap
};

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onClose, onLoadProject, onDeleteProject, currentProjectId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create'>('list');
  const { t } = useLanguage();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await storage.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setLoading(false);
    }
  };

  const createProjectFromTemplate = async (template?: Template) => {
    let nodes: any[] = [];
    let edges: any[] = [];

    if (template) {
        const parsed = parseDDL(template.sql);
        // Use a default layout direction or logic here
        const layouted = getLayoutedElements(parsed.nodes, parsed.edges);
        nodes = layouted.nodes;
        edges = layouted.edges;
    }

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: template 
        ? `${t(template.nameKey as any)} ${new Date().toLocaleDateString()}`
        : `Untitled Project ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: nodes,
      edges: edges,
      version: 1
    };

    try {
        await storage.saveProject(newProject);
        onLoadProject(newProject);
        onClose();
    } catch (err) {
        console.error("Failed to create project", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t('pm_delete_confirm'))) {
      const previousProjects = [...projects];
      setProjects(prev => prev.filter(p => p.id !== id));
      
      // Notify parent to handle active project state immediately
      onDeleteProject(id);

      try {
        await storage.deleteProject(id);
      } catch (err) {
        console.error("Delete failed", err);
        setProjects(previousProjects);
      }
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderTemplateSelection = () => (
      <div className="flex flex-col h-full overflow-hidden">
         <div className="mb-4 flex items-center gap-2 shrink-0">
             <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1">
                 <ArrowLeft size={16} /> {t('pm_back')}
             </Button>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 overflow-y-auto pr-2">
            {/* Blank Project */}
            <div 
              onClick={() => createProjectFromTemplate(undefined)}
              className="p-5 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-primary cursor-pointer transition-all group flex flex-col items-center text-center gap-4 hover:-translate-y-1 hover:shadow-xl"
            >
               <div className="p-4 bg-slate-800 rounded-full group-hover:bg-blue-500/20 text-slate-400 group-hover:text-primary transition-colors">
                  <FileText size={32} />
               </div>
               <div>
                   <h3 className="font-bold text-slate-100 mb-1">{t('pm_blank')}</h3>
                   <p className="text-xs text-slate-500 leading-snug">{t('pm_blank_desc')}</p>
               </div>
            </div>

            {/* Templates */}
            {templates.map(tpl => {
                const Icon = iconMap[tpl.icon] || LayoutTemplate;
                return (
                    <div 
                      key={tpl.id}
                      onClick={() => createProjectFromTemplate(tpl)}
                      className="p-5 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-purple-500 cursor-pointer transition-all group flex flex-col items-center text-center gap-4 hover:-translate-y-1 hover:shadow-xl"
                    >
                       <div className="p-4 bg-slate-800 rounded-full group-hover:bg-purple-500/20 text-slate-400 group-hover:text-purple-400 transition-colors">
                          <Icon size={32} />
                       </div>
                       <div>
                           <h3 className="font-bold text-slate-100 mb-1">{t(tpl.nameKey as any)}</h3>
                           <p className="text-xs text-slate-500 leading-snug">{t(tpl.descKey as any)}</p>
                       </div>
                    </div>
                );
            })}
         </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animation-fade-in p-4">
      <div className="bg-surface w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl border border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-surface rounded-t-lg z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderOpen size={20} className="text-primary"/> 
            {view === 'list' ? t('pm_title') : t('pm_templates')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-6">
           {view === 'create' ? renderTemplateSelection() : (
               <div className="flex flex-col h-full">
                  {/* Create New Button */}
                  <div className="mb-6 shrink-0">
                      <button 
                        onClick={() => setView('create')}
                        className="w-full py-4 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:border-primary hover:text-primary hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 group"
                      >
                         <div className="bg-slate-800 p-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                            <Plus size={20} />
                         </div>
                         <span className="font-semibold">{t('pm_create_new')}</span>
                      </button>
                  </div>

                  {/* Project List */}
                  {loading ? (
                      <div className="flex-1 flex items-center justify-center text-slate-500">
                          Loading...
                      </div>
                  ) : projects.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-60">
                          <FolderOpen size={48} className="mb-4 stroke-1"/>
                          <p>{t('pm_no_projects')}</p>
                      </div>
                  ) : (
                      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                          {projects.map(project => (
                              <div 
                                key={project.id} 
                                className={`group p-4 rounded-lg border bg-slate-900/30 transition-all cursor-pointer relative hover:shadow-lg ${
                                    currentProjectId === project.id 
                                    ? 'border-primary ring-1 ring-primary/50' 
                                    : 'border-slate-700 hover:border-slate-500'
                                }`}
                                onClick={() => {
                                    onLoadProject(project);
                                    onClose();
                                }}
                              >
                                 <div className="flex items-start justify-between mb-3">
                                     <div className="p-2 bg-slate-800 rounded text-blue-400">
                                         <FileText size={20} />
                                     </div>
                                     {currentProjectId === project.id && (
                                         <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                                             ACTIVE
                                         </span>
                                     )}
                                 </div>
                                 
                                 <h3 className="font-bold text-slate-200 truncate pr-6 mb-1">{project.name}</h3>
                                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                     <Clock size={12} />
                                     <span>{formatDate(project.updatedAt)}</span>
                                 </div>

                                 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        className="p-1.5 hover:bg-red-900/50 text-slate-500 hover:text-red-400 rounded transition-colors"
                                        onClick={(e) => handleDelete(e, project.id)}
                                        title={t('pm_delete')}
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                 </div>
                              </div>
                          ))}
                      </div>
                  )}
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
