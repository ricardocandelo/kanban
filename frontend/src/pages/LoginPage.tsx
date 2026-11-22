import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { Kanban, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || sessionStorage.getItem('pending_invite_token');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, workspaces } = res.data.data;
      setAuth(user, accessToken, workspaces);
      toast.success(`¡Bienvenido de vuelta, ${user.firstName}!`);

      // Si hay invite pendiente, aceptarlo y redirigir a la página de invitación
      if (inviteToken) {
        sessionStorage.removeItem('pending_invite_token');
        navigate(`/invite/${inviteToken}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#060911] p-4 select-none transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 mb-4">
            <Kanban className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">FlowBoard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Plataforma Colaborativa de Gestión de Trabajo
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          ¿No tienes una cuenta aún?{' '}
          <Link
            to={inviteToken ? `/register?invite=${inviteToken}` : '/register'}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
