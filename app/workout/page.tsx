"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Clock,
  Dumbbell,
  Edit3,
  History,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string | null;
  description: string | null;
};

type WorkoutExercise = {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  targetReps: string;
  restSeconds: number;
  notes: string | null;
  exercise: Exercise;
};

type WorkoutDay = {
  id: string;
  name: string;
  dayNumber: number;
  notes: string | null;
  exercises: WorkoutExercise[];
};

type WorkoutProgram = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  days: WorkoutDay[];
};

/*
 * IMPORTANT:
 * Form inputs return strings.
 * Keep these as strings in the UI state.
 * The API converts them to numbers when saving.
 */
type WorkoutSet = {
  id?: string;
  exerciseId: string;
  workoutExerciseId?: string | null;
  setNumber: number;
  reps: string;
  weight: string;
  resistance: string;
  completed: boolean;
};

type Session = {
  id: string;
  workoutDay: {
    name: string;
    dayNumber: number;
    program: {
      name: string;
    };
  };
  date: string;
  durationMin: number | null;
  sets: Array<{
    id: string;
    exercise: Exercise;
    setNumber: number;
    reps: number | null;
    weight: number | null;
    resistance: number | null;
    completed: boolean;
  }>;
};

const dayColors = [
  "from-cyan-500/20 to-blue-500/10",
  "from-violet-500/20 to-purple-500/10",
  "from-emerald-500/20 to-green-500/10",
  "from-amber-500/20 to-orange-500/10",
  "from-pink-500/20 to-rose-500/10",
  "from-indigo-500/20 to-blue-500/10",
  "from-slate-500/20 to-slate-500/10",
];

