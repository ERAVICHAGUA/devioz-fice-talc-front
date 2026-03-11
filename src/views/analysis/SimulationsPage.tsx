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
  scenarioType?: string;
  scenarioName?: string;
  monthlySaving?: number;
  expenseAmount?: number;
  loanAmount?: number;
  months?: number;
};

type SimulationResult = {
  id: number;
  projectedBalance?: number;
  riskLevel?: string;
  scenarioName?: string;
  recommendation?: string;
};

function money(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function SimulationsPage() {
  const auth = useAuth();
  const userId = auth.userId ? Number(auth.userId) : null;

  const [scenarioType, setScenarioType] = React.useState("SAVINGS");
  const [scenarioName, setScenarioName] = React.useState("");
  const [monthlySaving, setMonthlySaving] = React.useState("300");
  const [expenseAmount, setExpenseAmount] = React.useState("1200");
  const [loanAmount, setLoanAmount] = React.useState("2400");
  const [months, setMonths] = React.useState("6");

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

      if (!scenarioName.trim()) {
        throw new Error("Ingresa un nombre para la simulación.");
      }

      let payload: any = {
        userId,
        scenarioType,
        scenarioName: scenarioName.trim(),
      };

      if (scenarioType === "SAVINGS") {
        const saving = Number(monthlySaving);
        const duration = Number(months);

        if (Number.isNaN(saving) || saving <= 0) {
          throw new Error("Ingresa un monthlySaving válido.");
        }

        if (Number.isNaN(duration) || duration <= 0) {
          throw new Error("Ingresa months válido.");
        }

        payload.monthlySaving = saving;
        payload.months = duration;
      }

      if (scenarioType === "EXPENSE") {
        const expense = Number(expenseAmount);

        if (Number.isNaN(expense) || expense <= 0) {
          throw new Error("Ingresa un expenseAmount válido.");
        }

        payload.expenseAmount = expense;
      }

      if (scenarioType === "LOAN") {
        const loan = Number(loanAmount);
        const duration = Number(months);

        if (Number.isNaN(loan) || loan <= 0) {
          throw new Error("Ingresa un loanAmount válido.");
        }

        if (Number.isNaN(duration) || duration <= 0) {
          throw new Error("Ingresa months válido.");
        }

        payload.loanAmount = loan;
        payload.months = duration;
      }

      return dseApi.createSimulation(payload);
    },
    onSuccess: async () => {
      toast.success("Simulación ejecutada", {
        description: "La simulación se creó correctamente.",
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
          Evalúa escenarios de ahorro, gasto o préstamo antes de tomar decisiones.
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
              <Label htmlFor="scenarioType">Tipo de simulación</Label>
              <select
                id="scenarioType"
                value={scenarioType}
                onChange={(e) => setScenarioType(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="SAVINGS">AHORROS</option>
                <option value="EXPENSE">GASTO</option>
                <option value="LOAN">PRÉSTAMO</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenarioName">Nombre del escenario</Label>
              <Input
                id="scenarioName"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Ej. Ahorro mensual 6 meses"
              />
            </div>

            {scenarioType === "SAVINGS" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="monthlySaving">Ahorro mensual</Label>
                  <Input
                    id="monthlySaving"
                    type="number"
                    step="0.01"
                    value={monthlySaving}
                    onChange={(e) => setMonthlySaving(e.target.value)}
                    placeholder="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthsSavings">Meses</Label>
                  <Input
                    id="monthsSavings"
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    placeholder="6"
                  />
                </div>
              </>
            )}

            {scenarioType === "EXPENSE" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expenseAmount">Monto del gasto</Label>
                <Input
                  id="expenseAmount"
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="1200"
                />
              </div>
            )}

            {scenarioType === "LOAN" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="loanAmount">Monto del préstamo</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    step="0.01"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="2400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthsLoan">Meses</Label>
                  <Input
                    id="monthsLoan"
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    placeholder="12"
                  />
                </div>
              </>
            )}

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
                    {s.scenarioType ?? "SIMULATION"} · {s.scenarioName ?? "Sin nombre"}
                  </div>
                  <div className="mt-1 text-white/70">
                    {s.monthlySaving != null && <>Ahorro mensual: {money(s.monthlySaving)} · </>}
                    {s.expenseAmount != null && <>Gasto: {money(s.expenseAmount)} · </>}
                    {s.loanAmount != null && <>Préstamo: {money(s.loanAmount)} · </>}
                    {s.months != null ? `Meses: ${s.months}` : ""}
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
                    {r.scenarioName ?? "Resultado"} · Balance proyectado: {money(Number(r.projectedBalance))}
                  </div>
                  <div className="mt-1 text-white/70">
                    Riesgo: {r.riskLevel ?? "—"}
                  </div>
                  <div className="mt-1 text-white/55">
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