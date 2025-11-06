import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateVersionButtonProps {
  reportId: string;
  onVersionCreated?: () => void;
}

export function CreateVersionButton({ 
  reportId, 
  onVersionCreated 
}: CreateVersionButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  const createMutation = trpc.technicalReports.versioning.createVersion.useMutation({
    onSuccess: (data) => {
      toast.success(t('messages.version_created', { version: data.version.versionNumber.toString() }));
      setOpen(false);
      setChangeSummary('');
      onVersionCreated?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      reportId,
      changeSummary: changeSummary || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('actions.create_version')}
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('actions.create_version')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="changeSummary">{t('change_summary')}</Label>
            <Textarea
              id="changeSummary"
              placeholder="Descreva as mudanças realizadas nesta versão..."
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('actions.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
