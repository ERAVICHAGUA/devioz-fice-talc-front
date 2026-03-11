import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/state/auth";
import { crfeApi } from "@/services/crfeApi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Forecast = {
  id: number;
  userId: number;
  forecastDate?: string;
  periodType?: string;
  projectedIncome?: number;
  projectedExpense?: number;
  forecastBalance?: number;
  projectedBalance?: number;
  createdAt?: string;
};

type RiskAlert = {
  id: number;
  riskLevel?: string;
  alertType?: string;
  message?: string;
  description?: string;
  createdAt?: string;
};

function money(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function ForecastPage() {
  const auth = useAuth();
  const userId = auth.userId ? Number(auth.userId) : null;

  const [forecastDate, setForecastDate] = React.useState("");
  const [periodType, setPeriodType] = React.useState("monthly");
  const [projectedIncome, setProjectedIncome] = React.useState("");
  const [projectedExpense, setProjectedExpense] = React.useState("");

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
    onSuccess: async () => {
      toast.success("Forecast generado", {
        description: "Se creó una proyección automática desde tus movimientos.",
      });
      await forecastsQuery.refetch();
      await alertsQuery.refetch();
    },
    onError: (e: any) => {
      toast.error("No se pudo generar el forecast", {
        description: e?.message ?? "Ocurrió un error inesperado.",
      });
    },
  });

  const createManualForecastMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("No se encontró el usuario autenticado.");
      }

      const income = Number(projectedIncome);
      const expense = Number(projectedExpense);

      if (!forecastDate) {
        throw new Error("Ingresa la fecha del forecast.");
      }

      if (Number.isNaN(income) || income < 0) {
        throw new Error("Ingresa un projectedIncome válido.");
      }

      if (Number.isNaN(expense) || expense < 0) {
        throw new Error("Ingresa un projectedExpense válido.");
      }

      return crfeApi.createForecast({
        userId,
        forecastDate,
        periodType,
        projectedIncome: income,
        projectedExpense: expense,
      });
    },
    onSuccess: async () => {
      toast.success("Forecast manual creado", {
        description: "La proyección se guardó correctamente.",
      });

      setForecastDate("");
      setPeriodType("monthly");
      setProjectedIncome("");
      setProjectedExpense("");

      await forecastsQuery.refetch();
      await alertsQuery.refetch();
    },
    onError: (e: any) => {
      toast.error("No se pudo crear el forecast manual", {
        description: e?.message ?? "Ocurrió un error inesperado.",
      });
    },
  });

  const forecasts = Array.isArray(forecastsQuery.data)
    ? (forecastsQuery.data as Forecast[])
    : [];

  const alerts = Array.isArray(alertsQuery.data)
    ? (alertsQuery.data as RiskAlert[])
    : [];

  const latestForecast = forecasts.length > 0 ? forecasts[forecasts.length - 1] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Proyecciones financieras</h1>
        <p className="mt-1 text-sm text-white/60">
          Genera forecasts manuales o automáticos a partir de tus movimientos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Último balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">
              {money(latestForecast?.forecastBalance ?? latestForecast?.projectedBalance)}
            </div>
            <p className="mt-1 text-sm text-white/60">Última proyección registrada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecasts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{forecasts.length}</div>
            <p className="mt-1 text-sm text-white/60">Proyecciones almacenadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-white">{alerts.length}</div>
            <p className="mt-1 text-sm text-white/60">Alertas de riesgo detectadas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Generación automática</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!userId || generateMutation.isPending}
            >
              {generateMutation.isPending ? "Generando..." : "Generar forecast desde TIIE"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Forecast manual</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await createManualForecastMutation.mutateAsync();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="forecastDate">Fecha del forecast</Label>
              <Input
                id="forecastDate"
                type="date"
                value={forecastDate}
                onChange={(e) => setForecastDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodType">Periodo</Label>
              <select
                id="periodType"
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="monthly">monthly</option>
                <option value="weekly">weekly</option>
                <option value="yearly">yearly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectedIncome">Ingreso proyectado</Label>
              <Input
                id="projectedIncome"
                type="number"
                step="0.01"
                value={projectedIncome}
                onChange={(e) => setProjectedIncome(e.target.value)}
                placeholder="2500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectedExpense">Gasto proyectado</Label>
              <Input
                id="projectedExpense"
                type="number"
                step="0.01"
                value={projectedExpense}
                onChange={(e) => setProjectedExpense(e.target.value)}
                placeholder="2300"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={!userId || createManualForecastMutation.isPending}
              >
                {createManualForecastMutation.isPending
                  ? "Guardando..."
                  : "Crear forecast manual"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de forecasts</CardTitle>
        </CardHeader>
        <CardContent>
          {forecasts.length > 0 ? (
            <div className="space-y-3">
              {forecasts.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div className="font-medium text-white">
                    {f.forecastDate ?? "Sin fecha"} · {f.periodType ?? "periodo"}
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <div className="text-white/80">
                      Ingreso proyectado: {money(f.projectedIncome)}
                    </div>
                    <div className="text-white/80">
                      Gasto proyectado: {money(f.projectedExpense)}
                    </div>
                    <div className="text-white/80">
                      Balance: {money(f.forecastBalance ?? f.projectedBalance)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No hay proyecciones todavía.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de riesgo</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div className="font-medium text-white">
                    {a.riskLevel ?? a.alertType ?? "RISK"}
                  </div>
                  <div className="mt-1 text-white/70">
                    {a.message ?? a.description ?? "Sin detalle"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No hay alertas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}