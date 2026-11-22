# 🚀 Guía de Despliegue en Vercel - FlowBoard (Frontend y Backend Separados)

Esta guía explica paso a paso cómo desplegar **FlowBoard** en **Vercel** de manera independiente:
1. **Backend Serverless** (`kanban/backend`)
2. **Frontend SPA** (`kanban/frontend`)

---

## 📌 Requisitos Previos

1. Cuenta activa en [Vercel](https://vercel.com).
2. Proyecto subido a un repositorio de GitHub / GitLab / Bitbucket (puede ser un monorepo o dos repositorios separados).
3. Base de datos PostgreSQL en [Neon](https://neon.tech) activa con las credenciales de conexión (`DATABASE_URL` y `DIRECT_URL`).
4. (Opcional) Cuenta de [Cloudinary](https://cloudinary.com) para avatares y archivos adjuntos.

---

## 🟢 PASO 1: Desplegar el Backend en Vercel

### 1.1 Importar el Proyecto en Vercel
1. Ingresa a tu panel de Vercel y haz clic en **"Add New..."** ➔ **"Project"**.
2. Selecciona tu repositorio de GitHub.
3. En la sección **Root Directory**:
   - Haz clic en **Edit**.
   - Selecciona la carpeta: `kanban/backend` (o la raíz si es un repositorio dedicado al backend).
4. **Framework Preset**: Selecciona **Other** (Vercel detectará automáticamente el archivo `api/index.ts` y `vercel.json`).

### 1.2 Configurar Variables de Entorno en Vercel
En la sección **Environment Variables**, agrega las siguientes variables:

| Variable | Valor / Descripción |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Tu URL de Neon con Connection Pooling (`-pooler...sslmode=require`) |
| `DIRECT_URL` | Tu URL de conexión directa a Neon |
| `JWT_ACCESS_SECRET` | Clave secreta larga y aleatoria (ej: `d8f92a3b4c5e6f7a8b9c0d1e2f3a4b5c`) |
| `JWT_REFRESH_SECRET` | Otra clave secreta larga diferente |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Pon temporalmente `https://localhost:5173` (la actualizaremos en el Paso 3) |
| `CLOUDINARY_CLOUD_NAME` | *(Opcional)* Tu Cloud Name de Cloudinary |
| `CLOUDINARY_API_KEY` | *(Opcional)* Tu API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | *(Opcional)* Tu API Secret de Cloudinary |

### 1.3 Desplegar
- Haz clic en **Deploy**.
- Espera a que termine la compilación.
- **Verificación**: Abre la URL asignada por Vercel (ej: `https://flowboard-backend-tuusuario.vercel.app/api/health`).
  - Debe responder: `{"status":"ok","timestamp":"..."}`.
  - La raíz `https://flowboard-backend-tuusuario.vercel.app/` responderá con los datos de estado de FlowBoard API.

---

## 🔵 PASO 2: Desplegar el Frontend en Vercel

### 2.1 Importar el Proyecto en Vercel
1. En tu panel de Vercel, haz clic nuevamente en **"Add New..."** ➔ **"Project"**.
2. Selecciona el mismo repositorio (o el repositorio del frontend).
3. En **Root Directory**:
   - Haz clic en **Edit**.
   - Selecciona la carpeta: `kanban/frontend`.
4. **Framework Preset**: Vercel detectará automáticamente **Vite**.
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### 2.2 Configurar Variables de Entorno del Frontend
En la sección **Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://tu-backend-en-vercel.vercel.app/api` *(¡Usa la URL del Paso 1 agregando `/api` al final!)* |
| `VITE_SOCKET_URL` | `https://tu-backend-en-vercel.vercel.app` *(La URL raíz del Backend)* |

### 2.3 Desplegar
- Haz clic en **Deploy**.
- Vercel construirá la aplicación React y desplegará tu Frontend.
- Copia la URL que Vercel le asigne a tu Frontend (ej: `https://flowboard-frontend-tuusuario.vercel.app`).

---

## 🔄 PASO 3: Vincular Frontend y Backend

Para asegurar que las cookies de sesión y las peticiones CORS funcionen al 100%:

1. Ve a tu proyecto de **Backend** en Vercel.
2. Dirígete a **Settings** ➔ **Environment Variables**.
3. Edita la variable `FRONTEND_URL` y asígnale el dominio real de tu frontend:
   - Valor: `https://flowboard-frontend-tuusuario.vercel.app`
4. Ve a la pestaña **Deployments** en el backend y haz clic en **Redeploy** (o pulsa los 3 puntos del último despliegue y selecciona *Redeploy*) para aplicar la nueva variable.

---

## ⚡ Verificación Final de Funcionamiento

1. Ingresa a la URL de tu **Frontend**.
2. Inicia sesión con el usuario Super Admin:
   - **Email**: `admin@flowboard.com`
   - **Contraseña**: `Admin123!`
3. Prueba las funcionalidades:
   - Cambiar entre **Modo Oscuro** (Deep Navy Blue) y **Modo Claro**.
   - Probar en pantalla de escritorio y móvil/tablet (menú hamburguesa responsivo).
   - Crear proyectos, tableros y mover tarjetas en el tablero Kanban.
   - Entrar al panel de **Super Admin** (`/admin/users`) para gestionar usuarios.
   - Crear equipos de trabajo y delegar administración (`/teams`).
   - Cambiar foto de perfil (el compresor en el navegador optimiza a WebP ligero).

---

## 🛠️ Notas Técnicas y Solución de Problemas

- **Rutas SPA (Error 404 al recargar página)**: Ya está solucionado con el archivo `kanban/frontend/vercel.json` (`rewrites: [ { "source": "/(.*)", "destination": "/index.html" } ]`).
- **Prisma en Vercel**: `package.json` incluye `"vercel-build": "prisma generate && tsc"`, lo que asegura que el motor binario de Prisma para AWS Lambda se genere automáticamente durante cada despliegue.
- **Base de Datos Serverless**: Al usar Neon con Vercel Serverless, asegúrate de utilizar el connection string con pooling (`-pooler`) en `DATABASE_URL` para evitar agotar las conexiones concurrentes a la base de datos.
- **WebSockets en Serverless**: Vercel Serverless es un entorno basado en funciones Lambda sin estado. Si deseas sincronización WebSockets en tiempo real permanente para múltiples usuarios simultáneos sin refrescar, puedes apuntar `VITE_SOCKET_URL` a un servidor Node continuo (ej: Railway, Render o VPS), mientras Vercel continúa sirviendo toda la API REST y el Frontend a máxima velocidad global.
