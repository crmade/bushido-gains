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

## Cómo usarla

**Opción 1 — GitHub Pages (recomendada):**

1. En este repositorio ve a **Settings → Pages**.
2. En *Build and deployment*, elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guarda.
3. En 1–2 minutos tu app quedará disponible en `https://crmade.github.io/bushido-gains/`.

**Opción 2 — Local:** descarga `index.html` y ábrelo en cualquier navegador (requiere internet para cargar React, Tailwind y los videos).

## Tus datos

Todo se guarda en el **localStorage del navegador**, en tu dispositivo. Nada se envía a ningún servidor. Ten en cuenta que si borras los datos de navegación o cambias de dispositivo/navegador, el historial no se transfiere.

## Cambiar los videos

Cualquier video puede reemplazarse desde la app: **Rutina → ✎ Editar rutina → pega otro link de YouTube** en el ejercicio que quieras.

## Stack

HTML + React 18 (UMD) + Babel Standalone + Tailwind CDN. Gráficas en SVG puro, sin dependencias.

---

Hecho con [Claude](https://claude.ai). Entrena duro, rueda suave. Oss! 🤙
