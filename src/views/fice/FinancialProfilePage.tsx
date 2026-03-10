import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import { ficeApi } from "@/services/ficeApi";
import { Skeleton } from "@/components/common/Skeleton";
import { KpiCard } from "@/components/common/KpiCard";
import { fmtDate } from "@/views/system/format";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FinancialProfilePage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? Number(auth.user_id) : null;

  const qIdentity = useQuery({
    queryKey: ["identity", userId],
    queryFn: () => ficeApi.getFinancialIdentityByUserId(userId as number),
    enabled: !!userId,
    retry: false,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">Perfil financiero</div>
          <div className="mt-1 text-sm text-white/60">
            Consulta y seguimiento de tu perfil financiero actual.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink to="/app/finance/inputs">
            <Button variant="secondary" size="sm">
              Actualizar perfil
            </Button>
          </NavLink>

          <NavLink to="/app/system/snapshots">
            <Button size="sm">Historial</Button>
          </NavLink>
        </div>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Resumen del perfil</CardTitle>
          <CardDescription>Información principal de tu perfil financiero</CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {qIdentity.isLoading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : qIdentity.isError || !qIdentity.data ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              Aún no tienes un perfil financiero registrado.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard label="Tipo de ingreso" value={qIdentity.data.incomeType ?? "-"} />
              <KpiCard
                label="Estabilidad"
                value={
                  qIdentity.data.incomeStabilityScore != null
                    ? `${qIdentity.data.incomeStabilityScore}/100`
                    : "-"
                }
              />
              <KpiCard label="Tolerancia al riesgo" value={qIdentity.data.riskTolerance ?? "-"} />
              <KpiCard label="Estilo de decisión" value={qIdentity.data.decisionStyle ?? "-"} />
              <KpiCard
                label="Creado"
                value={qIdentity.data.createdAt ? fmtDate(qIdentity.data.createdAt) : "-"}
                className="lg:col-span-2"
              />
              <KpiCard
                label="Última actualización"
                value={qIdentity.data.lastUpdated ? fmtDate(qIdentity.data.lastUpdated) : "-"}
                className="lg:col-span-2"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}