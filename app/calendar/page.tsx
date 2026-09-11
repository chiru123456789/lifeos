"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Dumbbell,
  Utensils,
  ListTodo,
  Repeat2,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type CalendarEvent = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  category?: string;
  priority?: string;
  completed?: boolean;
  progress?: number;
  target?: number;
};

type CalendarData = {
  date: string;
  dayOfWeek: number;

  summary: {
    progress: number;
    completed: number;
    total: number;

    tasks: {
      total: number;
      completed: number;
      remaining: number;
    };

    habits: {
      total: number;
      completed: number;
      remaining: number;
    };

    workout: {
      scheduled: boolean;
    };

    diet: {
      meals: number;
    };
  };

  events: CalendarEvent[];
};

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const previousMonthDays = new Date(
    year,
    month,
    0
  ).getDate();

  const days: {
    date: Date;
    currentMonth: boolean;
  }[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    days.push({
      date: new Date(
        year,
        month - 1,
        previousMonthDays - i
      ),
      currentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      currentMonth: true,
    });
  }

  while (days.length < 42) {
    const nextDay = days.length - firstWeekday - daysInMonth + 1;

    days.push({
      date: new Date(year, month + 1, nextDay),
      currentMonth: false,
    });
  }

  return days;
}

function monthName(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function typeStyles(type: string) {
  switch (type) {
    case "task":
      return {
        icon: ListTodo,
        dot: "bg-blue-400",
        bg: "bg-blue-500/10",
        text: "text-blue-300",
        border: "border-blue-500/20",
      };

    case "timetable":
      return {
        icon: Clock3,
        dot: "bg-cyan-400",
        bg: "bg-cyan-500/10",
        text: "text-cyan-300",
        border: "border-cyan-500/20",
      };

    case "habit":
      return {
        icon: Repeat2,
        dot: "bg-violet-400",
        bg: "bg-violet-500/10",
        text: "text-violet-300",
        border: "border-violet-500/20",
      };

    case "workout":
      return {
        icon: Dumbbell,
        dot: "bg-emerald-400",
        bg: "bg-emerald-500/10",
        text: "text-emerald-300",
        border: "border-emerald-500/20",
      };

    case "diet":
      return {
        icon: Utensils,
        dot: "bg-orange-400",
        bg: "bg-orange-500/10",
        text: "text-orange-300",
        border: "border-orange-500/20",
      };

    default:
      return {
        icon: CalendarDays,
        dot: "bg-blue-400",
        bg: "bg-blue-500/10",
        text: "text-blue-300",
        border: "border-blue-500/20",
      };
  }
}

export default function CalendarPage() {
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [data, setData] = useState<CalendarData | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const days = useMemo(
    () => getMonthDays(viewDate),
    [viewDate]
  );

  const selectedKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(today);

  async function loadCalendar(date: Date) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/calendar?date=${formatDateKey(date)}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load calendar");
      }

      const result = await response.json();

      setData(result);
    } catch (error) {
      console.error(error);
      setError("Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalendar(selectedDate);
  }, [selectedDate]);

  function selectDate(date: Date) {
    setSelectedDate(date);
  }

  function previousMonth() {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    );
  }

  function nextMonth() {
    setViewDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    );
  }

  function goToday() {
    const now = new Date();

    setViewDate(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );

    setSelectedDate(now);
  }

  const selectedEvents = data?.events ?? [];

  const groupedEvents = {
    timetable: selectedEvents.filter(
      (event) => event.type === "timetable"
    ),
    task: selectedEvents.filter(
      (event) => event.type === "task"
    ),
    habit: selectedEvents.filter(
      (event) => event.type === "habit"
    ),
    workout: selectedEvents.filter(
      (event) => event.type === "workout"
    ),
    diet: selectedEvents.filter(
      (event) => event.type === "diet"
    ),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050912] px-4 py-6 text-white sm:px-6 lg:px-10">
      {/* BLUE GLOW */}
      <div className="pointer-events-none absolute left-1/3 top-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              <CalendarDays size={14} />
              LifeOS
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Calendar
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Your entire life, organized by day.
            </p>
          </div>

          <button
            onClick={goToday}
            className="w-fit rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:border-blue-500/40 hover:bg-blue-500/15"
          >
            Today
          </button>
        </div>

        {/* CALENDAR + DAY PANEL */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          {/* CALENDAR */}
          <div className="rounded-3xl border border-blue-500/15 bg-[#0a101d]/95 p-4 shadow-[0_0_50px_rgba(37,99,235,0.04)] sm:p-6">
            {/* MONTH HEADER */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {monthName(viewDate)}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select a day to see your schedule
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={previousMonth}
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <ChevronLeft size={19} />
                </button>

                <button
                  onClick={nextMonth}
                  className="rounded-xl p-2.5 text-slate-400 transition hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <ChevronRight size={19} />
                </button>
              </div>
            </div>

            {/* WEEKDAYS */}
            <div className="mb-2 grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* DAYS */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map(({ date, currentMonth }, index) => {
                const key = formatDateKey(date);
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;

                return (
                  <button
                    key={`${key}-${index}`}
                    onClick={() => selectDate(date)}
                    className={`group relative flex min-h-[72px] flex-col rounded-xl border p-2 text-left transition sm:min-h-[88px] ${
                      isSelected
                        ? "border-blue-500/60 bg-blue-500/15 shadow-lg shadow-blue-500/10"
                        : currentMonth
                          ? "border-transparent bg-[#080e18] hover:border-blue-500/20 hover:bg-blue-500/[0.06]"
                          : "border-transparent bg-transparent opacity-25"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
                        isToday
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : isSelected
                            ? "text-blue-300"
                            : "text-slate-400"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* EVENT DOTS */}
                    {currentMonth && (
                      <div className="mt-auto flex flex-wrap gap-1">
                        {[
                          "bg-blue-400",
                          "bg-cyan-400",
                          "bg-violet-400",
                          "bg-emerald-400",
                          "bg-orange-400",
                        ].map((color, dotIndex) => (
                          <span
                            key={dotIndex}
                            className={`h-1.5 w-1.5 rounded-full ${color} opacity-0`}
                          />
                        ))}
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute bottom-2 left-2 right-2 h-0.5 rounded-full bg-blue-500/60" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* LEGEND */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/5 pt-4">
              {[
                ["bg-blue-400", "Tasks"],
                ["bg-cyan-400", "Schedule"],
                ["bg-violet-400", "Habits"],
                ["bg-emerald-400", "Workout"],
                ["bg-orange-400", "Diet"],
              ].map(([color, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-[11px] text-slate-500"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${color}`}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* SELECTED DAY */}
          <div className="rounded-3xl border border-blue-500/15 bg-[#0a101d]/95 p-5 shadow-[0_0_50px_rgba(37,99,235,0.04)] sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Selected day
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {selectedDate.toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                    }
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedDate.toLocaleDateString(
                    "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-400">
                <CalendarDays size={20} />
              </div>
            </div>

            {/* PROGRESS */}
            {data && (
              <div className="mb-6 rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Daily progress
                  </span>

                  <span className="text-sm font-bold text-blue-400">
                    {data.summary.progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${data.summary.progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[11px] text-slate-600">
                  {data.summary.completed} of{" "}
                  {data.summary.total} items completed
                </p>
              </div>
            )}

            {/* QUICK STATS */}
            {data && (
              <div className="mb-6 grid grid-cols-2 gap-2">
                <Stat
                  label="Tasks"
                  value={`${data.summary.tasks.completed}/${data.summary.tasks.total}`}
                  icon={ListTodo}
                />

                <Stat
                  label="Habits"
                  value={`${data.summary.habits.completed}/${data.summary.habits.total}`}
                  icon={Repeat2}
                />

                <Stat
                  label="Workout"
                  value={
                    data.summary.workout.scheduled
                      ? "Scheduled"
                      : "Rest"
                  }
                  icon={Dumbbell}
                />

                <Stat
                  label="Meals"
                  value={String(data.summary.diet.meals)}
                  icon={Utensils}
                />
              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2
                  size={24}
                  className="animate-spin text-blue-400"
                />
              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* EMPTY */}
            {!loading &&
              !error &&
              selectedEvents.length === 0 && (
                <div className="rounded-2xl border border-dashed border-blue-500/10 bg-blue-500/[0.02] px-5 py-10 text-center">
                  <CalendarDays
                    size={25}
                    className="mx-auto mb-3 text-slate-700"
                  />

                  <p className="text-sm text-slate-500">
                    Nothing scheduled for this day.
                  </p>

                  <p className="mt-1 text-xs text-slate-700">
                    Enjoy the free time.
                  </p>
                </div>
              )}

            {/* EVENTS */}
            {!loading &&
              !error &&
              selectedEvents.length > 0 && (
                <div className="space-y-5">
                  <EventGroup
                    title="Schedule"
                    events={groupedEvents.timetable}
                  />

                  <EventGroup
                    title="Tasks"
                    events={groupedEvents.task}
                  />

                  <EventGroup
                    title="Habits"
                    events={groupedEvents.habit}
                  />

                  <EventGroup
                    title="Workout"
                    events={groupedEvents.workout}
                  />

                  <EventGroup
                    title="Diet"
                    events={groupedEvents.diet}
                  />
                </div>
              )}
          </div>
        </div>

        {/* BOTTOM INFO */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard
            icon={ShieldCheck}
            title="One source of truth"
            text="Calendar pulls from your existing LifeOS modules."
          />

          <InfoCard
            icon={Clock3}
            title="See your day"
            text="Timetable and tasks stay visible alongside everything else."
          />

          <InfoCard
            icon={CheckCircle2}
            title="Track progress"
            text="Daily completion is summarized automatically."
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ListTodo;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#080e18] p-3">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon size={14} />
        <span className="text-[11px]">{label}</span>
      </div>

      <p className="text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function EventGroup({
  title,
  events,
}: {
  title: string;
  events: CalendarEvent[];
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <EventCard key={`${event.type}-${event.id}`} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventCard({
  event,
}: {
  event: CalendarEvent;
}) {
  const styles = typeStyles(event.type);
  const Icon = styles.icon;

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} p-3 transition hover:brightness-110`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg bg-black/10 p-2 ${styles.text}`}
        >
          <Icon size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={`text-sm font-medium ${
                  event.completed
                    ? "text-slate-500 line-through"
                    : "text-white"
                }`}
              >
                {event.title}
              </p>

              {event.description && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {event.description}
                </p>
              )}
            </div>

            {event.completed ? (
              <CheckCircle2
                size={15}
                className="shrink-0 text-emerald-400"
              />
            ) : (
              <Circle
                size={15}
                className="shrink-0 text-slate-700"
              />
            )}
          </div>

          {(event.startTime || event.endTime) && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock3 size={12} />

              {event.startTime}

              {event.endTime && ` — ${event.endTime}`}
            </div>
          )}

          {event.type === "habit" &&
            event.target !== undefined && (
              <div className="mt-2 text-[11px] text-violet-300/70">
                Progress: {event.progress ?? 0}/
                {event.target}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-500/10 bg-[#080e18] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        <Icon size={17} />
      </div>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}