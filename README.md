# Diario de Estudio

Web sencilla para registrar sesiones de estudio y mantener la motivación viendo la racha de días seguidos.

## Qué hace

- Formulario para registrar una sesión: fecha (por defecto hoy, editable para apuntar días anteriores), tema y minutos.
- Racha actual: días consecutivos con sesión que terminan hoy. Si hoy aún no has estudiado pero ayer sí, la racha sigue viva.
- Mejor racha: el grupo más largo de días seguidos con sesión que has conseguido nunca. Las fechas futuras no cuentan.
- Lista de sesiones, de la más reciente a la más antigua.

## Cómo usarla

1. Haz doble clic en `index.html`: se abre en el navegador, sin servidor ni instalación.
2. Rellena el formulario y pulsa «Guardar sesión».
3. Tus datos se guardan en el navegador (localStorage) y se mantienen al recargar.

Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `diario-estudio-sesiones`.

## Proyecto

- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Sin frameworks, librerías ni compilación. Todo el código es HTML, CSS y JavaScript puros.
- Datos en localStorage bajo la clave `diario-estudio-sesiones`: array de `{ id, fecha: "AAAA-MM-DD", tema, minutos }`.
- Las fechas se trabajan siempre en hora local.
