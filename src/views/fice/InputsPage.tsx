import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useAuth } from "@/state/auth";
import {
  ficeApi,
  type CreateFinancialIdentityRequest,
  type UpdateFinancialIdentityRequest,
} from "@/services/ficeApi";
import { tiieApi } from "@/services/tiieApi";

export function InputsPage() {
  const auth = useAuth();
  const qc = useQueryClient();

  const userId = auth.userId ? Number(auth.userId) : null;

  const [incomeType, setIncomeType] = React.useState("SALARY");
  const [incomeStabilityScore, setIncomeStabilityScore] = React.useState("80");
  const [riskTolerance, setRiskTolerance] = React.useState("MEDIUM");
  const [decisionStyle, setDecisionStyle] = React.useState("ANALYTICAL");

  const [txType, setTxType] = React.useState<"income" | "expense">("expense");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("PEN");
  const [rawDescription, setRawDescription] = React.useState("");
  const [merchantRaw, setMerchantRaw] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState("");

  const {
    data: identity,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["financial-identity", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("No se encontró el usuario autenticado.");
      }

      return ficeApi.getFinancialIdentityByUserId(userId);
    },
    enabled: !!userId,
    retry: false,
  });

  React.useEffect(() => {
    if (!identity) return;

    setIncomeType(identity.incomeType ?? "SALARY");
    setIncomeStabilityScore(String(identity.incomeStabilityScore ?? 80));
    setRiskTolerance(identity.riskTolerance ?? "MEDIUM");
    setDecisionStyle(identity.decisionStyle ?? "ANALYTICAL");
  }, [identity]);

  const saveIdentityMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("No se encontró el usuario autenticado.");
      }

      const score = Number(incomeStabilityScore);

      if (Number.isNaN(score) || score < 0 || score > 100) {
        throw new Error("Income Stability Score debe estar entre 0 y 100.");
      }

      if (identity?.id) {
        const payload: UpdateFinancialIdentityRequest = {
          incomeType,
          incomeStabilityScore: score,
          riskTolerance,
          decisionStyle,
        };

        return ficeApi.updateFinancialIdentity(userId, payload);
      }

      const payload: CreateFinancialIdentityRequest = {
        userId,
        incomeType,
        incomeStabilityScore: score,
        riskTolerance,
        decisionStyle,
      };

      return ficeApi.createFinancialIdentity(payload);
    },
    onSuccess: async () => {
      toast.success("Perfil financiero guardado", {
        description: "La información se actualizó correctamente.",
      });

      await qc.invalidateQueries({
        queryKey: ["financial-identity", userId],
      });
    },
    onError: (e: any) => {
      toast.error("No se pudo guardar el perfil", {
        description: e?.message ?? "Ocurrió un error inesperado.",
      });
    },
  });

const createTransactionMutation = useMutation({
  mutationFn: async () => {
    if (!userId) {
      throw new Error("No se encontró el usuario autenticado.");
    }

    const parsedAmount = Number(amount);

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Ingresa un monto válido.");
    }

    if (!rawDescription.trim()) {
      throw new Error("Ingresa una descripción.");
    }

    const payload = {
      userId: Number(userId),
      type: txType.toUpperCase(),
      amount: parsedAmount,
      currency: (currency.trim() || "PEN").toUpperCase(),
      rawDescription: rawDescription.trim(),
      merchantRaw: merchantRaw.trim(),
      occurredAt: occurredAt
        ? new Date(occurredAt).toISOString()
        : new Date().toISOString(),
    };

    return tiieApi.createTransaction(payload);
  },
  onSuccess: async () => {
    toast.success("Movimiento registrado", {
      description: "La transacción se guardó correctamente.",
    });

    setAmount("");
    setCurrency("PEN");
    setRawDescription("");
    setMerchantRaw("");
    setOccurredAt("");

    await qc.invalidateQueries({
      queryKey: ["transactions", userId],
    });
  },
  onError: (e: any) => {
    toast.error("No se pudo registrar el movimiento", {
      description: e?.message ?? "Ocurrió un error inesperado.",
    });
  },
});

  const onSubmitIdentity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await saveIdentityMutation.mutateAsync();
  };

  const onSubmitTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createTransactionMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Inputs</h1>
        <p className="mt-1 text-sm text-white/60">
          Configura tu perfil financiero y registra movimientos rápidos desde un solo lugar.
        </p>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Perfil financiero</CardTitle>
          <CardDescription>
            Estos datos ayudan a personalizar tu identidad financiera.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <p className="text-sm text-white/60">Cargando perfil financiero...</p>
          ) : isError ? (
            <p className="text-sm text-red-300">
              {(error as Error)?.message || "No se pudo cargar el perfil financiero."}
            </p>
          ) : null}

          <form onSubmit={onSubmitIdentity} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incomeType">Tipo de ingreso</Label>
              <select
                id="incomeType"
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="SALARIO">Salario</option>
                <option value="FREELANCE">Freelance</option>
                <option value="NEGOCIO">Negocio</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incomeStabilityScore">Estabilidad de ingresos (0 - 100)</Label>
              <Input
                id="incomeStabilityScore"
                type="number"
                min={0}
                max={100}
                value={incomeStabilityScore}
                onChange={(e) => setIncomeStabilityScore(e.target.value)}
                placeholder="80"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskTolerance">Tolerancia al riesgo</Label>
              <select
                id="riskTolerance"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="BAJO">BAJO</option>
                <option value="MEDIO">MEDIO</option>
                <option value="ALTO">ALTO</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decisionStyle">Estilo de decisión</Label>
              <select
                id="decisionStyle"
                value={decisionStyle}
                onChange={(e) => setDecisionStyle(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-white/20"
              >
                <option value="ANALYTICAL">Analítica</option>
                <option value="CONSERVATIVE">Conservador</option>
                <option value="AGGRESSIVE">Agresivo</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={saveIdentityMutation.isPending || !userId}
              aria-busy={saveIdentityMutation.isPending}
            >
              {saveIdentityMutation.isPending ? "Guardando..." : "Guardar perfil financiero"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Registro rápido</CardTitle>
          <CardDescription>
            Agrega un ingreso o gasto para alimentar tus movimientos financieros.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <form onSubmit={onSubmitTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de movimiento</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={
                    "rounded-2xl border px-3 py-2 text-sm transition " +
                    (txType === "income"
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                  }
                >
                  Ingreso
                </button>

                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={
                    "rounded-2xl border px-3 py-2 text-sm transition " +
                    (txType === "expense"
                      ? "border-white/20 bg-white/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                  }
                >
                  Gasto
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej. 150.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="PEN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rawDescription">Descripción</Label>
              <Input
                id="rawDescription"
                value={rawDescription}
                onChange={(e) => setRawDescription(e.target.value)}
                placeholder="Ej. Compra en bodega"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchantRaw">Comercio o fuente</Label>
              <Input
                id="merchantRaw"
                value={merchantRaw}
                onChange={(e) => setMerchantRaw(e.target.value)}
                placeholder="Ej. Bodega Don Pepe / Empresa ABC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occurredAt">Fecha y hora</Label>
              <Input
                id="occurredAt"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createTransactionMutation.isPending || !userId}
              aria-busy={createTransactionMutation.isPending}
            >
              {createTransactionMutation.isPending ? "Guardando..." : "Registrar movimiento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}