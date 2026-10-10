// Tests for heatmap-logic.js using node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateHeatLevel,
  clampWeeks,
  isFutureDate,
  getWeekStart,
  getWeekEnd,
  formatDateLabel,
  getHeatMapData
} = require('./heatmap-logic.js');

// calculateHeatLevel
test('calculateHeatLevel: 0 minutes -> level 0', () => {
  assert.equal(calculateHeatLevel(0), 0);
});

test('calculateHeatLevel: 1 minute -> level 1', () => {
  assert.equal(calculateHeatLevel(1), 1);
});

test('calculateHeatLevel: 15 minutes -> level 1', () => {
  assert.equal(calculateHeatLevel(15), 1);
});

test('calculateHeatLevel: 16 minutes -> level 2', () => {
  assert.equal(calculateHeatLevel(16), 2);
});

test('calculateHeatLevel: 30 minutes -> level 2', () => {
  assert.equal(calculateHeatLevel(30), 2);
});

test('calculateHeatLevel: 31 minutes -> level 3', () => {
  assert.equal(calculateHeatLevel(31), 3);
});

test('calculateHeatLevel: 60 minutes -> level 3', () => {
  assert.equal(calculateHeatLevel(60), 3);
});

test('calculateHeatLevel: 61 minutes -> level 4', () => {
  assert.equal(calculateHeatLevel(61), 4);
});

test('calculateHeatLevel: 120 minutes -> level 4', () => {
  assert.equal(calculateHeatLevel(120), 4);
});

test('calculateHeatLevel: negative minutes -> level 0', () => {
  assert.equal(calculateHeatLevel(-5), 0);
});

// clampWeeks
test('clampWeeks: 0 -> 1', () => {
  assert.equal(clampWeeks(0), 1);
});

test('clampWeeks: 1 -> 1', () => {
  assert.equal(clampWeeks(1), 1);
});

test('clampWeeks: 12 -> 12', () => {
  assert.equal(clampWeeks(12), 12);
});

test('clampWeeks: 52 -> 52', () => {
  assert.equal(clampWeeks(52), 52);
});

test('clampWeeks: 53 -> 52', () => {
  assert.equal(clampWeeks(53), 52);
});

test('clampWeeks: -5 -> 1', () => {
  assert.equal(clampWeeks(-5), 1);
});

// isFutureDate
test('isFutureDate: future date -> true', () => {
  assert.equal(isFutureDate('2026-10-10', '2026-10-09'), true);
});

test('isFutureDate: same date -> false', () => {
  assert.equal(isFutureDate('2026-10-09', '2026-10-09'), false);
});

test('isFutureDate: past date -> false', () => {
  assert.equal(isFutureDate('2026-10-08', '2026-10-09'), false);
});

// getWeekStart
test('getWeekStart: 2026-10-09 (Friday) -> 2026-10-05 (Monday)', () => {
  assert.equal(getWeekStart('2026-10-09'), '2026-10-05');
});

test('getWeekStart: 2026-10-05 (Monday) -> 2026-10-05', () => {
  assert.equal(getWeekStart('2026-10-05'), '2026-10-05');
});

// getWeekEnd
test('getWeekEnd: 2026-10-09 (Friday) -> 2026-10-11 (Sunday)', () => {
  assert.equal(getWeekEnd('2026-10-09'), '2026-10-11');
});

test('getWeekEnd: 2026-10-11 (Sunday) -> 2026-10-11', () => {
  assert.equal(getWeekEnd('2026-10-11'), '2026-10-11');
});

// formatDateLabel
test('formatDateLabel: returns Spanish format with month name', () => {
  const label = formatDateLabel('2026-10-09');
  assert.ok(label.includes('octubre'));
  assert.ok(label.includes('2026'));
  assert.ok(label.includes('9'));
});

// getHeatMapData
test('getHeatMapData: empty sessions -> all level 0', () => {
  const result = getHeatMapData([], '2026-10-09', 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].length, 7);
  assert.ok(result[0].every(day => day.level === 0 && day.minutes === 0));
});

test('getHeatMapData: future sessions ignored', () => {
  const sessions = [
    { fecha: '2026-10-15', minutos: 30 }, // future
    { fecha: '2026-10-09', minutos: 30 }  // today
  ];
  const result = getHeatMapData(sessions, '2026-10-09', 1);
  // Only today's session should count
  const todayCell = result[0].find(d => d.date === '2026-10-09');
  assert.equal(todayCell.minutes, 30);
  assert.equal(todayCell.level, 2);
});

test('getHeatMapData: multiple sessions same day -> sum minutes', () => {
  const sessions = [
    { fecha: '2026-10-09', minutos: 15 },
    { fecha: '2026-10-09', minutos: 20 }
  ];
  const result = getHeatMapData(sessions, '2026-10-09', 1);
  const todayCell = result[0].find(d => d.date === '2026-10-09');
  assert.equal(todayCell.minutes, 35);
  assert.equal(todayCell.level, 3);
});

test('getHeatMapData: range crosses month boundary', () => {
  // 2026-10-09 is Friday, 2 weeks back crosses into September
  const result = getHeatMapData([], '2026-10-09', 2);
  assert.equal(result.length, 2);
  assert.equal(result[0].length, 7);
  assert.equal(result[1].length, 7);
  // Check that dates are correct (no invalid dates)
  result.forEach(week => {
    week.forEach(day => {
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(day.date));
    });
  });
});

test('getHeatMapData: incomplete week at start -> outside range = level 0', () => {
  const result = getHeatMapData([], '2026-10-09', 2);
  const startDate = '2026-09-25'; // 14 days before 2026-10-09
  const outsideCells = result.flat().filter(d => d.date < startDate || d.date > '2026-10-09');
  assert.ok(outsideCells.every(d => d.level === 0 && d.isOutsideRange === true));
});

test('getHeatMapData: weeksBack 1, 4, 12, 52 -> correct length', () => {
  for (const weeks of [1, 4, 12, 52]) {
    const result = getHeatMapData([], '2026-10-09', weeks);
    assert.equal(result.length, weeks, `weeksBack=${weeks}`);
    assert.ok(result.every(w => w.length === 7), `all weeks have 7 days for weeksBack=${weeks}`);
  }
});

test('getHeatMapData: column order - recent week at index weeksBack-1', () => {
  const sessions = [
    { fecha: '2026-10-09', minutos: 30 }, // this week
    { fecha: '2026-10-02', minutos: 30 }  // last week
  ];
  const result = getHeatMapData(sessions, '2026-10-09', 2);
  // result[0] = older week, result[1] = current week
  const currentWeek = result[1];
  const lastWeek = result[0];
  const todayCell = currentWeek.find(d => d.date === '2026-10-09');
  const lastWeekCell = lastWeek.find(d => d.date === '2026-10-02');
  assert.equal(todayCell.level, 2);
  assert.equal(lastWeekCell.level, 2);
});