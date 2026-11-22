import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { Kanban, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || sessionStorage.getItem('pending_invite_token');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        inviteToken: inviteToken || undefined,
        workspaceName: workspaceName || undefined,
      });
      const { user, accessToken, workspace } = res.data.data;

      setAuth(user, accessToken, [workspace]);
      toast.success(`¡Cuenta creada exitosamente! Bienvenido, ${user.firstName}.`);
      if (inviteToken) {
        sessionStorage.removeItem('pending_invite_token');
        navigate(`/invite/${inviteToken}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 mb-4">
            <Kanban className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Crear Cuenta</h1>
          <p className="text-xs text-slate-400 mt-1">
            {inviteToken ? 'Crea tu cuenta para unirte al proyecto' : 'Comienza tu espacio de trabajo colaborativo'}
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Pérez"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@empresa.com"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {!inviteToken && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Espacio de Trabajo</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Ej: Innovación & Desarrollo"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 mt-3"
          >
            <span>{loading ? 'Creando cuenta...' : 'Registrarme'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            to={inviteToken ? `/login?invite=${inviteToken}` : '/login'}
            className="text-emerald-400 font-semibold hover:underline"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
