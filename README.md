# 🥋 Bushido Gains

App web de entrenamiento **full body 3×/semana** enfocada en hipertrofia para practicantes de BJJ. Funciona como una sola página (`index.html`), sin backend ni instalación.

## Características

- **Rutina A/B/C** con 18 ejercicios, series, repeticiones y notas técnicas, pensada para entrenar pesas antes de BJJ.
- **Video de técnica embebido** (YouTube, en español) para cada ejercicio.
- **Editor de rutina**: cambia nombre, series, reps, notas y video de cada ejercicio; agrega, elimina o reordena ejercicios; o restaura la rutina original.
- **Seguimiento del día**: marca ejercicios completados y el "cinturón" del día va ganando rayas blancas.
- **Registro de medidas**: peso, % grasa y % músculo por fecha, con IMC calculado automáticamente según tu estatura.
- **Gráficas de progreso** por métrica e historial completo.
- **Multiusuario**: cada perfil tiene su propia rutina, medidas e historial.
- **Guía "¿cuándo cambiar la rutina?"** con criterios prácticos (mesetas, molestias, adherencia).
- **Calentamiento guiado** (~10 min) con checklist propio: cardio, movilidad articular y series de aproximación.
- **Generador de rutinas con IA**: describe tu objetivo, marca tu equipo (multi-select) y la IA arma un plan personalizado usando una biblioteca de 28 ejercicios con video verificado.

## Cómo usarla

**Opción 1 — GitHub Pages (recomendada):**

1. En este repositorio ve a **Settings → Pages**.
2. En *Build and deployment*, elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guarda.
3. En 1–2 minutos tu app quedará disponible en `https://crmade.github.io/bushido-gains/`.

**Opción 2 — Local:** descarga `index.html` y ábrelo en cualquier navegador (requiere internet para cargar React, Tailwind y los videos).

## Generador con IA (opcional)

La pestaña **Generar** usa la API de Anthropic (Claude) directamente desde tu navegador. Como GitHub Pages es un sitio estático sin servidor, no hay forma segura de incluir una clave compartida — por eso cada persona usa **su propia clave de API**, que se guarda únicamente en el `localStorage` de su navegador. Se obtiene en [console.anthropic.com](https://console.anthropic.com) y cada generación cuesta unos centavos de dólar. El resto de la app funciona perfectamente sin clave.

## Cuentas y sincronización (opcional, Supabase + Google)

La app soporta inicio de sesión con Google para sincronizar rutina, medidas y progreso entre dispositivos, usando [Supabase](https://supabase.com) (plan gratuito). La configuración completa está en `supabase-setup.sql` y en las instrucciones del repositorio: se corre el SQL, se habilita Google como proveedor de auth, y se pegan la URL del proyecto y la clave `anon` en las dos constantes al inicio de `index.html`. Si las constantes se dejan con sus placeholders, la app funciona en modo local sin cuentas, igual que siempre. Los datos de cada usuario están protegidos con Row Level Security: nadie puede leer datos ajenos.

## Tus datos

Todo se guarda en el **localStorage del navegador**, en tu dispositivo. Nada se envía a ningún servidor. Ten en cuenta que si borras los datos de navegación o cambias de dispositivo/navegador, el historial no se transfiere.

## Cambiar los videos

Cualquier video puede reemplazarse desde la app: **Rutina → ✎ Editar rutina → pega otro link de YouTube** en el ejercicio que quieras.

## Stack

HTML + React 18 (UMD) + Babel Standalone + Tailwind CDN. Gráficas en SVG puro, sin dependencias.

---

Hecho con [Claude](https://claude.ai). Entrena duro, rueda suave. Oss! 🤙
