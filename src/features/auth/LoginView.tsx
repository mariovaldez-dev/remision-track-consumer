import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export const LoginView = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/login', { email, password });
      // El backend envuelve en { statusCode, message, data: { access_token, user } }
      const { access_token, user } = res.data;
      login(user, access_token);
      toast.success(`Bienvenido, ${user.nombre}`);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-12">

      {/* ── Gradient background ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_140%_100%_at_80%_0%,oklch(0.92_0.08_55)_0%,oklch(0.97_0.04_38)_35%,oklch(0.96_0.03_320)_70%,oklch(0.98_0.01_280)_100%)]" />

      {/* ── Blur orbs ── */}
      <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-orange-200/40 blur-3xl" />
      <div className="absolute top-[30%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-amber-100/50 blur-2xl" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-[400px]">

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-[13px] font-semibold tracking-tight">
            Facturación &nbsp;·&nbsp; Acceso
          </span>
        </div>

        {/* Title */}
        <h1 className="text-center text-[2.1rem] font-extrabold text-foreground leading-tight tracking-tight mb-8">
          ¡Bienvenido!
        </h1>

        {/* Form card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-xl shadow-primary/10 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-foreground/80 pl-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                autoComplete="email"
                className="w-full h-12 rounded-2xl border border-border/70 bg-white/80 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all shadow-sm"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-foreground/80 pl-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-12 rounded-2xl border border-border/70 bg-white/80 px-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-foreground text-background text-[14px] font-bold tracking-wide hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="size-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
          Sistema de gestión interno · v1.0
        </p>
      </div>
    </div>
  );
};
