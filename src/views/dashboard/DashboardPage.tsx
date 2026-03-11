import * as React from "react";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/common/KpiCard";
import { Skeleton } from "@/components/common/Skeleton";
import { WidgetCard } from "@/components/common/WidgetCard";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "@/views/system/format";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DEFAULT_LAYOUT,
  layoutForRole,
  type DashboardLayout,
  type WidgetKey,
} from "./widgets";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

import { ficeApi } from "@/services/ficeApi";
import { tiieApi } from "@/services/tiieApi";
import { crfeApi } from "@/services/crfeApi";

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
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const handleProps = { ...attributes, ...listeners };

  onHandleProps?.(handleProps);

  return (
    <div ref={setNodeRef} style={style}>
      {children({ handleProps })}
    </div>
  );
}

function money(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function DashboardPage() {
  const auth = useAuth();
  const fallback = React.useMemo(() => layoutForRole(auth.role), [auth.role]);
  const [layout, setLayout] = React.useState<DashboardLayout>(() => readLayout(fallback));

  React.useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) setLayout(fallback);
  }, [fallback]);

  const userId = auth.status === "authenticated" ? Number(auth.user_id) : null;

  const qIdentity = useQuery({
    queryKey: ["identity", userId],
    queryFn: () => ficeApi.getFinancialIdentityByUserId(userId as number),
    enabled: !!userId,
    retry: false,
  });

  const qTransactions = useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => tiieApi.getTransactions(userId as number),
    enabled: !!userId,
    retry: false,
  });

  const qForecasts = useQuery({
    queryKey: ["forecasts", userId],
    queryFn: () => crfeApi.getForecasts(userId as number),
    enabled: !!userId,
    retry: false,
  });

  const qAlerts = useQuery({
    queryKey: ["risk-alerts", userId],
    queryFn: () => crfeApi.getRiskAlerts(userId as number),
    enabled: !!userId,
    retry: false,
  });

  const qSnapshots = useQuery({
    queryKey: ["historial", userId],
    queryFn: async () => {
      const identity = await ficeApi.getFinancialIdentityByUserId(userId as number);
      if (!identity?.id) return [];
      return ficeApi.getSnapshotsByFinancialIdentityId(identity.id);
    },
    enabled: !!userId,
    retry: false,
  });

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
      widgets: layout.widgets.map((w) =>
        w.key === key ? { ...w, collapsed: !w.collapsed } : w
      ),
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

  const transactions = Array.isArray(qTransactions.data) ? (qTransactions.data as any[]) : [];
  const forecasts = Array.isArray(qForecasts.data) ? (qForecasts.data as any[]) : [];
  const alerts = Array.isArray(qAlerts.data) ? (qAlerts.data as any[]) : [];

  const totalIncome = transactions
    .filter((t) => String(t.type).toUpperCase() === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => String(t.type).toUpperCase() === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  const latestForecast = forecasts.length > 0 ? forecasts[forecasts.length - 1] : null;

  const identityLastUpdated =
    (qIdentity.data as any)?.lastUpdated || (qIdentity.data as any)?.last_updated
      ? formatDistanceToNowStrict(
          (qIdentity.data as any)?.lastUpdated ?? (qIdentity.data as any)?.last_updated
        )
      : "—";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">Dashboard</div>
          <div className="mt-1 text-sm text-white/60">
            Toma el control de tu dinero
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={resetLayout}>
            Restablecer Diseño
          </Button>

          <NavLink to="/app/finance/profile">
            <Button size="sm">Ir a perfil</Button>
          </NavLink>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Sesión"
          value={`Hola ${auth.firstName ?? auth.username ?? "Usuario"}`}
          hint="Tu espacio financiero está activo"
        />

        <KpiCard
          label="Identidad actualizada"
          value={identityLastUpdated}
          hint="Última actualización"
        />

        <KpiCard  
          label="Balance actual"
          value={money(balance)}
          hint="Ingresos menos gastos"
        />

        <KpiCard
          label="Alertas"
          value={String(alerts.length)}
          hint="Alertas de riesgo detectadas"
        />
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
                    q={{
                      qIdentity,
                      qTransactions,
                      qForecasts,
                      qAlerts,
                      qSnapshots,
                      totalIncome,
                      totalExpense,
                      balance,
                      latestForecast,
                    }}
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
        title="Resumen de identidad financiera"
        subtitle="Analiza, entiende y optimiza tu capital"
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
        ) : q.qIdentity.isError || !q.qIdentity.data ? (
          <Empty title="Sin identidad" description="Este usuario no tiene identidad financiera." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Tipo de Ingreso" value={(q.qIdentity.data as any)?.incomeType ?? "-"} />
            <KpiCard
              label="Estabilidad"
              value={`${(q.qIdentity.data as any)?.incomeStabilityScore ?? "-"}/100`}
            />
            <KpiCard label="Riesgo" value={(q.qIdentity.data as any)?.riskTolerance ?? "-"} />
            <KpiCard label="Estilo de Decisión" value={(q.qIdentity.data as any)?.decisionStyle ?? "-"} />
          </div>
        )}
      </WidgetCard>
    );
  }

  if (k === "transactions_summary") {
    return (
      <WidgetCard
        title="Resumen de movimientos"
        subtitle="Análisis de Gastos e Ingresos"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      >
        {q.qTransactions.isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Ingresos" value={money(q.totalIncome)} />
            <KpiCard label="Gastos" value={money(q.totalExpense)} />
            <KpiCard label="Balance" value={money(q.balance)} />
          </div>
        )}
      </WidgetCard>
    );
  }

  if (k === "forecast_summary") {
    return (
      <WidgetCard
        title="Resumen de proyecciones"
        subtitle="Escenarios Futuros basados en tu comportamiento"
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onRemove={onRemove}
        dragHandleProps={dragHandleProps}
      >
        {q.qForecasts.isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <KpiCard
              label="Proyectos generados"
              value={String(Array.isArray(q.qForecasts.data) ? q.qForecasts.data.length : 0)}
            />
            <KpiCard
              label="Alertas"
              value={String(Array.isArray(q.qAlerts.data) ? q.qAlerts.data.length : 0)}
            />
            <KpiCard
              label="Último balance"
              value={money(q.latestForecast?.forecastBalance ?? q.latestForecast?.projectedBalance)}
            />
          </div>
        )}
      </WidgetCard>
    );
  }

  if (k === "recent_snapshots") {
    return (
      <WidgetCard
        title="Historial reciente"
        subtitle="Histórico de cambios en tu identidad financiera"
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
            {((q.qSnapshots.data as any[]) ?? []).slice(0, 4).map((s: any) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">
                    {s.changeReason ?? s.change_reason ?? "Snapshot"}
                  </div>
                  <div className="text-xs text-white/45">
                    {s.createdAt || s.created_at
                      ? formatDistanceToNowStrict(s.createdAt ?? s.created_at)
                      : "—"}
                  </div>
                </div>
              </div>
            ))}
            {!((q.qSnapshots.data as any[]) ?? []).length ? (
              <Empty title="Sin snapshots" description="Aún no hay historial reciente." />
            ) : null}
          </div>
        )}
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Alertas de riesgo"
      subtitle="CRFE"
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
      onRemove={onRemove}
      dragHandleProps={dragHandleProps}
    >
      {q.qAlerts.isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="space-y-3">
          {((q.qAlerts.data as any[]) ?? []).slice(0, 5).map((a: any) => (
            <div key={a.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div
                className={cn(
                  "text-sm font-semibold",
                  String(a.riskLevel ?? a.alertType ?? "").includes("HIGH")
                    ? "text-red-300"
                    : "text-yellow-200"
                )}
              >
                {a.riskLevel ?? a.alertType ?? "RISK"}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {a.message ?? a.description ?? "Sin detalle"}
              </div>
            </div>
          ))}
          {!((q.qAlerts.data as any[]) ?? []).length ? (
            <Empty title="Sin alertas" description="No se detectaron riesgos por ahora." />
          ) : null}
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