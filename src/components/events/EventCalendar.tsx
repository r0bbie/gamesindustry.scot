import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface RecurrenceRule {
  frequency: "weekly" | "biweekly" | "monthly";
  start_date?: string;
  week?: number;
  day?: string;
  description: string;
}

export interface EventData {
  id: string;
  name: string;
  slug: string;
  date_start: string;
  date_end?: string;
  location?: string;
  is_online: boolean;
  is_scottish: boolean;
  tags: string[];
  highlighted: boolean;
  recurring?: boolean;
  recurrence?: RecurrenceRule;
}

export interface GameRelease {
  id: string;
  title: string;
  slug: string;
  release_date?: string;
  status: string;
}

interface Props {
  events: EventData[];
  gameReleases: GameRelease[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateInRange(date: Date, start: string, end?: string) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = parseDate(start);
  const e = end ? parseDate(end) : s;
  return d >= s && d <= e;
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function nthWeekdayOfMonth(year: number, month: number, dayName: string, n: number): Date | null {
  const dow = DAY_NAMES.indexOf(dayName.toLowerCase());
  if (dow === -1) return null;
  const firstDow = new Date(year, month, 1).getDay();
  const diff = (dow - firstDow + 7) % 7;
  const date = 1 + diff + (n - 1) * 7;
  // Ensure it doesn't spill into next month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  if (date > daysInMonth) return null;
  return new Date(year, month, date);
}

function getRecurringDaysForMonth(rule: RecurrenceRule, year: number, month: number): number[] {
  if (rule.frequency === "weekly" && rule.start_date) {
    const ref = new Date(rule.start_date + "T00:00:00");
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date >= ref) {
        const diffDays = Math.round((date.getTime() - ref.getTime()) / 86_400_000);
        if (diffDays % 7 === 0) results.push(d);
      }
    }
    return results;
  }
  if (rule.frequency === "biweekly" && rule.start_date && rule.day) {
    const dow = DAY_NAMES.indexOf(rule.day.toLowerCase());
    if (dow === -1) return [];
    const ref = new Date(rule.start_date + "T00:00:00");
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === dow) {
        const diffDays = Math.round((date.getTime() - ref.getTime()) / 86_400_000);
        if (diffDays >= 0 && diffDays % 14 === 0) results.push(d);
      }
    }
    return results;
  }
  if (rule.frequency === "monthly" && rule.week != null && rule.day) {
    const d = nthWeekdayOfMonth(year, month, rule.day, rule.week);
    return d ? [d.getDate()] : [];
  }
  return [];
}

export default function EventCalendar({ events, gameReleases }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [showGames, setShowGames] = useState(false);
  const [scottishOnly, setScottishOnly] = useState(false);

  const filteredEvents = useMemo(
    () => scottishOnly ? events.filter((e) => e.is_scottish) : events,
    [events, scottishOnly],
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, EventData[]>();
    for (const ev of filteredEvents) {
      if (ev.recurring && ev.recurrence) {
        const days = getRecurringDaysForMonth(ev.recurrence, year, month);
        for (const day of days) {
          const list = map.get(day) || [];
          list.push(ev);
          map.set(day, list);
        }
      } else {
        for (let d = 1; d <= daysInMonth; d++) {
          const cellDate = new Date(year, month, d);
          if (dateInRange(cellDate, ev.date_start, ev.date_end)) {
            const list = map.get(d) || [];
            list.push(ev);
            map.set(d, list);
          }
        }
      }
    }
    return map;
  }, [filteredEvents, year, month, daysInMonth]);

  const gamesByDay = useMemo(() => {
    if (!showGames) return new Map<number, GameRelease[]>();
    const map = new Map<number, GameRelease[]>();
    for (const game of gameReleases) {
      if (!game.release_date) continue;
      const rd = parseDate(game.release_date);
      if (rd.getFullYear() === year && rd.getMonth() === month) {
        const list = map.get(rd.getDate()) || [];
        list.push(game);
        map.set(rd.getDate(), list);
      }
    }
    return map;
  }, [gameReleases, showGames, year, month]);

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm shadow-sm transition-colors hover:bg-accent"
            aria-label="Previous month"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h3 className="min-w-[10rem] text-center text-lg font-semibold">
            {MONTHS[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm shadow-sm transition-colors hover:bg-accent"
            aria-label="Next month"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button
            onClick={goToday}
            className="ml-2 h-8 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={scottishOnly}
              onChange={(e) => setScottishOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-muted-foreground">Scottish only</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showGames}
              onChange={(e) => setShowGames(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-muted-foreground">Show game releases</span>
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted">
          {DAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const isToday = day !== null && isSameDay(new Date(year, month, day), today);
            const dayEvents = day ? (eventsByDay.get(day) || []) : [];
            const dayGames = day ? (gamesByDay.get(day) || []) : [];

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[5rem] border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  day === null && "bg-muted/30",
                )}
              >
                {day !== null && (
                  <>
                    <span
                      className={cn(
                        "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday && "bg-primary text-primary-foreground",
                      )}
                    >
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <a
                          key={ev.id}
                          href={`/events/${ev.slug}`}
                          className={cn(
                            "block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight transition-colors",
                            ev.is_scottish
                              ? "bg-primary/15 text-primary hover:bg-primary/25"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                          )}
                          title={ev.name}
                        >
                          {ev.name}
                        </a>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="block px-1 text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                      {dayGames.slice(0, 2).map((game) => (
                        <a
                          key={game.id}
                          href={`/games/${game.slug}`}
                          className="block truncate rounded bg-highlight/15 px-1 py-0.5 text-[10px] font-medium leading-tight text-highlight transition-colors hover:bg-highlight/25"
                          title={game.title}
                        >
                          🎮 {game.title}
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/30" />
          Scottish event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-secondary" />
          International event
        </span>
        {showGames && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-highlight/30" />
            Game release
          </span>
        )}
      </div>
    </div>
  );
}
