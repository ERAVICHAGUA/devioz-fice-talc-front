import {
  LayoutDashboard,
  Fingerprint,
  ShieldCheck,
  ActivitySquare,
  FileSearch,
  ClipboardCheck,
  Wallet,
  LineChart,
  Sparkles,
} from "lucide-react";

export type NavGroup = "Core" | "Finanzas" | "Análisis" | "Sistema";

export type NavItem = {
  label: string;
  to: string;
  icon: any;
  group: NavGroup;
};

export const NAV: NavItem[] = [
  { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard, group: "Core" },

  { label: "Registro financiero", to: "/app/finance/inputs", icon: FileSearch, group: "Finanzas" },
  { label: "Movimientos", to: "/app/finance/transactions", icon: Wallet, group: "Finanzas" },
  { label: "Perfil financiero", to: "/app/finance/profile", icon: Fingerprint, group: "Finanzas" },

  { label: "Proyecciones", to: "/app/analysis/forecast", icon: LineChart, group: "Análisis" },
  { label: "Simulaciones", to: "/app/analysis/simulations", icon: Sparkles, group: "Análisis" },

  { label: "Auditoría", to: "/app/system/audit", icon: ActivitySquare, group: "Sistema" },
  { label: "Integridad", to: "/app/system/integrity", icon: ShieldCheck, group: "Sistema" },

  { label: "Snapshots", to: "/app/system/snapshots", icon: ClipboardCheck, group: "Sistema" },
];