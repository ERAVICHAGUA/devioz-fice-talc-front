export type WidgetKey =
  | "identity_summary"
  | "transactions_summary"
  | "forecast_summary"
  | "recent_snapshots"
  | "recent_alerts";

export type WidgetState = {
  key: WidgetKey;
  collapsed?: boolean;
};

export type DashboardLayout = {
  version: 1;
  widgets: WidgetState[];
};

export const DEFAULT_LAYOUT: DashboardLayout = {
  version: 1,
  widgets: [
    { key: "identity_summary" },
    { key: "transactions_summary" },
    { key: "forecast_summary" },
    { key: "recent_snapshots" },
    { key: "recent_alerts" },
  ],
};

export function layoutForRole(_role: unknown): DashboardLayout {
  return DEFAULT_LAYOUT;
}