"use client";
"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Activity = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  dayOfWeek: number;
  enabled: boolean;
};

export default function TimetablePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    start: "09:00",
    end: "10:00",
    category: "Study",
    priority: "Medium" as Activity["priority"],
  });

  useEffect(() => {
    async function loadActivities() {
      try {
        const response = await fetch("/api/timetable");

        if (!response.ok) {
          throw new Error("Failed to load timetable");
        }

        const data: Activity[] = await response.json();
        setActivities(data);
      } catch (error) {
        console.error("Failed to load activities:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadActivities();
  }, []);

  function resetForm() {
    setForm({
      title: "",
      start: "09:00",
      end: "10:00",
      category: "Study",
      priority: "Medium",
    });
  }

  async function addActivity() {
    if (!form.title.trim()) return;

    try {
      const response = await fetch("/api/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          dayOfWeek: new Date().getDay(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create activity");
      }

      const newActivity: Activity = await response.json();

      setActivities((current) => [...current, newActivity]);
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Failed to add activity:", error);
    }
  }

  function startEdit(activity: Activity) {
    setEditingId(activity.id);

    setForm({
      title: activity.title,
      start: activity.startTime,
      end: activity.endTime,
      category: activity.category,
      priority: activity.priority,
    });
  }

  async function saveEdit() {
    if (!editingId || !form.title.trim()) return;

    try {
      const response = await fetch("/api/timetable", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          ...form,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update activity");
      }

      const updatedActivity: Activity = await response.json();

      setActivities((current) =>
        current.map((activity) =>
          activity.id === editingId ? updatedActivity : activity
        )
      );

      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  }

  async function deleteActivity(id: string) {
    try {
      const response = await fetch("/api/timetable", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete activity");
      }

      setActivities((current) =>
        current.filter((activity) => activity.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete activity:", error);
    }
  }

  function closeModal() {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              <CalendarDays size={18} />
              <span className="text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Timetable
            </h1>

            <p className="mt-2 text-slate-400">
              Plan your day. Control your time.
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add activity</span>
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
            <CalendarDays size={18} />
          </div>

          <div>
            <p className="font-medium">Today</p>
            <p className="text-sm text-slate-500">
              {activities.length} scheduled{" "}
              {activities.length === 1 ? "activity" : "activities"}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {isLoading ? (
            <div className="p-12 text-center">
              <Clock
                className="mx-auto mb-4 animate-pulse text-slate-600"
                size={32}
              />

              <h2 className="font-semibold">
                Loading timetable...
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Getting your schedule.
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center">
              <Clock
                className="mx-auto mb-4 text-slate-600"
                size={32}
              />

              <h2 className="font-semibold">
                Nothing scheduled
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add your first activity.
              </p>
            </div>
          ) : (
            <div>
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`group flex items-center gap-4 p-4 transition hover:bg-slate-950 ${
                    index !== activities.length - 1
                      ? "border-b border-slate-800"
                      : ""
                  }`}
                >
                  <div className="w-20 shrink-0 text-sm text-slate-500 sm:w-24">
                    {activity.startTime}
                  </div>

                  <div className="relative flex flex-1 items-center gap-4">
                    <div className="h-3 w-3 shrink-0 rounded-full border-2 border-slate-500 bg-slate-950" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium">
                          {activity.title}
                        </h2>

                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                          {activity.category}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            activity.priority === "High"
                              ? "bg-red-500/10 text-red-400"
                              : activity.priority === "Medium"
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {activity.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {activity.startTime} — {activity.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(activity)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-800 sm:block">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(isAdding || editingId !== null) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingId !== null
                      ? "Edit activity"
                      : "Add activity"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure your schedule.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Activity
                  </label>

                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Study Electronics"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm text-slate-400">
                      Start
                    </label>

                    <input
                      type="time"
                      value={form.start}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          start: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-400">
                      End
                    </label>

                    <input
                      type="time"
                      value={form.end}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          end: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-600"
                  >
                    <option>Study</option>
                    <option>Learning</option>
                    <option>Work</option>
                    <option>Fitness</option>
                    <option>Personal</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as Activity["priority"],
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-600"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-800 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    editingId !== null
                      ? saveEdit
                      : addActivity
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                >
                  <Check size={17} />

                  {editingId !== null
                    ? "Save changes"
                    : "Add activity"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}