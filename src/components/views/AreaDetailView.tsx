import { useEffect, useMemo, useState } from 'react';
import { 
  ArrowLeft,
  Briefcase, 
  Heart, 
  Users, 
  BookOpen, 
  Wallet, 
  Home, 
  Sparkles,
  FolderKanban,
  CheckSquare,
  Lightbulb,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/lib/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { IdeaCard } from '@/components/shared/IdeaCard';
import { TaskDetailDrawer } from '@/components/dialogs/TaskDetailDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const areaIcons: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  heart: Heart,
  users: Users,
  book: BookOpen,
  wallet: Wallet,
  home: Home,
  sparkles: Sparkles,
};

const areaColors: Record<string, string> = {
  'area-work': 'from-blue-500 to-blue-600',
  'area-health': 'from-green-500 to-emerald-600',
  'area-relationships': 'from-pink-500 to-rose-600',
  'area-learning': 'from-purple-500 to-violet-600',
  'area-finances': 'from-yellow-500 to-amber-600',
  'area-home': 'from-orange-500 to-orange-600',
  'area-personal': 'from-cyan-500 to-teal-600',
};

const iconOptions = [
  { value: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
];

const colorOptions = [
  { value: 'area-work', label: 'Blue' },
  { value: 'area-health', label: 'Green' },
  { value: 'area-relationships', label: 'Pink' },
  { value: 'area-learning', label: 'Purple' },
  { value: 'area-finances', label: 'Yellow' },
  { value: 'area-home', label: 'Orange' },
  { value: 'area-personal', label: 'Cyan' },
];

export function AreaDetailView() {
  const {
    areas,
    projects,
    tasks,
    ideas,
    selectedAreaId,
    setSelectedAreaId,
    setCurrentView,
    openQuickAdd,
    updateArea,
    deleteArea,
  } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('sparkles');
  const [editColor, setEditColor] = useState('area-personal');

  const area = areas.find(a => a.id === selectedAreaId);

  useEffect(() => {
    if (area && editOpen) {
      setEditName(area.name);
      setEditDescription(area.description || '');
      setEditIcon(area.icon || 'sparkles');
      setEditColor(area.color || 'area-personal');
    }
  }, [area, editOpen]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDrawerOpen(true);
  };

  const areaProjects = useMemo(() => {
    return projects.filter(p => p.areaId === selectedAreaId && !p.archived);
  }, [projects, selectedAreaId]);

  const areaTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.areaId === selectedAreaId) return true;
      const project = projects.find(p => p.id === t.projectId);
      return project?.areaId === selectedAreaId;
    }).filter(t => t.status !== 'done');
  }, [tasks, projects, selectedAreaId]);

  const areaIdeas = useMemo(() => {
    return ideas.filter(i => i.areaId === selectedAreaId && !i.archived);
  }, [ideas, selectedAreaId]);

  const handleBack = () => {
    setSelectedAreaId(null);
    setCurrentView('areas');
  };

  const handleSaveEdit = () => {
    if (!area || !editName.trim()) return;
    updateArea(area.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      icon: editIcon,
      color: editColor,
    });
    setEditOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!area) return;
    deleteArea(area.id);
    setDeleteOpen(false);
    handleBack();
  };

  if (!area) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Area not found</p>
        <Button variant="ghost" onClick={handleBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Areas
        </Button>
      </div>
    );
  }

  const Icon = areaIcons[area.icon || 'sparkles'] || Sparkles;
  const gradient = areaColors[area.color || 'area-personal'] || 'from-primary to-accent';

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Areas
        </Button>
        
        <div className="group flex items-center gap-4">
          <div className={cn(
            'h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center glow-sm',
            gradient
          )}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{area.name}</h1>
            {area.description && (
              <p className="text-muted-foreground">{area.description}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setEditOpen(true)}
              aria-label="Edit area"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete area"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Projects
            </h2>
            <span className="text-sm text-muted-foreground">({areaProjects.length})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openQuickAdd({ type: 'project', areaId: selectedAreaId || undefined })}>
            <Plus className="h-4 w-4 mr-1" />
            Add Project
          </Button>
        </div>

        {areaProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {areaProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <FolderKanban className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No projects in this area</p>
          </div>
        )}
      </section>

      {/* Tasks Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Tasks
            </h2>
            <span className="text-sm text-muted-foreground">({areaTasks.length})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openQuickAdd({ type: 'task', areaId: selectedAreaId || undefined })}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>

        {areaTasks.length > 0 ? (
          <div className="space-y-2">
            {areaTasks.map(task => (
              <div key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer">
                <TaskCard task={task} isDraggable={false} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <CheckSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No tasks in this area</p>
          </div>
        )}
      </section>

      {/* Ideas Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Ideas
            </h2>
            <span className="text-sm text-muted-foreground">({areaIdeas.length})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openQuickAdd({ type: 'idea', areaId: selectedAreaId || undefined })}>
            <Plus className="h-4 w-4 mr-1" />
            Add Idea
          </Button>
        </div>

        {areaIdeas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {areaIdeas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No ideas in this area</p>
          </div>
        )}
      </section>

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
      />

      {/* Edit Area Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Name</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Area name"
                className="bg-surface-2 border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Description</label>
              <Input
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Optional description"
                className="bg-surface-2 border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Icon</label>
                <Select value={editIcon} onValueChange={setEditIcon}>
                  <SelectTrigger className="bg-surface-2 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => {
                      const IconComponent = opt.icon;
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Color</label>
                <Select value={editColor} onValueChange={setEditColor}>
                  <SelectTrigger className="bg-surface-2 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3 w-3 rounded-full bg-gradient-to-r', areaColors[opt.value])} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{area.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the area. Projects and tasks assigned to it will lose their area
              association but won't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
