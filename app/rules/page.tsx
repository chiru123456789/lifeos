"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Ban,
  AlertTriangle,
  Loader2,
} from "lucide-react";

type Rule = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const sections = [
  {
    type: "MUST_DO",
    title: "Must Do",
    description: "Things you must get done.",
    icon: ShieldCheck,
  },
  {
    type: "DONT_DO",
    title: "Don't Do",
    description: "Behaviors you want to avoid.",
    icon: Ban,
  },
  {
    type: "RESTRICTION",
    title: "Restrictions",
    description: "Boundaries and limits for your day.",
    icon: AlertTriangle,
  },
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("MUST_DO");
  const [priority, setPriority] = useState("Medium");

  async function loadRules() {
    try {
      setLoading(true);
      const response = await fetch("/api/rules");

      if (!response.ok) {
        throw new Error("Failed to load rules");
      }

      setRules(await response.json());
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to load rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setType("MUST_DO");
    setPriority("Medium");
    setError("");
  }

  function editRule(rule: Rule) {
    setEditingId(rule.id);
    setTitle(rule.title);
    setDescription(rule.description ?? "");
    setType(rule.type);
    setPriority(rule.priority);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveRule() {
    if (!title.trim()) {
      setError("Enter a rule title.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/rules", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          title: title.trim(),
          description: description.trim() || null,
          type,
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save rule");
      }

      await loadRules();
      resetForm();
    } catch (error) {
      console.error(error);
      setError("Failed to save rule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(rule: Rule) {
    try {
      const response = await fetch("/api/rules", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: rule.id,
          enabled: !rule.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update rule");
      }

      setRules((current) =>
        current.map((item) =>
          item.id === rule.id
            ? { ...item, enabled: !item.enabled }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      setError("Failed to update rule.");
    }
  }

  async function deleteRule(id: string) {
    if (!window.confirm("Delete this rule?")) {
      return;
    }

    try {
      const response = await fetch("/api/rules", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete rule");
      }

      setRules((current) =>
        current.filter((rule) => rule.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      setError("Failed to delete rule.");
    }
  }

  function priorityStyle(priority: string) {
    if (priority === "High") {
      return "border-red-400/20 bg-red-400/10 text-red-300";
    }

    if (priority === "Low") {
      return "border-white/10 bg-white/5 text-white/40";
    }

    return "border-blue-400/20 bg-blue-400/10 text-blue-300";
  }

  function renderRule(rule: Rule) {
    const section = sections.find(
      (item) => item.type === rule.type
    );

    const Icon = section?.icon ?? ShieldCheck;

    return (
      <div
        key={rule.id}
        className={`rounded-2xl border p-4 transition-all ${
          rule.enabled
            ? "border-blue-500/20 bg-[#0b1220] hover:border-blue-500/40 hover:bg-[#0d1628]"
            : "border-white/5 bg-[#090d15] opacity-50"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-xl p-2.5 ${
              rule.enabled
                ? "bg-blue-500/10 text-blue-400"
                : "bg-white/5 text-white/30"
            }`}
          >
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">
                {rule.title}
              </h3>

              <span
                className={`rounded-full border px-2 py-1 text-[10px] font-medium ${priorityStyle(
                  rule.priority
                )}`}
              >
                {rule.priority}
              </span>

              {!rule.enabled && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/30">
                  Disabled
                </span>
              )}
            </div>

            {rule.description && (
              <p className="mt-1.5 text-sm leading-6 text-slate-400">
                {rule.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => toggleRule(rule)}
              className={`rounded-lg p-2 transition ${
                rule.enabled
                  ? "text-blue-400 hover:bg-blue-500/10"
                  : "text-white/30 hover:bg-white/10 hover:text-white"
              }`}
              title={rule.enabled ? "Disable" : "Enable"}
            >
              {rule.enabled ? (
                <Check size={16} />
              ) : (
                <X size={16} />
              )}
            </button>

            <button
              onClick={() => editRule(rule)}
              className="rounded-lg p-2 text-white/35 transition hover:bg-blue-500/10 hover:text-blue-400"
              title="Edit"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => deleteRule(rule.id)}
              className="rounded-lg p-2 text-white/35 transition hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeRules = rules.filter(
    (rule) => rule.enabled
  ).length;

  return (
    <div className="min-h-screen bg-[#050912] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            <ShieldCheck size={14} />
            LifeOS
          </div>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Rules
              </h1>

              <p className="mt-2 max-w-xl text-sm text-slate-400">
                Define the standards and boundaries that keep your day on track.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] px-5 py-3">
              <p className="text-xs text-slate-400">
                Active rules
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-400">
                {activeRules}
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="mb-10 rounded-3xl border border-blue-500/15 bg-[#0a101d] p-5 shadow-[0_0_40px_rgba(37,99,235,0.05)] sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">
                {editingId ? "Edit rule" : "Create a rule"}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Add something you want LifeOS to remember.
              </p>
            </div>

            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rule title..."
              className="w-full rounded-xl border border-blue-500/15 bg-[#060b14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={3}
              className="w-full resize-none rounded-xl border border-blue-500/15 bg-[#060b14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-xl border border-blue-500/15 bg-[#060b14] px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
              >
                <option value="MUST_DO">Must Do</option>
                <option value="DONT_DO">Don't Do</option>
                <option value="RESTRICTION">Restriction</option>
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="rounded-xl border border-blue-500/15 bg-[#060b14] px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button
              onClick={saveRule}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : editingId ? (
                <Check size={17} />
              ) : (
                <Plus size={17} />
              )}

              {editingId ? "Save changes" : "Add rule"}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* RULE SECTIONS */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2
              size={25}
              className="animate-spin text-blue-400"
            />
          </div>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => {
              const Icon = section.icon;

              const sectionRules = rules.filter(
                (rule) => rule.type === section.type
              );

              return (
                <section key={section.type}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl border border-blue-500/15 bg-blue-500/10 p-2.5 text-blue-400">
                      <Icon size={18} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-white">
                        {section.title}
                      </h2>

                      <p className="text-xs text-slate-500">
                        {section.description}
                      </p>
                    </div>

                    <span className="ml-auto rounded-full border border-blue-500/15 bg-blue-500/5 px-2.5 py-1 text-xs text-blue-400">
                      {sectionRules.length}
                    </span>
                  </div>

                  {sectionRules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-blue-500/10 bg-blue-500/[0.02] p-7 text-center text-sm text-slate-600">
                      No rules here yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sectionRules.map(renderRule)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}