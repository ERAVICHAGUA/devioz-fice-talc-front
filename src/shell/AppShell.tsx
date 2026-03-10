import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "@/shell/Sidebar";
import { Topbar } from "@/shell/Topbar";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function AppShell() {
  const navigate = useNavigate();

  const onGlobalSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    toast.message("Búsqueda global (demo)", { description: `Query: "${trimmed}" • Tip: conecta esto a React Query + endpoints.` });
    // Example: route based on keywords
    if (trimmed.toLowerCase().includes("audit")) navigate("/app/system/audit");
      else if (trimmed.toLowerCase().includes("snapshot")) navigate("/app/system/snapshots");
      else if (trimmed.toLowerCase().includes("perfil")) navigate("/app/finance/profile");
      else if (trimmed.toLowerCase().includes("mov")) navigate("/app/finance/transactions");
      else if (trimmed.toLowerCase().includes("proy")) navigate("/app/analysis/forecast");
      else if (trimmed.toLowerCase().includes("simu")) navigate("/app/analysis/simulations");
  };

  return (
    <div className="min-h-screen bg-bg-950">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none fixed -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-4 p-4 lg:grid-cols-[auto,1fr] lg:gap-5 lg:p-6">
        <div className="h-[calc(100vh-48px)] lg:sticky lg:top-6">
          <Sidebar />
        </div>

        <div className="space-y-4">
          <Topbar onGlobalSearch={onGlobalSearch} />
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="min-h-[calc(100vh-140px)] rounded-3xl border border-white/10 bg-bg-900/30 p-4 shadow-soft backdrop-blur-glass lg:p-5"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  );
}
