import { useMemo } from 'react';
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
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { TaskCard } from '@/components/shared/TaskCard';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { IdeaCard } from '@/components/shared/IdeaCard';
import { Button } from '@/components/ui/button';
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

export function AreaDetailView() {
  const { areas, projects, tasks, ideas, selectedAreaId, setSelectedAreaId, setCurrentView, openQuickAdd } = useApp();

  const area = areas.find(a => a.id === selectedAreaId);

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
        
        <div className="flex items-center gap-4">
          <div className={cn(
            'h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center glow-sm',
            gradient
          )}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{area.name}</h1>
            {area.description && (
              <p className="text-muted-foreground">{area.description}</p>
            )}
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
          <Button variant="ghost" size="sm" onClick={() => openQuickAdd({ type: 'project' })}>
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
          <Button variant="ghost" size="sm" onClick={() => openQuickAdd({ type: 'task' })}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>

        {areaTasks.length > 0 ? (
          <div className="space-y-2">
            {areaTasks.map(task => (
              <TaskCard key={task.id} task={task} isDraggable={false} />
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
          <Button variant="ghost" size="sm" onClick={() => openQuickAdd({ type: 'idea' })}>
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
    </div>
  );
}