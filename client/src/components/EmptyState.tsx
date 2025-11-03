/**
 * EmptyState Component
 * Displays beautiful empty states with illustrations, CTAs, and helpful guidance
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
} from "lucide-react";

export interface EmptyStateProps {
  variant?: "no-reports" | "no-results" | "error" | "quota-exceeded";
  searchQuery?: string;
  onCreateReport?: () => void;
  onUploadReport?: () => void;
  onClearFilters?: () => void;
  onUpgradePlan?: () => void;
}

export function EmptyState({
  variant = "no-reports",
  searchQuery,
  onCreateReport,
  onUploadReport,
  onClearFilters,
  onUpgradePlan,
}: EmptyStateProps) {
  
  // Variant: No reports created yet
  if (variant === "no-reports") {
    return (
      <Card className="p-12 text-center border-dashed border-2">
        <div className="max-w-md mx-auto space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <FileText className="relative h-20 w-20 text-primary mx-auto" strokeWidth={1.5} />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              Nenhum relatório criado ainda
            </h3>
            <p className="text-muted-foreground text-base">
              Comece criando seu primeiro relatório técnico de mineração ou faça upload de um arquivo existente
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onCreateReport && (
              <Button
                size="lg"
                onClick={onCreateReport}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Criar Relatório
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            
            {onUploadReport && (
              <Button
                size="lg"
                variant="outline"
                onClick={onUploadReport}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Fazer Upload
              </Button>
            )}
          </div>

          {/* Help Section */}
          <div className="pt-6 border-t space-y-3">
            <h4 className="text-sm font-medium flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              Como começar?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold mt-0.5">1.</span>
                <span>Escolha um padrão internacional (JORC, NI 43-101, PERC, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold mt-0.5">2.</span>
                <span>Preencha os dados do projeto ou faça upload de um PDF/DOCX</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-semibold mt-0.5">3.</span>
                <span>Aguarde o processamento automático e revisão de conformidade</span>
              </li>
            </ul>
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Dica Rápida
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Você pode baixar templates pré-formatados para facilitar o preenchimento dos dados
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Variant: No search results
  if (variant === "no-results") {
    return (
      <Card className="p-12 text-center border-dashed border-2">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <FileText className="h-16 w-16 text-muted-foreground/50" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Nenhum resultado encontrado
            </h3>
            {searchQuery ? (
              <p className="text-muted-foreground">
                Não encontramos relatórios com "<span className="font-medium">{searchQuery}</span>"
              </p>
            ) : (
              <p className="text-muted-foreground">
                Nenhum relatório corresponde aos filtros aplicados
              </p>
            )}
          </div>

          {onClearFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="gap-2"
            >
              Limpar Filtros
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          <p className="text-sm text-muted-foreground">
            Tente ajustar sua busca ou criar um novo relatório
          </p>
        </div>
      </Card>
    );
  }

  // Variant: Quota exceeded
  if (variant === "quota-exceeded") {
    return (
      <Card className="p-12 text-center border-amber-500/50 border-2">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <Sparkles className="relative h-20 w-20 text-amber-500 mx-auto" strokeWidth={1.5} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">
              Limite de relatórios atingido
            </h3>
            <p className="text-muted-foreground text-base">
              Você atingiu o limite do seu plano atual. Faça upgrade para criar mais relatórios e desbloquear recursos avançados.
            </p>
          </div>

          {onUpgradePlan && (
            <Button
              size="lg"
              onClick={onUpgradePlan}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Sparkles className="h-4 w-4" />
              Fazer Upgrade
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {/* Plan Comparison */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Planos Disponíveis</h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-card">
                <p className="font-semibold mb-1">START</p>
                <p className="text-muted-foreground">1 relatório</p>
              </div>
              <div className="p-3 rounded-lg border-2 border-primary bg-primary/5">
                <p className="font-semibold mb-1 text-primary">PRO</p>
                <p className="text-muted-foreground">5 relatórios</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <p className="font-semibold mb-1">ENTERPRISE</p>
                <p className="text-muted-foreground">15 relatórios</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Variant: Error state
  if (variant === "error") {
    return (
      <Card className="p-12 text-center border-destructive/50 border-2">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-center">
            <HelpCircle className="h-16 w-16 text-destructive/70" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              Erro ao carregar relatórios
            </h3>
            <p className="text-muted-foreground">
              Ocorreu um erro ao carregar seus relatórios. Por favor, tente novamente.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            Tentar Novamente
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}

export default EmptyState;
