// Pure logic functions for heatmap - no DOM, no localStorage
// All dates as "AAAA-MM-DD" strings (local time)

function calculateHeatLevel(minutes) {
  if (!Number.isInteger(minutes) || minutes <= 0) return 0;
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 60) return 3;
  return 4;
}

function clampWeeks(value) {
  const n = Number(value);
  if (!Number.isInteger(n)) return 12;
  if (n < 1) return 1;
  if (n > 52) return 52;
  return n;
}

function isFutureDate(dateStr, today) {
  return dateStr > today;
}

function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekStart(dateStr) {
  const date = parseDateStr(dateStr);
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
  date.setDate(date.getDate() + diff);
  return toDateStr(date);
}

function getWeekEnd(dateStr) {
  const start = getWeekStart(dateStr);
  const date = parseDateStr(start);
  date.setDate(date.getDate() + 6);
  return toDateStr(date);
}

function formatDateLabel(dateStr) {
  const date = parseDateStr(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getHeatMapData(sessions, today, weeksBack) {
  const wb = clampWeeks(weeksBack);

  // Group valid sessions by date (sum minutes), ignore future dates
  const minutesByDate = {};
  for (const s of sessions) {
    if (isFutureDate(s.fecha, today)) continue;
    minutesByDate[s.fecha] = (minutesByDate[s.fecha] || 0) + (s.minutos || 0);
  }

  // Calculate start date (weeksBack * 7 days before today)
  const todayDate = parseDateStr(today);
  const startDate = new Date(todayDate);
  startDate.setDate(startDate.getDate() - wb * 7);
  const startStr = toDateStr(startDate);

  const weeks = [];
  let currentWeekEnd = todayDate;

  for (let i = 0; i < wb; i++) {
    const weekEndStr = toDateStr(currentWeekEnd);
    const weekStartStr = getWeekStart(weekEndStr);
    const weekStartDate = parseDateStr(weekStartStr);

    const days = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(dayDate.getDate() + dayOffset);
      const dayStr = toDateStr(dayDate);

      const isOutside = dayStr > today || dayStr < startStr;
      let minutes = 0;
      let level = 0;

      if (!isOutside) {
        minutes = minutesByDate[dayStr] || 0;
        level = calculateHeatLevel(minutes);
      }

      days.push({
        date: dayStr,
        level,
        minutes,
        isFuture: false,
        isOutsideRange: isOutside
      });
    }

    weeks.unshift(days); // prepend so weeks[0] = oldest, weeks[wb-1] = current
    currentWeekEnd.setDate(currentWeekEnd.getDate() - 7);
  }

  return weeks;
}

// Export for both Node (tests) and browser
const HeatmapLogic = {
  calculateHeatLevel,
  clampWeeks,
  isFutureDate,
  getWeekStart,
  getWeekEnd,
  formatDateLabel,
  getHeatMapData
};

// Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeatmapLogic;
}

// Browser (global)
if (typeof window !== 'undefined') {
  window.HeatmapLogic = HeatmapLogic;
}