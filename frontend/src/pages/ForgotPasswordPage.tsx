import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Kanban, ArrowLeft, Mail, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      const token = res.data?.data?.resetToken;
      if (token) {
        setResetToken(token);
        toast.success('Token de recuperación generado');
      } else {
        toast.success(res.data?.data?.message || 'Si el correo existe, se generó el enlace');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al solicitar recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resetToken) return;
    navigator.clipboard.writeText(resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Token copiado al portapapeles');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 mb-4">
            <Kanban className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Recuperar Contraseña</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ingresa tu correo y recibirás un token para restablecer tu contraseña
          </p>
        </div>

        {!resetToken ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Generando token...' : 'Generar Token de Recuperación'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                ✅ Token generado exitosamente
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Copia este token y úsalo en la página de restablecimiento de contraseña. Es válido por <strong>1 hora</strong>.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 truncate">
                  {resetToken}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                  title="Copiar token"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Link
              to="/reset-password"
              className="block w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs text-center shadow-lg shadow-emerald-500/20 transition"
            >
              Ir a Restablecer Contraseña →
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
