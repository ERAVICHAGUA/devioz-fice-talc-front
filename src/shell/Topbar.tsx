import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, UserCircle2 } from "lucide-react";
import { useAuth } from "@/state/auth";
import { toast } from "sonner";

export function Topbar({ onGlobalSearch }: { onGlobalSearch: (q: string) => void }) {
  const auth = useAuth();
  const [q, setQ] = React.useState("");

  const displayName =
    auth.status === "authenticated"
      ? auth.full_name ?? auth.email ?? "Mi cuenta"
      : "Invitado";
  return (
    <div className="glass flex items-center justify-between gap-3 rounded-3xl px-4 py-3">
      <div className="relative w-full max-w-[560px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar: historial, actividad, usuarios…"
          className="pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") onGlobalSearch(q);
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10">
              <UserCircle2 className="h-5 w-5 text-white/60" />
              <span className="hidden sm:block">{displayName}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                toast.message("Perfil", {
                  description: "Aquí luego conectas datos reales del usuario.",
                });
              }}
            >
              Mi perfil
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={async () => {
                await auth.logout?.();
                toast.success("Sesión cerrada.");
              }}
              className="text-red-200"
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Opcional: botón acción */}
        <Button variant="secondary" size="sm" className="h-10">
          Ayuda
        </Button>
      </div>
    </div>
  );
}