import { useMemo, useState } from 'react';
import { 
  DndContext, 
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CheckSquare, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskStatus } from '@/lib/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-status-backlog' },
  { id: 'todo', label: 'To Do', color: 'bg-status-todo' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-status-inprogress' },
  { id: 'done', label: 'Done', color: 'bg-status-done' },
];

function DroppableColumn({ 
  column, 
  tasks, 
  isOver,
  onTaskClick,
}: { 
  column: { id: TaskStatus; label: string; color: string }; 
  tasks: Task[];
  isOver: boolean;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      key={column.id}
      className="w-80 flex flex-col bg-surface-1 rounded-xl border border-border"
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', column.color)} />
          <h3 className="font-semibold text-foreground">{column.label}</h3>
          <span className="text-sm text-muted-foreground ml-auto">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div 
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 overflow-y-auto space-y-2 min-h-[200px] transition-colors',
          isOver && 'bg-primary/10'
        )}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <div key={task.id} onClick={() => onTaskClick(task)} className="cursor-pointer">
              <TaskCard task={task} />
            </div>
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div
            className={cn(
              'h-full min-h-[60px] rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm',
              isOver && 'border-primary'
            )}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function BoardView() {
  const { tasks, projects, areas, updateTaskStatus } = useApp();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;
      if (areaFilter !== 'all') {
        const taskArea = task.areaId || projects.find(p => p.id === task.projectId)?.areaId;
        if (taskArea !== areaFilter) return false;
      }
      return true;
    });
  }, [tasks, projects, projectFilter, areaFilter]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };
    
    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const columnId = COLUMNS.find(c => c.id === over.id)?.id;
      setOverColumn(columnId || null);
    } else {
      setOverColumn(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (over) {
      // Check if dropped on a column
      const newStatus = COLUMNS.find(c => c.id === over.id)?.id;
      if (newStatus && active.id) {
        const task = tasks.find(t => t.id === active.id);
        if (task && task.status !== newStatus) {
          updateTaskStatus(active.id as string, newStatus);
        }
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    // TODO: Open task detail modal/drawer
    console.log('Task clicked:', task.title);
  };

  return (
    <div className="h-screen flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Board</h1>
              <p className="text-sm text-muted-foreground">{filteredTasks.length} tasks</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.filter(p => !p.archived).map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[150px] bg-card border-border">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.filter(c => c.id !== 'blocked').map(column => (
              <DroppableColumn 
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id]}
                isOver={overColumn === column.id}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isDraggable={false} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}