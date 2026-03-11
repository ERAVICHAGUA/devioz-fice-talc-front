import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/state/auth";
import { tiieApi } from "@/services/tiieApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/common/Skeleton";
import { fmtDate } from "@/views/system/format";

function money(amount?: number, currency?: string) {
  if (amount == null) return "—";

  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currency || "PEN",
    }).format(amount);
  } catch {
    return `${currency || "PEN"} ${amount}`;
  }
}

export function TransactionsPage() {
  const auth = useAuth();
  const userId = auth.userId ? Number(auth.userId) : null;

  const qTransactions = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => tiieApi.getTransactions(userId as number),
    enabled: !!userId,
    retry: false,
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold tracking-tight">Movimientos</div>
        <div className="mt-1 text-sm text-white/60">
          Lista de ingresos y gastos registrados en tu cuenta.
        </div>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
          <CardDescription>
            Información obtenida directamente desde TIIE.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {qTransactions.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : qTransactions.isError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              No se pudieron cargar los movimientos.
            </div>
          ) : (qTransactions.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Todavía no tienes movimientos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {(qTransactions.data ?? []).map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "rounded-full px-2 py-1 text-xs font-medium " +
                            (tx.type?.toLowerCase() === "income"
                              ? "bg-emerald-500/15 text-emerald-200"
                              : "bg-rose-500/15 text-rose-200")
                          }
                        >
                          {tx.type?.toLowerCase() === "income" ? "Ingreso" : "Gasto"}
                        </span>

                        {tx.category ? (
                          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                            {tx.category}
                          </span>
                        ) : null}
                      </div>

                      <div className="text-sm font-semibold text-white">
                        {tx.rawDescription || "Sin descripción"}
                      </div>

                      <div className="text-xs text-white/55">
                        {tx.merchantRaw || "Sin comercio/fuente"}
                      </div>
                    </div>

                    <div className="space-y-1 text-left lg:text-right">
                      <div className="text-base font-semibold text-white">
                        {money(tx.amount, tx.currency)}
                      </div>
                      <div className="text-xs text-white/55">
                        {tx.occurredAt ? fmtDate(tx.occurredAt) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}