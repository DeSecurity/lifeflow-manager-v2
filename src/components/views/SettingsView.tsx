import { useRef, useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Palette,
  LogOut,
  Download,
  Upload,
  Database,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SettingsView() {
  const { settings, updateSettings } = useApp();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [areasR, tagsR, projectsR, tasksR, ideasR, settingsR, profileR] = await Promise.all([
        supabase.from('areas').select('*'),
        supabase.from('tags').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('ideas').select('*'),
        supabase.from('user_settings').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        data: {
          areas: areasR.data || [],
          tags: tagsR.data || [],
          projects: projectsR.data || [],
          tasks: tasksR.data || [],
          ideas: ideasR.data || [],
          user_settings: settingsR.data || [],
          profiles: profileR.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-pm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export complete', description: 'Your backup has been downloaded.' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!confirm('Import will ADD the backed-up rows to your account. Existing data will not be deleted, but duplicates may appear if you import the same backup twice. Continue?')) return;

    setImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const data = payload.data || {};

      // Map old IDs -> new IDs to maintain relationships
      const areaIdMap = new Map<string, string>();
      const projectIdMap = new Map<string, string>();
      const taskIdMap = new Map<string, string>();
      const tagIdMap = new Map<string, string>();

      const stripIds = (row: any) => {
        const { id, user_id, created_at, updated_at, ...rest } = row;
        return { ...rest, user_id: user.id };
      };

      // Areas
      for (const row of data.areas || []) {
        const { data: inserted, error } = await supabase
          .from('areas').insert(stripIds(row)).select('id').single();
        if (error) throw error;
        areaIdMap.set(row.id, inserted.id);
      }

      // Tags
      for (const row of data.tags || []) {
        const { data: inserted, error } = await supabase
          .from('tags').insert(stripIds(row)).select('id').single();
        if (error) throw error;
        tagIdMap.set(row.id, inserted.id);
      }

      const remapTags = (tags: string[] | null | undefined) =>
        (tags || []).map(t => tagIdMap.get(t) || t);

      // Projects
      for (const row of data.projects || []) {
        const base = stripIds(row);
        base.area_id = row.area_id ? areaIdMap.get(row.area_id) || null : null;
        base.tags = remapTags(row.tags);
        const { data: inserted, error } = await supabase
          .from('projects').insert(base).select('id').single();
        if (error) throw error;
        projectIdMap.set(row.id, inserted.id);
      }

      // Tasks: insert in two passes (parent_task_id may reference other tasks)
      const tasks = data.tasks || [];
      // First pass: insert without parent_task_id
      for (const row of tasks) {
        const base = stripIds(row);
        base.area_id = row.area_id ? areaIdMap.get(row.area_id) || null : null;
        base.project_id = row.project_id ? projectIdMap.get(row.project_id) || null : null;
        base.tags = remapTags(row.tags);
        base.parent_task_id = null;
        const { data: inserted, error } = await supabase
          .from('tasks').insert(base).select('id').single();
        if (error) throw error;
        taskIdMap.set(row.id, inserted.id);
      }
      // Second pass: set parent_task_id
      for (const row of tasks) {
        if (!row.parent_task_id) continue;
        const newId = taskIdMap.get(row.id);
        const newParent = taskIdMap.get(row.parent_task_id);
        if (newId && newParent) {
          await supabase.from('tasks').update({ parent_task_id: newParent }).eq('id', newId);
        }
      }

      // Ideas
      for (const row of data.ideas || []) {
        const base = stripIds(row);
        base.area_id = row.area_id ? areaIdMap.get(row.area_id) || null : null;
        base.tags = remapTags(row.tags);
        const { error } = await supabase.from('ideas').insert(base);
        if (error) throw error;
      }

      toast({
        title: 'Import complete',
        description: `Imported ${data.areas?.length || 0} areas, ${data.projects?.length || 0} projects, ${tasks.length} tasks, ${data.ideas?.length || 0} ideas. Refresh to see them.`,
      });

      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Customize your experience</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Account */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-foreground">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                </div>
              </div>
              <Select
                value={settings.theme}
                onValueChange={v => updateSettings({ theme: v as 'dark' | 'light' })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Hide completed tasks</p>
                <p className="text-sm text-muted-foreground">Hide completed tasks from views</p>
              </div>
              <Switch
                checked={settings.hideCompletedTasks}
                onCheckedChange={v => updateSettings({ hideCompletedTasks: v })}
              />
            </div>
          </div>
        </section>

        {/* App Info */}
        <section className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Life PM v1.0.0 • Your data is synced to the cloud
          </p>
        </section>
      </div>
    </div>
  );
}
