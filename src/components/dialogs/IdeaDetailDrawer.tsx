import { useState, useEffect } from 'react';
import { Trash2, X, Archive, ArchiveRestore } from 'lucide-react';
import { Idea } from '@/lib/types';
import { useApp } from '@/contexts/AppContext';
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

interface IdeaDetailDrawerProps {
  idea: Idea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IdeaDetailDrawer({ idea, open, onOpenChange }: IdeaDetailDrawerProps) {
  const { areas, updateIdea, deleteIdea, archiveIdea } = useApp();
  
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [areaId, setAreaId] = useState<string>('none');

  // Sync state when idea changes
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setNotes(idea.notes || '');
      setAreaId(idea.areaId || 'none');
    }
  }, [idea]);

  const handleSave = async () => {
    if (!idea || !title.trim()) return;

    await updateIdea(idea.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      areaId: areaId === 'none' ? undefined : areaId,
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!idea) return;
    await deleteIdea(idea.id);
    onOpenChange(false);
  };

  const handleArchive = async () => {
    if (!idea) return;
    await archiveIdea(idea.id);
    onOpenChange(false);
  };

  if (!idea) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">Edit Idea</SheetTitle>
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
              placeholder="Idea title"
              className="bg-surface-2 border-border"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="bg-surface-2 border-border resize-none"
              rows={5}
            />
          </div>

          {/* Area */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Area
            </label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="bg-surface-2 border-border">
                <SelectValue placeholder="No area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No area</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleArchive}
              className="flex-1"
            >
              {idea.archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
