/**
 * UploadProgress Component
 * Displays detailed upload progress with multiple stages
 */

import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Upload,
  FileCheck,
  Cog,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStage = "uploading" | "converting" | "processing" | "complete" | "error";

export interface UploadProgressProps {
  stage: UploadStage;
  progress: number; // 0-100
  fileName?: string;
  fileSize?: number;
  error?: string;
  className?: string;
}

interface StageInfo {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const STAGE_INFO: Record<UploadStage, StageInfo> = {
  uploading: {
    label: "Enviando arquivo",
    icon: Upload,
    color: "text-blue-500",
  },
  converting: {
    label: "Convertendo formato",
    icon: FileCheck,
    color: "text-purple-500",
  },
  processing: {
    label: "Processando conteúdo",
    icon: Cog,
    color: "text-amber-500",
  },
  complete: {
    label: "Upload concluído",
    icon: CheckCircle2,
    color: "text-green-500",
  },
  error: {
    label: "Erro no upload",
    icon: XCircle,
    color: "text-red-500",
  },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export function UploadProgress({
  stage,
  progress,
  fileName,
  fileSize,
  error,
  className,
}: UploadProgressProps) {
  const stageInfo = STAGE_INFO[stage];
  const Icon = stageInfo.icon;
  const isAnimating = stage !== "complete" && stage !== "error";

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header with icon and status */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full",
              stage === "complete" ? "bg-green-500/10" :
              stage === "error" ? "bg-red-500/10" :
              "bg-blue-500/10"
            )}
          >
            {isAnimating ? (
              <Loader2 className={cn("h-6 w-6 animate-spin", stageInfo.color)} />
            ) : (
              <Icon className={cn("h-6 w-6", stageInfo.color)} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn("font-medium", stageInfo.color)}>
              {stageInfo.label}
            </p>
            {fileName && (
              <p className="text-sm text-muted-foreground truncate">
                {fileName}
                {fileSize && (
                  <span className="ml-2">({formatFileSize(fileSize)})</span>
                )}
              </p>
            )}
          </div>

          {/* Progress percentage */}
          {stage !== "error" && (
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {stage !== "error" && (
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2"
            />
            
            {/* Stage indicators */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className={cn(
                "flex items-center gap-1",
                ["uploading", "converting", "processing", "complete"].includes(stage) && "text-green-600 dark:text-green-400"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  ["uploading", "converting", "processing", "complete"].includes(stage) ? "bg-green-600 dark:bg-green-400" : "bg-gray-300 dark:bg-gray-700"
                )} />
                Upload
              </div>
              
              <div className={cn(
                "flex items-center gap-1",
                ["converting", "processing", "complete"].includes(stage) && "text-green-600 dark:text-green-400"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  ["converting", "processing", "complete"].includes(stage) ? "bg-green-600 dark:bg-green-400" : "bg-gray-300 dark:bg-gray-700"
                )} />
                Conversão
              </div>
              
              <div className={cn(
                "flex items-center gap-1",
                ["processing", "complete"].includes(stage) && "text-green-600 dark:text-green-400"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  ["processing", "complete"].includes(stage) ? "bg-green-600 dark:bg-green-400" : "bg-gray-300 dark:bg-gray-700"
                )} />
                Processamento
              </div>
              
              <div className={cn(
                "flex items-center gap-1",
                stage === "complete" && "text-green-600 dark:text-green-400"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  stage === "complete" ? "bg-green-600 dark:bg-green-400" : "bg-gray-300 dark:bg-gray-700"
                )} />
                Concluído
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {stage === "error" && error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Success message */}
        {stage === "complete" && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Arquivo processado com sucesso! O relatório está sendo analisado.
            </p>
          </div>
        )}

        {/* Estimated time remaining (for active uploads) */}
        {isAnimating && progress > 0 && progress < 100 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tempo estimado:</span>
            <span className="font-medium">
              {progress < 30 ? "~2 minutos" :
               progress < 60 ? "~1 minuto" :
               progress < 90 ? "~30 segundos" :
               "Finalizando..."}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default UploadProgress;
