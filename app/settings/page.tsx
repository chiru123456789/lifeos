"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  Database,
  Dumbbell,
  Moon,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Shield,
  Sun,
  Target,
  User,
} from "lucide-react";

type SettingsState = {
  name: string;
  dayStart: string;
  dayEnd: string;
  reminderEnabled: boolean;
  reminderMinutes: string;
  progressThreshold: string;
  workoutRest: string;
  theme: "dark" | "system";
};

const DEFAULT_SETTINGS: SettingsState = {
  name: "Chiranth",
  dayStart: "08:00",
  dayEnd: "23:00",
  reminderEnabled: true,
  reminderMinutes: "10",
  progressThreshold: "50",
  workoutRest: "90",
  theme: "dark",
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<SettingsState>(DEFAULT_SETTINGS);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "lifeos-settings"
      );

      if (stored) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(stored),
        });
      }
    } catch (error) {
      console.error(
        "Failed to load settings",
        error
      );
    }
  }, []);

  function updateSetting<K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }

  function saveSettings() {
    localStorage.setItem(
      "lifeos-settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function resetSettings() {
    const confirmed = window.confirm(
      "Reset all LifeOS settings to their defaults?"
    );

    if (!confirmed) return;

    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "lifeos-settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function clearLocalData() {
    const confirmed = window.confirm(
      "This will clear local LifeOS preferences from this browser. Your database data will NOT be deleted. Continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem(
      "lifeos-settings"
    );

    setSettings(DEFAULT_SETTINGS);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <SettingsIcon className="h-4 w-4" />
              LifeOS configuration
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Configure how LifeOS works for you.
            </p>
          </div>

          <button
            onClick={saveSettings}
            className="flex w-fit items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        </div>

        {/* PROFILE */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <User className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Profile
              </h2>

              <p className="text-xs text-slate-500">
                Personalize your LifeOS experience
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-300">
              Display name
            </label>

            <input
              value={settings.name}
              onChange={(event) =>
                updateSetting(
                  "name",
                  event.target.value
                )
              }
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-slate-600">
              Used for greetings and your personal
              dashboard.
            </p>
          </div>
        </section>

        {/* DAY */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <CalendarClock className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Daily schedule
              </h2>

              <p className="text-xs text-slate-500">
                Define your normal productive window
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-300">
                Day starts
              </label>

              <input
                type="time"
                value={settings.dayStart}
                onChange={(event) =>
                  updateSetting(
                    "dayStart",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">
                Day ends
              </label>

              <input
                type="time"
                value={settings.dayEnd}
                onChange={(event) =>
                  updateSetting(
                    "dayEnd",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* REMINDERS */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Reminders
              </h2>

              <p className="text-xs text-slate-500">
                Control your activity notifications
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <p className="text-sm font-medium text-white">
                Activity reminders
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Remind me before scheduled activities
              </p>
            </div>

            <button
              onClick={() =>
                updateSetting(
                  "reminderEnabled",
                  !settings.reminderEnabled
                )
              }
              className={`relative h-6 w-11 rounded-full transition ${
                settings.reminderEnabled
                  ? "bg-blue-500"
                  : "bg-slate-700"
              }`}
              aria-label="Toggle reminders"
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  settings.reminderEnabled
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          {settings.reminderEnabled && (
            <div className="mt-5">
              <label className="text-sm font-medium text-slate-300">
                Reminder lead time
              </label>

              <select
                value={settings.reminderMinutes}
                onChange={(event) =>
                  updateSetting(
                    "reminderMinutes",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="5">
                  5 minutes before
                </option>

                <option value="10">
                  10 minutes before
                </option>

                <option value="15">
                  15 minutes before
                </option>

                <option value="30">
                  30 minutes before
                </option>
              </select>
            </div>
          )}
        </section>

        {/* PROGRESS */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Progress
              </h2>

              <p className="text-xs text-slate-500">
                Configure progress behavior
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-300">
              Streak threshold
            </label>

            <select
              value={settings.progressThreshold}
              onChange={(event) =>
                updateSetting(
                  "progressThreshold",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="25">
                25% — Easy
              </option>

              <option value="50">
                50% — Balanced
              </option>

              <option value="75">
                75% — Strict
              </option>

              <option value="90">
                90% — Extreme
              </option>
            </select>

            <p className="mt-2 text-xs text-slate-600">
              Determines how much daily progress is
              required to count toward a streak.
            </p>
          </div>
        </section>

        {/* WORKOUT */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <Dumbbell className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Workout
              </h2>

              <p className="text-xs text-slate-500">
                Default training preferences
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-slate-300">
              Default rest time
            </label>

            <select
              value={settings.workoutRest}
              onChange={(event) =>
                updateSetting(
                  "workoutRest",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="45">
                45 seconds
              </option>

              <option value="60">
                60 seconds
              </option>

              <option value="90">
                90 seconds
              </option>

              <option value="120">
                120 seconds
              </option>

              <option value="180">
                180 seconds
              </option>
            </select>
          </div>
        </section>

        {/* APPEARANCE */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Moon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Appearance
              </h2>

              <p className="text-xs text-slate-500">
                Choose your LifeOS interface
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() =>
                updateSetting("theme", "dark")
              }
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                settings.theme === "dark"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <Moon className="h-5 w-5 text-blue-400" />

              <div>
                <p className="text-sm font-medium">
                  Dark
                </p>

                <p className="text-xs text-slate-500">
                  Focused dark interface
                </p>
              </div>
            </button>

            <button
              onClick={() =>
                updateSetting("theme", "system")
              }
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                settings.theme === "system"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <Sun className="h-5 w-5 text-amber-400" />

              <div>
                <p className="text-sm font-medium">
                  System
                </p>

                <p className="text-xs text-slate-500">
                  Follow device preference
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* PRIVACY / DATA */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/10 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
              <Shield className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Data & privacy
              </h2>

              <p className="text-xs text-slate-500">
                Manage local application preferences
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-slate-500" />

                <div>
                  <p className="text-sm font-medium text-white">
                    Local preferences
                  </p>

                  <p className="text-xs text-slate-600">
                    Stored in this browser
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={clearLocalData}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
            >
              <RotateCcw className="h-4 w-4" />
              Clear local preferences
            </button>
          </div>
        </section>

        {/* RESET */}
        <section className="mt-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-5 w-5 text-red-400" />

            <div>
              <h2 className="font-semibold">
                Reset settings
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Restore LifeOS preferences to their
                default values.
              </p>
            </div>
          </div>

          <button
            onClick={resetSettings}
            className="mt-5 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Reset to defaults
          </button>
        </section>

        <div className="h-10" />
      </div>
    </div>
  );
}