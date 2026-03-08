import * as React from "react";
import { useAuth } from "@/state/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as fice from "@/services/ficeApi";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fmtDate } from "@/views/system/format";

const INPUT_TYPES = [
  { value: "salary", label: "Salary" },
  { value: "freelance", label: "Freelance" },
  { value: "expenses", label: "Expenses" },
  { value: "loan", label: "Loan" },
  { value: "savings", label: "Savings" },
  { value: "card_usage", label: "Card usage" },
] as const;

export function InputsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user_id : "u_user";
  const qc = useQueryClient();

 const qInputs = useQuery({
    queryKey: ["inputs"],
    queryFn: () => fice.getInputs()
  });
  const mAdd = useMutation({
    mutationFn: (payload: {
      input_type: string;
      input_value: string;
      reason?: string;
    }) => fice.addInput(payload),
    onSuccess: async () => {
      toast.success("Input guardado", {
        description: "Se recalculó perfil + snapshot + auditoría.",
      });

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inputs"] }),
        qc.invalidateQueries({ queryKey: ["identity"] }),
        qc.invalidateQueries({ queryKey: ["snapshots"] }),
        qc.invalidateQueries({ queryKey: ["audit"] }),
      ]);
    },
    onError: (e: any) =>
      toast.error("No se pudo guardar", { description: e?.message }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">FICE • Inputs</div>
          <div className="mt-1 text-sm text-white/60">Tabla con filtros, paginación y modal para agregar input.</div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar input</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar input</DialogTitle>
              <DialogDescription>Simula un input real y dispara snapshot + auditoría.</DialogDescription>
            </DialogHeader>
            <AddInputForm
              loading={mAdd.isPending}
              onSubmit={async (v) => {
                await mAdd.mutateAsync(v);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        rows={qInputs.data ?? []}
        getRowId={(r) => (r as any).id}
        columns={[
          { key: "type", header: "Tipo", render: (r) => <span className="font-medium">{(r as any).input_type}</span> },
          { key: "value", header: "Valor", render: (r) => (r as any).input_value },
          { key: "date", header: "Creado", render: (r) => <span className="text-white/60">{fmtDate((r as any).created_at)}</span> },
        ]}
        empty={{ title: "Sin inputs", description: "Agrega tu primer input con el botón superior." }}
      />
    </div>
  );
}

function AddInputForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (v: { input_type: any; input_value: string; reason?: string }) => Promise<void>;
}) {
  const [type, setType] = React.useState<(typeof INPUT_TYPES)[number]["value"]>("salary");
  const [value, setValue] = React.useState("S/ 1000");
  const [reason, setReason] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error("Completa el valor");
      return;
    }
    await onSubmit({ input_type: type, input_value: value.trim(), reason: reason.trim() || undefined });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <div className="grid grid-cols-2 gap-2">
          {INPUT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={
                "rounded-2xl border px-3 py-2 text-sm transition " +
                (type === t.value ? "border-accent/40 bg-accent/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Valor</Label>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="S/ 4500" />
      </div>

      <div className="space-y-2">
        <Label>Razón (opcional)</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej: actualización de gastos" />
      </div>

      <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
        {loading ? "Guardando…" : "Guardar input"}
      </Button>
    </form>
  );
}
