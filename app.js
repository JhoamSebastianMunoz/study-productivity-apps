// Clave donde guardamos las sesiones en localStorage
const CLAVE = "diario-estudio-sesiones";

const formulario = document.getElementById("form-sesion");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const mensajeError = document.getElementById("mensaje-error");
const numeroRacha = document.getElementById("racha-numero");
const textoRacha = document.getElementById("racha-texto");
const mejorRacha = document.getElementById("mejor-racha");
const minutosSemana = document.getElementById("minutos-semana");
const diasMes = document.getElementById("dias-mes");
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

// Devuelve el lunes de la semana actual (hora local) como "AAAA-MM-DD"
function inicioSemanaLocal() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana; // lunes = 1
  hoy.setDate(hoy.getDate() + diff);
  return aTextoFechaLocal(hoy);
}

// Devuelve el domingo de la semana actual (hora local) como "AAAA-MM-DD"
function finSemanaLocal() {
  const inicio = inicioSemanaLocal();
  const partes = inicio.split("-");
  const domingo = new Date(partes[0], partes[1] - 1, partes[2]);
  domingo.setDate(domingo.getDate() + 6);
  return aTextoFechaLocal(domingo);
}

// Devuelve el primer día del mes actual (hora local) como "AAAA-MM-DD"
function inicioMesLocal() {
  const hoy = new Date();
  return aTextoFechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

// Devuelve el último día del mes actual (hora local) como "AAAA-MM-DD"
function finMesLocal() {
  const hoy = new Date();
  return aTextoFechaLocal(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
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

// Calcula la mejor racha: el grupo más largo de días seguidos con sesión.
// Las fechas futuras se ignoran. Varias sesiones el mismo día cuentan como un día.
function calcularMejorRacha(sesiones) {
  const dias = [];
  const vistos = new Set();
  for (const sesion of sesiones) {
    if (sesion.fecha > hoyLocal() || vistos.has(sesion.fecha)) {
      continue;
    }
    vistos.add(sesion.fecha);
    dias.push(sesion.fecha);
  }
  dias.sort();

  let mejor = 0;
  let actual = 0;
  let anterior = "";
  for (const dia of dias) {
    if (anterior !== "") {
      const partes = anterior.split("-");
      const siguiente = new Date(partes[0], partes[1] - 1, partes[2]);
      siguiente.setDate(siguiente.getDate() + 1);
      if (aTextoFechaLocal(siguiente) !== dia) {
        actual = 0;
      }
    }
    actual = actual + 1;
    if (actual > mejor) {
      mejor = actual;
    }
    anterior = dia;
  }
  return mejor;
}

// Suma los minutos de las sesiones que caen en la semana actual (lunes-domingo).
// Ignora fechas futuras.
function calcularMinutosSemana(sesiones) {
  const inicio = inicioSemanaLocal();
  const fin = finSemanaLocal();
  let total = 0;
  for (const s of sesiones) {
    if (s.fecha > hoyLocal()) {
      continue;
    }
    if (s.fecha >= inicio && s.fecha <= fin) {
      total += s.minutos;
    }
  }
  return total;
}

// Cuenta los días únicos con sesión en el mes actual.
// Ignora fechas futuras.
function calcularDiasMes(sesiones) {
  const inicio = inicioMesLocal();
  const fin = finMesLocal();
  const hoy = hoyLocal();
  const dias = new Set();
  for (const s of sesiones) {
    if (s.fecha > hoy) {
      continue;
    }
    if (s.fecha >= inicio && s.fecha <= fin) {
      dias.add(s.fecha);
    }
  }
  return dias.size;
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

  const mejor = calcularMejorRacha(sesiones);
  mejorRacha.textContent = "🏆 Mejor racha: " + mejor + (mejor === 1 ? " día" : " días");

  const minutos = calcularMinutosSemana(sesiones);
  if (minutos > 0) {
    minutosSemana.textContent = "Esta semana: " + minutos + " min";
    minutosSemana.hidden = false;
  } else {
    minutosSemana.hidden = true;
  }

  const dias = calcularDiasMes(sesiones);
  if (dias > 0) {
    diasMes.textContent = "Este mes: " + dias + (dias === 1 ? " día" : " días");
    diasMes.hidden = false;
  } else {
    diasMes.hidden = true;
  }

  listaSesiones.innerHTML = "";
  mensajeVacio.hidden = sesiones.length !== 0;

  for (const sesion of sesiones) {
    const item = document.createElement("li");

    const titulo = document.createElement("strong");
    titulo.textContent = sesion.tema;

    const meta = document.createElement("div");
    meta.className = "sesion-meta";

    const fechaEl = document.createElement("span");
    fechaEl.className = "sesion-fecha";
    fechaEl.textContent = fechaLegible(sesion.fecha);

    const minutosEl = document.createElement("span");
    minutosEl.className = "sesion-minutos";
    minutosEl.textContent = sesion.minutos + " min";

    meta.appendChild(fechaEl);
    meta.appendChild(minutosEl);

    item.appendChild(titulo);
    item.appendChild(meta);
    listaSesiones.appendChild(item);
  }
}

// Cuando se envía el formulario, valida y guarda la nueva sesión
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();
  mensajeError.hidden = true;
  mensajeError.textContent = "";

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

// ===== HEATMAP INTEGRATION =====
const HEATMAP_KEY = "diario-estudio-heatmap-semanas";
const HEATMAP_DEFAULT_WEEKS = 12;

const heatmapSection = document.getElementById("heatmap");
const heatmapSelect = document.getElementById("heatmap-weeks-select");
const heatmapInput = document.getElementById("heatmap-weeks-input");

let heatmapTooltip = null;
let tooltipTimeout = null;
let focusedCell = null;

function loadHeatmapWeeks() {
  try {
    const stored = localStorage.getItem(HEATMAP_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 52) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return HEATMAP_DEFAULT_WEEKS;
}

function saveHeatmapWeeks(value) {
  try {
    const clamped = Math.max(1, Math.min(52, parseInt(value, 10) || HEATMAP_DEFAULT_WEEKS));
    localStorage.setItem(HEATMAP_KEY, String(clamped));
    return clamped;
  } catch (e) {
    return HEATMAP_DEFAULT_WEEKS;
  }
}

function renderHeatMap(weeksBack) {
  const sesiones = cargarSesiones();
  const today = hoyLocal();
  const weeksData = window.HeatmapLogic.getHeatMapData(sesiones, today, weeksBack);

  // Build table
  const table = document.createElement("table");
  table.setAttribute("role", "img");
  table.setAttribute("aria-label", `Mapa de calor de actividad de estudio: últimas ${weeksBack} semanas`);

  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = `Mapa de calor: últimas ${weeksBack} semanas`;
  table.appendChild(caption);

  // thead with day labels
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const emptyTh = document.createElement("th");
  emptyTh.setAttribute("scope", "col");
  emptyTh.setAttribute("aria-hidden", "true");
  headerRow.appendChild(emptyTh);

  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  for (const label of dayLabels) {
    const th = document.createElement("th");
    th.setAttribute("scope", "col");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // tbody: 7 rows (Mon-Sun), each with weeksBack cells
  const tbody = document.createElement("tbody");
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  for (let rowIdx = 0; rowIdx < 7; rowIdx++) {
    const tr = document.createElement("tr");

    // Row header (day name)
    const th = document.createElement("th");
    th.setAttribute("scope", "row");
    th.textContent = dayNames[rowIdx];
    tr.appendChild(th);

    // Cells for each week (columns)
    // weeksData[0] = oldest week, weeksData[weeksBack-1] = current week
    // We want recent week on the right, so iterate weeksData in order
    for (let weekIdx = 0; weekIdx < weeksBack; weekIdx++) {
      const dayData = weeksData[weekIdx][rowIdx];
      const td = document.createElement("td");
      td.setAttribute("data-date", dayData.date);
      td.setAttribute("data-level", String(dayData.level));
      td.setAttribute("data-minutes", String(dayData.minutes));
      td.setAttribute("tabindex", "0");

      const minutesText = dayData.minutes > 0 ? `${dayData.minutes} min` : "Sin actividad";
      td.setAttribute("aria-label", `Fecha: ${dayData.date}. Minutos: ${minutesText}`);

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  // Tooltip element
  if (!heatmapTooltip) {
    heatmapTooltip = document.createElement("div");
    heatmapTooltip.id = "heatmap-tooltip";
    heatmapTooltip.setAttribute("role", "tooltip");
    heatmapTooltip.hidden = true;
    document.body.appendChild(heatmapTooltip);
  }

  // Replace content
  heatmapSection.innerHTML = "";
  heatmapSection.appendChild(table);

  // Event delegation on table
  table.addEventListener("mouseenter", handleCellHover, true);
  table.addEventListener("focusin", handleCellFocus, true);
  table.addEventListener("mouseleave", handleCellLeave, true);
  table.addEventListener("focusout", handleCellBlur, true);
  table.addEventListener("click", handleCellClick);
  table.addEventListener("keydown", handleCellKeydown);

  // Sync controls
  heatmapSelect.value = String(weeksBack);
  heatmapInput.value = "";
}

function showTooltip(cell) {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  tooltipTimeout = setTimeout(() => {
    const date = cell.getAttribute("data-date");
    const minutes = parseInt(cell.getAttribute("data-minutes"), 10);
    const level = parseInt(cell.getAttribute("data-level"), 10);

    let text;
    if (minutes > 0) {
      text = `${date}: ${minutes} min`;
    } else {
      text = `${date}: Sin actividad`;
    }
    heatmapTooltip.textContent = text;
    heatmapTooltip.hidden = false;

    positionTooltip(cell);
  }, 150);
}

function hideTooltip() {
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  if (heatmapTooltip) {
    heatmapTooltip.hidden = true;
  }
}

function positionTooltip(cell) {
  const rect = cell.getBoundingClientRect();
  const tooltipRect = heatmapTooltip.getBoundingClientRect();
  const left = rect.left + rect.width / 2 - tooltipRect.width / 2;
  const top = rect.top - tooltipRect.height - 8;
  heatmapTooltip.style.left = `${Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8))}px`;
  heatmapTooltip.style.top = `${Math.max(8, top)}px`;
}

function handleCellHover(e) {
  const cell = e.target.closest("td[data-date]");
  if (cell) {
    focusedCell = cell;
    showTooltip(cell);
  }
}

function handleCellFocus(e) {
  const cell = e.target.closest("td[data-date]");
  if (cell) {
    focusedCell = cell;
    showTooltip(cell);
  }
}

function handleCellLeave(e) {
  const cell = e.target.closest("td[data-date]");
  if (cell && !cell.matches(":focus")) {
    hideTooltip();
    focusedCell = null;
  }
}

function handleCellBlur(e) {
  const cell = e.target.closest("td[data-date]");
  if (cell && !cell.matches(":hover")) {
    hideTooltip();
    focusedCell = null;
  }
}

function handleCellClick(e) {
  const cell = e.target.closest("td[data-date]");
  if (cell && window.matchMedia("(pointer: coarse)").matches) {
    // Touch device: toggle tooltip
    if (heatmapTooltip.hidden || focusedCell !== cell) {
      focusedCell = cell;
      showTooltip(cell);
    } else {
      hideTooltip();
      focusedCell = null;
    }
  }
}

function handleCellKeydown(e) {
  const cell = e.target.closest("td[data-date]");
  if (!cell) return;

  const table = cell.closest("table");
  const cells = Array.from(table.querySelectorAll("td[data-date]"));
  const idx = cells.indexOf(cell);
  const weeksBack = parseInt(heatmapSelect.value, 10) || HEATMAP_DEFAULT_WEEKS;
  const cols = weeksBack;
  const rows = 7;

  let newIdx = -1;
  switch (e.key) {
    case "ArrowRight":
      newIdx = idx + rows;
      break;
    case "ArrowLeft":
      newIdx = idx - rows;
      break;
    case "ArrowDown":
      newIdx = idx + 1;
      break;
    case "ArrowUp":
      newIdx = idx - 1;
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      showTooltip(cell);
      focusedCell = cell;
      return;
    case "Escape":
      hideTooltip();
      focusedCell = null;
      cell.blur();
      return;
    default:
      return;
  }

  if (newIdx >= 0 && newIdx < cells.length) {
    e.preventDefault();
    cells[newIdx].focus();
    // Tooltip will show via focusin handler
  }
}

function initHeatmap() {
  const weeks = loadHeatmapWeeks();
  heatmapSelect.value = String(weeks);
  renderHeatMap(weeks);

  heatmapSelect.addEventListener("change", () => {
    const weeks = saveHeatmapWeeks(heatmapSelect.value);
    renderHeatMap(weeks);
  });

  heatmapInput.addEventListener("input", () => {
    const val = parseInt(heatmapInput.value, 10);
    if (Number.isInteger(val) && val >= 1 && val <= 52) {
      const weeks = saveHeatmapWeeks(val);
      renderHeatMap(weeks);
    }
  });

  // Close tooltip on scroll/resize
  window.addEventListener("scroll", hideTooltip);
  window.addEventListener("resize", hideTooltip);
}

// Initialize heatmap after DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeatmap);
} else {
  initHeatmap();
}
