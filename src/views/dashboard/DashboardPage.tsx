import * as React from "react";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import * as db from "@/services/mockDb";
import { KpiCard } from "@/components/common/KpiCard";
import { Skeleton } from "@/components/common/Skeleton";
import { WidgetCard } from "@/components/common/WidgetCard";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "@/views/system/format";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DEFAULT_LAYOUT, layoutForRole, type DashboardLayout, type WidgetKey } from "./widgets";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

const LS_KEY = "devioz.dashboard.layout.v1";

function readLayout(fallback: DashboardLayout): DashboardLayout {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as DashboardLayout;
    if (parsed?.version !== 1) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

function saveLayout(layout: DashboardLayout) {
  localStorage.setItem(LS_KEY, JSON.stringify(layout));
}

function SortableItem({
  id,
  children,
  onHandleProps,
}: {
  id: string;
  children: (args: { handleProps: React.HTMLAttributes<HTMLButtonElement> }) => React.ReactNode;
  onHandleProps?: (p: React.HTMLAttributes<HTMLButtonElement>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  const handleProps = { ...attributes, ...listeners };

  onHandleProps?.(handleProps);

  return (
    <div ref={setNodeRef} style={style}>
      {children({ handleProps })}
    </div>
  );
}

export function DashboardPage() {
  const auth = useAuth();
  const fallback = React.useMemo(() => layoutForRole(auth.role), [auth.role]);
  const [layout, setLayout] = React.useState<DashboardLayout>(() => readLayout(fallback));

  React.useEffect(() => {
    // if role changes and no custom layout saved, adapt
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) setLayout(fallback);
  }, [fallback]);

  const userId = auth.status === "authenticated" ? auth.user_id : "u_user";

  const qIdentity = useQuery({
    queryKey: ["identity", userId],
    queryFn: () => db.getFinancialIdentity(userId),
  });
  const qInputs = useQuery({ queryKey: ["inputs", userId], queryFn: () => db.getInputs(userId) });
  const qSnapshots = useQuery({ queryKey: ["Historial", userId], queryFn: () => db.getSnapshots(userId) });
  const qAudit = useQuery({ queryKey: ["audit", auth.role], queryFn: () => db.getAuditEvents(auth.role === "Admin" ? undefined : userId) });
  const qIntegrity = useQuery({ queryKey: ["integrity"], queryFn: () => db.getIntegrityChecks() });

  const ids = layout.widgets.map((w) => w.key);

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    const nextWidgets = arrayMove(layout.widgets, oldIndex, newIndex);
    const next = { ...layout, widgets: nextWidgets };
    setLayout(next);
    saveLayout(next);
  };

  const toggleCollapse = (key: WidgetKey) => {
    const next = {
      ...layout,
      widgets: layout.widgets.map((w) => (w.key === key ? { ...w, collapsed: !w.collapsed } : w)),
    };
    setLayout(next);
    saveLayout(next);
  };

  const removeWidget = (key: WidgetKey) => {
    const next = { ...layout, widgets: layout.widgets.filter((w) => w.key !== key) };
    setLayout(next);
    saveLayout(next);
    toast.message("Widget removido", { description: key });
  };

  const resetLayout = () => {
    const next = DEFAULT_LAYOUT;
    setLayout(next);
    saveLayout(next);
    toast.success("Layout reseteado");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">Dashboard</div>
          <div className="mt-1 text-sm text-white/60">Widgets flotantes • Reordenables • Guardados en localStorage</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={resetLayout}>
            Reset layout
          </Button>
          <NavLink to="/fice/profile">
            <Button size="sm">Ir a FICE</Button>
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <KpiCard
            label="Sesión"
            value={`Hola ${auth.firstName ?? auth.username ?? "Usuario"}`}
            hint="Tu espacio financiero está activo"
          />
        <KpiCard
          label="Identidad actualizada"
          value={qIdentity.data ? formatDistanceToNowStrict(qIdentity.data.last_updated) : "—"}
          hint="Basado en financial_identity.last_updated"
        />
        <KpiCard label="Integridad" value={qIntegrity.data?.[0]?.status ?? "—"} hint="Último check (mock)" />
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {layout.widgets.map((w) => (
              <SortableItem key={w.key} id={w.key}>
                {({ handleProps }) => (
                  <WidgetRenderer
                    k={w.key}
                    collapsed={!!w.collapsed}
                    onToggleCollapse={() => toggleCollapse(w.key)}
                    onRemove={() => removeWidget(w.key)}
                    dragHandleProps={handleProps}
                    q={{ qIdentity, qInputs, qSnapshots, qAudit, qIntegrity }}
                  />
                )}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function WidgetRenderer({
  k,
  collapsed,
  onToggleCollapse,
  onRemove,
  dragHandleProps,
  q,
}: {
  k: WidgetKey;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  dragHandleProps: React.HTMLAttributes<HTMLButtonElement>;
  q: any;
}) {
  if (k === "identity_summary") {
    return (
      <WidgetCard
        title="Resumen de Identidad Financiera"
        subtitle="financial_identity"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      >
        {q.qIdentity.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : q.qIdentity.isError ? (
          <Empty title="Sin identidad" description="Este usuario no tiene financial_identity." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Income type" value={q.qIdentity.data?.income_type ?? "-"} />
            <KpiCard label="Stability" value={`${q.qIdentity.data.income_stability_score}/100`} />
            <KpiCard label="Risk" value={q.qIdentity.data.risk_tolerance} />
            <KpiCard label="Decision style" value={q.qIdentity.data.decision_style} />
          </div>
        )}
      </WidgetCard>
    );
  }

  if (k === "recent_inputs") {
    return (
      <WidgetCard
        title="Inputs recientes"
        subtitle="financial_profile_input"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      >
        {q.qInputs.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <div className="space-y-2">
            {(q.qInputs.data ?? []).slice(0, 5).map((i: any) => (
              <div key={i.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-sm">
                  <span className="text-white/60">{i.input_type}</span>{" "}
                  <span className="font-semibold">{i.input_value}</span>
                </div>
                <div className="text-xs text-white/45">{formatDistanceToNowStrict(i.created_at)}</div>
              </div>
            ))}
            {!(q.qInputs.data ?? []).length ? <Empty title="Sin inputs" description="Agrega el primer input desde FICE." /> : null}
          </div>
        )}
      </WidgetCard>
    );
  }

  if (k === "recent_snapshots") {
    return (
      <WidgetCard
        title="Historial recientes"
        subtitle="financial_identity_snapshot"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      >
        {q.qSnapshots.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <div className="space-y-2">
            {(q.qSnapshots.data ?? []).slice(0, 4).map((s: any) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{s.change_reason ?? "Snapshot"}</div>
                  <div className="text-xs text-white/45">{formatDistanceToNowStrict(s.created_at)}</div>
                </div>
                <div className="mt-2 text-xs text-white/55">
                  Stability: <span className="text-white/80">{(s.snapshot_data as any).income_stability_score}</span> • Risk:{" "}
                  <span className="text-white/80">{(s.snapshot_data as any).risk_tolerance}</span>
                </div>
              </div>
            ))}
            {!(q.qSnapshots.data ?? []).length ? <Empty title="Sin snapshots" description="Se generan al guardar inputs." /> : null}
          </div>
        )}
      </WidgetCard>
    );
  }

  if (k === "recent_audit") {
    return (
      <WidgetCard
        title="Auditoría reciente"
        subtitle="audit_event"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      >
        {q.qAudit.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <div className="space-y-2">
            {(q.qAudit.data ?? []).slice(0, 6).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{e.action}</div>
                  <div className="truncate text-xs text-white/55">
                    {e.actor} • {e.entity}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-white/45">{formatDistanceToNowStrict(e.created_at)}</div>
              </div>
            ))}
            {!(q.qAudit.data ?? []).length ? <Empty title="Sin eventos" description="Aparecerán acciones del sistema y usuarios." /> : null}
          </div>
        )}
      </WidgetCard>
    );
  }

  // integrity_status
  return (
    <WidgetCard
      title="Integridad"
      subtitle="TACL Integrity"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onRemove={onRemove}
      dragHandleProps={dragHandleProps}
    >
      {q.qIntegrity.isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
            <div>
              <div className="text-xs text-white/60">Status</div>
              <div className={cn("mt-1 text-lg font-semibold", q.qIntegrity.data?.[0]?.status === "WARN" ? "text-yellow-200" : "text-accent")}>
                {q.qIntegrity.data?.[0]?.status ?? "—"}
              </div>
            </div>
            <NavLink to="/tacl/integrity">
              <Button variant="secondary" size="sm">
                Ver detalles
              </Button>
            </NavLink>
          </div>
          <div className="text-xs text-white/55">
            Último check: {q.qIntegrity.data?.[0] ? formatDistanceToNowStrict(q.qIntegrity.data[0].created_at) : "—"}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}

function Empty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <div className="text-sm font-semibold">{title}</div>
      {description ? <div className="mt-1 text-xs text-white/55">{description}</div> : null}
    </div>
  );
}
