export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isToday(dateStr: string): boolean {
  return dateStr === getLocalDateString();
}

export function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === getLocalDateString(yesterday);
}

export function getPastDates(days: number): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(getLocalDateString(date));
  }
  return dates;
}

export function getCurrentWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dates: string[] = [];
  for (let i = 0; i <= dayOfWeek; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOfWeek + i);
    dates.push(getLocalDateString(date));
  }
  return dates;
}

export function getCurrentMonthDates(): string[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dates: string[] = [];
  const currentDate = new Date(year, month, 1);
  while (currentDate <= today) {
    dates.push(getLocalDateString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(getLocalDateString(date));
  }
  return dates;
}

// Returns all 7 days (Sun–Sat) for a week relative to today.
// weekOffset 0 = current week, -1 = last week, etc.
export function getWeekDates(weekOffset: number = 0): string[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return getLocalDateString(d);
  });
}
