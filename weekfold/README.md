# weekfold

Calendarios semanales por usuario, compartibles entre cuentas. React + Vite + Firebase (Auth + Firestore).

## Crear el repositorio

```bash
cd weekfold
git init
git add .
git commit -m "scaffold inicial de weekfold"
gh repo create weekfold --public --source=. --remote=origin --push
```

Si no tienes `gh` CLI autenticado, crea el repo vacío en github.com/new y luego:

```bash
git remote add origin https://github.com/TU_USUARIO/weekfold.git
git branch -M main
git push -u origin main
```

## Configurar Firebase

1. Crea un proyecto en https://console.firebase.google.com
2. Habilita **Authentication → Email/Password**
3. Crea una base de datos **Firestore** (modo producción)
4. Copia la config web (Project Settings → tus apps → SDK config) a un archivo `.env` basado en `.env.example`
5. Despliega las reglas e índices:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # selecciona tu proyecto, usa los archivos existentes
firebase deploy --only firestore:rules,firestore:indexes
```

## Correr localmente

```bash
npm install
npm run dev
```

## Qué falta por decisión de alcance (v1)

- No hay recuperación de contraseña ni verificación de email.
- Los eventos no son recurrentes (no hay "repetir cada semana").
- El nombre visible de un colaborador en "Compartir" muestra el UID recortado, no el username — falta un lookup adicional a `users/{uid}` por cada miembro.
- Zona horaria: se usa la hora local del navegador, no hay soporte multi-timezone.
- Eliminar un calendario completo (no solo eventos) no tiene UI todavía.

Dime cuál de estos priorizamos en la siguiente iteración.
