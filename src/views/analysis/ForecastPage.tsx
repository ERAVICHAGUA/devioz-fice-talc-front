import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/state/auth";
import { crfeApi } from "@/services/crfeApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ForecastPage() {
  const auth = useAuth();
  const userId = auth.userId ? Number(auth.userId) : null;

 const forecastsQuery = useQuery({
  queryKey: ["forecasts", userId],
  queryFn: () => crfeApi.getForecasts(userId as number),
  enabled: !!userId,
});

 const alertsQuery = useQuery({
  queryKey: ["risk-alerts", userId],
  queryFn: () => crfeApi.getRiskAlerts(userId as number),
  enabled: !!userId,
});

  const generateMutation = useMutation({
  mutationFn: () => crfeApi.generateForecast(userId as number),
  onSuccess: () => {
    forecastsQuery.refetch();
    alertsQuery.refetch();
  },
});

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white">
        Proyecciones financieras
      </h1>

      <Button onClick={() => generateMutation.mutate()} disabled={!userId}>
        Generar forecast
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Forecasts</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(forecastsQuery.data) && forecastsQuery.data.length > 0 ? (
            forecastsQuery.data.map((f: any) => (
              <div key={f.id} className="text-sm">
                Balance proyectado: {f.forecastBalance ?? f.projectedBalance ?? "—"}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">
              No hay proyecciones todavía
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(alertsQuery.data) && alertsQuery.data.length > 0 ? (
            alertsQuery.data.map((a: any) => (
              <div key={a.id} className="text-sm">
                {a.message ?? a.alertMessage ?? "Sin mensaje"}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">
              No hay alertas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}