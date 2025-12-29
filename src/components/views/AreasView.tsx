import { useMemo, useState } from 'react';
import { 
  Layers, 
  Briefcase, 
  Heart, 
  Users, 
  BookOpen, 
  Wallet, 
  Home, 
  Sparkles,
  FolderKanban,
  CheckSquare,
  Plus,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
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

export function AreasView() {
  const { areas, projects, tasks, setCurrentView, setSelectedAreaId, createArea } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDescription, setNewAreaDescription] = useState('');
  const [newAreaIcon, setNewAreaIcon] = useState('sparkles');
  const [newAreaColor, setNewAreaColor] = useState('area-personal');

  const areaStats = useMemo(() => {
    return areas.map(area => {
      const areaProjects = projects.filter(p => p.areaId === area.id && !p.archived);
      const areaTasks = tasks.filter(t => {
        if (t.areaId === area.id) return true;
        const project = projects.find(p => p.id === t.projectId);
        return project?.areaId === area.id;
      });
      const completedTasks = areaTasks.filter(t => t.status === 'done').length;
      const progress = areaTasks.length > 0 ? completedTasks / areaTasks.length : 0;

      return {
        area,
        projects: areaProjects.length,
        totalTasks: areaTasks.length,
        completedTasks,
        progress,
      };
    });
  }, [areas, projects, tasks]);

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    
    createArea({
      name: newAreaName.trim(),
      description: newAreaDescription.trim() || undefined,
      icon: newAreaIcon,
      color: newAreaColor,
    });

    setNewAreaName('');
    setNewAreaDescription('');
    setNewAreaIcon('sparkles');
    setNewAreaColor('area-personal');
    setShowAddDialog(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center glow-sm">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Areas of Life</h1>
            <p className="text-muted-foreground">Organize your life into meaningful categories</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Area
        </Button>
      </div>

      {/* Areas Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {areaStats.map(({ area, projects: projectCount, totalTasks, completedTasks, progress }) => {
          const Icon = areaIcons[area.icon || 'sparkles'] || Sparkles;
          const gradient = areaColors[area.color || 'area-personal'] || 'from-primary to-accent';

          return (
            <div
              key={area.id}
              onClick={() => {
                setSelectedAreaId(area.id);
                setCurrentView('area-detail');
              }}
              className={cn(
                'group relative bg-card rounded-xl border border-border p-5 transition-all duration-200',
                'hover:border-muted-foreground/30 hover:shadow-lg cursor-pointer'
              )}
            >
              {/* Icon & Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                  'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
                  gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg">{area.name}</h3>
                  {area.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">{area.description}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {projectCount} project{projectCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {completedTasks}/{totalTasks} tasks
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500 bg-gradient-to-r', gradient)}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Area Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Name
              </label>
              <Input
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                placeholder="Area name"
                className="bg-surface-2 border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Description
              </label>
              <Input
                value={newAreaDescription}
                onChange={e => setNewAreaDescription(e.target.value)}
                placeholder="Optional description"
                className="bg-surface-2 border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Icon
                </label>
                <Select value={newAreaIcon} onValueChange={setNewAreaIcon}>
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
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Color
                </label>
                <Select value={newAreaColor} onValueChange={setNewAreaColor}>
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
              <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddArea} disabled={!newAreaName.trim()}>
                Add Area
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
