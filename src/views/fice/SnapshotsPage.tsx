import * as React from "react";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import { ficeApi } from "@/services/ficeApi";
import { Timeline } from "@/components/common/Timeline";
import { Drawer } from "@/components/common/Drawer";
import { fmtDate } from "@/views/system/format";
import { Skeleton } from "@/components/common/Skeleton";

export function SnapshotsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? Number(auth.user_id) : null;

  const qIdentity = useQuery({
    queryKey: ["identity", userId],
    queryFn: () => ficeApi.getFinancialIdentityByUserId(userId as number),
    enabled: !!userId,
    retry: false,
  });

  const financialIdentityId = qIdentity.data?.id ?? null;

  const qSnapshots = useQuery({
    queryKey: ["snapshots", financialIdentityId],
    queryFn: () => ficeApi.getSnapshotsByFinancialIdentityId(financialIdentityId as number),
    enabled: !!financialIdentityId,
    retry: false,
  });

  const [openId, setOpenId] = React.useState<number | null>(null);

  const selected = (qSnapshots.data ?? []).find((s) => s.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold tracking-tight">Historial financiero</div>
        <div className="mt-1 text-sm text-white/60">
          Revisa los cambios registrados en tu perfil financiero.
        </div>
      </div>

      {qIdentity.isLoading || qSnapshots.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : !financialIdentityId ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Aún no existe un perfil financiero para mostrar historial.
        </div>
      ) : (qSnapshots.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Todavía no hay cambios registrados en el historial.
        </div>
      ) : (
        <Timeline
          items={(qSnapshots.data ?? []).map((s) => ({
            id: String(s.id),
            title: s.changeReason ?? "Cambio registrado",
            subtitle: `Fecha: ${fmtDate(s.createdAt)}`,
            metaRight: `#${s.id}`,
          }))}
          onSelect={(id) => setOpenId(Number(id))}
        />
      )}

      <Drawer
        open={!!selected}
        title={selected?.changeReason ?? "Detalle"}
        subtitle={selected ? fmtDate(selected.createdAt) : undefined}
        onClose={() => setOpenId(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">Información del registro</div>

              <div className="mt-2 space-y-1 text-sm">
                <div className="text-white/70">
                  ID: <span className="text-white">{selected.id}</span>
                </div>

                <div className="text-white/70">
                  Perfil financiero ID:{" "}
                  <span className="text-white">{selected.financialIdentityId}</span>
                </div>

                <div className="text-white/70">
                  Motivo: <span className="text-white">{selected.changeReason ?? "—"}</span>
                </div>

                <div className="text-white/70">
                  Fecha: <span className="text-white">{fmtDate(selected.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}