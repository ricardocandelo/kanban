import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { Kanban, Users, Shield, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface InviteData {
  id: string;
  token: string;
  role: 'VIEWER' | 'MEMBER' | 'ADMIN';
  expiresAt: string | null;
  project: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    workspace: { id: string; name: string; logoUrl: string | null };
  };
  createdBy: { firstName: string; lastName: string; avatarUrl: string | null };
}

const roleInfo = {
  VIEWER: { label: 'Visualizador', icon: Eye, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  MEMBER: { label: 'Miembro', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ADMIN: { label: 'Administrador', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

export const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'error' | 'accepting' | 'done'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get(`/invite/${token}`)
      .then(res => {
        setInvite(res.data.data);
        setStatus('valid');
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Enlace inválido o expirado');
        setStatus('error');
      });
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // Guardar token para aceptar después del login/registro
      sessionStorage.setItem('pending_invite_token', token!);
      navigate(`/login?invite=${token}`);
      return;
    }

    try {
      setStatus('accepting');
      const res = await api.post(`/invite/${token}/accept`);
      const { alreadyMember, project } = res.data.data;

      if (alreadyMember) {
        toast('Ya eres miembro de este proyecto', { icon: '👋' });
      } else {
        toast.success(`¡Te uniste al proyecto ${project.name}!`);
      }
      setStatus('done');
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al unirse al proyecto');
      setStatus('valid');
    }
  };

  const role = invite ? roleInfo[invite.role] : null;
  const RoleIcon = role?.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#060911] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] rounded-2xl p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 mb-3">
            <Kanban className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">FlowBoard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Invitación a proyecto</p>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Validando invitación...</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Enlace no válido</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{errorMsg}</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">¡Te uniste exitosamente!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Redirigiendo al dashboard...</p>
          </div>
        )}

        {/* Valid invite */}
        {(status === 'valid' || status === 'accepting') && invite && role && RoleIcon && (
          <div className="space-y-5">
            {/* Invitado por */}
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {invite.createdBy.firstName} {invite.createdBy.lastName}
              </span>{' '}
              te invita a unirte a:
            </p>

            {/* Proyecto */}
            <div className="bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                  {invite.project.key}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  {invite.project.name}
                </span>
              </div>
              {invite.project.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{invite.project.description}</p>
              )}
              <p className="text-[11px] text-slate-400">
                Workspace: <span className="font-medium text-slate-600 dark:text-slate-300">{invite.project.workspace.name}</span>
              </p>
            </div>

            {/* Rol */}
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${role.bg}`}>
              <RoleIcon className={`w-4 h-4 ${role.color}`} />
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tu rol: {role.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {invite.role === 'VIEWER' && 'Podrás ver las tareas y tableros del proyecto'}
                  {invite.role === 'MEMBER' && 'Podrás crear y gestionar tareas en el proyecto'}
                  {invite.role === 'ADMIN' && 'Tendrás acceso completo para administrar el proyecto'}
                </p>
              </div>
            </div>

            {/* Expiración */}
            {invite.expiresAt && (
              <p className="text-[11px] text-center text-slate-400">
                Este enlace expira el{' '}
                <span className="font-medium text-slate-500 dark:text-slate-300">
                  {new Date(invite.expiresAt).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </p>
            )}

            {/* Acción */}
            {user ? (
              <button
                onClick={handleAccept}
                disabled={status === 'accepting'}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition disabled:opacity-60 cursor-pointer"
              >
                {status === 'accepting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uniéndose...</>
                ) : (
                  `Unirme como ${role.label}`
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleAccept}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Iniciar sesión para unirme
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('pending_invite_token', token!);
                    navigate(`/register?invite=${token}`);
                  }}
                  className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-[#1a2947] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#101a30] transition cursor-pointer"
                >
                  Crear cuenta y unirme
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
