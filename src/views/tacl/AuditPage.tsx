import * as React from "react";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/common/DataTable";
import { Drawer } from "@/components/common/Drawer";
import { fmtDate } from "@/views/system/format";
import { Button } from "@/components/ui/button";

const db = {
  getAuditEvents: async (_userId?: string | number) => [],
};

export function AuditPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user_id : "u_user";

  const q = useQuery({
    queryKey: ["audit", auth.role, userId],
    queryFn: () => db.getAuditEvents(auth.role === "Admin" ? undefined : userId),
  });

  const [openId, setOpenId] = React.useState<string | null>(null);
  const selected = ((q.data as any[]) ?? []).find((e: any) => e.id === openId) ?? null;

  const isForbidden = auth.role !== "Admin" && auth.role !== "User";

  if (isForbidden) return <AuditState code={403} />;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-lg font-semibold tracking-tight">Sistema • Auditoría</div>
        <div className="mt-1 text-sm text-white/60">
          Tabla de eventos con filtros + drawer con detalle.
        </div>
      </div>

      <DataTable
        rows={(q.data as any[]) ?? []}
        getRowId={(r) => (r as any).id}
        columns={[
          { key: "action", header: "Acción", render: (r: any) => <span className="font-medium">{r.action}</span> },
          { key: "actor", header: "Actor", render: (r: any) => <span className="text-white/70">{r.actor}</span> },
          { key: "entity", header: "Entidad", render: (r: any) => r.entity },
          { key: "date", header: "Fecha", render: (r: any) => <span className="text-white/60">{fmtDate(r.created_at)}</span> },
          {
            key: "view",
            header: "",
            render: (r: any) => (
              <Button variant="secondary" size="sm" onClick={() => setOpenId(r.id)}>
                Ver
              </Button>
            ),
            className: "w-[90px]",
          },
        ]}
        empty={{ title: "Sin eventos", description: "No se registraron eventos todavía." }}
      />

      <Drawer
        open={!!selected}
        title={selected?.action ?? "Evento"}
        subtitle={selected ? `${selected.actor} • ${fmtDate(selected.created_at)}` : undefined}
        onClose={() => setOpenId(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">Quién / cuándo / qué</div>
              <div className="mt-2 text-sm text-white/80">
                <div>
                  Actor: <span className="text-white">{selected.actor}</span>
                </div>
                <div>
                  User ID: <span className="text-white">{selected.user_id}</span>
                </div>
                <div>
                  Entidad: <span className="text-white">{selected.entity}</span>{" "}
                  {selected.entity_id ? `• ${selected.entity_id}` : ""}
                </div>
                <div>
                  Acción: <span className="text-accent">{selected.action}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">Meta</div>
              <pre className="mt-3 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-white/75 scrollbar-thin">
                {JSON.stringify(selected.meta ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function AuditState({ code }: { code: 401 | 403 }) {
  return (
    <div className="grid place-items-center py-14">
      <div className="max-w-md text-center">
        <div className="text-2xl font-semibold">{code}</div>
        <div className="mt-2 text-sm text-white/60">
          {code === 401 ? "Debes iniciar sesión." : "No tienes permisos para ver auditoría."}
        </div>
      </div>
    </div>
  );
}