export default function WorkoutPage() {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<Session[]>([]);

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [programModal, setProgramModal] = useState(false);
  const [dayModal, setDayModal] = useState(false);
  const [exerciseModal, setExerciseModal] = useState(false);
  const [customExerciseModal, setCustomExerciseModal] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [editingProgram, setEditingProgram] =
    useState<WorkoutProgram | null>(null);

  const [editingDay, setEditingDay] = useState<WorkoutDay | null>(null);

  const [editingExercise, setEditingExercise] =
    useState<WorkoutExercise | null>(null);

  const [programName, setProgramName] = useState("");
  const [programDescription, setProgramDescription] = useState("");

  const [dayName, setDayName] = useState("");
  const [dayNumber, setDayNumber] = useState("1");
  const [dayNotes, setDayNotes] = useState("");

  const [exerciseName, setExerciseName] = useState("");
  const [exerciseCategory, setExerciseCategory] = useState("General");
  const [exerciseEquipment, setExerciseEquipment] = useState("");

  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const [sets, setSets] = useState("3");
  const [targetReps, setTargetReps] = useState("8-12");
  const [restSeconds, setRestSeconds] = useState("90");

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(
    null
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [loggedSets, setLoggedSets] = useState<
    Record<string, WorkoutSet[]>
  >({});

  const activeProgram = programs[0] ?? null;

  const selectedDay = useMemo(() => {
    if (!activeProgram) return null;

    return (
      activeProgram.days.find((day) => day.id === selectedDayId) ??
      activeProgram.days[0] ??
      null
    );
  }, [activeProgram, selectedDayId]);

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    if (!sessionStartedAt) return;

    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - sessionStartedAt) / 1000)
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [sessionStartedAt]);

  async function loadEverything() {
    try {
      setLoading(true);

      const [workoutResponse, exerciseResponse, historyResponse] =
        await Promise.all([
          fetch("/api/workouts"),
          fetch("/api/workouts/exercises"),
          fetch("/api/workouts/session"),
        ]);

      if (workoutResponse.ok) {
        const data = await workoutResponse.json();

        setPrograms(data);

        if (data[0]?.days?.length > 0) {
          setSelectedDayId((current) => current ?? data[0].days[0].id);
        }
      }

      if (exerciseResponse.ok) {
        setExercises(await exerciseResponse.json());
      }

      if (historyResponse.ok) {
        setHistory(await historyResponse.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     PROGRAM
  ========================= */

  function openCreateProgram() {
    setEditingProgram(null);
    setProgramName("");
    setProgramDescription("");
    setProgramModal(true);
  }

  function openEditProgram() {
    if (!activeProgram) return;

    setEditingProgram(activeProgram);
    setProgramName(activeProgram.name);
    setProgramDescription(activeProgram.description ?? "");
    setProgramModal(true);
  }

  async function saveProgram() {
    if (!programName.trim()) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts", {
        method: editingProgram ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingProgram ? { id: editingProgram.id } : {}),
          name: programName,
          description: programDescription,
          active: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save program");
      }

      setProgramModal(false);
      await loadEverything();
    } catch (error) {
      console.error(error);
      alert("Could not save workout program.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProgram() {
    if (!activeProgram) return;

    const confirmed = window.confirm(
      `Delete "${activeProgram.name}" and all its workout days?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeProgram.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete program");
      }

      setSelectedDayId(null);
      await loadEverything();
    } catch (error) {
      console.error(error);
      alert("Could not delete workout program.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     DAYS
  ========================= */

  function openCreateDay() {
    if (!activeProgram) return;

    setEditingDay(null);
    setDayName("");
    setDayNumber(String(activeProgram.days.length + 1));
    setDayNotes("");
    setDayModal(true);
  }

  function openEditDay(day: WorkoutDay) {
    setEditingDay(day);
    setDayName(day.name);
    setDayNumber(String(day.dayNumber));
    setDayNotes(day.notes ?? "");
    setDayModal(true);
  }

  async function saveDay() {
    if (!activeProgram || !dayName.trim()) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts/days", {
        method: editingDay ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingDay ? { id: editingDay.id } : {}),
          programId: activeProgram.id,
          name: dayName,
          dayNumber: Number(dayNumber),
          notes: dayNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save day");
      }

      setDayModal(false);
      await loadEverything();
    } catch (error) {
      console.error(error);
      alert("Could not save workout day.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDay(day: WorkoutDay) {
    const confirmed = window.confirm(
      `Delete "${day.name}" and all exercises inside it?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts/days", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: day.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete day");
      }

      if (selectedDayId === day.id) {
        setSelectedDayId(null);
      }

      await loadEverything();
    } catch (error) {
      console.error(error);
      alert("Could not delete workout day.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     EXERCISES
  ========================= */

  function openAddExercise() {
    if (!selectedDay) return;

    setEditingExercise(null);
    setSelectedExerciseId("");
    setSets("3");
    setTargetReps("8-12");
    setRestSeconds("90");
    setExerciseModal(true);
  }

  function openEditExercise(exercise: WorkoutExercise) {
    setEditingExercise(exercise);
    setSelectedExerciseId(exercise.exerciseId);
    setSets(String(exercise.sets));
    setTargetReps(exercise.targetReps);
    setRestSeconds(String(exercise.restSeconds));
    setExerciseModal(true);
  }

  async function saveExercise() {
    if (!selectedDay || !selectedExerciseId) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts/exercises/manage", {
        method: editingExercise ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingExercise ? { id: editingExercise.id } : {}),
          workoutDayId: selectedDay.id,
          exerciseId: selectedExerciseId,
          order: editingExercise?.order ?? selectedDay.exercises.length,
          sets: Number(sets),
          targetReps,
          restSeconds: Number(restSeconds),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save exercise");
      }

      setExerciseModal(false);
      await loadEverything();
    } catch (error) {
      console.error(error);
      alert("Could not save exercise.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExercise(exercise: WorkoutExercise) {
    const confirmed = window.confirm(
      `Remove "${exercise.exercise.name}" from this workout?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts/exercises/manage", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: exercise.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete exercise");
      }

      await loadEverything();
    } catch (error) {
      console.error(error);
      alert("Could not remove exercise.");
    } finally {
      setSaving(false);
    }
  }

  async function createCustomExercise() {
    if (!exerciseName.trim()) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: exerciseName,
          category: exerciseCategory,
          equipment: exerciseEquipment,
          custom: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create exercise");
      }

      const newExercise = await response.json();

      setExerciseName("");
      setExerciseCategory("General");
      setExerciseEquipment("");
      setCustomExerciseModal(false);

      await loadEverything();

      setSelectedExerciseId(newExercise.id);
      setExerciseModal(true);
    } catch (error) {
      console.error(error);
      alert("Could not create exercise.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     WORKOUT SESSION
  ========================= */

  async function startWorkout() {
    if (!selectedDay || activeSessionId) return;

    setSaving(true);

    try {
      const response = await fetch("/api/workouts/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutDayId: selectedDay.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start workout");
      }

      const session = await response.json();

      setActiveSessionId(session.id);
      setSessionStartedAt(Date.now());
      setElapsedSeconds(0);
      setLoggedSets({});
    } catch (error) {
      console.error(error);
      alert("Could not start workout.");
    } finally {
      setSaving(false);
    }
  }

  function getSetRows(exercise: WorkoutExercise): WorkoutSet[] {
    if (loggedSets[exercise.id]) {
      return loggedSets[exercise.id];
    }

    return Array.from({ length: exercise.sets }, (_, index) => ({
      exerciseId: exercise.exerciseId,
      workoutExerciseId: exercise.id,
      setNumber: index + 1,
      reps: "",
      weight: "",
      resistance: "",
      completed: false,
    }));
  }

  /*
   * FIXED:
   * Inputs produce strings.
   * We keep them as strings until the API receives them.
   */
  function updateSet(
    exerciseId: string,
    setNumber: number,
    field: keyof WorkoutSet,
    value: string | boolean
  ) {
    setLoggedSets((current) => {
      const exercise = selectedDay?.exercises.find(
        (item) => item.id === exerciseId
      );

      if (!exercise) {
        return current;
      }

      const rows = current[exerciseId] ?? getSetRows(exercise);

      return {
        ...current,
        [exerciseId]: rows.map((row) =>
          row.setNumber === setNumber
            ? {
                ...row,
                [field]: value,
              }
            : row
        ),
      };
    });
  }

  async function saveSet(
    exercise: WorkoutExercise,
    set: WorkoutSet
  ) {
    if (!activeSessionId) return;

    try {
      const response = await fetch("/api/workouts/session/sets", {
        method: set.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(set.id ? { id: set.id } : {}),
          sessionId: activeSessionId,
          exerciseId: exercise.exerciseId,
          workoutExerciseId: exercise.id,
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          resistance: set.resistance,
          completed: set.completed,
          restSeconds: exercise.restSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save set");
      }

      const saved = await response.json();

      setLoggedSets((current) => ({
        ...current,
        [exercise.id]: (current[exercise.id] ?? []).map((row) =>
          row.setNumber === set.setNumber
            ? {
                ...row,
                id: saved.id,
              }
            : row
        ),
      }));
    } catch (error) {
      console.error(error);
      alert("Could not save set.");
    }
  }

  async function finishWorkout() {
    if (!activeSessionId) return;

    setSaving(true);

    try {
      for (const exercise of selectedDay?.exercises ?? []) {
        const rows = getSetRows(exercise);

        for (const row of rows) {
          await saveSet(exercise, row);
        }
      }

      const durationMin = Math.max(
        1,
        Math.round(elapsedSeconds / 60)
      );

      const response = await fetch("/api/workouts/session", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeSessionId,
          durationMin,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to finish workout");
      }

      setActiveSessionId(null);
      setSessionStartedAt(null);
      setElapsedSeconds(0);
      setLoggedSets({});

      await loadEverything();

      alert("Workout saved 🔥");
    } catch (error) {
      console.error(error);
      alert("Could not finish workout.");
    } finally {
      setSaving(false);
    }
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  }

  const completedSets = Object.values(loggedSets)
    .flat()
    .filter((set) => set.completed).length;

  const totalSets =
    selectedDay?.exercises.reduce(
      (sum, exercise) => sum + exercise.sets,
      0
    ) ?? 0;

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </main>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-cyan-400">
                <Dumbbell className="h-4 w-4" />
                <span>TRAINING SYSTEM</span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Workout
              </h1>

              <p className="mt-2 max-w-2xl text-slate-400">
                Build your program, train, log every set and track your
                progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium transition hover:border-slate-700 hover:bg-slate-800"
              >
                <History className="h-4 w-4" />
                History
              </button>

              <button
                onClick={openCreateProgram}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <Plus className="h-4 w-4" />
                New Program
              </button>
            </div>
          </div>
        </header>

        {/* NO PROGRAM */}
        {!activeProgram ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
            <Dumbbell className="mx-auto mb-4 h-12 w-12 text-slate-600" />

            <h2 className="text-xl font-semibold">
              No workout program yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Create your first workout program and start building your
              training system.
            </p>

            <button
              onClick={openCreateProgram}
              className="mt-6 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
            >
              Create Program
            </button>
          </section>
        ) : (
          <>
            {/* PROGRAM CARD */}
            <section className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      ACTIVE
                    </span>

                    <span className="text-xs text-slate-500">
                      {activeProgram.days.length} training days
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold">
                    {activeProgram.name}
                  </h2>

                  {activeProgram.description && (
                    <p className="mt-1 text-sm text-slate-400">
                      {activeProgram.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={openEditProgram}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm transition hover:bg-slate-800"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    onClick={deleteProgram}
                    className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-500/5 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </section>

            {/* DAY SELECTOR */}
            <section className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Training Days
                  </h3>

                  <p className="text-xs text-slate-500">
                    Select a day to view its exercises
                  </p>
                </div>

                <button
                  onClick={openCreateDay}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Day
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {activeProgram.days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`min-w-[145px] rounded-2xl border p-4 text-left transition ${
                      selectedDay?.id === day.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        DAY {day.dayNumber}
                      </span>

                      {selectedDay?.id === day.id && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      )}
                    </div>

                    <p className="font-semibold">
                      {day.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {day.exercises.length} exercises
                    </p>
                  </button>
                ))}

                {activeProgram.days.length === 0 && (
                  <div className="w-full rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
                    No workout days yet. Add your first day.
                  </div>
                )}
              </div>
            </section>

            {selectedDay && (
              <>
                {/* DAY HEADER */}
                <section
                  className={`mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br ${
                    dayColors[
                      (selectedDay.dayNumber - 1) %
                        dayColors.length
                    ]
                  }`}
                >
                  <div className="bg-slate-950/60 p-5 backdrop-blur-sm sm:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                          <Activity className="h-4 w-4" />
                          DAY {selectedDay.dayNumber}
                        </div>

                        <h2 className="text-2xl font-bold">
                          {selectedDay.name}
                        </h2>

                        {selectedDay.notes && (
                          <p className="mt-1 text-sm text-slate-400">
                            {selectedDay.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            openEditDay(selectedDay)
                          }
                          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm hover:bg-slate-800"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit Day
                        </button>

                        <button
                          onClick={() =>
                            deleteDay(selectedDay)
                          }
                          className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-500/5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        {!activeSessionId ? (
                          <button
                            onClick={startWorkout}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                          >
                            <Play className="h-4 w-4 fill-current" />
                            Start Workout
                          </button>
                        ) : (
                          <button
                            onClick={finishWorkout}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            Finish Workout
                          </button>
                        )}
                      </div>
                    </div>

                    {activeSessionId && (
                      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-800 pt-4">
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Clock className="h-4 w-4" />

                          <span className="font-mono text-lg font-bold">
                            {formatTime(elapsedSeconds)}
                          </span>
                        </div>

                        <div className="text-sm text-slate-400">
                          {completedSets}/{totalSets} sets completed
                        </div>

                        <div className="h-2 min-w-[150px] flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-cyan-400 transition-all"
                            style={{
                              width:
                                totalSets > 0
                                  ? `${Math.min(
                                      100,
                                      (completedSets /
                                        totalSets) *
                                        100
                                    )}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* EXERCISES */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Exercises
                      </h3>

                      <p className="text-xs text-slate-500">
                        {selectedDay.exercises.length} exercises
                        in this day
                      </p>
                    </div>

                    <button
                      onClick={openAddExercise}
                      className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Exercise
                    </button>
                  </div>

                  {selectedDay.exercises.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center">
                      <Dumbbell className="mx-auto mb-4 h-10 w-10 text-slate-700" />

                      <h3 className="font-semibold">
                        No exercises
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Add an exercise to this training day.
                      </p>

                      <button
                        onClick={openAddExercise}
                        className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Add Exercise
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDay.exercises.map(
                        (exercise, index) => {
                          const rows =
                            getSetRows(exercise);

                          return (
                            <article
                              key={exercise.id}
                              className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70"
                            >
                              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-slate-400">
                                    {String(index + 1).padStart(
                                      2,
                                      "0"
                                    )}
                                  </div>

                                  <div>
                                    <h4 className="font-semibold">
                                      {exercise.exercise.name}
                                    </h4>

                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                      <span>
                                        {exercise.sets} sets ×{" "}
                                        {exercise.targetReps}
                                      </span>

                                      <span>•</span>

                                      <span>
                                        {exercise.restSeconds}s
                                        rest
                                      </span>

                                      {exercise.exercise
                                        .equipment && (
                                        <>
                                          <span>•</span>

                                          <span>
                                            {
                                              exercise.exercise
                                                .equipment
                                            }
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      openEditExercise(
                                        exercise
                                      )
                                    }
                                    className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                                    title="Edit exercise"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteExercise(
                                        exercise
                                      )
                                    }
                                    className="rounded-lg border border-red-900/60 p-2 text-red-400 hover:bg-red-500/10"
                                    title="Remove exercise"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {activeSessionId && (
                                <div className="border-t border-slate-800 bg-slate-950/60 p-4">
                                  <div className="mb-3 grid grid-cols-[45px_1fr_1fr_70px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600 sm:grid-cols-[55px_1fr_1fr_80px]">
                                    <span>Set</span>
                                    <span>Reps</span>
                                    <span>
                                      Resistance
                                    </span>
                                    <span>Done</span>
                                  </div>

                                  <div className="space-y-2">
                                    {rows.map((set) => (
                                      <div
                                        key={set.setNumber}
                                        className={`grid grid-cols-[45px_1fr_1fr_70px] items-center gap-2 rounded-xl border p-2 sm:grid-cols-[55px_1fr_1fr_80px] ${
                                          set.completed
                                            ? "border-emerald-500/20 bg-emerald-500/5"
                                            : "border-slate-800 bg-slate-900"
                                        }`}
                                      >
                                        <span className="text-center text-sm font-semibold text-slate-400">
                                          {set.setNumber}
                                        </span>

                                        <input
                                          type="number"
                                          min="0"
                                          value={set.reps}
                                          onChange={(event) =>
                                            updateSet(
                                              exercise.id,
                                              set.setNumber,
                                              "reps",
                                              event.target
                                                .value
                                            )
                                          }
                                          onBlur={() =>
                                            saveSet(
                                              exercise,
                                              set
                                            )
                                          }
                                          placeholder="Reps"
                                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm outline-none focus:border-cyan-500"
                                        />

                                        <input
                                          type="number"
                                          min="0"
                                          step="0.5"
                                          value={
                                            set.resistance
                                          }
                                          onChange={(event) =>
                                            updateSet(
                                              exercise.id,
                                              set.setNumber,
                                              "resistance",
                                              event.target
                                                .value
                                            )
                                          }
                                          onBlur={() =>
                                            saveSet(
                                              exercise,
                                              set
                                            )
                                          }
                                          placeholder="kg"
                                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-2 text-sm outline-none focus:border-cyan-500"
                                        />

                                        <button
                                          onClick={async () => {
                                            const updated = {
                                              ...set,
                                              completed:
                                                !set.completed,
                                            };

                                            updateSet(
                                              exercise.id,
                                              set.setNumber,
                                              "completed",
                                              updated.completed
                                            );

                                            await saveSet(
                                              exercise,
                                              updated
                                            );
                                          }}
                                          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                                            set.completed
                                              ? "border-emerald-500 bg-emerald-500 text-slate-950"
                                              : "border-slate-700 text-slate-600 hover:border-slate-500"
                                          }`}
                                        >
                                          <Check className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      {/* =========================
          PROGRAM MODAL
      ========================= */}

      {programModal && (
        <Modal
          title={
            editingProgram
              ? "Edit Program"
              : "Create Program"
          }
          onClose={() => setProgramModal(false)}
        >
          <div className="space-y-4">
            <Field label="Program name">
              <input
                value={programName}
                onChange={(event) =>
                  setProgramName(event.target.value)
                }
                placeholder="Home Lean Bulk"
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={programDescription}
                onChange={(event) =>
                  setProgramDescription(event.target.value)
                }
                placeholder="Resistance bands + pull-up bar"
                rows={3}
                className={inputClass}
              />
            </Field>

            <button
              onClick={saveProgram}
              disabled={
                saving || !programName.trim()
              }
              className={primaryButton}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save Program
            </button>
          </div>
        </Modal>
      )}

      {/* =========================
          DAY MODAL
      ========================= */}

      {dayModal && (
        <Modal
          title={
            editingDay
              ? "Edit Workout Day"
              : "Add Workout Day"
          }
          onClose={() => setDayModal(false)}
        >
          <div className="space-y-4">
            <Field label="Day name">
              <input
                value={dayName}
                onChange={(event) =>
                  setDayName(event.target.value)
                }
                placeholder="Push"
                className={inputClass}
              />
            </Field>

            <Field label="Day number">
              <input
                type="number"
                min="1"
                value={dayNumber}
                onChange={(event) =>
                  setDayNumber(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={dayNotes}
                onChange={(event) =>
                  setDayNotes(event.target.value)
                }
                placeholder="Chest, shoulders and triceps"
                rows={3}
                className={inputClass}
              />
            </Field>

            <button
              onClick={saveDay}
              disabled={
                saving || !dayName.trim()
              }
              className={primaryButton}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save Day
            </button>
          </div>
        </Modal>
      )}

      {/* =========================
          ADD / EDIT EXERCISE
      ========================= */}

      {exerciseModal && (
        <Modal
          title={
            editingExercise
              ? "Edit Exercise"
              : "Add Exercise"
          }
          onClose={() => setExerciseModal(false)}
        >
          <div className="space-y-4">
            <Field label="Exercise">
              <select
                value={selectedExerciseId}
                onChange={(event) =>
                  setSelectedExerciseId(
                    event.target.value
                  )
                }
                className={inputClass}
              >
                <option value="">
                  Select exercise
                </option>

                {exercises.map((exercise) => (
                  <option
                    key={exercise.id}
                    value={exercise.id}
                  >
                    {exercise.name}
                  </option>
                ))}
              </select>
            </Field>

            <button
              onClick={() => {
                setExerciseModal(false);
                setCustomExerciseModal(true);
              }}
              className="w-full rounded-xl border border-dashed border-slate-700 px-4 py-3 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
            >
              + Create Custom Exercise
            </button>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Sets">
                <input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(event) =>
                    setSets(event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Target reps">
                <input
                  value={targetReps}
                  onChange={(event) =>
                    setTargetReps(event.target.value)
                  }
                  placeholder="8-12"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Rest seconds">
              <input
                type="number"
                min="0"
                value={restSeconds}
                onChange={(event) =>
                  setRestSeconds(event.target.value)
                }
                className={inputClass}
              />
            </Field>

            <button
              onClick={saveExercise}
              disabled={
                saving || !selectedExerciseId
              }
              className={primaryButton}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {editingExercise
                ? "Update Exercise"
                : "Add Exercise"}
            </button>
          </div>
        </Modal>
      )}

      {/* =========================
          CUSTOM EXERCISE
      ========================= */}

      {customExerciseModal && (
        <Modal
          title="Create Custom Exercise"
          onClose={() =>
            setCustomExerciseModal(false)
          }
        >
          <div className="space-y-4">
            <Field label="Exercise name">
              <input
                value={exerciseName}
                onChange={(event) =>
                  setExerciseName(event.target.value)
                }
                placeholder="Band Chest Fly"
                className={inputClass}
              />
            </Field>

            <Field label="Category">
              <input
                value={exerciseCategory}
                onChange={(event) =>
                  setExerciseCategory(
                    event.target.value
                  )
                }
                placeholder="Chest"
                className={inputClass}
              />
            </Field>

            <Field label="Equipment">
              <input
                value={exerciseEquipment}
                onChange={(event) =>
                  setExerciseEquipment(
                    event.target.value
                  )
                }
                placeholder="Resistance Band"
                className={inputClass}
              />
            </Field>

            <button
              onClick={createCustomExercise}
              disabled={
                saving || !exerciseName.trim()
              }
              className={primaryButton}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              Create Exercise
            </button>
          </div>
        </Modal>
      )}

      {/* =========================
          HISTORY
      ========================= */}

      {historyOpen && (
        <Modal
          title="Workout History"
          onClose={() => setHistoryOpen(false)}
          wide
        >
          {history.length === 0 ? (
            <div className="py-10 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-700" />

              <p className="font-medium">
                No workouts logged yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Complete your first workout and it will
                appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {session.workoutDay.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {session.workoutDay.program.name} •{" "}
                        {new Date(
                          session.date
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>
                        {
                          session.sets.filter(
                            (set) => set.completed
                          ).length
                        }{" "}
                        sets
                      </span>

                      {session.durationMin && (
                        <span>
                          {session.durationMin} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}

/* =========================
   SHARED UI
========================= */

const inputClass =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500";

const primaryButton =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
          <h2 className="font-semibold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}