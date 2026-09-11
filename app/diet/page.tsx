"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Apple,
  Check,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Flame,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  Utensils,
  X,
} from "lucide-react";

type Food = {
  id: string;
  name: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  custom: boolean;
};

type MealFood = {
  id: string;
  mealId: string;
  foodId: string;
  quantity: number;
  food: Food;
};

type Meal = {
  id: string;
  planId: string;
  name: string;
  mealTime: string;
  order: number;
  completed: boolean;
  foods: MealFood[];
};

type NutritionTarget = {
  id: string;
  planId: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type DietPlan = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  meals: Meal[];
  targets: NutritionTarget[];
};

type FoodForm = {
  name: string;
  servingUnit: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
};

function formatNumber(value: number, decimals = 0) {
  return Number(value.toFixed(decimals)).toLocaleString("en-IN");
}

function getFoodNutrition(item: MealFood) {
  const multiplier =
    item.food.servingUnit === "egg"
      ? item.quantity
      : item.quantity / 100;

  return {
    calories: item.food.calories * multiplier,
    protein: item.food.protein * multiplier,
    carbs: item.food.carbs * multiplier,
    fats: item.food.fats * multiplier,
  };
}

function getMealNutrition(meal: Meal) {
  return meal.foods.reduce(
    (total, item) => {
      const nutrition = getFoodNutrition(item);

      return {
        calories: total.calories + nutrition.calories,
        protein: total.protein + nutrition.protein,
        carbs: total.carbs + nutrition.carbs,
        fats: total.fats + nutrition.fats,
      };
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    },
  );
}

