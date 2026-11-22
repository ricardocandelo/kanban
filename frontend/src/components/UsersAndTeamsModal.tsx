import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { User, Team, TeamMember } from '../types/index.js';
import { compressAndRenderImage } from '../utils/imageCompressor.js';
import {
  X,
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  Layers,
  Plus,
  Trash2,
  Check,
  KeyRound,
  UserX,
  UserCheck,
  Camera,
  Sparkles,
  Settings,
  ShieldCheck,
  Lock,
  UserMinus,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UsersAndTeamsModalProps {
  onClose: () => void;
}

export const UsersAndTeamsModal: React.FC<UsersAndTeamsModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { user: currentUser, currentWorkspace } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados formulario nuevo usuario
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [newUserRole, setNewUserRole] = useState('MEMBER');
  const [newUserSuperAdmin, setNewUserSuperAdmin] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarCompressionInfo, setAvatarCompressionInfo] = useState<string | null>(null);

  // Estados para modal de cambio de contraseña administrativo
  const [pwdModalUser, setPwdModalUser] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');

  // Estados formulario nuevo equipo
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#2563EB');
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);

  // Estados para Modal de Gestión de Equipo (Permisos, Miembros, Edición)
  const [selectedManageTeam, setSelectedManageTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [editTeamColor, setEditTeamColor] = useState('#2563EB');
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberWithPermission, setAddMemberWithPermission] = useState(false);

  // 1. Obtener lista de usuarios
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users', searchQuery, currentWorkspace?.id],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { q: searchQuery || undefined, workspaceId: currentWorkspace?.id },
      });
      return res.data.data;
    },
  });

  // 2. Obtener lista de equipos
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const res = await api.get(`/workspaces/${currentWorkspace.id}/teams`);
      return res.data.data;
    },
    enabled: !!currentWorkspace?.id,
  });

  // Mantener datos actualizados del equipo que se está gestionando
  useEffect(() => {
    if (selectedManageTeam) {
      const refreshed = teams.find((t) => t.id === selectedManageTeam.id);
      if (refreshed) {
        setSelectedManageTeam(refreshed);
      }
    }
  }, [teams]);

  // Al abrir gestión de un equipo, precargar datos
  const handleOpenManageTeam = (team: Team) => {
    setSelectedManageTeam(team);
    setEditTeamName(team.name);
    setEditTeamDesc(team.description || '');
    setEditTeamColor(team.color || '#2563EB');
    setAddMemberUserId('');
    setAddMemberWithPermission(false);
  };

  // Subir y optimizar foto para nuevo usuario
  const handleNewUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const comp = await compressAndRenderImage(file, 256, 0.85);
      setAvatarCompressionInfo(`${Math.round(comp.originalSize / 1024)}KB ➔ ${Math.round(comp.compressedSize / 1024)}KB (${comp.reductionPercentage}% menos)`);

      const { data: signRes } = await api.post('/attachments/sign', { folder: 'flowboard/avatars' });
      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

      const formData = new FormData();
      formData.append('file', comp.file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setNewUserAvatar(data.secure_url);
        toast.success('Foto optimizada y cargada');
      }
    } catch {
      toast.error('Error al procesar la foto');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Mutación: Crear Usuario
  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/users', {
        email: newUserEmail,
        password: newUserPassword,
        firstName: newUserFirstName,
        lastName: newUserLastName,
        avatarUrl: newUserAvatar || undefined,
        role: newUserRole,
        isSuperAdmin: newUserSuperAdmin,
        workspaceId: currentWorkspace?.id,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
      setIsCreatingUser(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserAvatar('');
      setAvatarCompressionInfo(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al crear usuario');
    },
  });

  // Mutación: Activar / Desactivar Usuario
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await api.patch(`/users/${userId}/status`, { isActive });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.isActive ? 'Usuario activado' : 'Usuario desactivado');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    },
  });

  // Mutación: Resetear contraseña desde Admin
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await api.post(`/users/${userId}/reset-password`, { newPassword });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada con éxito');
      setPwdModalUser(null);
      setAdminNewPassword('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
    },
  });

  // Mutación: Eliminar Usuario permanentemente
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado permanentemente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al eliminar usuario');
    },
  });

  // Mutación: Crear Equipo
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/workspaces/${currentWorkspace?.id}/teams`, {
        name: newTeamName,
        description: newTeamDesc || undefined,
        color: newTeamColor,
        memberIds: selectedTeamMemberIds,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentWorkspace?.id] });
      toast.success('Equipo creado exitosamente');
      setIsCreatingTeam(false);
      setNewTeamName('');
      setNewTeamDesc('');
      setSelectedTeamMemberIds([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al crear equipo');
    },
  });

  // Mutación: Actualizar Equipo
  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      if (!selectedManageTeam) return;
      const res = await api.patch(`/teams/${selectedManageTeam.id}`, {
        name: editTeamName,
        description: editTeamDesc || undefined,
        color: editTeamColor,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentWorkspace?.id] });
      toast.success('Datos del equipo actualizados');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al actualizar equipo');
    },
  });

  // Mutación: Dar o Quitar Permiso de Gestión a un Miembro ("A quien se le dé permiso")
  const toggleMemberPermissionMutation = useMutation({
    mutationFn: async ({ teamId, userId, canManage }: { teamId: string; userId: string; canManage: boolean }) => {
      const res = await api.patch(`/teams/${teamId}/members/${userId}`, {
        canManage,
        role: canManage ? 'LEADER' : 'MEMBER',
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentWorkspace?.id] });
      toast.success(data.canManage ? 'Permiso de gestión otorgado al miembro' : 'Permiso de gestión revocado');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al modificar permisos');
    },
  });

  // Mutación: Añadir Miembro al Equipo
  const addTeamMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedManageTeam || !addMemberUserId) return;
      const res = await api.post(`/teams/${selectedManageTeam.id}/members`, {
        userId: addMemberUserId,
        canManage: addMemberWithPermission,
        role: addMemberWithPermission ? 'LEADER' : 'MEMBER',
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentWorkspace?.id] });
      setAddMemberUserId('');
      setAddMemberWithPermission(false);
      toast.success('Miembro añadido al equipo');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al añadir miembro');
    },
  });

  // Mutación: Remover Miembro del Equipo
  const removeTeamMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      await api.delete(`/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentWorkspace?.id] });
      toast.success('Miembro removido del equipo');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al remover miembro');
    },
  });

  // Mutación: Eliminar Equipo
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await api.delete(`/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', currentWorkspace?.id] });
      setSelectedManageTeam(null);
      toast.success('Equipo eliminado exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al eliminar equipo');
    },
  });

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Administración de Usuarios y Equipos
                </h2>
                {currentUser?.isSuperAdmin && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gestiona cuentas, contraseñas, equipos y permisos de delegación.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 dark:border-[#1a2947] bg-slate-50/50 dark:bg-[#0b1120]/50">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === 'users'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <Users className="w-4 h-4" />
            Usuarios ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === 'teams'
                ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            <Layers className="w-4 h-4" />
            Equipos de Trabajo ({teams.length})
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: USUARIOS */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => setIsCreatingUser(!isCreatingUser)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>

              {/* Formulario nuevo usuario */}
              {isCreatingUser && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createUserMutation.mutate();
                  }}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#101a30] border border-blue-500/30 space-y-4 animate-in fade-in"
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Registrar Nuevo Usuario
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={newUserFirstName}
                        onChange={(e) => setNewUserFirstName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={newUserLastName}
                        onChange={(e) => setNewUserLastName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Contraseña Inicial *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Foto de perfil optimizada */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Foto de Perfil (Optimización automática en WebP)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-[#0b1120] flex items-center justify-center overflow-hidden border border-slate-300 dark:border-[#1a2947] shrink-0">
                        {newUserAvatar ? (
                          <img src={newUserAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-[#162544] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-300 dark:hover:bg-[#1f3560] transition">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{isUploadingAvatar ? 'Optimizando...' : 'Cargar foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingAvatar}
                            onChange={handleNewUserAvatarUpload}
                            className="hidden"
                          />
                        </label>
                        {avatarCompressionInfo && (
                          <span className="block text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            <Sparkles className="w-3 h-3 inline mr-1" />
                            {avatarCompressionInfo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Rol en Workspace</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white"
                      >
                        <option value="MEMBER">Member (Miembro)</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OWNER">Owner (Propietario)</option>
                      </select>
                    </div>

                    {currentUser?.isSuperAdmin && (
                      <label className="flex items-center gap-2 cursor-pointer mt-4">
                        <input
                          type="checkbox"
                          checked={newUserSuperAdmin}
                          onChange={(e) => setNewUserSuperAdmin(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                        />
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Asignar Permisos de Super Admin Global
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingUser(false)}
                      className="px-4 py-2 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createUserMutation.isPending || isUploadingAvatar}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {createUserMutation.isPending ? 'Guardando...' : 'Crear Usuario'}
                    </button>
                  </div>
                </form>
              )}

              {/* Grilla de Usuarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 truncate">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-[#1a2947] shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.firstName.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {u.firstName} {u.lastName}
                            </span>
                            {u.isSuperAdmin && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400">
                                SUPER ADMIN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{u.email}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.isActive
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400'
                          }`}
                      >
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {/* Barra de Acciones por Usuario */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1a2947]/70">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.role || 'MEMBER'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            toggleUserStatusMutation.mutate({
                              userId: u.id,
                              isActive: !u.isActive,
                            })
                          }
                          title={u.isActive ? 'Desactivar acceso' : 'Activar acceso'}
                          className={`p-1.5 rounded-lg border text-xs transition ${u.isActive
                              ? 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10'
                              : 'text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
                            }`}
                        >
                          {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            setPwdModalUser(u);
                            setAdminNewPassword('');
                          }}
                          title="Restablecer contraseña"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1a2947] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162544] transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {currentUser?.isSuperAdmin && u.id !== currentUser.id && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar permanentemente a ${u.firstName} ${u.lastName}?`)) {
                                deleteUserMutation.mutate(u.id);
                              }
                            }}
                            title="Eliminar usuario permanentemente"
                            className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EQUIPOS (TEAMS) */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Los equipos son gestionados por <strong>quien los creó</strong> o por miembros a quienes se les otorgó <strong>permiso de gestión</strong>.
                </p>
                <button
                  onClick={() => setIsCreatingTeam(!isCreatingTeam)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Equipo</span>
                </button>
              </div>

              {/* Formulario nuevo equipo */}
              {isCreatingTeam && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createTeamMutation.mutate();
                  }}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#101a30] border border-blue-500/30 space-y-4 animate-in fade-in"
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Crear Nuevo Equipo
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nombre del Equipo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Equipo Móvil FormX"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Color Identificador
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newTeamColor}
                          onChange={(e) => setNewTeamColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-slate-400">{newTeamColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Descripción del Equipo
                    </label>
                    <input
                      type="text"
                      placeholder="Objetivos o alcance del equipo..."
                      value={newTeamDesc}
                      onChange={(e) => setNewTeamDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Seleccionar miembros iniciales */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Seleccionar Miembros Iniciales
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                      {users.map((u) => {
                        const isSelected = selectedTeamMemberIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedTeamMemberIds((prev) =>
                                isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              );
                            }}
                            className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'bg-white dark:bg-[#0b1120] border-slate-200 dark:border-[#1a2947] text-slate-700 dark:text-slate-300'
                              }`}
                          >
                            <span className="truncate">
                              {u.firstName} {u.lastName}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingTeam(false)}
                      className="px-4 py-2 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createTeamMutation.isPending}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {createTeamMutation.isPending ? 'Creando...' : 'Crear Equipo'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Equipos con Atribución y Botón de Gestión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                            {t.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#16233d] text-slate-600 dark:text-slate-300 shrink-0">
                          {t.members?.length || 0} integrantes
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {t.description}
                        </p>
                      )}

                      {/* Información de Creación */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Creado por:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : 'Administrador'}
                        </span>
                      </div>
                    </div>

                    {/* Miembros y Botón de Gestión */}
                    <div className="pt-3 border-t border-slate-200 dark:border-[#1a2947]/70 flex items-center justify-between">
                      <div className="flex items-center -space-x-1.5">
                        {t.members?.slice(0, 5).map((m) => (
                          <div
                            key={m.id}
                            title={`${m.user.firstName} ${m.user.lastName} ${m.canManage ? '(Gestor)' : ''}`}
                            className={`w-6 h-6 rounded-full border border-white dark:border-[#101a30] bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white overflow-hidden ${m.canManage ? 'ring-1 ring-blue-400' : ''
                              }`}
                          >
                            {m.user.avatarUrl ? (
                              <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              m.user.firstName.charAt(0)
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Control según permisos: Creador / Permiso asignado */}
                      {t.userCanManage ? (
                        <button
                          onClick={() => handleOpenManageTeam(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Gestionar</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 dark:bg-[#0b1120] px-2 py-1 rounded-md border border-slate-200 dark:border-[#1a2947]">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Solo lectura</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Modal: Resetear Contraseña Usuario */}
      {pwdModalUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-[#1a2947] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Restablecer Contraseña
              </h3>
              <button
                onClick={() => setPwdModalUser(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Estás modificando la contraseña para{' '}
              <strong className="text-slate-900 dark:text-white">
                {pwdModalUser.firstName} {pwdModalUser.lastName}
              </strong>{' '}
              ({pwdModalUser.email}).
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Nueva Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPwdModalUser(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resetPasswordMutation.isPending || adminNewPassword.length < 6}
                onClick={() =>
                  resetPasswordMutation.mutate({
                    userId: pwdModalUser.id,
                    newPassword: adminNewPassword,
                  })
                }
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {resetPasswordMutation.isPending ? 'Guardando...' : 'Guardar Nueva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Gestionar Equipo (Permisos de Gestión, Miembros y Edición) */}
      {selectedManageTeam && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-60 p-3 sm:p-4">
          <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Cabecera de Gestión */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedManageTeam.color }}
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Gestionar Equipo: {selectedManageTeam.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Edita el equipo, añade miembros y asigna permisos de gestión.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedManageTeam(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Sección 1: Editar Datos Básicos */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Datos del Equipo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Color Identificador
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editTeamColor}
                        onChange={(e) => setEditTeamColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-slate-400">{editTeamColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={editTeamDesc}
                    onChange={(e) => setEditTeamDesc(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={updateTeamMutation.isPending || !editTeamName.trim()}
                    onClick={() => updateTeamMutation.mutate()}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs disabled:opacity-50 transition cursor-pointer"
                  >
                    {updateTeamMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              {/* Sección 2: Añadir Nuevo Miembro */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Añadir Miembro al Equipo
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Seleccionar Usuario del Workspace
                    </label>
                    <select
                      value={addMemberUserId}
                      onChange={(e) => setAddMemberUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-[#1a2947] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Elige un usuario --</option>
                      {users
                        .filter((u) => !selectedManageTeam.members?.some((m) => m.userId === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </option>
                        ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pb-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={addMemberWithPermission}
                      onChange={(e) => setAddMemberWithPermission(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Otorgar permiso de gestión
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!addMemberUserId || addTeamMemberMutation.isPending}
                    onClick={() => addTeamMemberMutation.mutate()}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {/* Sección 3: Lista de Miembros y Delegación de Permisos ("A quien se le dé permiso") */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Miembros Actuales y Permisos ({selectedManageTeam.members?.length || 0})</span>
                  <span className="text-[11px] font-normal text-slate-400 lowercase">
                    puedes otorgar o quitar permiso de gestión con un clic
                  </span>
                </h4>

                <div className="space-y-2">
                  {selectedManageTeam.members?.map((m) => {
                    const isCreator = selectedManageTeam.createdById === m.userId;
                    const canManage = m.canManage || isCreator;

                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#101a30] border border-slate-200 dark:border-[#1a2947] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 truncate">
                          {m.user.avatarUrl ? (
                            <img
                              src={m.user.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-[#1a2947]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                              {m.user.firstName.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {m.user.firstName} {m.user.lastName}
                              </span>
                              {isCreator && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center gap-1 shrink-0">
                                  <Crown className="w-2.5 h-2.5" />
                                  CREADOR
                                </span>
                              )}
                              {!isCreator && m.canManage && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center gap-1 shrink-0">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  GESTOR
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">{m.user.email}</span>
                          </div>
                        </div>

                        {/* Botones de Permisos de Gestión */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!isCreator ? (
                            <button
                              onClick={() =>
                                toggleMemberPermissionMutation.mutate({
                                  teamId: selectedManageTeam.id,
                                  userId: m.userId,
                                  canManage: !m.canManage,
                                })
                              }
                              title={m.canManage ? 'Quitar permiso de gestión' : 'Dar permiso de gestión'}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer border ${m.canManage
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                                  : 'bg-slate-100 dark:bg-[#0b1120] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1a2947] hover:border-blue-500'
                                }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{m.canManage ? 'Quitar Permiso' : 'Dar Permiso'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5">
                              Propietario
                            </span>
                          )}

                          {!isCreator && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Remover a ${m.user.firstName} del equipo?`)) {
                                  removeTeamMemberMutation.mutate({
                                    teamId: selectedManageTeam.id,
                                    userId: m.userId,
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition"
                              title="Remover del equipo"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 4: Zona de Peligro / Eliminar Equipo */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-red-600 dark:text-red-400">
                    Eliminar este Equipo
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Se desvinculará de todos los proyectos pero no se borrarán los usuarios.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar el equipo "${selectedManageTeam.name}"?`)) {
                      deleteTeamMutation.mutate(selectedManageTeam.id);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition cursor-pointer shrink-0"
                >
                  Eliminar Equipo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
