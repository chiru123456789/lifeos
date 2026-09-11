"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Circle,
  Filter,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  category: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type FilterType = "All" | "Today" | "Upcoming" | "Completed";

const emptyForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  category: "Personal",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");

  const [form, setForm] = useState(emptyForm);

  async function loadTasks() {
    try {
      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function resetForm() {
    setForm(emptyForm);
  }

  function closeModal() {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  }

  async function addTask() {
    if (!form.title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await response.json();

      setTasks((current) => [newTask, ...current]);

      closeModal();
    } catch (error) {
      console.error(error);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);

    setForm({
      title: task.title,
      description: task.description ?? "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
      priority: task.priority,
      category: task.category,
    });
  }

  async function saveEdit() {
    if (!editingId || !form.title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
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
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks((current) =>
        current.map((task) =>
          task.id === editingId ? updatedTask : task
        )
      );

      closeModal();
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleTask(task: Task) {
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

      const updatedTask = await response.json();

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? updatedTask : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteTask(id: string) {
    try {
      const response = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );
    } catch (error) {
      console.error(error);
    }
  }

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (filter === "All") {
        return true;
      }

      if (filter === "Completed") {
        return task.completed;
      }

      if (!task.dueDate) {
        return false;
      }

      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      if (filter === "Today") {
        return due.getTime() === today.getTime();
      }

      if (filter === "Upcoming") {
        return due.getTime() > today.getTime();
      }

      return true;
    });
  }, [tasks, filter]);

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-slate-500">
              Stay focused. Keep moving.
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Tasks
            </h1>

            <p className="mt-2 text-slate-400">
              {tasks.length} tasks · {completedCount} completed
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
            <span className="hidden sm:inline">
              Add task
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="mr-1 flex items-center gap-2 text-sm text-slate-500">
            <Filter size={16} />
            Filter
          </div>

          {(["All", "Today", "Upcoming", "Completed"] as FilterType[]).map(
            (item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  filter === item
                    ? "bg-white text-slate-950"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        {/* Tasks */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading tasks...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <Check
                className="mx-auto mb-4 text-slate-600"
                size={32}
              />

              <h2 className="font-semibold">
                No tasks here
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add something you want to get done.
              </p>
            </div>
          ) : (
            <div>
              {filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`group flex items-start gap-4 p-4 transition hover:bg-slate-950 ${
                    index !== filteredTasks.length - 1
                      ? "border-b border-slate-800"
                      : ""
                  }`}
                >
                  {/* Complete */}
                  <button
                    onClick={() => toggleTask(task)}
                    className="mt-0.5 shrink-0 text-slate-500 transition hover:text-white"
                  >
                    {task.completed ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-950">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className={`font-medium ${
                          task.completed
                            ? "text-slate-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </h2>

                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                        {task.category}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          task.priority === "High"
                            ? "bg-red-500/10 text-red-400"
                            : task.priority === "Medium"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {task.description}
                      </p>
                    )}

                    {task.dueDate && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar size={13} />

                        {new Date(
                          task.dueDate
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(task)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(isAdding || editingId !== null) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingId
                      ? "Edit task"
                      : "Add task"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    What needs to get done?
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

                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Task
                  </label>

                  <input
                    autoFocus
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Finish electronics assignment"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-slate-600"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional details..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-slate-600"
                  />
                </div>

                {/* Due date */}
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Due date
                  </label>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-slate-600"
                  />
                </div>

                {/* Category */}
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
                    <option>Personal</option>
                    <option>Study</option>
                    <option>Work</option>
                    <option>Project</option>
                    <option>Fitness</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value,
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

              {/* Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-800 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    editingId
                      ? saveEdit
                      : addTask
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                >
                  <Check size={17} />

                  {editingId
                    ? "Save changes"
                    : "Add task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}