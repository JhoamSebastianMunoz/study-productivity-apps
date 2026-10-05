// Clave donde guardamos las sesiones en localStorage
const CLAVE = "diario-estudio-sesiones";

const formulario = document.getElementById("form-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const mensajeError = document.getElementById("mensaje-error");
const numeroRacha = document.getElementById("racha-numero");
const textoRacha = document.getElementById("racha-texto");
const listaSesiones = document.getElementById("lista-sesiones");
const mensajeVacio = document.getElementById("mensaje-vacio");

// Convierte un objeto Date a texto "AAAA-MM-DD" usando la hora local
function aTextoFechaLocal(fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return año + "-" + mes + "-" + dia;
}

// Devuelve el texto "AAAA-MM-DD" del día de hoy (hora local)
function hoyLocal() {
  return aTextoFechaLocal(new Date());
}

// Devuelve el texto "AAAA-MM-DD" de ayer (hora local)
function ayerLocal() {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return aTextoFechaLocal(ayer);
}

// Lee las sesiones guardadas. Si no hay nada, devuelve una lista vacía.
function cargarSesiones() {
  const texto = localStorage.getItem(CLAVE);
  if (!texto) {
    return [];
  }
  try {
    return JSON.parse(texto);
  } catch {
    return [];
  }
}

// Guarda la lista de sesiones en localStorage
function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}

// Calcula la racha: días seguidos con sesión que terminan hoy.
// Si hoy aún no tiene sesión pero ayer sí, la racha sigue viva.
function calcularRacha(sesiones) {
  const diasConEstudio = new Set(sesiones.map(function (s) { return s.fecha; }));

  // Si ni hoy ni ayer tienen sesión, la racha es 0
  if (!diasConEstudio.has(hoyLocal()) && !diasConEstudio.has(ayerLocal())) {
    return 0;
  }

  // Empezamos a contar desde hoy, o desde ayer si hoy aún no tiene sesión
  const dia = new Date();
  if (!diasConEstudio.has(aTextoFechaLocal(dia))) {
    dia.setDate(dia.getDate() - 1);
  }

  let racha = 0;
  while (diasConEstudio.has(aTextoFechaLocal(dia))) {
    racha = racha + 1;
    dia.setDate(dia.getDate() - 1);
  }
  return racha;
}

// Convierte "AAAA-MM-DD" en una fecha legible, sin usar UTC
function fechaLegible(textoFecha) {
  const partes = textoFecha.split("-");
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Muestra la racha y la lista de sesiones en la página
function mostrar() {
  const sesiones = cargarSesiones();

  // Ordenar de la más reciente a la más antigua
  sesiones.sort(function (a, b) {
    if (a.fecha !== b.fecha) {
      return b.fecha.localeCompare(a.fecha);
    }
    return b.id - a.id;
  });

  const racha = calcularRacha(sesiones);
  numeroRacha.textContent = racha;
  textoRacha.textContent = racha === 1
    ? "día seguido estudiando"
    : "días seguidos estudiando";

  listaSesiones.innerHTML = "";
  mensajeVacio.hidden = sesiones.length !== 0;

  for (const sesion of sesiones) {
    const item = document.createElement("li");

    const titulo = document.createElement("strong");
    titulo.textContent = sesion.tema;

    const detalle = document.createElement("span");
    detalle.textContent = fechaLegible(sesion.fecha) + " · " + sesion.minutos + " min";

    item.appendChild(titulo);
    item.appendChild(detalle);
    listaSesiones.appendChild(item);
  }
}

// Cuando se envía el formulario, valida y guarda la nueva sesión
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
  mensajeError.hidden = true;

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  if (!fecha) {
    mensajeError.textContent = "Elige una fecha.";
    mensajeError.hidden = false;
    return;
  }
  if (!tema) {
    mensajeError.textContent = "Escribe un tema.";
    mensajeError.hidden = false;
    return;
  }
  if (!Number.isInteger(minutos) || minutos <= 0) {
    mensajeError.textContent = "Los minutos tienen que ser un número mayor que 0.";
    mensajeError.hidden = false;
    return;
  }

  const sesiones = cargarSesiones();
  sesiones.push({
    id: Date.now(),
    fecha: fecha,
    tema: tema,
    minutos: minutos
  });
  guardarSesiones(sesiones);

  // Limpiar el formulario y dejar la fecha en hoy
  campoFecha.value = hoyLocal();
  campoTema.value = "";
  campoMinutos.value = "";

  mostrar();
});

// Al abrir la página: fecha por defecto = hoy, y mostrar los datos guardados
campoFecha.value = hoyLocal();
mostrar();
