import * as React from "react";
import { useAuth } from "@/state/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ficeApi } from "@/services/ficeApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const INCOME_TYPES = [
  { value: "SALARY", label: "Salario" },
  { value: "FREELANCE", label: "Independiente" },
  { value: "BUSINESS", label: "Negocio" },
  { value: "OTHER", label: "Otro" },
] as const;

const RISK_TOLERANCES = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
] as const;

const DECISION_STYLES = [
  { value: "CONSERVATIVE", label: "Conservador" },
  { value: "ANALYTICAL", label: "Analítico" },
  { value: "AGGRESSIVE", label: "Agresivo" },
] as const;

export function InputsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? Number(auth.user_id) : null;
  const qc = useQueryClient();

  const qIdentity = useQuery({
    queryKey: ["identity", userId],
    queryFn: () => ficeApi.getFinancialIdentityByUserId(userId as number),
    enabled: !!userId,
    retry: false,
  });

  const [incomeType, setIncomeType] = React.useState<string>("SALARY");
  const [incomeStabilityScore, setIncomeStabilityScore] = React.useState<string>("80");
  const [riskTolerance, setRiskTolerance] = React.useState<string>("MEDIUM");
  const [decisionStyle, setDecisionStyle] = React.useState<string>("ANALYTICAL");

  React.useEffect(() => {
    if (qIdentity.data) {
      setIncomeType(qIdentity.data.incomeType ?? "SALARY");
      setIncomeStabilityScore(
        qIdentity.data.incomeStabilityScore != null
          ? String(qIdentity.data.incomeStabilityScore)
          : "80"
      );
      setRiskTolerance(qIdentity.data.riskTolerance ?? "MEDIUM");
      setDecisionStyle(qIdentity.data.decisionStyle ?? "ANALYTICAL");
    }
  }, [qIdentity.data]);

  const mSave = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("No se encontró el usuario autenticado.");

      const payload = {
        incomeType,
        incomeStabilityScore: Number(incomeStabilityScore),
        riskTolerance,
        decisionStyle,
      };

      if (qIdentity.data) {
        return ficeApi.updateFinancialIdentity(userId, payload);
      }

      return ficeApi.createFinancialIdentity({
        userId,
        ...payload,
      });
    },
    onSuccess: async () => {
      toast.success(
        qIdentity.data ? "Perfil actualizado" : "Perfil creado",
        {
          description: "La información financiera se guardó correctamente.",
        }
      );

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["identity", userId] }),
        qc.invalidateQueries({ queryKey: ["snapshots"] }),
      ]);
    },
    onError: (e: any) => {
      toast.error("No se pudo guardar", {
        description: e?.message ?? "Ocurrió un error inesperado.",
      });
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const score = Number(incomeStabilityScore);

    if (Number.isNaN(score) || score < 0 || score > 100) {
      toast.error("Score inválido", {
        description: "La estabilidad debe estar entre 0 y 100.",
      });
      return;
    }

    await mSave.mutateAsync();
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold tracking-tight">
          Actualizar perfil
        </div>
        <div className="mt-1 text-sm text-white/60">
          Completa tu información para crear o actualizar tu perfil financiero.
        </div>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>
            {qIdentity.data ? "Editar perfil financiero" : "Crear perfil financiero"}
          </CardTitle>
          <CardDescription>
            Esta información se usa para construir tu perfil financiero.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {qIdentity.isLoading ? (
            <div className="text-sm text-white/60">Cargando perfil...</div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de ingreso</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INCOME_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setIncomeType(item.value)}
                      className={
                        "rounded-2xl border px-3 py-2 text-sm transition " +
                        (incomeType === item.value
                          ? "border-accent/40 bg-accent/10 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estabilidad financiera (0 - 100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={incomeStabilityScore}
                  onChange={(e) => setIncomeStabilityScore(e.target.value)}
                  placeholder="80"
                />
              </div>

              <div className="space-y-2">
                <Label>Tolerancia al riesgo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_TOLERANCES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRiskTolerance(item.value)}
                      className={
                        "rounded-2xl border px-3 py-2 text-sm transition " +
                        (riskTolerance === item.value
                          ? "border-accent/40 bg-accent/10 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estilo de decisión</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DECISION_STYLES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setDecisionStyle(item.value)}
                      className={
                        "rounded-2xl border px-3 py-2 text-sm transition " +
                        (decisionStyle === item.value
                          ? "border-accent/40 bg-accent/10 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={mSave.isPending}
                aria-busy={mSave.isPending}
              >
                {mSave.isPending
                  ? "Guardando..."
                  : qIdentity.data
                  ? "Actualizar perfil"
                  : "Crear perfil"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}