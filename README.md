# Mate Code App — Gestor de tareas

SPA de gestión de tareas desarrollada como proyecto integrador del Módulo 4 de Soy Henry. Permite crear, organizar y hacer seguimiento de tareas con soporte de prioridades, fechas de vencimiento, etiquetas y resumen por email.

**URL de producción:** https://matecode-task-manager.vercel.app

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript, Vite |
| Auth + DB | Firebase Authentication + Firestore |
| Email | AWS SES via Vercel Function |
| IA en app | Gemini API (asistente Tyrion) |
| Tests | Vitest + React Testing Library |
| Deploy | Vercel (frontend + serverless functions) |

---

## Funcionalidades

- Registro y login con email/password y Google
- Sesión persistente con redirección automática
- Rutas protegidas (sin acceso sin autenticación)
- CRUD completo de tareas con sincronización en tiempo real (Firestore `onSnapshot`)
- Dashboard con saludo personalizado, estadísticas de tareas y barra de progreso
- Campos por tarea: título, descripción, prioridad (baja/media/alta), fecha y hora de vencimiento, etiqueta
- Cards con chips semánticos de prioridad y estado
- Filtros: todas / pendientes / completadas
- Orden: más recientes / por prioridad / por fecha
- Tres temas visuales: Clásico (☀️), Nocturno (🌙), Vívido (✨) — seleccionables por el usuario, persistidos en localStorage y Firestore para sincronizar entre dispositivos
- Resumen de tareas por email con diseño responsive, agrupado por estado y formato de fecha dd/mm/aa 24hs
- Asistente Tyrion Lannister (Gemini) para redactar y priorizar tareas
- Loading skeletons y toast notifications en todas las acciones

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd ProyectoIntegrador-M4-ACPJ

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Completar .env con las credenciales reales (ver sección Variables de entorno)

# 4. Iniciar en desarrollo
npm run dev

# 5. Para probar las Vercel Functions localmente (email, chat IA)
npx vercel dev
```

### Scripts disponibles

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción
npm run preview   # preview del build
npm run test      # tests con Vitest
npm run lint      # ESLint
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar con los valores reales. Nunca commitear `.env`.

```env
# Firebase — prefijo VITE_ obligatorio para que Vite las exponga al cliente
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AWS SES — SIN prefijo VITE_: solo las usa el servidor (Vercel Function)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
SES_FROM_EMAIL=

# Gemini — SIN prefijo VITE_: solo la usa el servidor
GEMINI_API_KEY=

# URL pública de la app (usada en el email de resumen)
APP_URL=https://matecode-task-manager.vercel.app
```

En Vercel, las variables con prefijo `VITE_` se configuran como variables de entorno del proyecto; las sin prefijo solo están disponibles en el servidor.

> **AWS SES en sandbox**: la app está en modo sandbox de AWS SES. Esto significa que el email de resumen solo funciona si el destinatario fue verificado manualmente en la consola de AWS. Si al probar la funcionalidad de email no llega nada, es por esta limitación — no por un error en la app. Para uso en producción real se requiere solicitar a AWS el acceso productivo ("Request production access").

---

## Arquitectura y decisiones técnicas

### Separación de responsabilidades

Los componentes solo describen qué se muestra. La lógica de negocio vive en hooks (`useTasks`, `useTaskItem`, `useAuth`, `useTheme`) y la comunicación con servicios externos en `src/services/`. Esta separación hace que cada parte del código tenga una razón única para cambiar y facilita el testing de la lógica sin depender del DOM.

```
src/
├── components/   # UI: TaskCard, TaskModal, TaskEditForm, DueChip, Dashboard...
├── hooks/        # Lógica reutilizable: useTasks, useTaskItem, useAuth, useTheme
├── services/     # Firebase, Firestore, emailService
├── pages/        # Vistas: Login, Register, Tasks
├── styles/       # Variables CSS globales, temas, estilos base
├── utils/        # Helpers: format.ts, taskHelpers.ts
└── types/        # Interfaces compartidas: Task, TaskFormValues, Theme...

