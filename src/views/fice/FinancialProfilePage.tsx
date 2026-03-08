import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import * as fice from "@/services/ficeApi";
import { Skeleton } from "@/components/common/Skeleton";
import { KpiCard } from "@/components/common/KpiCard";
import { fmtDate } from "@/views/system/format";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function FinancialProfilePage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user_id : "u_user";

  const qIdentity = useQuery({
  queryKey: ["identity"],
  queryFn: () => fice.getFinancialIdentity()
});

const qInputs = useQuery({
  queryKey: ["inputs"],
  queryFn: () => fice.getInputs()
});

const qSnapshots = useQuery({
  queryKey: ["snapshots"],
  queryFn: () => fice.getSnapshots()
});

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight">FICE • Perfil Financiero</div>
          <div className="mt-1 text-sm text-white/60">Identidad financiera, inputs, snapshots y comparación simple.</div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/fice/inputs">
            <Button variant="secondary" size="sm">Inputs</Button>
          </NavLink>
          <NavLink to="/fice/snapshots">
            <Button size="sm">Snapshots</Button>
          </NavLink>
        </div>
      </div>

      <Card className="p-0">
        <CardHeader>
          <CardTitle>Financial Identity</CardTitle>
          <CardDescription>Entidad: financial_identity</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {qIdentity.isLoading ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : qIdentity.isError ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              No hay identidad para este usuario.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <KpiCard label="Income type" value={qIdentity.data?.income_type ?? "-"} />

                  <KpiCard
                    label="Stability score"
                    value={
                      qIdentity.data?.income_stability_score
                        ? `${qIdentity.data.income_stability_score}/100`
                        : "-"
                    }
                  />
                  <KpiCard label="Risk tolerance" value={qIdentity.data?.risk_tolerance ?? "-"} />
                  <KpiCard label="Decision style" value={qIdentity.data?.decision_style ?? "-"} />
                  <KpiCard
                    label="Created"
                    value={qIdentity.data?.created_at ? fmtDate(qIdentity.data.created_at) : "-"}
                    className="lg:col-span-2"
                  />
                  <KpiCard
                    label="Last updated"
                    value={qIdentity.data?.last_updated ? fmtDate(qIdentity.data.last_updated) : "-"}
                    className="lg:col-span-2"
                  />
              </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="inputs">
        <TabsList>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="compare">Comparación</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="mt-4">
          <Card className="p-0">
            <CardHeader>
              <CardTitle>Inputs recientes</CardTitle>
              <CardDescription>financial_profile_input</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {qInputs.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(qInputs.data ?? []).slice(0, 8).map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-sm">
                        <span className="text-white/60">{i.input_type}</span> <span className="font-semibold">{i.input_value}</span>
                      </div>
                      <div className="text-xs text-white/45">{fmtDate(i.created_at)}</div>
                    </div>
                  ))}
                  {!(qInputs.data ?? []).length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
                      Sin inputs.
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="mt-4">
          <Card className="p-0">
            <CardHeader>
              <CardTitle>Snapshots recientes</CardTitle>
              <CardDescription>financial_identity_snapshot</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {qSnapshots.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (
                <div className="space-y-2">
                  {(qSnapshots.data ?? []).slice(0, 6).map((s) => (
                    <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{s.change_reason ?? "Snapshot"}</div>
                        <div className="text-xs text-white/45">{fmtDate(s.created_at)}</div>
                      </div>
                      <div className="mt-2 text-xs text-white/55">{JSON.stringify(s.snapshot_data)}</div>
                    </div>
                  ))}
                  {!(qSnapshots.data ?? []).length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
                      Sin snapshots.
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare" className="mt-4">
          <CompareSnapshots snapshots={qSnapshots.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompareSnapshots({ snapshots }: { snapshots: any[] }) {
  const a = snapshots?.[0]?.snapshot_data;
  const b = snapshots?.[1]?.snapshot_data;
  if (!a || !b) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
        Necesitas al menos 2 snapshots para comparar.
      </div>
    );
  }

  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold">Diff simple (snapshot 0 vs snapshot 1)</div>
      <div className="mt-3 overflow-auto scrollbar-thin">
        <table className="min-w-full text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Campo</th>
              <th className="px-3 py-2 text-left font-medium">A</th>
              <th className="px-3 py-2 text-left font-medium">B</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const av = (a as any)[k];
              const bv = (b as any)[k];
              const changed = JSON.stringify(av) !== JSON.stringify(bv);
              return (
                <tr key={k} className="border-t border-white/10">
                  <td className="px-3 py-2 text-white/70">{k}</td>
                  <td className={"px-3 py-2 " + (changed ? "text-white" : "text-white/60")}>{String(av)}</td>
                  <td className={"px-3 py-2 " + (changed ? "text-accent" : "text-white/60")}>{String(bv)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
