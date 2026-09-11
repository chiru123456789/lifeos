"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  Clock3,
  Dumbbell,
  Flame,
  ListTodo,
  Loader2,
  Utensils,
  CalendarDays,
  ChevronRight,
  Play,
  Target,
} from "lucide-react";

type TimetableEntry = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  priority: string;
  dayOfWeek: number;
  enabled: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  category: string;
  completed: boolean;
};

type Habit = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  target: number;
  completed: number;
  done: boolean;
};

type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  category: string;
  equipment: string | null;
  order: number;
  sets: number;
  targetReps: string;
  restSeconds: number;
  notes: string | null;
};

type Workout = {
  programId?: string;
  programName?: string;
  dayId: string;
  dayNumber: number;
  name: string;
  notes: string | null;
  exercises: WorkoutExercise[];
};

type DietFood = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type DietMeal = {
  id: string;
  name: string;
  time: string | null;
  status: "completed" | "current" | "upcoming";
  foods: DietFood[];
};

type Diet = {
  id: string;
  name: string;
  description: string | null;
  meals: DietMeal[];
  targets: {
    id: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
};

type TodayData = {
  date: string;
  currentTime: string;
  dayOfWeek: number;

  currentActivity: TimetableEntry | null;
  nextActivity: TimetableEntry | null;

  timetable: TimetableEntry[];

  tasks: {
    items: Task[];
    total: number;
    completed: number;
    remaining: number;
  };

  habits: {
    items: Habit[];
    total: number;
    completed: number;
    remaining: number;
  };

  workout: Workout | null;
  diet: Diet | null;

  rules: unknown[];

  progress: {
    percentage: number;
    completed: number;
    total: number;
  };
};

const categoryStyles: Record<string, string> = {
  Study: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  Work: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  Workout: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  Personal: "bg-slate-500/10 text-slate-300 border-slate-500/20",
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function formatTime(time: string | null) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getPriorityClass(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "text-red-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-emerald-400";
    default:
      return "text-slate-400";
  }
}

export default function TodayPage() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  async function loadToday() {
    try {
      setError("");

      const response = await fetch("/api/today", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load today's data");
      }

      const result = await response.json();

      setData(result);
      setCurrentTime(result.currentTime);
    } catch (err) {
      console.error(err);
      setError("Couldn't load today's data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadToday();

    const interval = setInterval(() => {
      const now = new Date();

      setCurrentTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function toggleTask(task: Task) {
    if (!data) return;

    const previous = data;

    setData({
      ...data,
      tasks: {
        ...data.tasks,
        items: data.tasks.items.map((item) =>
          item.id === task.id
            ? {
                ...item,
                completed: !item.completed,
              }
            : item
        ),
        completed: data.tasks.completed + (task.completed ? -1 : 1),
        remaining: data.tasks.remaining + (task.completed ? 1 : -1),
      },
    });

    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: task.id,
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }
    } catch (err) {
      console.error(err);
      setData(previous);
    }
  }

  async function toggleHabit(habit: Habit) {
    if (!data) return;

    const previous = data;

    const newCompleted = habit.done
      ? Math.max(0, habit.completed - 1)
      : Math.min(habit.target, habit.completed + 1);

    const newDone = newCompleted >= habit.target;

    setData({
      ...data,
      habits: {
        ...data.habits,
        items: data.habits.items.map((item) =>
          item.id === habit.id
            ? {
                ...item,
                completed: newCompleted,
                done: newDone,
              }
            : item
        ),
        completed:
          data.habits.completed +
          (habit.done === newDone ? 0 : newDone ? 1 : -1),
        remaining:
          data.habits.remaining +
          (habit.done === newDone ? 0 : newDone ? -1 : 1),
      },
    });

    try {
      const response = await fetch("/api/habits/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: habit.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update habit");
      }
    } catch (err) {
      console.error(err);
      setData(previous);
    }
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreeting(hour);
  }, [currentTime]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-10">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p>Loading your day...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white lg:px-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="mb-4 text-red-300">{error}</p>

          <button
            onClick={loadToday}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {formatDate(data.date)}
              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {greeting}
              </h1>

              <p className="mt-2 text-slate-400">
                Here&apos;s what your day looks like.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
              <Clock3 className="h-5 w-5 text-slate-400" />

              <div>
                <p className="text-xs text-slate-500">Current time</p>
                <p className="text-lg font-medium">
                  {formatTime(currentTime)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* PROGRESS */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />

                <span className="text-sm font-medium text-slate-300">
                  Today&apos;s progress
                </span>
              </div>

              <p className="text-3xl font-semibold">
                {data.progress.percentage}%
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {data.progress.completed} of {data.progress.total} items
                completed
              </p>
            </div>

            <div className="w-full sm:max-w-md">
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>Daily completion</span>
                <span>{data.progress.percentage}%</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{
                    width: `${data.progress.percentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* NOW / NEXT */}
        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          {/* NOW */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-slate-400">
                  NOW
                </span>
              </div>

              {data.currentActivity && (
                <span className="text-xs text-slate-500">
                  {formatTime(data.currentActivity.startTime)} —{" "}
                  {formatTime(data.currentActivity.endTime)}
                </span>
              )}
            </div>

            {data.currentActivity ? (
              <div>
                <h2 className="text-2xl font-semibold">
                  {data.currentActivity.title}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      categoryStyles[data.currentActivity.category] ??
                      categoryStyles.Personal
                    }`}
                  >
                    {data.currentActivity.category}
                  </span>

                  <span
                    className={`text-xs ${getPriorityClass(
                      data.currentActivity.priority
                    )}`}
                  >
                    {data.currentActivity.priority} priority
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-slate-300">
                  Nothing scheduled
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  You have some free time right now.
                </p>
              </div>
            )}
          </div>

          {/* NEXT */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-slate-500" />

              <span className="text-sm font-medium text-slate-400">
                UP NEXT
              </span>
            </div>

            {data.nextActivity ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {data.nextActivity.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatTime(data.nextActivity.startTime)} —{" "}
                    {formatTime(data.nextActivity.endTime)}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 shrink-0 text-slate-600" />
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-slate-300">
                  Nothing else scheduled
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Your timetable is clear for the rest of the day.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* MAIN GRID */}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* TASKS */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-500/10 p-2.5">
                    <ListTodo className="h-5 w-5 text-blue-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Today&apos;s tasks</h2>

                    <p className="text-xs text-slate-500">
                      {data.tasks.completed} completed ·{" "}
                      {data.tasks.remaining} remaining
                    </p>
                  </div>
                </div>

                <a
                  href="/tasks"
                  className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-white"
                >
                  View all
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {data.tasks.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No tasks for today.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.tasks.items.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-transparent p-3 text-left transition hover:border-white/10 hover:bg-white/[0.03]"
                    >
                      {task.completed ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:text-slate-400" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            task.completed
                              ? "text-slate-500 line-through"
                              : "text-slate-200"
                          }`}
                        >
                          {task.title}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-slate-600">
                            {task.category}
                          </span>

                          <span
                            className={`text-xs ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* TIMETABLE */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Today&apos;s schedule</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Your timeline
                  </p>
                </div>

                <a
                  href="/timetable"
                  className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-white"
                >
                  Manage
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {data.timetable.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No timetable entries today.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {data.timetable.map((entry) => {
                    const isCurrent =
                      data.currentActivity?.id === entry.id;

                    return (
                      <div
                        key={entry.id}
                        className={`flex gap-4 rounded-2xl p-3 transition ${
                          isCurrent
                            ? "bg-emerald-500/5 ring-1 ring-emerald-500/10"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="w-20 shrink-0 pt-0.5 text-xs text-slate-500">
                          <div>{formatTime(entry.startTime)}</div>
                          <div className="mt-1 text-slate-700">↓</div>
                          <div>{formatTime(entry.endTime)}</div>
                        </div>

                        <div className="min-w-0 flex-1 border-l border-white/10 pl-4">
                          <div className="flex items-center gap-2">
                            {isCurrent && (
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            )}

                            <p className="truncate text-sm font-medium text-slate-200">
                              {entry.title}
                            </p>
                          </div>

                          <span
                            className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] ${
                              categoryStyles[entry.category] ??
                              categoryStyles.Personal
                            }`}
                          >
                            {entry.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* HABITS */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-500/10 p-2.5">
                    <Flame className="h-5 w-5 text-orange-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Habits</h2>
                    <p className="text-xs text-slate-500">
                      {data.habits.completed} of {data.habits.total} done
                    </p>
                  </div>
                </div>

                <a
                  href="/habits"
                  className="text-xs text-slate-500 transition hover:text-white"
                >
                  View
                </a>
              </div>

              {data.habits.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No active habits.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.habits.items.map((habit) => (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.03]"
                    >
                      {habit.done ? (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-400 text-slate-950">
                          <Check
                            className="h-3.5 w-3.5"
                            strokeWidth={3}
                          />
                        </span>
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-slate-600" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            habit.done
                              ? "text-slate-500 line-through"
                              : "text-slate-200"
                          }`}
                        >
                          {habit.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          {habit.completed}/{habit.target}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* WORKOUT */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-500/10 p-2.5">
                    <Dumbbell className="h-5 w-5 text-red-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Today&apos;s workout</h2>
                    <p className="text-xs text-slate-500">
                      {data.workout?.programName ?? "No workout"}
                    </p>
                  </div>
                </div>

                <a
                  href="/workout"
                  className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-white"
                >
                  Open
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {data.workout ? (
                <>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-xl font-semibold">
                        {data.workout.name}
                      </p>

                      {data.workout.notes && (
                        <p className="mt-1 text-xs text-slate-500">
                          {data.workout.notes}
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-slate-600">
                      {data.workout.exercises.length} exercises
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.workout.exercises
                      .slice(0, 4)
                      .map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between rounded-xl bg-white/[0.025] px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="text-xs text-slate-600">
                              {exercise.order + 1}
                            </span>

                            <span className="truncate text-sm text-slate-300">
                              {exercise.name}
                            </span>
                          </div>

                          <span className="shrink-0 text-xs text-slate-600">
                            {exercise.sets} × {exercise.targetReps}
                          </span>
                        </div>
                      ))}
                  </div>

                  {data.workout.exercises.length > 4 && (
                    <p className="mt-3 text-center text-xs text-slate-600">
                      +{data.workout.exercises.length - 4} more exercises
                    </p>
                  )}

                  <a
                    href="/workout"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Start workout
                  </a>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                  <p className="text-sm text-slate-500">
                    Rest day. Recover and get ready for tomorrow.
                  </p>
                </div>
              )}
            </section>

            {/* DIET */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5">
                    <Utensils className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Today&apos;s diet</h2>
                    <p className="text-xs text-slate-500">
                      {data.diet?.name ?? "No active diet"}
                    </p>
                  </div>
                </div>

                <a
                  href="/diet"
                  className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-white"
                >
                  Open
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {data.diet ? (
                <>
                  {data.diet.targets && (
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-white/[0.025] p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-600">
                          Calories
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {data.diet.targets.calories}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.025] p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-600">
                          Protein
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {data.diet.targets.protein}g
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.025] p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-600">
                          Carbs
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {data.diet.targets.carbs}g
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/[0.025] p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-600">
                          Fats
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {data.diet.targets.fats}g
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {data.diet.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-300">
                            {meal.name}
                          </p>

                          {meal.time && (
                            <span className="text-xs text-slate-600">
                              {formatTime(meal.time)}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                          {meal.foods
                            .map(
                              (food) =>
                                `${food.name} ${food.quantity}${food.unit}`
                            )
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                  <p className="text-sm text-slate-500">
                    No active diet plan.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 border-t border-white/5 pt-5 text-center">
          <p className="text-xs text-slate-700">
            LifeOS · Your personal operating system
          </p>
        </div>
      </div>
    </main>
  );
}