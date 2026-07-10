# Weekfold

Weekfold es una aplicación web para gestionar calendarios semanales de forma colaborativa. Permite crear calendarios compartidos, organizar eventos por día, invitar a otros usuarios y recibir recordatorios basados en notificaciones del navegador.

## Qué hace el proyecto

- Registro e inicio de sesión con Firebase Authentication.
- Creación de calendarios personales o compartidos.
- Gestión de eventos por día y por semana.
- Compartición de calendarios con otros usuarios.
- Recordatorios locales mediante notificaciones del navegador.
- Interfaz moderna construida con React, Vite y Tailwind CSS.

## Tecnologías utilizadas

- React 18
- Vite
- Tailwind CSS
- Firebase Auth
- Firestore
- date-fns

## Estructura del proyecto

- src/components: componentes reutilizables como navbar, modal de eventos, modal de compartir y vista semanal.
- src/pages: pantallas principales de autenticación, dashboard y calendario.
- src/context: contexto de autenticación.
- src/hooks: lógica reutilizable para cargar calendarios.
- src/utils: utilidades para notificaciones y paletas.
- functions: funciones backend de Firebase, si se requieren para extensiones futuras.

## Requisitos previos

- Node.js 18 o superior
- npm
- Una cuenta de Firebase con proyecto creado

## Configuración de Firebase

1. Crea un proyecto en Firebase Console.
2. Activa Authentication con el método Email/Password.
3. Crea una base de datos Firestore.
4. Crea un archivo .env en la raíz del proyecto con las siguientes variables:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

5. Si deseas desplegar reglas e índices de Firestore, puedes usar Firebase CLI.

## Instalación

```bash
npm install
```

## Ejecución local

```bash
npm run dev
```

## Construcción para producción

```bash
npm run build
```

## Flujo de uso

1. Inicia sesión o crea una cuenta.
2. Crea un calendario nuevo.
3. Añade eventos en la vista semanal.
4. Comparte el calendario con otros usuarios si lo deseas.
5. Activa las notificaciones del navegador para recibir recordatorios.

## Estado actual

El proyecto ya incluye la base funcional para trabajar con calendarios compartidos, eventos y recordatorios, y está listo para seguir expandiéndose con nuevas mejoras como repetición de eventos, recuperación de contraseña y más opciones de colaboración.
