import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Eye 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es, fr } from 'date-fns/locale';

interface VersionHistoryProps {
  reportId: string;
  onRollback?: (versionNumber: number) => void;
}

const localeMap = {
  pt: ptBR,
  en: enUS,
  es: es,
  fr: fr,
};

export function VersionHistory({ reportId, onRollback }: VersionHistoryProps) {
  const { t, locale } = useTranslation();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  
  const { data: history, isLoading, refetch } = trpc.technicalReports.versioning.getHistory.useQuery({
    reportId,
  });

  const rollbackMutation = trpc.technicalReports.versioning.rollback.useMutation({
    onSuccess: () => {
      refetch();
      if (selectedVersion) {
        onRollback?.(selectedVersion);
      }
    },
  });

  const handleRollback = (versionNumber: number) => {
    if (confirm(t('messages.confirm_rollback_message', { version: versionNumber.toString() }))) {
      setSelectedVersion(versionNumber);
      rollbackMutation.mutate({ reportId, targetVersionNumber: versionNumber });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <span>{t('messages.loading')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.totalVersions === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{t('messages.no_versions')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('version_history')}
          <Badge variant="secondary">{history.totalVersions}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {history.versions.map((version, index) => (
              <div
                key={version.id}
                className={`
                  p-4 rounded-lg border transition-colors
                  ${selectedVersion === version.versionNumber 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={index === 0 ? 'default' : 'outline'}>
                        {t('version_number', { number: version.versionNumber.toString() })}
                      </Badge>
                      
                      {index === 0 && (
                        <Badge variant="secondary">{t('current_version')}</Badge>
                      )}
                      
                      {version.qpValidated && (
                        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {t('validated_by_qp')}
                        </Badge>
                      )}
                      
                      {version.restoredFromVersion && (
                        <Badge variant="outline" className="bg-yellow-50">
                          {t('restored_from', { version: version.restoredFromVersion.toString() })}
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium mb-1">{version.title}</h4>
                    
                    {version.changeSummary && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {version.changeSummary}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                          locale: localeMap[locale as keyof typeof localeMap],
                        })}
                      </span>
                      
                      <span>
                        {t('status.' + version.status)}
                      </span>
                      
                      <span className="font-mono text-xs">
                        {version.contentHash.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedVersion(version.versionNumber)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('actions.view_details')}
                    </Button>
                    
                    {index !== 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRollback(version.versionNumber)}
                        disabled={rollbackMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        {t('rollback')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
