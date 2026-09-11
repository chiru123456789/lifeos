"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flame,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

type ProgressData = {
  period: {
    days: number;
    start: string;
    end: string;
  };
  overview: {
    progress: number;
    tasks: {
      total: number;
      completed: number;
      remaining: number;
    };
    habits: {
      checkins: number;
      active: number;
    };
    workouts: {
      sessions: number;
      completedSets: number;
      plannedSets: number;
      completion: number;
    };
    streak: number;
  };
  daily: {
    date: string;
    day: string;
    percentage: number;
    tasks: {
      total: number;
      completed: number;
    };
    habits: {
      total: number;
      completed: number;
    };
    workout: {
      sessions: number;
      completedSets: number;
      plannedSets: number;
      percentage: number;
    };
    timetable: {
      scheduled: number;
    };
  }[];
  habits: {
    id: string;
    name: string;
    target: number;
    successfulDays: number;
    consistency: number;
  }[];
  workouts: {
    id: string;
    date: string;
    workout: string;
    durationMin: number | null;
    completedSets: number;
    plannedSets: number;
    totalSets: number;
    percentage: number;
  }[];
  highlights: {
    bestDay: ProgressData["daily"][number] | null;
    weakestDay: ProgressData["daily"][number] | null;
  };
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    }
  );
}

function getShortDate(date: string) {
  return new Date(`${date}T00:00:00`).getDate();
}

