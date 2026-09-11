import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

function parseDate(value: string | null) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    const { searchParams } = new URL(request.url);

    const requestedDate = parseDate(
      searchParams.get("date")
    );

    const date = requestedDate ?? new Date();

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayOfWeek = date.getDay();

    /*
     * Calendar is an aggregation layer.
     * We don't create duplicate calendar records.
     *
     * Every query is scoped to the signed-in user.
     */

    const [
      timetable,
      tasks,
      habits,
      workoutProgram,
      dietPlan,
    ] = await Promise.all([
      // Timetable for this weekday
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

      // Tasks due on this date
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: [
          {
            completed: "asc",
          },
          {
            priority: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),

      // Habits + completion for this date
      prisma.habit.findMany({
        where: {
          userId: user.id,
          enabled: true,
        },
        include: {
          completions: {
            where: {
              date: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // Workout scheduled for this weekday
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

      // Active diet
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
    ]);

    /*
     * Workout
     *
     * JavaScript:
     * Sunday = 0
     *
     * Our workout program:
     * Monday = 1 ... Sunday = 7
     */
    const workoutDayNumber =
      dayOfWeek === 0 ? 7 : dayOfWeek;

    const workoutDay =
      workoutProgram?.days.find(
        (day) => day.dayNumber === workoutDayNumber
      ) ?? null;

    /*
     * Normalize timetable events
     */
    const timetableEvents = timetable.map((entry) => ({
      id: entry.id,
      type: "timetable",
      title: entry.title,
      date: formatDate(date),
      startTime: entry.startTime,
      endTime: entry.endTime,
      category: entry.category,
      priority: entry.priority,
      completed: false,
    }));

    /*
     * Normalize task events
     */
    const taskEvents = tasks.map((task) => ({
      id: task.id,
      type: "task",
      title: task.title,
      description: task.description,
      date: formatDate(date),
      startTime: null,
      endTime: null,
      category: task.category,
      priority: task.priority,
      completed: task.completed,
    }));

    /*
     * Normalize habit events
     */
    const habitEvents = habits.map((habit) => {
      const completion = habit.completions[0];

      const completedCount =
        completion?.count ?? 0;

      return {
        id: habit.id,
        type: "habit",
        title: habit.name,
        description: habit.description,
        date: formatDate(date),
        startTime: null,
        endTime: null,
        category: "Habit",
        priority: "Medium",
        completed:
          completedCount >= habit.target,
        progress: completedCount,
        target: habit.target,
      };
    });

    /*
     * Workout event
     */
    const workoutEvent = workoutDay
      ? {
          id: workoutDay.id,
          type: "workout",
          title: workoutDay.name,
          description:
            workoutDay.notes ??
            workoutProgram?.description ??
            null,
          date: formatDate(date),
          startTime: null,
          endTime: null,
          category: "Workout",
          priority: "High",
          completed: false,
          programId: workoutProgram?.id ?? null,
          programName: workoutProgram?.name ?? null,
          dayNumber: workoutDay.dayNumber,
          exercises: workoutDay.exercises.map(
            (item) => ({
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
      : null;

    /*
     * Diet meals
     */
    const dietEvents =
      dietPlan?.meals.map((meal) => ({
        id: meal.id,
        type: "diet",
        title: meal.name,
        description: null,
        date: formatDate(date),
        startTime: null,
        endTime: null,
        category: "Diet",
        priority: "Medium",
        completed: false,
        foods: meal.foods.map((mealFood) => ({
          id: mealFood.food.id,
          name: mealFood.food.name,
          quantity: mealFood.quantity,
          unit: mealFood.food.servingUnit,
          calories: mealFood.food.calories,
          protein: mealFood.food.protein,
          carbs: mealFood.food.carbs,
          fats: mealFood.food.fats,
        })),
      })) ?? [];

    /*
     * Combined events
     */
    const events = [
      ...timetableEvents,
      ...taskEvents,
      ...habitEvents,
      ...(workoutEvent ? [workoutEvent] : []),
      ...dietEvents,
    ];

    /*
     * Daily stats
     */
    const completedTasks = tasks.filter(
      (task) => task.completed
    ).length;

    const completedHabits = habitEvents.filter(
      (habit) => habit.completed
    ).length;

    const totalHabits = habitEvents.length;

    const totalItems =
      tasks.length +
      totalHabits +
      (workoutEvent ? 1 : 0) +
      dietEvents.length;

    const completedItems =
      completedTasks + completedHabits;

    const progress =
      totalItems > 0
        ? Math.round(
            (completedItems / totalItems) * 100
          )
        : 0;

    return NextResponse.json({
      date: formatDate(date),

      dayOfWeek,

      summary: {
        progress,
        completed: completedItems,
        total: totalItems,

        tasks: {
          total: tasks.length,
          completed: completedTasks,
          remaining:
            tasks.length - completedTasks,
        },

        habits: {
          total: totalHabits,
          completed: completedHabits,
          remaining:
            totalHabits - completedHabits,
        },

        workout: {
          scheduled: Boolean(workoutEvent),
        },

        diet: {
          meals: dietEvents.length,
        },
      },

      timetable: timetableEvents,
      tasks: taskEvents,
      habits: habitEvents,
      workout: workoutEvent,
      diet: dietEvents,

      events,
    });
  } catch (error) {
    console.error(
      "GET /api/calendar error:",
      error
    );

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to load calendar data",
      },
      {
        status: 500,
      }
    );
  }
}