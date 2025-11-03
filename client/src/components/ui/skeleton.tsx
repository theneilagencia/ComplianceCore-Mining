import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
}

/**
 * Skeleton para cards de estatísticas
 */
function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg" aria-busy="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para lista de auditorias
 */
function AuditListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando auditorias">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para formulários
 */
function FormSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando formulário">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <div className="pt-4">
        <Skeleton className="h-10 w-full rounded" />
      </div>
    </div>
  );
}

export { Skeleton, CardSkeleton, AuditListSkeleton, FormSkeleton };
