"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  ListTodo,
  Plus,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  category: string;
  dueDate: string | null;
};

type Activity = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  priority: string;
  dayOfWeek: number;
  enabled: boolean;
};

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [tasksResponse, timetableResponse] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/timetable"),
        ]);

        if (tasksResponse.ok) {
          setTasks(await tasksResponse.json());
        }

        if (timetableResponse.ok) {
          setActivities(await timetableResponse.json());
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const today = new Date();

  const todayNumber = today.getDay();

  const todayActivities = useMemo(() => {
    return activities
      .filter(
        (activity) =>
          activity.enabled && activity.dayOfWeek === todayNumber
      )
      .sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
  }, [activities, todayNumber]);

  const todayTasks = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return tasks.filter((task) => {
      if (!task.dueDate) return false;

      const due = new Date(task.dueDate);

      return due >= start && due < end;
    });
  }, [tasks]);

  const incompleteTasks = tasks.filter(
    (task) => !task.completed
  );

  const completedTasks = tasks.filter(
    (task) => task.completed
  );

  const nextActivity = todayActivities.find(
    (activity) => activity.startTime >=
      `${String(today.getHours()).padStart(2, "0")}:${String(
        today.getMinutes()
      ).padStart(2, "0")}`
  );

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm text-slate-500">
            {today.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {getGreeting()}.
              </h1>

              <p className="mt-2 text-slate-400">
                Here's what's happening with your day.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/tasks"
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                <ListTodo size={17} />
                Tasks
              </Link>

              <Link
                href="/timetable"
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                <Plus size={17} />
                Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* Next Up */}
        <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} />
            Next up
          </div>

          {loading ? (
            <p className="text-slate-500">
              Loading your day...
            </p>
          ) : nextActivity ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  {nextActivity.title}
                </h2>

                <p className="mt-1 text-slate-500">
                  {formatTime(nextActivity.startTime)} —{" "}
                  {formatTime(nextActivity.endTime)}
                </p>
              </div>

              <span className="hidden rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400 sm:block">
                {nextActivity.category}
              </span>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold">
                Nothing scheduled
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your day is clear. Add something to your timetable.
              </p>

              <Link
                href="/timetable"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-slate-300"
              >
                Add activity
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </section>

        {/* Main Grid */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Tasks */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h2 className="font-semibold">
                  Today's tasks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {todayTasks.length} due today
                </p>
              </div>

              <Link
                href="/tasks"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <ArrowRight size={18} />
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="p-8 text-center">
                <Check
                  className="mx-auto mb-3 text-slate-600"
                  size={28}
                />

                <p className="font-medium">
                  Nothing due today
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  You're all clear.
                </p>
              </div>
            ) : (
              <div>
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 border-b border-slate-800 p-4 last:border-0"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        task.priority === "High"
                          ? "bg-red-400"
                          : task.priority === "Medium"
                          ? "bg-yellow-400"
                          : "bg-slate-500"
                      }`}
                    />

                    <span
                      className={
                        task.completed
                          ? "text-sm text-slate-600 line-through"
                          : "text-sm text-slate-300"
                      }
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Schedule */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h2 className="font-semibold">
                  Today's schedule
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {todayActivities.length} activities
                </p>
              </div>

              <Link
                href="/timetable"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <CalendarDays size={18} />
              </Link>
            </div>

            {todayActivities.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarDays
                  className="mx-auto mb-3 text-slate-600"
                  size={28}
                />

                <p className="font-medium">
                  Nothing planned
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your timetable is empty for today.
                </p>
              </div>
            ) : (
              <div>
                {todayActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 border-b border-slate-800 p-4 last:border-0"
                  >
                    <div className="w-20 shrink-0 text-xs text-slate-500">
                      {formatTime(activity.startTime)}
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {activity.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Overview */}
        <section className="mt-5 grid gap-5 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Total tasks
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tasks.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {incompleteTasks.length} remaining
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold">
              {completedTasks.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              tasks finished
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-500">
              Scheduled
            </p>

            <p className="mt-2 text-3xl font-bold">
              {todayActivities.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              activities today
            </p>
          </div>

        </section>

        {/* Future modules */}
        <section className="mt-5 rounded-2xl border border-dashed border-slate-800 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">
                LifeOS is just getting started.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Habits, workouts, diet, rules and progress will
                appear here as you build them.
              </p>
            </div>

            <span className="text-xs text-slate-600">
              2 modules active
            </span>
          </div>
        </section>

      </div>
    </main>
  );
}