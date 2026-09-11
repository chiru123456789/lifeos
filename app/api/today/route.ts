import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

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

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  category: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type HabitItem = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  target: number;
  enabled: boolean;
  completions: {
    id: string;
    habitId: string;
    date: Date;
    count: number;
    createdAt: Date;
  }[];
};

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const now = new Date();
    const dayOfWeek = now.getDay();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const [
      timetable,
      tasks,
      habits,
      workoutProgram,
      dietPlan,
      rules,
    ] = await Promise.all([
      // TIMETABLE
      prisma.timetableEntry.findMany({
        where: {
          userId: user.id,
          dayOfWeek,
          enabled: true,
        },
        orderBy: {
          startTime: "asc",
        },
      }),

      // TASKS
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            {
              dueDate: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            {
              dueDate: null,
              completed: false,
            },
          ],
        },
        orderBy: [
          {
            completed: "asc",
          },
          {
            dueDate: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),

      // HABITS
      prisma.habit.findMany({
        where: {
          userId: user.id,
          enabled: true,
        },
        include: {
          completions: {
            where: {
              date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // ACTIVE WORKOUT PROGRAM
      prisma.workoutProgram.findFirst({
        where: {
          userId: user.id,
          active: true,
        },
        include: {
          days: {
            orderBy: {
              dayNumber: "asc",
            },
            include: {
              exercises: {
                orderBy: {
                  order: "asc",
                },
                include: {
                  exercise: true,
                },
              },
            },
          },
        },
      }),

      // ACTIVE DIET PLAN
      prisma.dietPlan.findFirst({
        where: {
          userId: user.id,
          active: true,
        },
        include: {
          meals: {
            include: {
              foods: {
                include: {
                  food: true,
                },
              },
            },
          },
          targets: true,
        },
      }),

      // ACTIVE RULES
      prisma.rule.findMany({
        where: {
          userId: user.id,
          enabled: true,
        },
        orderBy: [
          {
            priority: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),
    ]);

    const typedTimetable = timetable as TimetableEntry[];
    const typedTasks = tasks as TaskItem[];
    const typedHabits = habits as HabitItem[];

    // CURRENT ACTIVITY
    const currentActivity =
      typedTimetable.find(
        (entry) =>
          currentTime >= entry.startTime &&
          currentTime < entry.endTime
      ) ?? null;

    // NEXT ACTIVITY
    const nextActivity =
      typedTimetable.find(
        (entry) => entry.startTime > currentTime
      ) ?? null;

    // HABIT DATA
    const habitData = typedHabits.map((habit) => {
      const completion = habit.completions[0];

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        target: habit.target,
        completed: completion?.count ?? 0,
        done: (completion?.count ?? 0) >= habit.target,
      };
    });

    const completedHabits = habitData.filter(
      (habit) => habit.done
    ).length;

    // WORKOUT DAY
    // JavaScript:
    // Sunday = 0
    // Monday = 1
    // ...
    // Saturday = 6
    //
    // Our workout program:
    // Monday = 1
    // ...
    // Sunday = 7

    const workoutDayNumber =
      dayOfWeek === 0 ? 7 : dayOfWeek;

    const todayWorkout =
      workoutProgram?.days.find(
        (day: (typeof workoutProgram.days)[number]) =>
          day.dayNumber === workoutDayNumber
      ) ?? null;

    // DIET DATA
    const dietMeals =
      dietPlan?.meals.map(
        (meal: (typeof dietPlan.meals)[number]) => ({
          id: meal.id,
          name: meal.name,

          // Meal currently has no time field in the database.
          time: null,

          status: "upcoming" as const,

          foods: meal.foods.map(
            (mealFood: (typeof meal.foods)[number]) => ({
              id: mealFood.food.id,
              name: mealFood.food.name,
              quantity: mealFood.quantity,

              // Unit comes from the Food record.
              unit: mealFood.food.servingUnit,

              calories: mealFood.food.calories,
              protein: mealFood.food.protein,
              carbs: mealFood.food.carbs,
              fats: mealFood.food.fats,
            })
          ),
        })
      ) ?? [];

    // TASK PROGRESS
    const completedTasks = typedTasks.filter(
      (task) => task.completed
    ).length;

    // DAILY PROGRESS
    // Rules are intentionally NOT counted as completed items
    // because rules are currently behavioral constraints,
    // not checkboxes.

    const totalProgressItems =
      typedTasks.length +
      habitData.length +
      dietMeals.length;

    const completedProgressItems =
      completedTasks + completedHabits;

    const progressPercentage =
      totalProgressItems > 0
        ? Math.round(
            (completedProgressItems / totalProgressItems) *
              100
          )
        : 0;

    return NextResponse.json({
      // BASIC DATE/TIME
      date: now.toISOString(),
      currentTime,
      dayOfWeek,

      // TIMETABLE
      currentActivity,
      nextActivity,
      timetable: typedTimetable,

      // TASKS
      tasks: {
        items: typedTasks,
        total: typedTasks.length,
        completed: completedTasks,
        remaining:
          typedTasks.length - completedTasks,
      },

      // HABITS
      habits: {
        items: habitData,
        total: habitData.length,
        completed: completedHabits,
        remaining:
          habitData.length - completedHabits,
      },

      // WORKOUT
      workout: todayWorkout
        ? {
            programId: workoutProgram?.id,
            programName: workoutProgram?.name,

            dayId: todayWorkout.id,
            dayNumber: todayWorkout.dayNumber,
            name: todayWorkout.name,
            notes: todayWorkout.notes,

            exercises: todayWorkout.exercises.map(
              (
                item: (typeof todayWorkout.exercises)[number]
              ) => ({
                id: item.id,
                exerciseId: item.exerciseId,
                name: item.exercise.name,
                category: item.exercise.category,
                equipment: item.exercise.equipment,
                order: item.order,
                sets: item.sets,
                targetReps: item.targetReps,
                restSeconds: item.restSeconds,
                notes: item.notes,
              })
            ),
          }
        : null,

      // DIET
      diet: dietPlan
        ? {
            id: dietPlan.id,
            name: dietPlan.name,
            description: dietPlan.description,
            meals: dietMeals,
            targets: dietPlan.targets,
          }
        : null,

      // RULES
      rules,

      // PROGRESS
      progress: {
        percentage: progressPercentage,
        completed: completedProgressItems,
        total: totalProgressItems,
      },
    });
  } catch (error) {
    console.error("GET /api/today error:", error);

    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to load today's data",
      },
      {
        status: 500,
      }
    );
  }
}