function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-slate-800 ${className}`}
    >
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>
      </div>

      <p className="text-sm text-slate-400">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function ProgressPage() {
  const [days, setDays] = useState<7 | 30>(7);
  const [data, setData] =
    useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProgress(selectedDays: 7 | 30) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/progress?days=${selectedDays}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load progress"
        );
      }

      const result = await response.json();

      setData(result);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load progress right now."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgress(days);
  }, [days]);

  const chartDays = useMemo(() => {
    if (!data) return [];

    if (days === 7) {
      return data.daily;
    }

    // For 30 days, keep all days but make
    // the chart visually compact.
    return data.daily;
  }, [data, days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-10 w-48 rounded-lg bg-slate-800" />
          <div className="mt-3 h-5 w-72 rounded bg-slate-900" />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-36 rounded-2xl bg-slate-900"
                />
              )
            )}
          </div>

          <div className="mt-6 h-80 rounded-2xl bg-slate-900" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-semibold">
            Progress
          </h1>

          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-red-300">
              {error || "No progress data available."}
            </p>

            <button
              onClick={() => loadProgress(days)}
              className="mt-4 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bestDay = data.highlights.bestDay;
  const weakestDay = data.highlights.weakestDay;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <TrendingUp className="h-4 w-4" />
              Personal analytics
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Progress
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              See how consistently you are showing up.
            </p>
          </div>

          {/* RANGE SWITCH */}
          <div className="flex w-fit rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
              onClick={() => setDays(7)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                days === 7
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              7D
            </button>

            <button
              onClick={() => setDays(30)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                days === 30
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              30D
            </button>
          </div>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Overall progress"
            value={`${data.overview.progress}%`}
            description={`${days}-day average`}
          />

          <StatCard
            icon={<Flame className="h-5 w-5" />}
            label="Current streak"
            value={`${data.overview.streak} ${
              data.overview.streak === 1
                ? "day"
                : "days"
            }`}
            description="50%+ progress per day"
          />

          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Tasks"
            value={`${data.overview.tasks.completed}/${data.overview.tasks.total}`}
            description={`${data.overview.tasks.remaining} remaining`}
          />

          <StatCard
            icon={<Dumbbell className="h-5 w-5" />}
            label="Workout"
            value={`${data.overview.workouts.completion}%`}
            description={`${data.overview.workouts.completedSets}/${data.overview.workouts.plannedSets} sets`}
          />
        </div>

        {/* MAIN PROGRESS + HIGHLIGHTS */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          {/* CHART */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Daily progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your completion level each day
                </p>
              </div>

              <Activity className="h-5 w-5 text-slate-600" />
            </div>

            <div className="mt-8">
              {days === 7 ? (
                <div className="flex h-56 items-end gap-3 sm:gap-5">
                  {chartDays.map((day) => (
                    <div
                      key={day.date}
                      className="flex min-w-0 flex-1 flex-col items-center gap-3"
                    >
                      <span className="text-xs font-medium text-slate-400">
                        {day.percentage}%
                      </span>

                      <div className="relative flex h-40 w-full items-end justify-center">
                        <div
                          className="w-full max-w-10 rounded-t-xl bg-blue-500/80 transition-all duration-500 hover:bg-blue-400"
                          style={{
                            height: `${Math.max(
                              day.percentage,
                              4
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs text-slate-500">
                        {day.day}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex h-56 items-end gap-[3px]">
                    {chartDays.map((day) => (
                      <div
                        key={day.date}
                        title={`${formatDate(
                          day.date
                        )}: ${day.percentage}%`}
                        className="group flex h-full min-w-0 flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-sm bg-blue-500/70 transition-all group-hover:bg-blue-400"
                          style={{
                            height: `${Math.max(
                              day.percentage,
                              2
                            )}%`,
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between text-[10px] text-slate-600">
                    {chartDays
                      .filter(
                        (_, index) =>
                          index === 0 ||
                          index ===
                            chartDays.length - 1 ||
                          index % 5 === 0
                      )
                      .map((day) => (
                        <span key={day.date}>
                          {getShortDate(day.date)}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* HIGHLIGHTS */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
            <h2 className="text-lg font-semibold">
              Highlights
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your strongest and weakest days
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <Trophy className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Best day
                    </p>

                    <p className="font-medium text-white">
                      {bestDay
                        ? formatDate(bestDay.date)
                        : "No completed days"}
                    </p>
                  </div>

                  {bestDay && (
                    <span className="ml-auto text-lg font-semibold text-amber-400">
                      {bestDay.percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Award className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Needs attention
                    </p>

                    <p className="font-medium text-white">
                      {weakestDay
                        ? formatDate(
                            weakestDay.date
                          )
                        : "No data"}
                    </p>
                  </div>

                  {weakestDay && (
                    <span className="ml-auto text-lg font-semibold text-blue-400">
                      {weakestDay.percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4">
                <p className="text-sm leading-6 text-slate-400">
                  Progress is calculated from the
                  modules that currently have
                  completion tracking: tasks, habits,
                  and workouts.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* TASK / HABIT / WORKOUT BREAKDOWN */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* TASKS */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Tasks
                </h2>
                <p className="text-xs text-slate-500">
                  Completion
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <span className="text-3xl font-bold">
                {data.overview.tasks.total > 0
                  ? Math.round(
                      (data.overview.tasks.completed /
                        data.overview.tasks.total) *
                        100
                    )
                  : 0}
                %
              </span>

              <span className="text-sm text-slate-500">
                {data.overview.tasks.completed} completed
              </span>
            </div>

            <ProgressBar
              value={
                data.overview.tasks.total > 0
                  ? (data.overview.tasks.completed /
                      data.overview.tasks.total) *
                    100
                  : 0
              }
              className="mt-4"
            />
          </section>

          {/* HABITS */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Flame className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Habits
                </h2>
                <p className="text-xs text-slate-500">
                  Active habits
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <span className="text-3xl font-bold">
                {data.overview.habits.active}
              </span>

              <span className="text-sm text-slate-500">
                {data.overview.habits.checkins} check-ins
              </span>
            </div>

            <ProgressBar
              value={
                data.overview.habits.active > 0
                  ? Math.min(
                      100,
                      (data.overview.habits.checkins /
                        (data.overview.habits.active *
                          days)) *
                        100
                    )
                  : 0
              }
              className="mt-4"
            />
          </section>

          {/* WORKOUT */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Dumbbell className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Workouts
                </h2>
                <p className="text-xs text-slate-500">
                  Set completion
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between">
              <span className="text-3xl font-bold">
                {data.overview.workouts.completion}%
              </span>

              <span className="text-sm text-slate-500">
                {data.overview.workouts.sessions} sessions
              </span>
            </div>

            <ProgressBar
              value={
                data.overview.workouts.completion
              }
              className="mt-4"
            />
          </section>
        </div>

        {/* HABIT PERFORMANCE */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Habit performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consistency across your habits
              </p>
            </div>

            <Flame className="h-5 w-5 text-slate-600" />
          </div>

          {data.habits.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-sm text-slate-500">
                No active habits yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {data.habits.map((habit) => (
                <div key={habit.id}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {habit.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {habit.successfulDays} successful days
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-blue-400">
                      {habit.consistency}%
                    </span>
                  </div>

                  <ProgressBar
                    value={habit.consistency}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* WORKOUT HISTORY */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Workout history
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your logged training sessions
              </p>
            </div>

            <CalendarDays className="h-5 w-5 text-slate-600" />
          </div>

          {data.workouts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <Dumbbell className="mx-auto h-8 w-8 text-slate-700" />

              <p className="mt-3 text-sm text-slate-500">
                No workout sessions in this period.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[1.2fr_1fr_1fr_100px] gap-4 border-b border-slate-800 px-3 pb-3 text-xs font-medium uppercase tracking-wide text-slate-600">
                  <span>Date</span>
                  <span>Workout</span>
                  <span>Sets</span>
                  <span className="text-right">
                    Progress
                  </span>
                </div>

                <div className="divide-y divide-slate-800/70">
                  {data.workouts
                    .slice()
                    .reverse()
                    .map((workout) => (
                      <div
                        key={workout.id}
                        className="grid grid-cols-[1.2fr_1fr_1fr_100px] items-center gap-4 px-3 py-4"
                      >
                        <span className="text-sm text-slate-400">
                          {formatDate(
                            workout.date
                          )}
                        </span>

                        <span className="text-sm font-medium text-white">
                          {workout.workout}
                        </span>

                        <span className="text-sm text-slate-400">
                          {workout.completedSets}/
                          {workout.plannedSets}
                        </span>

                        <div className="text-right">
                          <span className="text-sm font-semibold text-blue-400">
                            {workout.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* DATA NOTE */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex gap-3">
            <div className="mt-0.5">
              <ChevronDown className="h-4 w-4 rotate-[-90deg] text-slate-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300">
                Progress tracking
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                LifeOS currently tracks completion
                history for tasks, habits, and
                workouts. Diet and timetable are
                currently shown as planning data and
                will be included in adherence analytics
                once completion tracking is added.
              </p>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}