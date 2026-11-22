import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { Task, Subtask, Comment, Attachment } from '../types/index.js';
import {
  X,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Clock,
  Trash2,
  Send,
  Upload,
  Calendar,
  Flag,
  User as UserIcon,
  Plus,
  History,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const queryClient = useQueryClient();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAssigneePickerOpen, setIsAssigneePickerOpen] = useState(false);

  // Obtener detalle completo de la tarea
  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data.data;
    },
  });

  // Obtener miembros del proyecto para asignar
  const { data: projectMembersData } = useQuery<{ members: any[] }>({
    queryKey: ['project_members_for_task', task?.column?.boardId],
    queryFn: async () => {
      const boardRes = await api.get(`/boards/${task!.column!.boardId}`);
      const projectId = boardRes.data.data.projectId;
      const res = await api.get(`/projects/${projectId}/members`);
      return res.data.data;
    },
    enabled: !!task?.column?.boardId,
  });

  // Mutación para actualizar asignados
  const setAssigneesMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await api.put(`/tasks/${taskId}/assignees`, { userIds });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.success('Asignados actualizados');
    },
  });

  // Mutación para actualizar tarea
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<Task>) => {
      const res = await api.patch(`/tasks/${taskId}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });

  // Mutación para agregar subtarea
  const addSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post(`/tasks/${taskId}/subtasks`, { title });
      return res.data.data;
    },
    onSuccess: () => {
      setNewSubtaskTitle('');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });

  // Mutación para alternar estado de subtarea
  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ subtaskId, isCompleted }: { subtaskId: string; isCompleted: boolean }) => {
      await api.patch(`/subtasks/${subtaskId}`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });

  // Mutación para agregar comentario
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/tasks/${taskId}/comments`, { content });
      return res.data.data;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.success('Comentario agregado');
    },
  });

  // Subir archivo a Cloudinary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // 1. Obtener firma del backend
      const { data: signRes } = await api.post('/attachments/sign', { folder: 'flowboard' });
      const { timestamp, signature, apiKey, cloudName, folder } = signRes.data;

      // 2. Subida directa a Cloudinary vía FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const cloudRes = JSON.parse(xhr.responseText);

          // 3. Registrar metadatos en backend
          await api.post(`/tasks/${taskId}/attachments`, {
            fileName: file.name,
            fileUrl: cloudRes.secure_url,
            publicId: cloudRes.public_id,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            format: cloudRes.format || file.name.split('.').pop() || 'bin',
          });

          queryClient.invalidateQueries({ queryKey: ['task', taskId] });
          queryClient.invalidateQueries({ queryKey: ['board'] });
          toast.success('Archivo subido con éxito');
        } else {
          toast.error('Error al subir a Cloudinary');
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        toast.error('Fallo en la conexión de subida');
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch {
      toast.error('Error al iniciar la subida');
      setIsUploading(false);
    }
  };

  if (isLoading || !task) {
    return (
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Cargando detalles de la tarea...</p>
        </div>
      </div>
    );
  }

  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#0b1120] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-[#1a2947] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-slate-200 dark:border-[#1a2947] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: task.column?.color || '#10b981' }}
            />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {task.column?.name}
            </span>
            <span className="text-xs text-slate-400">
              Creado por {task.createdBy?.firstName} {task.createdBy?.lastName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido en dos columnas */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Izquierda (Principal: Título, Descripción, Subtareas, Archivos, Comentarios) */}
          <div className="md:col-span-2 space-y-6">
            {/* Título editable */}
            <div>
              <input
                type="text"
                defaultValue={task.title}
                onBlur={(e) => {
                  if (e.target.value !== task.title) {
                    updateMutation.mutate({ title: e.target.value });
                  }
                }}
                className="w-full text-base font-bold bg-transparent text-slate-900 dark:text-white border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none pb-1 transition"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Descripción
              </label>
              <textarea
                defaultValue={task.description || ''}
                placeholder="Añadir una descripción detallada..."
                onBlur={(e) => {
                  if (e.target.value !== (task.description || '')) {
                    updateMutation.mutate({ description: e.target.value });
                  }
                }}
                rows={4}
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            {/* Subtareas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                  Subtareas ({completedSubtasks}/{totalSubtasks})
                </label>
                {totalSubtasks > 0 && (
                  <span className="text-xs font-mono text-emerald-500 font-bold">
                    {Math.round((completedSubtasks / totalSubtasks) * 100)}%
                  </span>
                )}
              </div>

              {/* Barra de Progreso */}
              {totalSubtasks > 0 && (
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  />
                </div>
              )}

              {/* Lista de subtareas */}
              <div className="space-y-2">
                {task.subtasks?.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      onChange={(e) =>
                        toggleSubtaskMutation.mutate({
                          subtaskId: st.id,
                          isCompleted: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                    />
                    <span
                      className={`flex-1 ${
                        st.isCompleted
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Añadir subtarea */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newSubtaskTitle.trim()) {
                    addSubtaskMutation.mutate(newSubtaskTitle.trim());
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Nueva subtarea..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Agregar
                </button>
              </form>
            </div>

            {/* Archivos Adjuntos (Cloudinary) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-500" />
                  Archivos Adjuntos ({task.attachments?.length || 0})
                </label>
                <label className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  <Upload className="w-3.5 h-3.5" />
                  Subir archivo
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {isUploading && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-xs text-emerald-500 font-semibold">
                    <span>Subiendo a Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-emerald-950/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {task.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {att.format}
                      </div>
                      <div className="truncate">
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-emerald-500 truncate block"
                        >
                          {att.fileName}
                        </a>
                        <span className="text-[10px] text-slate-400">
                          {(att.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Comentarios ({task.comments?.length || 0})
              </label>

              {/* Input nuevo comentario */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) {
                    addCommentMutation.mutate(commentText.trim());
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Escribe un comentario o menciona a alguien con @..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Lista de comentarios */}
              <div className="space-y-3">
                {task.comments?.map((c) => (
                  <div key={c.id} className="flex gap-3 text-xs">
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {c.user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {c.user?.firstName} {c.user?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha (Ajustes: Prioridad, Fechas, Asignados, Actividad) */}
          <div className="space-y-6 md:border-l md:border-slate-200 md:dark:border-slate-800 md:pl-6">
            {/* Prioridad */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Prioridad
              </label>
              <select
                value={task.priority}
                onChange={(e) => updateMutation.mutate({ priority: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            {/* Fechas */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fechas
              </label>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Fecha de Inicio:</span>
                <input
                  type="date"
                  value={task.startDate ? task.startDate.split('T')[0] : ''}
                  onChange={(e) =>
                    updateMutation.mutate({
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Fecha de Entrega:</span>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={(e) =>
                    updateMutation.mutate({
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>

            {/* Asignados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Asignados ({task.assignees?.length || 0})
                </label>
                <button
                  type="button"
                  onClick={() => setIsAssigneePickerOpen(!isAssigneePickerOpen)}
                  className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Asignar
                </button>
              </div>

              {/* Selector desplegable de asignación */}
              {isAssigneePickerOpen && (
                <div className="mb-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 space-y-1.5 max-h-48 overflow-y-auto">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block px-1">
                    Miembros del Proyecto
                  </span>
                  {projectMembersData?.members?.map((member: any) => {
                    const isAssigned = task.assignees?.some((a) => a.user.id === member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          const currentIds = task.assignees?.map((a) => a.user.id) || [];
                          const newIds = isAssigned
                            ? currentIds.filter((id) => id !== member.id)
                            : [...currentIds, member.id];
                          setAssigneesMutation.mutate(newIds);
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs transition ${
                          isAssigned
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-[9px] flex items-center justify-center">
                              {member.firstName.charAt(0)}
                            </div>
                          )}
                          <span>{member.firstName} {member.lastName}</span>
                        </div>
                        {isAssigned && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Lista de asignados actuales */}
              <div className="space-y-2">
                {task.assignees?.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div className="flex items-center gap-2">
                      {a.user.avatarUrl ? (
                        <img src={a.user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                          {a.user.firstName.charAt(0)}
                        </div>
                      )}
                      <span className="text-slate-700 dark:text-slate-300">
                        {a.user.firstName} {a.user.lastName}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const currentIds = task.assignees?.map((x) => x.user.id) || [];
                        setAssigneesMutation.mutate(currentIds.filter((id) => id !== a.user.id));
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                      title="Desasignar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!task.assignees || task.assignees.length === 0) && (
                  <div className="text-xs text-slate-400 italic">No hay miembros asignados</div>
                )}
              </div>
            </div>

            {/* Historial de Actividad reciente */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Historial de Actividad
              </label>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {task.activity?.slice(0, 10).map((act) => (
                  <div key={act.id} className="text-[11px] text-slate-400 leading-tight">
                    <span className="font-semibold text-slate-300">
                      {act.user.firstName}
                    </span>{' '}
                    realizó <span className="text-emerald-400 font-mono text-[10px]">{act.action}</span>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {new Date(act.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
