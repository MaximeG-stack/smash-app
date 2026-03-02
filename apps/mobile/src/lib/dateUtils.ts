const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
const MONTHS_LONG_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const WEEKDAYS_LONG_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Format du type "Aujourd'hui à 14:30" ou "Lun 3 mars à 14:30"
export function formatMatchDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  if (matchDay.getTime() === today.getTime()) return `Aujourd'hui à ${timeStr}`;
  if (matchDay.getTime() === tomorrow.getTime()) return `Demain à ${timeStr}`;

  const dayName = WEEKDAYS_LONG_FR[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTHS_LONG_FR[date.getMonth()];
  // Capitalize first letter
  const capitalDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  return `${capitalDay} ${dayNum} ${monthName} à ${timeStr}`;
}

// Format court pour les listes : "Auj. 14:30" ou "Lun 3 mars 14:30"
export function formatMatchDateShort(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  if (matchDay.getTime() === today.getTime()) return `Auj. ${timeStr}`;
  if (matchDay.getTime() === tomorrow.getTime()) return `Dem. ${timeStr}`;

  return `${DAYS_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${timeStr}`;
}

// Format durée : 60→"1h", 90→"1h30", 120→"2h"
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

// Retourne les N prochains jours à partir d'aujourd'hui
export function getNextDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// Retourne les créneaux horaires de 07:00 à 22:00 (intervalles de 30min)
export function getTimeSlots(): Array<{ label: string; hour: number; minute: number }> {
  const slots: Array<{ label: string; hour: number; minute: number }> = [];
  for (let h = 7; h <= 22; h++) {
    slots.push({
      label: `${String(h).padStart(2, "0")}:00`,
      hour: h,
      minute: 0,
    });
    if (h < 22) {
      slots.push({
        label: `${String(h).padStart(2, "0")}:30`,
        hour: h,
        minute: 30,
      });
    }
  }
  return slots;
}

// Formatage d'un chip de date : { dayName: "Lun", dayNum: "3", monthName: "mars" }
export function formatDayChip(date: Date): { dayName: string; dayNum: string; monthName: string; isToday: boolean } {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return {
    dayName: isToday ? "Auj." : DAYS_FR[date.getDay()],
    dayNum: date.getDate().toString(),
    monthName: MONTHS_FR[date.getMonth()],
    isToday,
  };
}

// Vérifie si deux dates sont le même jour
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Combine une date et une heure/minute en objet Date
export function buildDateTime(date: Date, hour: number, minute: number): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}
