import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/state/auth";
import { dseApi } from "@/services/dseApi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Scenario = {
  id: number;
  simulationType?: string;
  type?: string;
  amount?: number;
  currentValue?: number;
  targetValue?: number;
};

type SimulationResult = {
  id: number;
  resultValue?: number | string;
  result?: string;
  recommendation?: string;
};

export function SimulationsPage() {
  const auth = useAuth();
  const userId = auth.userId ? Number(auth.userId) : null;

  const [simulationType, setSimulationType] = React.useState("SAVINGS");
  const [amount, setAmount] = React.useState("500");

  const scenariosQuery = useQuery({
    queryKey: ["scenarios", userId],
    queryFn: () => dseApi.getScenarios(userId as number),
    enabled: !!userId,
  });

  const resultsQuery = useQuery({
    queryKey: ["results", userId],
    queryFn: () => dseApi.getResults(userId as number),
    enabled: !!userId,
  });

  const createSimulationMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("No se encontró el usuario autenticado.");
      }

      const parsedAmount = Number(amount);

      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Ingresa un monto válido.");
      }

      return dseApi.createSimulation({
        userId,
        type: simulationType,
        amount: parsedAmount,
      });
    },
    onSuccess: async () => {
      toast.success("Simulación ejecutada", {
        description: "Se generó correctamente la simulación.",
      });

      await scenariosQuery.refetch();
      await resultsQuery.refetch();
    },
    onError: (e: any) => {
      toast.error("No se pudo ejecutar la simulación", {
        description: e?.message ?? "Ocurrió un error inesperado.",
      });
    },
  });

  const scenarios = Array.isArray(scenariosQuery.data)
    ? (scenariosQuery.data as Scenario[])
    : [];

  const results = Array.isArray(resultsQuery.data)
    ? (resultsQuery.data as SimulationResult[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Simulaciones financieras</h1>
        <p className="mt-1 text-sm text-white/60">
          Evalúa escenarios y revisa resultados antes de tomar decisiones.
        </p>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Nueva simulación</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await createSimulationMutation.mutateAsync();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="simulationType">Tipo de simulación</Label>
              <select
                id="simulationType"
                value={simulationType}
                onChange={(e) => setSimulationType(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="AHORROS">SAVINGS</option>
                <option value="INVERSION">INVESTMENT</option>
                <option value="REDUCCIÓN DE GASTOS">EXPENSE_REDUCTION</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={!userId || createSimulationMutation.isPending}
              >
                {createSimulationMutation.isPending
                  ? "Ejecutando..."
                  : "Ejecutar simulación"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escenarios</CardTitle>
        </CardHeader>
        <CardContent>
          {scenarios.length > 0 ? (
            <div className="space-y-3">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div className="font-medium text-white">
                    {s.simulationType ?? s.type ?? "SIMULADOR"}
                  </div>
                  <div className="mt-1 text-white/70">
                    Monto: {s.amount ?? s.currentValue ?? s.targetValue ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No hay escenarios todavía.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div className="font-medium text-white">
                    Resultado: {r.resultValue ?? r.result ?? "—"}
                  </div>
                  <div className="mt-1 text-white/70">
                    {r.recommendation ?? "Sin recomendación adicional"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No hay resultados todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}