import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface GuardRailModalProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  action: string;
}

export default function GuardRailModal({
  open,
  onClose,
  reportId,
  action,
}: GuardRailModalProps) {
  const [, navigate] = useLocation();

  const handleReview = () => {
    onClose();
    navigate(`/reports/${reportId}/review`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Revisão Necessária</DialogTitle>
              <DialogDescription>
                Finalize a revisão para continuar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            O relatório <span className="font-mono text-xs bg-[#171a4a] px-2 py-1 rounded">{reportId}</span> possui
            campos que precisam de validação humana antes de prosseguir para <strong>{action}</strong>.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Por que isso é necessário?</strong>
            </p>
            <p className="text-sm text-blue-800 mt-1">
              Para garantir a precisão e conformidade com os padrões internacionais,
              todos os campos extraídos automaticamente devem ser validados por um
              especialista antes de serem submetidos a auditoria ou certificação.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleReview}>
            Revisar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

