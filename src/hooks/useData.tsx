/**
 * Data hook for managing all app data with Supabase
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { 
  Area, 
  Tag, 
  Project, 
  Task, 
  Idea, 
  TaskStatus, 
  ProjectStatus, 
  Priority,
  ProfileSettings,
  ChecklistItem,
} from '@/lib/types';

interface DataContextType {
  // Data
  areas: Area[];
  tags: Tag[];
  projects: Project[];
  tasks: Task[];
  ideas: Idea[];
  settings: ProfileSettings;
  loading: boolean;
  
  // Area actions
  createArea: (area: Omit<Area, 'id'>) => Promise<void>;
  updateArea: (id: string, updates: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  
  // Tag actions
  createTag: (tag: Omit<Tag, 'id'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  // Project actions
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Task actions
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'checklistItems'> & { checklistItems?: ChecklistItem[] }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  toggleTaskToday: (id: string) => Promise<void>;
  
  // Idea actions
  createIdea: (idea: Omit<Idea, 'id' | 'createdAt'>) => Promise<void>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  convertIdeaToProject: (ideaId: string) => Promise<void>;
  convertIdeaToTask: (ideaId: string, projectId?: string) => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<ProfileSettings>) => Promise<void>;
  
  // Refresh
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [settings, setSettings] = useState<ProfileSettings>({
    theme: 'dark',
    defaultView: 'today',
    defaultTaskGrouping: 'project',
    hideCompletedTasks: false,
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [areasRes, tagsRes, projectsRes, tasksRes, ideasRes, settingsRes] = await Promise.all([
        supabase.from('areas').select('*').order('created_at'),
        supabase.from('tags').select('*').order('created_at'),
        supabase.from('projects').select('*').order('created_at'),
        supabase.from('tasks').select('*').order('created_at'),
        supabase.from('ideas').select('*').order('created_at'),
        supabase.from('user_settings').select('*').single(),
      ]);

      if (areasRes.data) {
        setAreas(areasRes.data.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description || undefined,
          color: a.color || undefined,
          icon: a.icon || undefined,
        })));
      }

      if (tagsRes.data) {
        setTags(tagsRes.data.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color || undefined,
        })));
      }

      if (projectsRes.data) {
        setProjects(projectsRes.data.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description || undefined,
          areaId: p.area_id || '',
          status: p.status as ProjectStatus,
          priority: p.priority as Priority,
          tags: p.tags || [],
          startDate: p.start_date || undefined,
          dueDate: p.due_date || undefined,
          goalType: p.goal_type as any || undefined,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          archived: p.archived || false,
          isFocus: p.is_focus || false,
        })));
      }

      if (tasksRes.data) {
        setTasks(tasksRes.data.map(t => ({
          id: t.id,
          projectId: t.project_id || undefined,
          parentTaskId: t.parent_task_id || undefined,
          title: t.title,
          description: t.description || undefined,
          status: t.status as TaskStatus,
          priority: t.priority as Priority,
          tags: t.tags || [],
          areaId: t.area_id || undefined,
          estimateMinutes: t.estimate_minutes || undefined,
          timeSpentMinutes: t.time_spent_minutes || 0,
          dueDate: t.due_date || undefined,
          isToday: t.is_today || false,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          completedAt: t.completed_at || undefined,
          checklistItems: (t.checklist_items as unknown as ChecklistItem[]) || [],
        })));
      }

      if (ideasRes.data) {
        setIdeas(ideasRes.data.map(i => ({
          id: i.id,
          title: i.title,
          notes: i.notes || undefined,
          areaId: i.area_id || undefined,
          tags: i.tags || [],
          createdAt: i.created_at,
          archived: i.archived || false,
        })));
      }

      if (settingsRes.data) {
        setSettings({
          theme: settingsRes.data.theme as 'dark' | 'light',
          defaultView: settingsRes.data.default_view as any,
          defaultTaskGrouping: settingsRes.data.default_task_grouping as any,
          hideCompletedTasks: settingsRes.data.hide_completed_tasks,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Area actions
  const createArea = async (area: Omit<Area, 'id'>) => {
    if (!user) return;
    const { error } = await supabase.from('areas').insert({
      user_id: user.id,
      name: area.name,
      description: area.description,
      color: area.color,
      icon: area.icon,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const updateArea = async (id: string, updates: Partial<Area>) => {
    const { error } = await supabase.from('areas').update({
      name: updates.name,
      description: updates.description,
      color: updates.color,
      icon: updates.icon,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const deleteArea = async (id: string) => {
    const { error } = await supabase.from('areas').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  // Tag actions
  const createTag = async (tag: Omit<Tag, 'id'>) => {
    if (!user) return;
    const { error } = await supabase.from('tags').insert({
      user_id: user.id,
      name: tag.name,
      color: tag.color,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    const { error } = await supabase.from('tags').update({
      name: updates.name,
      color: updates.color,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  // Project actions
  const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      title: project.title,
      description: project.description,
      area_id: project.areaId || null,
      status: project.status,
      priority: project.priority,
      tags: project.tags,
      start_date: project.startDate,
      due_date: project.dueDate,
      goal_type: project.goalType,
      archived: project.archived,
      is_focus: project.isFocus,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.areaId !== undefined) updateData.area_id = updates.areaId || null;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.goalType !== undefined) updateData.goal_type = updates.goalType;
    if (updates.archived !== undefined) updateData.archived = updates.archived;
    if (updates.isFocus !== undefined) updateData.is_focus = updates.isFocus;

    const { error } = await supabase.from('projects').update(updateData).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  // Task actions
  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'checklistItems'> & { checklistItems?: ChecklistItem[] }) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').insert([{
      user_id: user.id,
      project_id: task.projectId || null,
      parent_task_id: task.parentTaskId || null,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      area_id: task.areaId || null,
      estimate_minutes: task.estimateMinutes,
      time_spent_minutes: task.timeSpentMinutes || 0,
      due_date: task.dueDate,
      is_today: task.isToday,
      checklist_items: (task.checklistItems || []) as unknown as any,
      completed_at: task.completedAt,
    }]);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updateData: any = {};
    if (updates.projectId !== undefined) updateData.project_id = updates.projectId || null;
    if (updates.parentTaskId !== undefined) updateData.parent_task_id = updates.parentTaskId || null;
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'done') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.areaId !== undefined) updateData.area_id = updates.areaId || null;
    if (updates.estimateMinutes !== undefined) updateData.estimate_minutes = updates.estimateMinutes;
    if (updates.timeSpentMinutes !== undefined) updateData.time_spent_minutes = updates.timeSpentMinutes;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.isToday !== undefined) updateData.is_today = updates.isToday;
    if (updates.checklistItems !== undefined) updateData.checklist_items = updates.checklistItems as unknown as any;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

    const { error } = await supabase.from('tasks').update(updateData).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    await updateTask(id, { status });
  };

  const toggleTaskToday = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      await updateTask(id, { isToday: !task.isToday });
    }
  };

  // Idea actions
  const createIdea = async (idea: Omit<Idea, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      title: idea.title,
      notes: idea.notes,
      area_id: idea.areaId || null,
      tags: idea.tags,
      archived: idea.archived,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const updateIdea = async (id: string, updates: Partial<Idea>) => {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.areaId !== undefined) updateData.area_id = updates.areaId || null;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.archived !== undefined) updateData.archived = updates.archived;

    const { error } = await supabase.from('ideas').update(updateData).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const deleteIdea = async (id: string) => {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await fetchData();
    }
  };

  const convertIdeaToProject = async (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea || !user) return;

    await createProject({
      title: idea.title,
      description: idea.notes,
      areaId: idea.areaId || areas[0]?.id || '',
      status: 'backlog',
      priority: 'medium',
      tags: idea.tags,
    });

    await deleteIdea(ideaId);
  };

  const convertIdeaToTask = async (ideaId: string, projectId?: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea || !user) return;

    await createTask({
      projectId,
      title: idea.title,
      description: idea.notes,
      status: 'todo',
      priority: 'medium',
      tags: idea.tags,
      areaId: idea.areaId,
    });

    await deleteIdea(ideaId);
  };

  // Settings
  const updateSettings = async (newSettings: Partial<ProfileSettings>) => {
    if (!user) return;
    
    const updateData: any = {};
    if (newSettings.theme !== undefined) updateData.theme = newSettings.theme;
    if (newSettings.defaultView !== undefined) updateData.default_view = newSettings.defaultView;
    if (newSettings.defaultTaskGrouping !== undefined) updateData.default_task_grouping = newSettings.defaultTaskGrouping;
    if (newSettings.hideCompletedTasks !== undefined) updateData.hide_completed_tasks = newSettings.hideCompletedTasks;

    const { error } = await supabase.from('user_settings').update(updateData).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  const value: DataContextType = {
    areas,
    tags,
    projects,
    tasks,
    ideas,
    settings,
    loading,
    createArea,
    updateArea,
    deleteArea,
    createTag,
    updateTag,
    deleteTag,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    toggleTaskToday,
    createIdea,
    updateIdea,
    deleteIdea,
    convertIdeaToProject,
    convertIdeaToTask,
    updateSettings,
    refreshData: fetchData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