api/
├── send-email.ts       # Vercel Function: recibe payload, llama a SES
├── _emailTemplate.ts   # Template HTML + generateSummaryEmail() — testeable sin SES
└── chat.ts             # Vercel Function: proxy para Gemini API
```

### Tiempo real con onSnapshot

`useTasks` se suscribe a Firestore con `onSnapshot` y cancela la suscripción al desmontar el componente, evitando fugas de memoria. La query filtra por `userId` tanto en el cliente como en las reglas de Firestore.

### Temas sin flash

El tema se aplica con `data-theme` en `<html>`. Un script inline en `index.html` lee `localStorage` antes del primer render de React para evitar el flash de tema incorrecto. `useLayoutEffect` sincroniza el atributo en cada cambio. El tema también se persiste en `users/{uid}` en Firestore para sincronizar entre dispositivos.

### Credenciales AWS siempre en el servidor

El frontend nunca habla con AWS directamente. Llama a `POST /api/send-email` (Vercel Function), que tiene acceso a las credenciales en variables de entorno del servidor. Las variables sin prefijo `VITE_` no llegan nunca al bundle del cliente.

### Template de email desacoplado del handler

`api/_emailTemplate.ts` exporta `generateSummaryEmail(data)` de forma pura: toma datos, devuelve `{ html, text }`. El handler `send-email.ts` solo valida, mapea el tema a color de acento y llama a SES. Esto permite testear el template sin depender de AWS ni Vercel.

---

## Flujo de email de resumen

1. El usuario hace clic en **📧 Resumen** en el header de la app
2. `Tasks.tsx` llama a `sendTaskSummary(email, tasks, { name, theme })`
3. `emailService.ts` formatea las fechas en zona horaria local (el servidor corre en UTC) y hace `POST /api/send-email`
4. La Vercel Function mapea el tema del usuario a un color de acento (`classic` → `#4F6EF7`, `midnight` → `#5c7cfa`)
5. `generateSummaryEmail()` agrupa las tareas por estado, construye el HTML reemplazando los `{{PLACEHOLDERS}}` en el template, y genera el fallback en texto plano
6. AWS SES envía el email con ambas versiones (HTML + texto)

---

## Seguridad de Firestore

Cada usuario solo puede leer y escribir sus propias tareas. Las reglas validan `userId` tanto en lectura como en escritura:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## Tests

```bash
npm run test
```

Cobertura actual: 15 tests en 4 archivos.

- `emailService.test.ts`: verifica que el payload se construye correctamente, que las fechas se formatean en el cliente, y el manejo de errores del serverless
- `_emailTemplate.test.ts`: verifica la generación del HTML sin depender de AWS
- Mocks de Firebase para evitar llamadas reales en tests

---

## Uso de IA en el desarrollo

Este proyecto fue desarrollado con asistencia puntual de **Claude** (Anthropic) como herramienta de consulta y debugging, de forma similar a como se usaría Stack Overflow o la documentación oficial.

### Cómo se usó

Claude se consultó para resolver dudas específicas durante el desarrollo:

- **Debugging**: diagnóstico del bug del checkbox invisible (conflicto de especificidad CSS entre `input[type='checkbox']` y `.task-check`) y discusión del fix con `:not([type='checkbox'])`
- **Preguntas técnicas puntuales**: comportamiento de `useLayoutEffect` vs `useEffect` para la sincronización del tema, manejo de zona horaria en el servidor (Vercel corre en UTC), convenciones de cancelación de `onSnapshot`
- **Revisión de código**: consultas sobre si un patrón específico era idiomático en React + TypeScript

### Qué decidí y construí yo

- Diseño visual completo: dashboard con saludo, estadísticas y barra de progreso, paleta de colores de los tres temas (Classic/Midnight/Vívido), sistema de chips semánticos, toggle lista/grilla
- Tyrion Lannister como personaje del asistente IA, su tono, su system prompt y sus límites de comportamiento
- No usar librerías de UI (Tailwind, shadcn, etc.) — CSS puro con variables como decisión de aprendizaje
- Estructura de carpetas, convenciones de commits semánticos y organización general del proyecto
- Mantener el drag & drop fuera del scope para no comprometer la estabilidad del CRUD
- Evaluar e descartar el toggle lista/grilla: se priorizó una vista única de cards bien ejecutada por sobre agregar complejidad de UI sin impacto en la funcionalidad central
- Elección de features extras: etiquetas, hora separada de la fecha, resumen por estado en el email, temas por usuario

### Asistente Tyrion (Gemini en la app)

El chat de IA dentro de la app usa **Gemini API** (via `api/chat.ts`) con un system prompt que define a Tyrion Lannister como personaje. Su rol es consultivo: ayuda a redactar y priorizar tareas, pero no puede crearlas ni modificarlas directamente.

La API key de Gemini es una variable de entorno del servidor (`GEMINI_API_KEY`, sin prefijo `VITE_`) y nunca llega al bundle del frontend.
