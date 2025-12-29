import { useEffect, useMemo, useState } from 'react';
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
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckSquare, Filter } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskStatus } from '@/lib/types';
import { TaskCard } from '@/components/shared/TaskCard';
import { TaskDetailDrawer } from '@/components/dialogs/TaskDetailDrawer';
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

function SortableTaskCard({ 
  task, 
  onTaskClick 
}: { 
  task: Task; 
  onTaskClick: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={() => onTaskClick(task)} 
      className="cursor-pointer"
    >
      <TaskCard task={task} />
    </div>
  );
}

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
            <SortableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
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
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);

  const [orderByStatus, setOrderByStatus] = useState<Record<TaskStatus, string[]>>({
    backlog: [],
    todo: [],
    'in-progress': [],
    blocked: [],
    done: [],
  });

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

  // Keep a stable, user-controlled order per column.
  useEffect(() => {
    const idsByStatus: Record<TaskStatus, string[]> = {
      backlog: [],
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };

    filteredTasks.forEach(t => {
      idsByStatus[t.status].push(t.id);
    });

    setOrderByStatus(prev => {
      const next: Record<TaskStatus, string[]> = { ...prev };
      (Object.keys(idsByStatus) as TaskStatus[]).forEach(status => {
        const ids = idsByStatus[status];
        const kept = (prev[status] || []).filter(id => ids.includes(id));
        const added = ids.filter(id => !kept.includes(id));
        next[status] = [...kept, ...added];
      });
      return next;
    });
  }, [filteredTasks]);

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

    (Object.keys(grouped) as TaskStatus[]).forEach(status => {
      const order = orderByStatus[status] || [];
      const orderIndex = new Map(order.map((id, idx) => [id, idx]));
      grouped[status].sort((a, b) => {
        const ai = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bi = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return grouped;
  }, [filteredTasks, orderByStatus]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) {
      setOverColumn(null);
      return;
    }

    const isColumn = COLUMNS.some(c => c.id === overId);
    if (isColumn) {
      setOverColumn(overId as TaskStatus);
      return;
    }

    const overTask = tasks.find(t => t.id === overId);
    setOverColumn(overTask?.status ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverColumn(null);

    const activeId = active?.id ? String(active.id) : null;
    const overId = over?.id ? String(over.id) : null;
    if (!activeId || !overId || activeId === overId) return;

    const activeTaskRow = tasks.find(t => t.id === activeId);
    if (!activeTaskRow) return;

    const overIsColumn = COLUMNS.some(c => c.id === overId);
    const overTaskRow = overIsColumn ? null : tasks.find(t => t.id === overId);
    const nextStatus: TaskStatus | null = overIsColumn
      ? (overId as TaskStatus)
      : (overTaskRow?.status ?? null);

    if (!nextStatus) return;

    // Update in-column order immediately for snappy UI.
    setOrderByStatus(prev => {
      const fromStatus = activeTaskRow.status;
      const next: Record<TaskStatus, string[]> = { ...prev };

      if (fromStatus === nextStatus) {
        if (!overTaskRow) return next;

        const order = next[nextStatus] || [];
        const oldIndex = order.indexOf(activeId);
        const newIndex = order.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return next;

        next[nextStatus] = arrayMove(order, oldIndex, newIndex);
        return next;
      }

      // Move across columns
      next[fromStatus] = (next[fromStatus] || []).filter(id => id !== activeId);

      const toOrder = (next[nextStatus] || []).filter(id => id !== activeId);
      const insertAt = overTaskRow ? toOrder.indexOf(overId) : toOrder.length;
      toOrder.splice(insertAt < 0 ? toOrder.length : insertAt, 0, activeId);
      next[nextStatus] = toOrder;

      return next;
    });

    // Persist status change.
    if (activeTaskRow.status !== nextStatus) {
      updateTaskStatus(activeId, nextStatus);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDrawerOpen(true);
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
          collisionDetection={closestCenter}
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

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={taskDrawerOpen}
        onOpenChange={setTaskDrawerOpen}
      />
    </div>
  );
}