import * as React from "react";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import * as fice from "@/services/ficeApi";
import { Timeline } from "@/components/common/Timeline";
import { Drawer } from "@/components/common/Drawer";
import { fmtDate } from "@/views/system/format";
import { Skeleton } from "@/components/common/Skeleton";

export function SnapshotsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user_id : "u_user";
  const q = useQuery({
    queryKey: ["snapshots"],
    queryFn: () => fice.getSnapshots()
  });
  const [openId, setOpenId] = React.useState<string | null>(null);
  const selected = (q.data ?? []).find((s) => s.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold tracking-tight">FICE • Snapshots</div>
        <div className="mt-1 text-sm text-white/60">Timeline + detalle en drawer con JSON formateado.</div>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <Timeline
          items={(q.data ?? []).map((s) => ({
            id: s.id,
            title: s.change_reason ?? "Snapshot",
            subtitle: `Creado: ${fmtDate(s.created_at)}`,
            metaRight: s.id,
          }))}
          onSelect={(id) => setOpenId(id)}
        />
      )}

      <Drawer
        open={!!selected}
        title={selected?.change_reason ?? "Snapshot"}
        subtitle={selected ? fmtDate(selected.created_at) : undefined}
        onClose={() => setOpenId(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">Metadata</div>
              <div className="mt-2 text-sm">
                <div className="text-white/70">ID: <span className="text-white">{selected.id}</span></div>
                <div className="text-white/70">FinancialIdentity ID: <span className="text-white">{selected.financial_identity_id}</span></div>
                <div className="text-white/70">Reason: <span className="text-white">{selected.change_reason ?? "—"}</span></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">snapshot_data</div>
              <pre className="mt-3 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-white/75 scrollbar-thin">
{JSON.stringify(selected.snapshot_data, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
