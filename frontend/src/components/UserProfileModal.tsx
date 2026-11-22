import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { api } from '../api/client.js';
import { X, Camera, ShieldAlert, Sparkles } from 'lucide-react';
import { compressAndRenderImage, CompressedImageResult } from '../utils/imageCompressor.js';
import toast from 'react-hot-toast';

interface UserProfileModalProps {
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { user, setAuth } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [compressionInfo, setCompressionInfo] = useState<CompressedImageResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Subir avatar con pre-renderizado y compresión WebP
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    try {
      setIsUploading(true);

      // 1. Comprimir en cliente a WebP de 256x256
      const compResult = await compressAndRenderImage(rawFile, 256, 0.85);
      setCompressionInfo(compResult);
      setAvatarUrl(compResult.previewUrl);

      // 2. Obtener firma del backend
      const { data: signRes } = await api.post('/attachments/sign', { folder: 'flowboard/avatars' });
      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

      // 3. Subir el archivo optimizado a Cloudinary
      const formData = new FormData();
      formData.append('file', compResult.file);
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
        setAvatarUrl(data.secure_url);
        toast.success(`Foto optimizada (${compResult.reductionPercentage}% menos peso) y subida`);
      }
    } catch (err: any) {
      toast.error('Error al procesar o subir la foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.patch('/auth/profile', {
        firstName,
        lastName,
        avatarUrl: avatarUrl || null,
      });
      const updatedUser = res.data.data;
      const token = localStorage.getItem('flowboard_access_token') || '';
      setAuth(updatedUser, token);
      toast.success('Perfil actualizado con éxito');
      onClose();
    } catch {
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-md border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Perfil de Usuario</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Avatar con botón de subida y compresión */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/10"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-bold flex items-center justify-center text-3xl shadow-md ring-4 ring-slate-300 dark:ring-slate-800">
                  {firstName.charAt(0) || 'U'}
                </div>
              )}
              <label className="absolute inset-0 rounded-full bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-white text-[10px] font-semibold gap-1">
                <Camera className="w-5 h-5" />
                <span>Cambiar Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Indicador de renderizado y compresión */}
            {compressionInfo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>
                  {Math.round(compressionInfo.originalSize / 1024)} KB ➔ {Math.round(compressionInfo.compressedSize / 1024)} KB ({compressionInfo.reductionPercentage}% reducido a WebP)
                </span>
              </div>
            )}

            {isUploading && (
              <span className="text-[11px] text-emerald-500 font-semibold animate-pulse">
                Procesando y subiendo a Cloudinary...
              </span>
            )}

            {user?.isSuperAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                SUPER ADMINISTRADOR
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Foto de Perfil (URL directa o súbela arriba)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
