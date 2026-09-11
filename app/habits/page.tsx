"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Flame,
  MoreVertical,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";

type Completion = {
  id: string;
  date: string;
  count: number;
};

type Habit = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  target: number;
  enabled: boolean;
  completions: Completion[];
};

type HabitForm = {
  name: string;
  description: string;
  frequency: string;
  target: number;
};

const emptyForm: HabitForm = {
  name: "",
  description: "",
  frequency: "Daily",
  target: 1,
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getTodayKey() {
  return dateKey(new Date());
}

function getLastDays(count: number) {
  const days: Date[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push(date);
  }

  return days;
}

function calculateStreak(completions: Completion[]) {
  const completedDates = new Set(
    completions.map((completion) => dateKey(new Date(completion.date)))
  );

  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  while (completedDates.has(dateKey(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitForm>(emptyForm);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const days = useMemo(() => getLastDays(14), []);

  async function loadHabits() {
    try {
      setLoading(true);

      const response = await fetch("/api/habits");

      if (!response.ok) {
        throw new Error("Failed to load habits");
      }

      const data = await response.json();
      setHabits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHabits();
  }, []);

  function openAddModal() {
    setEditingHabit(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(habit: Habit) {
    setEditingHabit(habit);

    setForm({
      name: habit.name,
      description: habit.description ?? "",
      frequency: habit.frequency,
      target: habit.target,
    });

    setOpenMenu(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingHabit(null);
    setForm(emptyForm);
  }

  async function saveHabit() {
    if (!form.name.trim()) return;

    try {
      setSaving(true);

      const response = await fetch("/api/habits", {
        method: editingHabit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingHabit
            ? {
                id: editingHabit.id,
                ...form,
                target: Number(form.target),
              }
            : {
                ...form,
                target: Number(form.target),
              }
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to save habit");
      }

      await loadHabits();
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Failed to save habit.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHabit(id: string) {
    const confirmed = window.confirm(
      "Delete this habit? Its completion history will also be deleted."
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/habits", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete habit");
      }

      setHabits((current) => current.filter((habit) => habit.id !== id));
      setOpenMenu(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete habit.");
    }
  }

  async function toggleCheckIn(habit: Habit) {
    if (checkingIn) return;

    try {
      setCheckingIn(habit.id);

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
        throw new Error("Failed to update check-in");
      }

      await loadHabits();
    } catch (error) {
      console.error(error);
      alert("Failed to update habit.");
    } finally {
      setCheckingIn(null);
    }
  }

  function isCompletedOn(habit: Habit, date: Date) {
    const key = dateKey(date);

    return habit.completions.some(
      (completion) => dateKey(new Date(completion.date)) === key
    );
  }

  const todayKey = getTodayKey();

  const totalCompletedToday = habits.filter((habit) =>
    isCompletedOn(habit, new Date())
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-400">
              Consistency compounds.
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Habits
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Build routines that make your goals automatic.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            <Plus size={18} />
            Add habit
          </button>
        </div>

        {/* Overview */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-400">
              <Target size={18} />
              <span className="text-sm">Active habits</span>
            </div>

            <p className="text-3xl font-bold">{habits.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-400">
              <Check size={18} />
              <span className="text-sm">Completed today</span>
            </div>

            <p className="text-3xl font-bold">
              {totalCompletedToday}
              <span className="ml-2 text-base font-normal text-slate-500">
                / {habits.length}
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center gap-2 text-slate-400">
              <Flame size={18} />
              <span className="text-sm">Best streak</span>
            </div>

            <p className="text-3xl font-bold">
              {habits.length
                ? Math.max(...habits.map((habit) => calculateStreak(habit.completions)))
                : 0}
              <span className="ml-2 text-base font-normal text-slate-500">
                days
              </span>
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
            Loading habits...
          </div>
        ) : habits.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
              <Target size={24} className="text-slate-300" />
            </div>

            <h2 className="text-xl font-semibold">No habits yet</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Start with one simple habit. You can build the system from
              there.
            </p>

            <button
              onClick={openAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
            >
              <Plus size={18} />
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const streak = calculateStreak(habit.completions);
              const completedToday = isCompletedOn(habit, new Date());

              const recentCompletions = days.filter((day) =>
                isCompletedOn(habit, day)
              ).length;

              const completionRate = Math.round(
                (recentCompletions / days.length) * 100
              );

              return (
                <div
                  key={habit.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="truncate text-lg font-semibold">
                            {habit.name}
                          </h2>

                          <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                            {habit.frequency}
                          </span>
                        </div>

                        {habit.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {habit.description}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenu(
                              openMenu === habit.id ? null : habit.id
                            )
                          }
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {openMenu === habit.id && (
                          <div className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl">
                            <button
                              onClick={() => openEditModal(habit)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              onClick={() => deleteHabit(habit.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-800"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          Streak
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <Flame size={18} />
                          <span className="text-xl font-bold">{streak}</span>
                          <span className="text-sm text-slate-500">
                            days
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          14 day rate
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {completionRate}%
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          Target
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {habit.target}
                        </p>
                      </div>
                    </div>

                    {/* History */}
                    <div className="mt-6 overflow-x-auto">
                      <div className="flex min-w-max gap-2">
                        {days.map((day) => {
                          const completed = isCompletedOn(habit, day);
                          const isToday = dateKey(day) === todayKey;

                          return (
                            <div
                              key={dateKey(day)}
                              className="flex w-9 flex-col items-center gap-2"
                            >
                              <span
                                className={`text-[10px] ${
                                  isToday
                                    ? "font-bold text-white"
                                    : "text-slate-600"
                                }`}
                              >
                                {day.toLocaleDateString("en-US", {
                                  weekday: "short",
                                })[0]}
                              </span>

                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                                  completed
                                    ? "border-white bg-white text-slate-950"
                                    : "border-slate-800 bg-slate-950 text-slate-700"
                                }`}
                              >
                                {completed && <Check size={15} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        {completedToday
                          ? "Completed today. Keep the streak alive."
                          : "Not completed today yet."}
                      </p>

                      <button
                        onClick={() => toggleCheckIn(habit)}
                        disabled={checkingIn === habit.id}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                          completedToday
                            ? "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                            : "bg-white text-slate-950 hover:bg-slate-200"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <Check size={17} />

                        {checkingIn === habit.id
                          ? "Updating..."
                          : completedToday
                          ? "Completed"
                          : "Complete today"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingHabit ? "Edit habit" : "Create habit"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Make it simple enough to repeat.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Habit name
                </label>

                <input
                  autoFocus
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Study electronics"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-slate-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Frequency
                  </label>

                  <select
                    value={form.frequency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        frequency: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Weekdays</option>
                    <option>Weekends</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Daily target
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={form.target}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target: Math.max(1, Number(event.target.value)),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={saveHabit}
                disabled={saving || !form.name.trim()}
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingHabit
                  ? "Save changes"
                  : "Create habit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}