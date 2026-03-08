import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/state/auth";
import { CursorGlow } from "@/components/common/CursorGlow";

type Mode = "login" | "register";

function errorToMessage(err: unknown) {
  let msg = err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.";
  if (msg.toLowerCase().includes("failed to fetch")) {
    msg = "No se pudo conectar al servidor. Verifica que el servicio esté disponible y que CORS esté habilitado.";
  }
  return msg;
}

export function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const auth = useAuth();

  const from = loc.state?.from ?? "/app/dashboard";

  const [mode, setMode] = React.useState<Mode>("login");
  const [loading, setLoading] = React.useState(false);

  const [email, setEmail] = React.useState("egrp21405@devioz.com");
  const [password, setPassword] = React.useState("elias_21405");

  const [regFirstName, setRegFirstName] = React.useState("");
  const [regLastName, setRegLastName] = React.useState("");
  const [regUsername, setRegUsername] = React.useState("");
  const [regAge, setRegAge] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");

  React.useEffect(() => {
    if (auth.status === "authenticated") nav(from, { replace: true });
  }, [auth.status, from, nav]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await auth.login(email.trim(), password);
      toast.success("¡Bienvenido!");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(errorToMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!regFirstName.trim()) return toast.error("Escribe tus nombres.");
    if (!regLastName.trim()) return toast.error("Escribe tus apellidos.");
    if (!regUsername.trim()) return toast.error("Escribe un nombre de usuario.");
    if (!regEmail.trim()) return toast.error("Escribe tu correo.");
    if (!regPassword) return toast.error("Escribe una contraseña.");

    const ageNumber = regAge.trim() ? Number(regAge) : undefined;

    if (regAge.trim() && Number.isNaN(ageNumber)) {
      return toast.error("La edad debe ser un número válido.");
    }

    setLoading(true);
    try {
      await auth.register({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        username: regUsername.trim(),
        age: ageNumber,
        email: regEmail.trim(),
        password: regPassword,
      });

      toast.success("Cuenta creada. Ahora inicia sesión.");
      setMode("login");
      setEmail(regEmail.trim());
      setPassword("");

      setRegFirstName("");
      setRegLastName("");
      setRegUsername("");
      setRegAge("");
      setRegEmail("");
      setRegPassword("");
    } catch (err) {
      toast.error(errorToMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0F14] text-white">
      <CursorGlow />

      <div
        className="pointer-events-none absolute -top-64 -right-64 h-[700px] w-[700px] rounded-full blur-[170px]"
        style={{ background: "rgba(46, 229, 157, 0.16)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-72 -left-64 h-[650px] w-[650px] rounded-full blur-[170px]"
        style={{ background: "rgba(20, 184, 166, 0.10)" }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[520px]"
        >
          <Card className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <img
                src="/logo-dineroh.png"
                alt="Diner Oh!"
                className="h-12 w-auto drop-shadow-[0_0_18px_rgba(46,229,157,0.22)]"
              />
              <h1 className="mt-5 text-2xl font-semibold md:text-3xl">
                {mode === "login" ? "Bienvenido" : "Crea tu cuenta"}
              </h1>
              <p className="mt-2 max-w-sm text-sm text-white/65">
                {mode === "login" ? "Ingresa para ver tu panel." : "Regístrate para empezar."}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <div className="grid grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={[
                    "rounded-xl py-2 text-sm font-semibold transition",
                    mode === "login" ? "bg-white/10 text-white" : "text-white/65 hover:text-white",
                  ].join(" ")}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={[
                    "rounded-xl py-2 text-sm font-semibold transition",
                    mode === "register" ? "bg-white/10 text-white" : "text-white/65 hover:text-white",
                  ].join(" ")}
                >
                  Registrarse
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  onSubmit={onLogin}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-white/75">Correo</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Contraseña</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-12 w-full rounded-2xl bg-emerald-400 text-black hover:bg-emerald-300"
                  >
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => nav("/", { replace: false })}
                    className="w-full text-center text-sm text-white/55 hover:text-white"
                  >
                    Volver al inicio
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  onSubmit={onRegister}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-white/75">Nombres</Label>
                    <Input
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="Elias"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Apellidos</Label>
                    <Input
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Ravichagua"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Usuario</Label>
                    <Input
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="eravichagua"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Edad</Label>
                    <Input
                      type="number"
                      value={regAge}
                      onChange={(e) => setRegAge(e.target.value)}
                      placeholder="20"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Correo</Label>
                    <Input
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Contraseña</Label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Crea una contraseña"
                      className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/35"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-12 w-full rounded-2xl bg-emerald-400 text-black hover:bg-emerald-300"
                  >
                    {loading ? "Creando..." : "Crear cuenta"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full text-center text-sm text-white/55 hover:text-white"
                  >
                    Ya tengo cuenta, quiero iniciar sesión
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}