function ProgressBar({
  value,
  target,
  label,
}: {
  value: number;
  target: number;
  label: string;
}) {
  const percentage =
    target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">
          {formatNumber(value, 0)} / {formatNumber(target, 0)}g
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function DietPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>(
    {},
  );

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);

  const [editingPlan, setEditingPlan] = useState<DietPlan | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);

  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedMealFoodId, setSelectedMealFoodId] = useState<string | null>(
    null,
  );

  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  const [mealName, setMealName] = useState("");
  const [mealTime, setMealTime] = useState("12:00");

  const [foodForm, setFoodForm] = useState<FoodForm>({
    name: "",
    servingUnit: "g",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const [quantity, setQuantity] = useState("100");

  const [targetForm, setTargetForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const activePlan = plans[0] ?? null;

  const totals = useMemo(() => {
    if (!activePlan) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      };
    }

    return activePlan.meals.reduce(
      (total, meal) => {
        const nutrition = getMealNutrition(meal);

        return {
          calories: total.calories + nutrition.calories,
          protein: total.protein + nutrition.protein,
          carbs: total.carbs + nutrition.carbs,
          fats: total.fats + nutrition.fats,
        };
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      },
    );
  }, [activePlan]);

  const targets = activePlan?.targets[0] ?? null;

  const completedMeals =
    activePlan?.meals.filter((meal) => meal.completed).length ?? 0;

  async function loadData() {
    try {
      setLoading(true);

      const [dietResponse, foodResponse] = await Promise.all([
        fetch("/api/diet"),
        fetch("/api/diet/foods"),
      ]);

      if (!dietResponse.ok) {
        throw new Error("Failed to load diet");
      }

      if (!foodResponse.ok) {
        throw new Error("Failed to load foods");
      }

      const dietData = await dietResponse.json();
      const foodData = await foodResponse.json();

      setPlans(dietData);
      setFoods(foodData);

      if (dietData[0]?.targets?.[0]) {
        const target = dietData[0].targets[0];

        setTargetForm({
          calories: String(target.calories),
          protein: String(target.protein),
          carbs: String(target.carbs),
          fats: String(target.fats),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleMeal(mealId: string) {
    setExpandedMeals((current) => ({
      ...current,
      [mealId]: !current[mealId],
    }));
  }

  async function toggleMealComplete(meal: Meal) {
    try {
      const response = await fetch("/api/diet/meals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: meal.id,
          completed: !meal.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update meal");
      }

      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function openCreatePlan() {
    setEditingPlan(null);
    setPlanName("");
    setPlanDescription("");
    setShowPlanModal(true);
  }

  function openEditPlan() {
    if (!activePlan) return;

    setEditingPlan(activePlan);
    setPlanName(activePlan.name);
    setPlanDescription(activePlan.description ?? "");
    setShowPlanModal(true);
  }

  async function savePlan() {
    if (!planName.trim()) return;

    try {
      setSaving(true);

      const response = await fetch("/api/diet", {
        method: editingPlan ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingPlan
            ? {
                id: editingPlan.id,
                name: planName,
                description: planDescription,
              }
            : {
                name: planName,
                description: planDescription,
              },
        ),
      });

      if (!response.ok) {
        throw new Error("Failed to save diet plan");
      }

      setShowPlanModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function archivePlan() {
    if (!activePlan) return;

    const confirmed = window.confirm(
      "Archive this diet plan? Your plan will be hidden but its data will remain safe.",
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/diet", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activePlan.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive diet plan");
      }

      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function openCreateMeal() {
    if (!activePlan) return;

    setMealName("");
    setMealTime("12:00");
    setShowMealModal(true);
  }

  async function saveMeal() {
    if (!activePlan || !mealName.trim()) return;

    try {
      setSaving(true);

      const response = await fetch("/api/diet/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: activePlan.id,
          name: mealName,
          mealTime,
          order: activePlan.meals.length + 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meal");
      }

      setShowMealModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(mealId: string) {
    const confirmed = window.confirm("Delete this meal?");

    if (!confirmed) return;

    try {
      const response = await fetch("/api/diet/meals", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: mealId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete meal");
      }

      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function openAddFood(mealId: string) {
    setSelectedMealId(mealId);
    setEditingFood(null);
    setSelectedMealFoodId(null);

    setFoodForm({
      name: "",
      servingUnit: "g",
      calories: "",
      protein: "",
      carbs: "",
      fats: "",
    });

    setQuantity("100");
    setShowFoodModal(true);
  }

  function openEditFood(mealId: string, mealFood: MealFood) {
    setSelectedMealId(mealId);
    setSelectedMealFoodId(mealFood.id);
    setEditingFood(mealFood.food);

    setFoodForm({
      name: mealFood.food.name,
      servingUnit: mealFood.food.servingUnit,
      calories: String(mealFood.food.calories),
      protein: String(mealFood.food.protein),
      carbs: String(mealFood.food.carbs),
      fats: String(mealFood.food.fats),
    });

    setQuantity(String(mealFood.quantity));
    setShowFoodModal(true);
  }

  async function createFood() {
    if (!foodForm.name.trim()) return;

    try {
      setSaving(true);

      const response = await fetch("/api/diet/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: foodForm.name,
          servingUnit: foodForm.servingUnit,
          calories: Number(foodForm.calories || 0),
          protein: Number(foodForm.protein || 0),
          carbs: Number(foodForm.carbs || 0),
          fats: Number(foodForm.fats || 0),
          custom: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create food");
      }

      const newFood = await response.json();

      if (selectedMealId) {
        const addResponse = await fetch("/api/diet/meals/foods", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mealId: selectedMealId,
            foodId: newFood.id,
            quantity: Number(quantity || 100),
          }),
        });

        if (!addResponse.ok) {
          throw new Error("Food created but could not be added to meal");
        }
      }

      setShowFoodModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function addExistingFood(foodId: string) {
    if (!selectedMealId) return;

    try {
      setSaving(true);

      const response = await fetch("/api/diet/meals/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId: selectedMealId,
          foodId,
          quantity: Number(quantity || 100),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add food");
      }

      setShowFoodModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function updateFoodQuantity() {
    if (!selectedMealFoodId) return;

    try {
      setSaving(true);

      const response = await fetch("/api/diet/meals/foods", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedMealFoodId,
          quantity: Number(quantity),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      setShowFoodModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function removeFood(mealFoodId: string) {
    const confirmed = window.confirm("Remove this food from the meal?");

    if (!confirmed) return;

    try {
      const response = await fetch("/api/diet/meals/foods", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: mealFoodId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove food");
      }

      await loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function saveTargets() {
    if (!activePlan) return;

    try {
      setSaving(true);

      const response = await fetch("/api/diet/targets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: activePlan.id,
          calories: Number(targetForm.calories || 0),
          protein: Number(targetForm.protein || 0),
          carbs: Number(targetForm.carbs || 0),
          fats: Number(targetForm.fats || 0),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save targets");
      }

      setShowTargetsModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-800" />
          <div className="mt-3 h-4 w-80 rounded bg-slate-800" />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 rounded-2xl border border-slate-800 bg-slate-900"
              />
            ))}
          </div>

          <div className="mt-6 h-96 rounded-2xl border border-slate-800 bg-slate-900" />
        </div>
      </main>
    );
  }

  if (!activePlan) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <Apple size={22} />
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Diet
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Your nutrition command center.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <Utensils size={28} />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              No active diet plan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Create a nutrition plan to start tracking meals, calories and
              macros.
            </p>

            <button
              onClick={openCreatePlan}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              <Plus size={17} />
              Create diet plan
            </button>
          </div>

          {showPlanModal && (
            <PlanModal
              editing={editingPlan}
              name={planName}
              description={planDescription}
              setName={setPlanName}
              setDescription={setPlanDescription}
              onClose={() => setShowPlanModal(false)}
              onSave={savePlan}
              saving={saving}
            />
          )}
        </div>
      </main>
    );
  }

  const caloriePercentage = targets
    ? Math.min(Math.round((totals.calories / targets.calories) * 100), 100)
    : 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                <Apple size={21} />
              </div>

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Nutrition
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {activePlan.name}
            </h1>

            {activePlan.description && (
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                {activePlan.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={openEditPlan}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-800"
            >
              <Pencil size={15} />
              Edit plan
            </button>

            <button
              onClick={() => setShowTargetsModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-800"
            >
              <Target size={15} />
              Targets
            </button>

            <button
              onClick={openCreateMeal}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              <Plus size={16} />
              Add meal
            </button>

            <button
              onClick={archivePlan}
              className="inline-flex items-center gap-2 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-950/40"
            >
              <Trash2 size={15} />
              Archive
            </button>
          </div>
        </header>

        {/* CALORIE OVERVIEW */}
        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.025] blur-3xl" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Calories
                </p>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold">
                    {formatNumber(totals.calories)}
                  </span>

                  <span className="text-sm text-slate-500">
                    / {formatNumber(targets?.calories ?? 0)} kcal
                  </span>
                </div>
              </div>

              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-8 border-slate-800">
                <div
                  className="absolute inset-[-8px] rounded-full border-8 border-transparent border-t-white transition-all duration-700"
                  style={{
                    transform: `rotate(${Math.min(caloriePercentage * 3.6, 360)}deg)`,
                  }}
                />

                <span className="text-sm font-semibold">
                  {caloriePercentage}%
                </span>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{
                  width: `${caloriePercentage}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                {formatNumber(
                  Math.max((targets?.calories ?? 0) - totals.calories, 0),
                )}{" "}
                kcal remaining
              </span>

              <span>{completedMeals}/{activePlan.meals.length} meals</span>
            </div>
          </div>

          <MacroCard
            label="Protein"
            value={totals.protein}
            target={targets?.protein ?? 0}
            unit="g"
          />

          <MacroCard
            label="Carbs"
            value={totals.carbs}
            target={targets?.carbs ?? 0}
            unit="g"
          />

          <MacroCard
            label="Fats"
            value={totals.fats}
            target={targets?.fats ?? 0}
            unit="g"
          />
        </section>

        {/* MACRO TARGETS */}
        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Daily nutrition</h2>
              <p className="mt-1 text-xs text-slate-500">
                Track your planned intake against your targets.
              </p>
            </div>

            <button
              onClick={() => setShowTargetsModal(true)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
            >
              <Pencil size={15} />
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ProgressBar
              label="Protein"
              value={totals.protein}
              target={targets?.protein ?? 0}
            />

            <ProgressBar
              label="Carbohydrates"
              value={totals.carbs}
              target={targets?.carbs ?? 0}
            />

            <ProgressBar
              label="Fats"
              value={totals.fats}
              target={targets?.fats ?? 0}
            />
          </div>
        </section>

        {/* MEALS */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold">Today's meals</h2>
              <p className="mt-1 text-sm text-slate-500">
                Complete each meal as you go.
              </p>
            </div>

            <span className="text-xs text-slate-500">
              {completedMeals} of {activePlan.meals.length} complete
            </span>
          </div>

          <div className="space-y-3">
            {activePlan.meals.map((meal) => {
              const nutrition = getMealNutrition(meal);
              const expanded = expandedMeals[meal.id] ?? true;

              return (
                <div
                  key={meal.id}
                  className={`overflow-hidden rounded-2xl border transition ${
                    meal.completed
                      ? "border-slate-800 bg-slate-900/60"
                      : "border-slate-800 bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 p-4 sm:p-5">
                    <button
                      onClick={() => toggleMealComplete(meal)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                        meal.completed
                          ? "border-white bg-white text-slate-950"
                          : "border-slate-700 bg-slate-950 text-transparent hover:border-slate-500"
                      }`}
                    >
                      <Check size={16} strokeWidth={2.5} />
                    </button>

                    <button
                      onClick={() => toggleMeal(meal.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3
                          className={`font-semibold ${
                            meal.completed
                              ? "text-slate-500 line-through"
                              : "text-white"
                          }`}
                        >
                          {meal.name}
                        </h3>

                        <span className="text-xs text-slate-500">
                          {meal.mealTime}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{formatNumber(nutrition.calories)} kcal</span>
                        <span>{formatNumber(nutrition.protein, 1)}g protein</span>
                        <span>{formatNumber(nutrition.carbs, 1)}g carbs</span>
                        <span>{formatNumber(nutrition.fats, 1)}g fat</span>
                      </div>
                    </button>

                    <button
                      onClick={() => openAddFood(meal.id)}
                      className="hidden rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 sm:inline-flex sm:items-center sm:gap-1.5"
                    >
                      <Plus size={14} />
                      Food
                    </button>

                    <button
                      onClick={() => toggleMeal(meal.id)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                    >
                      {expanded ? (
                        <ChevronUp size={17} />
                      ) : (
                        <ChevronDown size={17} />
                      )}
                    </button>

                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="rounded-lg p-2 text-slate-600 transition hover:bg-red-950/30 hover:text-red-300"
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t border-slate-800">
                      {meal.foods.length > 0 ? (
                        <div className="divide-y divide-slate-800/70">
                          {meal.foods.map((mealFood) => {
                            const nutrition = getFoodNutrition(mealFood);

                            return (
                              <div
                                key={mealFood.id}
                                className="group flex items-center gap-3 px-4 py-3.5 sm:px-5"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                                  <Utensils size={16} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-slate-200">
                                    {mealFood.food.name}
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {mealFood.quantity}{" "}
                                    {mealFood.food.servingUnit}
                                  </p>
                                </div>

                                <div className="hidden text-right sm:block">
                                  <p className="text-sm text-slate-300">
                                    {formatNumber(nutrition.calories)} kcal
                                  </p>

                                  <p className="text-xs text-slate-600">
                                    P {formatNumber(nutrition.protein, 1)} · C{" "}
                                    {formatNumber(nutrition.carbs, 1)} · F{" "}
                                    {formatNumber(nutrition.fats, 1)}
                                  </p>
                                </div>

                                <button
                                  onClick={() =>
                                    openEditFood(meal.id, mealFood)
                                  }
                                  className="rounded-lg p-2 text-slate-600 opacity-100 transition hover:bg-slate-800 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  onClick={() => removeFood(mealFood.id)}
                                  className="rounded-lg p-2 text-slate-600 opacity-100 transition hover:bg-red-950/30 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-5 py-8 text-center text-sm text-slate-600">
                          No foods added yet.
                        </div>
                      )}

                      <button
                        onClick={() => openAddFood(meal.id)}
                        className="flex w-full items-center justify-center gap-2 border-t border-slate-800/70 px-5 py-3 text-xs font-medium text-slate-500 transition hover:bg-slate-800/40 hover:text-white sm:hidden"
                      >
                        <Plus size={14} />
                        Add food
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* QUICK FOOD DATABASE */}
        <section className="mt-10 pb-10">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">Food database</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {foods.length} foods available in LifeOS.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedMealId(null);
                  setEditingFood(null);
                  setSelectedMealFoodId(null);

                  setFoodForm({
                    name: "",
                    servingUnit: "g",
                    calories: "",
                    protein: "",
                    carbs: "",
                    fats: "",
                  });

                  setQuantity("100");
                  setShowFoodModal(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-800"
              >
                <CirclePlus size={16} />
                Create custom food
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {foods.slice(0, 9).map((food) => (
                <div
                  key={food.id}
                  className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-3"
                >
                  <p className="text-sm font-medium text-slate-300">
                    {food.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {formatNumber(food.calories)} kcal · P{" "}
                    {formatNumber(food.protein, 1)} · C{" "}
                    {formatNumber(food.carbs, 1)} · F{" "}
                    {formatNumber(food.fats, 1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {showPlanModal && (
        <PlanModal
          editing={editingPlan}
          name={planName}
          description={planDescription}
          setName={setPlanName}
          setDescription={setPlanDescription}
          onClose={() => setShowPlanModal(false)}
          onSave={savePlan}
          saving={saving}
        />
      )}

      {showMealModal && (
        <Modal title="Add meal" onClose={() => setShowMealModal(false)}>
          <div className="space-y-4">
            <Field label="Meal name">
              <input
                value={mealName}
                onChange={(event) => setMealName(event.target.value)}
                placeholder="e.g. Breakfast"
                className={inputClass}
                autoFocus
              />
            </Field>

            <Field label="Time">
              <input
                type="time"
                value={mealTime}
                onChange={(event) => setMealTime(event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <ModalButton
                variant="secondary"
                onClick={() => setShowMealModal(false)}
              >
                Cancel
              </ModalButton>

              <ModalButton onClick={saveMeal} disabled={saving}>
                {saving ? "Saving..." : "Add meal"}
              </ModalButton>
            </div>
          </div>
        </Modal>
      )}

      {showTargetsModal && (
        <Modal
          title="Nutrition targets"
          onClose={() => setShowTargetsModal(false)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Calories"
              value={targetForm.calories}
              onChange={(value) =>
                setTargetForm((current) => ({
                  ...current,
                  calories: value,
                }))
              }
              suffix="kcal"
            />

            <NumberField
              label="Protein"
              value={targetForm.protein}
              onChange={(value) =>
                setTargetForm((current) => ({
                  ...current,
                  protein: value,
                }))
              }
              suffix="g"
            />

            <NumberField
              label="Carbohydrates"
              value={targetForm.carbs}
              onChange={(value) =>
                setTargetForm((current) => ({
                  ...current,
                  carbs: value,
                }))
              }
              suffix="g"
            />

            <NumberField
              label="Fats"
              value={targetForm.fats}
              onChange={(value) =>
                setTargetForm((current) => ({
                  ...current,
                  fats: value,
                }))
              }
              suffix="g"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <ModalButton
              variant="secondary"
              onClick={() => setShowTargetsModal(false)}
            >
              Cancel
            </ModalButton>

            <ModalButton onClick={saveTargets} disabled={saving}>
              {saving ? "Saving..." : "Save targets"}
            </ModalButton>
          </div>
        </Modal>
      )}

      {showFoodModal && (
        <FoodModal
          foods={foods}
          selectedMealId={selectedMealId}
          editingFood={editingFood}
          quantity={quantity}
          setQuantity={setQuantity}
          foodForm={foodForm}
          setFoodForm={setFoodForm}
          saving={saving}
          onClose={() => setShowFoodModal(false)}
          onCreateFood={createFood}
          onAddExisting={addExistingFood}
          onUpdateQuantity={updateFoodQuantity}
        />
      )}
    </main>
  );
}

function MacroCard({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const percentage =
    target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>

        <span className="text-xs text-slate-600">{percentage}%</span>
      </div>

      <div className="mt-3">
        <span className="text-2xl font-semibold">
          {formatNumber(value, 1)}
        </span>

        <span className="ml-1 text-xs text-slate-500">
          / {formatNumber(target, 1)}
          {unit}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function PlanModal({
  editing,
  name,
  description,
  setName,
  setDescription,
  onClose,
  onSave,
  saving,
}: {
  editing: DietPlan | null;
  name: string;
  description: string;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Modal
      title={editing ? "Edit diet plan" : "Create diet plan"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Plan name">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Lean Bulk"
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe this nutrition plan..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <ModalButton variant="secondary" onClick={onClose}>
            Cancel
          </ModalButton>

          <ModalButton onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Create plan"}
          </ModalButton>
        </div>
      </div>
    </Modal>
  );
}

function FoodModal({
  foods,
  selectedMealId,
  editingFood,
  quantity,
  setQuantity,
  foodForm,
  setFoodForm,
  saving,
  onClose,
  onCreateFood,
  onAddExisting,
  onUpdateQuantity,
}: {
  foods: Food[];
  selectedMealId: string | null;
  editingFood: Food | null;
  quantity: string;
  setQuantity: (value: string) => void;
  foodForm: FoodForm;
  setFoodForm: React.Dispatch<React.SetStateAction<FoodForm>>;
  saving: boolean;
  onClose: () => void;
  onCreateFood: () => void;
  onAddExisting: (foodId: string) => void;
  onUpdateQuantity: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "custom">(
    editingFood ? "custom" : "existing",
  );

  if (editingFood) {
    return (
      <Modal title="Edit food quantity" onClose={onClose}>
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="font-medium">{editingFood.name}</p>

            <p className="mt-1 text-xs text-slate-500">
              {editingFood.calories} kcal per{" "}
              {editingFood.servingUnit === "egg" ? "egg" : "100g"}
            </p>
          </div>

          <NumberField
            label={`Quantity (${editingFood.servingUnit})`}
            value={quantity}
            onChange={setQuantity}
          />

          <div className="flex justify-end gap-2">
            <ModalButton variant="secondary" onClick={onClose}>
              Cancel
            </ModalButton>

            <ModalButton onClick={onUpdateQuantity} disabled={saving}>
              {saving ? "Saving..." : "Update quantity"}
            </ModalButton>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={selectedMealId ? "Add food" : "Create custom food"}
      onClose={onClose}
    >
      {selectedMealId && (
        <div className="mb-5 flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setMode("existing")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
              mode === "existing"
                ? "bg-white text-slate-950"
                : "text-slate-500 hover:text-white"
            }`}
          >
            Food database
          </button>

          <button
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
              mode === "custom"
                ? "bg-white text-slate-950"
                : "text-slate-500 hover:text-white"
            }`}
          >
            Custom food
          </button>
        </div>
      )}

      {mode === "existing" && selectedMealId ? (
        <div className="space-y-4">
          <NumberField
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            suffix="g / ml / units"
          />

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {foods.map((food) => (
              <button
                key={food.id}
                onClick={() => onAddExisting(food.id)}
                disabled={saving}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-left transition hover:border-slate-600 hover:bg-slate-800/70"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {food.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {formatNumber(food.calories)} kcal · P{" "}
                      {formatNumber(food.protein, 1)} · C{" "}
                      {formatNumber(food.carbs, 1)} · F{" "}
                      {formatNumber(food.fats, 1)}
                    </p>
                  </div>

                  <Plus size={16} className="shrink-0 text-slate-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Food name">
            <input
              value={foodForm.name}
              onChange={(event) =>
                setFoodForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Greek Yogurt"
              className={inputClass}
              autoFocus
            />
          </Field>

          <Field label="Serving unit">
            <select
              value={foodForm.servingUnit}
              onChange={(event) =>
                setFoodForm((current) => ({
                  ...current,
                  servingUnit: event.target.value,
                }))
              }
              className={inputClass}
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="egg">egg</option>
              <option value="piece">piece</option>
              <option value="serving">serving</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Calories"
              value={foodForm.calories}
              onChange={(value) =>
                setFoodForm((current) => ({
                  ...current,
                  calories: value,
                }))
              }
            />

            <NumberField
              label="Protein"
              value={foodForm.protein}
              onChange={(value) =>
                setFoodForm((current) => ({
                  ...current,
                  protein: value,
                }))
              }
              suffix="g"
            />

            <NumberField
              label="Carbs"
              value={foodForm.carbs}
              onChange={(value) =>
                setFoodForm((current) => ({
                  ...current,
                  carbs: value,
                }))
              }
              suffix="g"
            />

            <NumberField
              label="Fats"
              value={foodForm.fats}
              onChange={(value) =>
                setFoodForm((current) => ({
                  ...current,
                  fats: value,
                }))
              }
              suffix="g"
            />
          </div>

          {selectedMealId && (
            <NumberField
              label="Quantity to add"
              value={quantity}
              onChange={setQuantity}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <ModalButton variant="secondary" onClick={onClose}>
              Cancel
            </ModalButton>

            <ModalButton onClick={onCreateFood} disabled={saving}>
              {saving ? "Saving..." : "Create food"}
            </ModalButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold">{title}</h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${suffix ? "pr-16" : ""}`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

function ModalButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary"
          ? "bg-white text-slate-950 hover:bg-slate-200"
          : "border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-slate-500";