import { PrismaClient, TaskPriority, WorkspaceRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seeding de FlowBoard con el proyecto FormX...');

  // 1. Crear Usuario Principal (Ricardo Candelo)
  const passwordHash = await bcrypt.hash('Candelo2026*', 10);
  const user = await prisma.user.upsert({
    where: { email: 'ricardocandelo07@gmail.com' },
    update: { passwordHash, isSuperAdmin: true },
    create: {
      email: 'ricardocandelo07@gmail.com',
      passwordHash,
      firstName: 'Ricardo',
      lastName: 'Candelo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isSuperAdmin: true,
    },
  });

  // Usuario colaborador de prueba
  const reviewerHash = await bcrypt.hash('Reviewer2026*', 10);
  const reviewer = await prisma.user.upsert({
    where: { email: 'innovacion@sheeqconsulting.com' },
    update: { passwordHash: reviewerHash },
    create: {
      email: 'innovacion@sheeqconsulting.com',
      passwordHash: reviewerHash,
      firstName: 'Área de Innovación',
      lastName: 'SHEEQ',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const dev1Hash = await bcrypt.hash('Dev2026*', 10);
  const devCarlos = await prisma.user.upsert({
    where: { email: 'carlos.mendoza@sheeq.com' },
    update: { passwordHash: dev1Hash },
    create: {
      email: 'carlos.mendoza@sheeq.com',
      passwordHash: dev1Hash,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const dev2Hash = await bcrypt.hash('Dev2026*', 10);
  const devSofia = await prisma.user.upsert({
    where: { email: 'sofia.rodriguez@sheeq.com' },
    update: { passwordHash: dev2Hash },
    create: {
      email: 'sofia.rodriguez@sheeq.com',
      passwordHash: dev2Hash,
      firstName: 'Sofía',
      lastName: 'Rodríguez',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    },
  });

  // 2. Crear Workspace Principal: SHEEQ Consulting — Integra-Safe
  let workspace = await prisma.workspace.findFirst({
    where: { slug: 'sheeq-integra-safe' },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'SHEEQ Consulting — Integra-Safe',
        slug: 'sheeq-integra-safe',
        description: 'Espacio centralizado de desarrollo y homologación de módulos Integra-Safe V2.',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        ownerId: user.id,
        members: {
          create: [
            { userId: user.id, role: WorkspaceRole.OWNER },
            { userId: reviewer.id, role: WorkspaceRole.ADMIN },
          ],
        },
      },
    });
  }

  // 3. Crear Etiquetas del Workspace
  const labelsData = [
    { name: 'UI / UX Design', color: '#10B981' },
    { name: 'Frontend', color: '#3B82F6' },
    { name: 'Backend API', color: '#8B5CF6' },
    { name: 'Mobile Android', color: '#F59E0B' },
    { name: 'DevOps / Docker', color: '#EF4444' },
    { name: 'Seguridad / RBAC', color: '#EC4899' },
  ];

  const labelsMap: Record<string, string> = {};
  for (const l of labelsData) {
    const label = await prisma.label.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: l.name } },
      update: { color: l.color },
      create: { workspaceId: workspace.id, name: l.name, color: l.color },
    });
    labelsMap[l.name] = label.id;
  }

  // 4. Crear Proyecto: FormX (Iniciado el mes pasado: 1 de Octubre de 2026)
  const startDateLastMonth = new Date('2026-10-01T08:00:00.000Z');
  const targetDateEstimated = new Date('2026-12-15T18:00:00.000Z');

  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, key: 'FORMX' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        workspaceId: workspace.id,
        name: 'FormX — Módulo Captación de Datos & Panel Global',
        key: 'FORMX',
        description:
          'Plataforma No-Code para Check Lists digitales, App Móvil Android Offline-First, orquestación global_user y homologación UI/UX para Integra-Safe V2.',
        startDate: startDateLastMonth,
        targetDate: targetDateEstimated,
        members: {
          create: [{ userId: user.id }, { userId: reviewer.id }],
        },
      },
    });
  }

  // Miembros adicionales del Workspace
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: devCarlos.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: devCarlos.id, role: WorkspaceRole.MEMBER },
  });
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: devSofia.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: devSofia.id, role: WorkspaceRole.MEMBER },
  });

  // Equipos del Workspace
  const teamFrontend = await prisma.team.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'Equipo Frontend & UI/UX' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Equipo Frontend & UI/UX',
      description: 'Especialistas en interfaces web, Tailwind y homologación visual',
      color: '#3B82F6',
      members: {
        create: [
          { userId: user.id },
          { userId: devCarlos.id },
        ],
      },
    },
  });

  const teamMobile = await prisma.team.upsert({
    where: { workspaceId_name: { workspaceId: workspace.id, name: 'Equipo Móvil Android & QA' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Equipo Móvil Android & QA',
      description: 'Desarrollo en React Native / Expo, SQLite y sincronización offline',
      color: '#F59E0B',
      members: {
        create: [
          { userId: user.id },
          { userId: devSofia.id },
        ],
      },
    },
  });

  // Vincular equipos al Proyecto FormX
  await prisma.projectTeam.upsert({
    where: { projectId_teamId: { projectId: project.id, teamId: teamFrontend.id } },
    update: {},
    create: { projectId: project.id, teamId: teamFrontend.id },
  });
  await prisma.projectTeam.upsert({
    where: { projectId_teamId: { projectId: project.id, teamId: teamMobile.id } },
    update: {},
    create: { projectId: project.id, teamId: teamMobile.id },
  });

  // Asegurar que Carlos y Sofía son miembros del proyecto FormX
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: devCarlos.id } },
    update: {},
    create: { projectId: project.id, userId: devCarlos.id },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: devSofia.id } },
    update: {},
    create: { projectId: project.id, userId: devSofia.id },
  });

  // 5. Crear Tablero Kanban Principal
  let board = await prisma.board.findFirst({
    where: { projectId: project.id, name: 'Tablero de Control y Fases' },
  });

  if (!board) {
    board = await prisma.board.create({
      data: {
        projectId: project.id,
        name: 'Tablero de Control y Fases',
        description: 'Seguimiento por fases del RFI V2 y de la homologación visual de interfaces.',
        isFavorite: true,
      },
    });
  }

  // 6. Crear Columnas del Tablero
  const columnsData = [
    { name: 'Backlog / Fases Futuras', color: '#64748B', position: 1000, isDone: false },
    { name: 'Homologación UI/UX (Prioridad Alta)', color: '#EC4899', position: 2000, isDone: false, wipLimit: 3 },
    { name: 'En Desarrollo', color: '#3B82F6', position: 3000, isDone: false, wipLimit: 4 },
    { name: 'En Pruebas / QA', color: '#F59E0B', position: 4000, isDone: false, wipLimit: 3 },
    { name: 'Finalizado (Mes Pasado - Oct 2026)', color: '#10B981', position: 5000, isDone: true },
  ];

  const colMap: Record<string, string> = {};
  for (const c of columnsData) {
    let col = await prisma.column.findFirst({
      where: { boardId: board.id, name: c.name },
    });
    if (!col) {
      col = await prisma.column.create({
        data: {
          boardId: board.id,
          name: c.name,
          color: c.color,
          position: c.position,
          isDone: c.isDone,
          wipLimit: c.wipLimit,
        },
      });
    }
    colMap[c.name] = col.id;
  }

  // 7. Crear Tareas Reales del Proyecto FormX
  const tasksToCreate = [
    // --- COLUMNA: HOMOLOGACIÓN UI/UX (Tareas solicitadas específicamente en la propuesta) ---
    {
      columnId: colMap['Homologación UI/UX (Prioridad Alta)'],
      title: 'Homologación visual completa del Frontend de No Conformidades',
      description:
        'Rediseño y estandarización integral de la interfaz web del módulo de No Conformidades bajo el Design System corporativo de Integra-Safe.\n\nRequerimientos específicos:\n- Paleta cromática oficial (#4CAF50, #2E7D32, fondos neutros suaves).\n- Unificación de tipografías y escalas de texto.\n- Transiciones y micro-interacciones suaves.\n- Iconografía unificada mediante Lucide React / SVG.\n- Tablas de registros matriciales, modales de confirmación y selector de fecha/calendario.',
      priority: TaskPriority.URGENT,
      position: 1000,
      labels: ['UI / UX Design', 'Frontend'],
      subtasks: [
        { title: 'Extraer paleta y Design Tokens oficiales (#4CAF50, #2E7D32, #81C784)', isCompleted: true },
        { title: 'Estandarizar modales y confirmaciones visuales (eliminar alertas nativas)', isCompleted: true },
        { title: 'Rediseñar grillas y tablas de datos con paginación limpia', isCompleted: false },
        { title: 'Homologar el calendario de seguimiento y estados', isCompleted: false },
        { title: 'Revisión de responsive en tablets y dispositivos táctiles', isCompleted: false },
      ],
    },
    {
      columnId: colMap['Homologación UI/UX (Prioridad Alta)'],
      title: 'Panel Central de Empresas y Accesos (global_user)',
      description:
        'Orquestación vía API REST hacia los 3 módulos de Integra-Safe (No Conformidades, Formaciones y Captación de Datos) para dar de alta Empresas/Entidades, crear usuarios, asignar roles (Regular o Admin) y habilitar/restringir accesos por módulo en tiempo real sin modificar las bases de datos actuales.',
      priority: TaskPriority.HIGH,
      position: 2000,
      labels: ['Backend API', 'Seguridad / RBAC', 'Frontend'],
      subtasks: [
        { title: 'Modelar esquema de homologación Empresa = Grupo = Entidad', isCompleted: true },
        { title: 'Crear endpoints de orquestación REST global_user', isCompleted: false },
        { title: 'Validar restricciones de módulo en tiempo real', isCompleted: false },
      ],
    },

    // --- COLUMNA: EN DESARROLLO ---
    {
      columnId: colMap['En Desarrollo'],
      title: 'Motor de Reportes Automáticos en DOCX con mapeo de tags',
      description:
        'Editor y procesador de plantillas en formato Word (.docx) con inyección automática de nomenclaturas tipo ((nombre_campo)), tablas dinámicas repetitivas, despacho por correo electrónico ante envíos móviles y exportación XLSX/CSV con fotografías.',
      priority: TaskPriority.HIGH,
      position: 1000,
      labels: ['Backend API'],
      subtasks: [
        { title: 'Procesador docxtpl con inyección de variables', isCompleted: true },
        { title: 'Despacho condicional de emails con adjuntos XLSX/CSV', isCompleted: false },
        { title: 'Exportación masiva con fotos comprimidas', isCompleted: false },
      ],
    },
    {
      columnId: colMap['En Desarrollo'],
      title: 'Lógica Condicional Avanzada (US-018 y US-019)',
      description:
        'Completar el motor para soporte de campos obligatorios dinámicos y bloqueo/deshabilitación de campos basados en respuestas previas.',
      priority: TaskPriority.MEDIUM,
      position: 2000,
      labels: ['Frontend', 'Backend API'],
      subtasks: [
        { title: 'US-018: Campos obligatorios dinámicos', isCompleted: false },
        { title: 'US-019: Bloqueo de campos reactivo', isCompleted: false },
      ],
    },

    // --- COLUMNA: EN PRUEBAS / QA ---
    {
      columnId: colMap['En Pruebas / QA'],
      title: 'Aplicación Móvil Android Offline-First con cámara antifraude',
      description:
        'Validación en campo de la app Android con SQLite local: captura 100% sin conexión, autoguardado de borradores, escáner de códigos de barras/QR y restricción estricta de galería exigiendo fotos tomadas en vivo con marca de agua GPS.',
      priority: TaskPriority.HIGH,
      position: 1000,
      labels: ['Mobile Android'],
      subtasks: [
        { title: 'Prueba de sincronización Delta con cola SQLite', isCompleted: true },
        { title: 'Validación de marca de agua de fecha y GPS en tiempo real', isCompleted: true },
        { title: 'Pruebas de conectividad intermitente en terreno', isCompleted: false },
      ],
    },

    // --- COLUMNA: BACKLOG ---
    {
      columnId: colMap['Backlog / Fases Futuras'],
      title: 'Contenerización Docker Compose, SSL y Despliegue en Servidores SHEEQ',
      description:
        'Preparación de contenedores Docker multi-etapa, configuración de proxy inverso Nginx, certificados SSL con Let’s Encrypt y despliegue productivo para SHEEQ Consulting.',
      priority: TaskPriority.MEDIUM,
      position: 1000,
      labels: ['DevOps / Docker'],
      subtasks: [
        { title: 'Dockerfile multi-stage para frontend y backend', isCompleted: false },
        { title: 'docker-compose.yml con Nginx y variables de entorno', isCompleted: false },
        { title: 'Configurar subdominio y pruebas de penetración iniciales', isCompleted: false },
      ],
    },
    {
      columnId: colMap['Backlog / Fases Futuras'],
      title: 'Dashboard de KPIs y Métricas de Rendimiento FormX (US-039)',
      description:
        'Panel gráfico con métricas de Check Lists completados, tiempos promedio de llenado, reportes por técnico y porcentaje de no conformidades detectadas en terreno.',
      priority: TaskPriority.LOW,
      position: 2000,
      labels: ['Frontend', 'Backend API'],
      subtasks: [],
    },

    // --- COLUMNA: FINALIZADO (Iniciado y culminado el mes pasado - Octubre 2026) ---
    {
      columnId: colMap['Finalizado (Mes Pasado - Oct 2026)'],
      title: 'Constructor No-Code Drag & Drop con Catálogo de 17+ Mini Blocks',
      description:
        'Lienzo visual interactivo para diseñar Check Lists digitales con ordenamiento drag & drop, secciones, subsecciones, duplicación de campos y previsualización en vivo (móvil, tablet, escritorio).',
      priority: TaskPriority.URGENT,
      position: 1000,
      labels: ['Frontend', 'UI / UX Design'],
      subtasks: [
        { title: 'Paleta completa de Mini Blocks (Texto, Fotos, Firma, GPS, QR)', isCompleted: true },
        { title: 'Inspector de propiedades lateral y configuración de campos', isCompleted: true },
        { title: 'Vista previa responsiva con simulación en tiempo real', isCompleted: true },
      ],
    },
    {
      columnId: colMap['Finalizado (Mes Pasado - Oct 2026)'],
      title: 'Backend API Modular Python (FastAPI + MySQL + RBAC)',
      description:
        'Arquitectura modular por dominios (auth, users, groups, forms, lists, evidences), hashing bcrypt, tokens JWT seguros y Swagger OpenAPI interactivo.',
      priority: TaskPriority.HIGH,
      position: 2000,
      labels: ['Backend API', 'Seguridad / RBAC'],
      subtasks: [
        { title: 'Migración a FastAPI modular sin archivos residuales', isCompleted: true },
        { title: 'Autenticación multi-empresa y roles RBAC', isCompleted: true },
        { title: 'Swagger UI operativo en /docs', isCompleted: true },
      ],
    },
    {
      columnId: colMap['Finalizado (Mes Pasado - Oct 2026)'],
      title: 'Tablas Inteligentes con sumatorias y fórmulas automáticas',
      description:
        'Componente matricial dinámico capaz de albergar cualquier Mini Block en filas repetitivas, con sumatorias de columna y total general en tiempo real.',
      priority: TaskPriority.HIGH,
      position: 3000,
      labels: ['Frontend', 'Backend API'],
      subtasks: [
        { title: 'Editor enfocado por columna y sumatorias', isCompleted: true },
        { title: 'Validación de duplicados y fórmulas de fila', isCompleted: true },
      ],
    },
    {
      columnId: colMap['Finalizado (Mes Pasado - Oct 2026)'],
      title: 'Módulo de Listas Externas y Master Data (Grilla y Jerárquico)',
      description:
        'Gestión de catálogos maestros con 12 tipos de atributos, edición en línea tipo Airtable, modo árbol jerárquico e importación masiva de Excel/CSV.',
      priority: TaskPriority.MEDIUM,
      position: 4000,
      labels: ['Frontend', 'Backend API'],
      subtasks: [
        { title: 'Constructor de esquemas de atributos y grilla matricial', isCompleted: true },
        { title: 'Importador masivo con detección de encabezados', isCompleted: true },
      ],
    },
  ];

  for (const t of tasksToCreate) {
    const existing = await prisma.task.findFirst({
      where: { columnId: t.columnId, title: t.title },
    });

    if (!existing) {
      const task = await prisma.task.create({
        data: {
          columnId: t.columnId,
          createdById: user.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          position: t.position,
          startDate: startDateLastMonth,
          dueDate: targetDateEstimated,
          isCompleted: t.columnId === colMap['Finalizado (Mes Pasado - Oct 2026)'],
          assignees: {
            create: [{ userId: user.id }],
          },
          subtasks: {
            create: t.subtasks.map((st, idx) => ({
              title: st.title,
              isCompleted: st.isCompleted,
              position: (idx + 1) * 1000,
            })),
          },
        },
      });

      // Asignar etiquetas
      for (const labelName of t.labels) {
        if (labelsMap[labelName]) {
          await prisma.taskLabel.create({
            data: {
              taskId: task.id,
              labelId: labelsMap[labelName],
            },
          });
        }
      }

      // Comentario inicial
      await prisma.comment.create({
        data: {
          taskId: task.id,
          userId: user.id,
          content: 'Tarea inicializada según el plan de trabajo y requerimientos del RFI V2.',
        },
      });
    }
  }

  console.log('✅ Seeding completado exitosamente:');
  console.log('   - Usuario: ricardocandelo07@gmail.com (Password: Candelo2026*)');
  console.log('   - Workspace: SHEEQ Consulting — Integra-Safe');
  console.log('   - Proyecto: FormX (Iniciado: 1 de Octubre de 2026)');
  console.log('   - Tablero: Tablero de Control y Fases');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
