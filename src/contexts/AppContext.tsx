/**
 * Global application state context
 * Manages navigation and UI state, delegates data operations to useData
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ViewType } from '@/lib/types';
import { useData } from '@/hooks/useData';

interface QuickAddDefaults {
  type?: 'idea' | 'task' | 'project';
  isToday?: boolean;
  areaId?: string;
}

interface AppContextType {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;
  
  // Quick add
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  quickAddDefaults: QuickAddDefaults;
  openQuickAdd: (defaults?: QuickAddDefaults) => void;
  
  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Data from useData hook (re-exported for convenience)
  areas: ReturnType<typeof useData>['areas'];
  tags: ReturnType<typeof useData>['tags'];
  projects: ReturnType<typeof useData>['projects'];
  tasks: ReturnType<typeof useData>['tasks'];
  ideas: ReturnType<typeof useData>['ideas'];
  settings: ReturnType<typeof useData>['settings'];
  loading: ReturnType<typeof useData>['loading'];
  
  // Actions from useData hook
  createArea: ReturnType<typeof useData>['createArea'];
  updateArea: ReturnType<typeof useData>['updateArea'];
  deleteArea: ReturnType<typeof useData>['deleteArea'];
  createTag: ReturnType<typeof useData>['createTag'];
  updateTag: ReturnType<typeof useData>['updateTag'];
  deleteTag: ReturnType<typeof useData>['deleteTag'];
  createProject: ReturnType<typeof useData>['createProject'];
  updateProject: ReturnType<typeof useData>['updateProject'];
  deleteProject: ReturnType<typeof useData>['deleteProject'];
  createTask: ReturnType<typeof useData>['createTask'];
  updateTask: ReturnType<typeof useData>['updateTask'];
  deleteTask: ReturnType<typeof useData>['deleteTask'];
  updateTaskStatus: ReturnType<typeof useData>['updateTaskStatus'];
  toggleTaskToday: ReturnType<typeof useData>['toggleTaskToday'];
  createIdea: ReturnType<typeof useData>['createIdea'];
  updateIdea: ReturnType<typeof useData>['updateIdea'];
  deleteIdea: ReturnType<typeof useData>['deleteIdea'];
  convertIdeaToProject: ReturnType<typeof useData>['convertIdeaToProject'];
  convertIdeaToTask: ReturnType<typeof useData>['convertIdeaToTask'];
  updateSettings: ReturnType<typeof useData>['updateSettings'];
  refreshData: ReturnType<typeof useData>['refreshData'];
  
  // Archive actions
  archiveProject: (id: string) => Promise<void>;
  archiveIdea: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load initial view from localStorage
  const [currentView, setCurrentViewState] = useState<ViewType>(() => {
    const saved = localStorage.getItem('currentView');
    return (saved as ViewType) || 'today';
  });
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(() => {
    return localStorage.getItem('selectedProjectId');
  });
  const [selectedAreaId, setSelectedAreaIdState] = useState<string | null>(() => {
    return localStorage.getItem('selectedAreaId');
  });
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaults, setQuickAddDefaults] = useState<QuickAddDefaults>({});
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() => {
    // Always start collapsed on mobile/small screens, regardless of stored preference
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return true;
    }
    const stored = localStorage.getItem('sidebarCollapsed');
    // Default to collapsed on first login / when not set
    return stored === null ? true : stored === 'true';
  });
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, []);

  // Auto-collapse sidebar when viewport shrinks to mobile size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarCollapsedState(true);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  
  // Persist view state
  const setCurrentView = useCallback((view: ViewType) => {
    setCurrentViewState(view);
    localStorage.setItem('currentView', view);
  }, []);
  
  const setSelectedProjectId = useCallback((id: string | null) => {
    setSelectedProjectIdState(id);
    if (id) {
      localStorage.setItem('selectedProjectId', id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, []);
  
  const setSelectedAreaId = useCallback((id: string | null) => {
    setSelectedAreaIdState(id);
    if (id) {
      localStorage.setItem('selectedAreaId', id);
    } else {
      localStorage.removeItem('selectedAreaId');
    }
  }, []);
  
  const openQuickAdd = useCallback((defaults: QuickAddDefaults = {}) => {
    setQuickAddDefaults(defaults);
    setQuickAddOpen(true);
  }, []);
  
  const data = useData();
  
  // Archive helpers
  const archiveProject = useCallback(async (id: string) => {
    await data.updateProject(id, { archived: true, status: 'completed' });
  }, [data]);
  
  const archiveIdea = useCallback(async (id: string) => {
    await data.updateIdea(id, { archived: true });
  }, [data]);
  
  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(data.settings.theme);
  }, [data.settings.theme]);
  
  const value: AppContextType = {
    currentView,
    setCurrentView,
    selectedProjectId,
    setSelectedProjectId,
    selectedAreaId,
    setSelectedAreaId,
    quickAddOpen,
    setQuickAddOpen,
    quickAddDefaults,
    openQuickAdd,
    sidebarCollapsed,
    setSidebarCollapsed,
    
    // Re-export data
    areas: data.areas,
    tags: data.tags,
    projects: data.projects,
    tasks: data.tasks,
    ideas: data.ideas,
    settings: data.settings,
    loading: data.loading,
    
    // Re-export actions
    createArea: data.createArea,
    updateArea: data.updateArea,
    deleteArea: data.deleteArea,
    createTag: data.createTag,
    updateTag: data.updateTag,
    deleteTag: data.deleteTag,
    createProject: data.createProject,
    updateProject: data.updateProject,
    deleteProject: data.deleteProject,
    createTask: data.createTask,
    updateTask: data.updateTask,
    deleteTask: data.deleteTask,
    updateTaskStatus: data.updateTaskStatus,
    toggleTaskToday: data.toggleTaskToday,
    createIdea: data.createIdea,
    updateIdea: data.updateIdea,
    deleteIdea: data.deleteIdea,
    convertIdeaToProject: data.convertIdeaToProject,
    convertIdeaToTask: data.convertIdeaToTask,
    updateSettings: data.updateSettings,
    refreshData: data.refreshData,
    
    archiveProject,
    archiveIdea,
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
