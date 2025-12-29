import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Sun, Trash2, X } from 'lucide-react';
import { Task, Priority, TaskStatus } from '@/lib/types';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-priority-low' },
  { value: 'medium', label: 'Medium', color: 'bg-priority-medium' },
  { value: 'high', label: 'High', color: 'bg-priority-high' },
  { value: 'critical', label: 'Critical', color: 'bg-priority-critical' },
];

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export function TaskDetailDrawer({ task, open, onOpenChange }: TaskDetailDrawerProps) {
  const { projects, updateTask, deleteTask, toggleTaskToday } = useApp();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimateMinutes, setEstimateMinutes] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [isToday, setIsToday] = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setEstimateMinutes(task.estimateMinutes?.toString() || '');
      setProjectId(task.projectId || '');
      setIsToday(task.isToday || false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;

    await updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate?.toISOString(),
      estimateMinutes: estimateMinutes ? parseInt(estimateMinutes) : undefined,
      projectId: projectId || undefined,
      isToday,
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    await deleteTask(task.id);
    onOpenChange(false);
  };

  const handleToggleToday = () => {
    setIsToday(!isToday);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">Edit Task</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Title
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              className="bg-surface-2 border-border"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="bg-surface-2 border-border resize-none"
              rows={3}
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Status
              </label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="bg-surface-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Priority
              </label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="bg-surface-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Project
            </label>
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
              <SelectTrigger className="bg-surface-2 border-border">
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.filter(p => !p.archived).map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date & Estimate Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Due Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-surface-2 border-border',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Set date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Time Estimate
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={estimateMinutes}
                  onChange={e => setEstimateMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="pl-10 bg-surface-2 border-border"
                />
              </div>
            </div>
          </div>

          {/* Today Toggle */}
          <div>
            <Button
              type="button"
              variant={isToday ? 'default' : 'outline'}
              onClick={handleToggleToday}
              className="w-full"
            >
              <Sun className="h-4 w-4 mr-2" />
              {isToday ? 'Added to Today' : 'Add to Today'}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}