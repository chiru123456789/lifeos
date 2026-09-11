import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

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

function getDateRange(days: number) {
  const today = startOfDay(new Date());

  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));

  const end = endOfDay(new Date());

  return { start, end };
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    const { searchParams } = new URL(request.url);

    const requestedDays = Number(
      searchParams.get("days") ?? "7"
    );

    const days =
      requestedDays === 30
        ? 30
        : requestedDays === 7
          ? 7
          : 7;

    const { start, end } = getDateRange(days);

    const [
      tasks,
      habits,
      habitCompletions,
      workoutSessions,
      timetable,
      workoutPrograms,
    ] = await Promise.all([
      // Tasks created/due during the selected period
      prisma.task.findMany({
        where: {
          userId: user.id,
          OR: [
            {
              dueDate: {
                gte: start,
                lte: end,
              },
            },
            {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // Active habits
      prisma.habit.findMany({
        where: {
          userId: user.id,
          enabled: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),

      // Habit check-ins
      prisma.habitCompletion.findMany({
        where: {
          habit: {
            userId: user.id,
          },
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          date: "asc",
        },
      }),

      // Workout sessions and their completed sets
      prisma.workoutSession.findMany({
        where: {
          workoutDay: {
            program: {
              userId: user.id,
            },
          },
          date: {
            gte: start,
            lte: end,
          },
        },
        include: {
          workoutDay: {
            include: {
              exercises: true,
            },
          },
          sets: true,
        },
        orderBy: {
          date: "asc",
        },
      }),

      // Timetable is schedule data only.
      // It is NOT counted as completed progress.
      prisma.timetableEntry.findMany({
        where: {
          userId: user.id,
          enabled: true,
        },
      }),

      // Active workout programs are used to determine
      // how many sets are planned for each workout day.
      prisma.workoutProgram.findMany({
        where: {
          userId: user.id,
          active: true,
        },
        include: {
          days: {
            include: {
              exercises: true,
            },
          },
        },
      }),
    ]);

    /*
     * -----------------------------------------
     * DAILY DATA
     * -----------------------------------------
     */

    const daily = [];

    for (let i = 0; i < days; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      const dayStart = startOfDay(current);
      const dayEnd = endOfDay(current);

      const dateKey = formatDate(current);

      /*
       * Tasks
       */

      const dayTasks = tasks.filter((task) => {
        const relevantDate =
          task.dueDate ?? task.createdAt;

        return (
          relevantDate >= dayStart &&
          relevantDate <= dayEnd
        );
      });

      const completedTasks = dayTasks.filter(
        (task) => task.completed
      ).length;

      /*
       * Habits
       */

      const dayHabitCompletions =
        habitCompletions.filter(
          (completion) =>
            completion.date >= dayStart &&
            completion.date <= dayEnd
        );

      const completedHabitIds =
        new Set<string>();

      for (const completion of dayHabitCompletions) {
        const habit = habits.find(
          (item) => item.id === completion.habitId
        );

        if (
          habit &&
          completion.count >= habit.target
        ) {
          completedHabitIds.add(habit.id);
        }
      }

      const completedHabits =
        completedHabitIds.size;

      const totalHabits = habits.length;

      /*
       * Workouts
       */

      const dayWorkouts =
        workoutSessions.filter(
          (session) =>
            session.date >= dayStart &&
            session.date <= dayEnd
        );

      const workoutCount = dayWorkouts.length;

      const completedWorkoutSets =
        dayWorkouts.reduce(
          (total, session) =>
            total +
            session.sets.filter(
              (set) => set.completed
            ).length,
          0
        );

      /*
       * Calculate planned workout sets.
       */

      const plannedWorkoutSets =
        dayWorkouts.reduce(
          (total, session) => {
            const plannedForDay =
              session.workoutDay.exercises.reduce(
                (sum, exercise) =>
                  sum + exercise.sets,
                0
              );

            return total + plannedForDay;
          },
          0
        );

      const workoutPercentage =
        plannedWorkoutSets > 0
          ? Math.min(
              100,
              Math.round(
                (completedWorkoutSets /
                  plannedWorkoutSets) *
                  100
              )
            )
          : 0;

      /*
       * Timetable
       */

      const dayOfWeek = current.getDay();

      const scheduledActivities =
        timetable.filter(
          (entry) =>
            entry.dayOfWeek === dayOfWeek &&
            entry.enabled
        ).length;

      /*
       * -----------------------------------------
       * DAILY PROGRESS
       * -----------------------------------------
       */

      const taskWeight = dayTasks.length;
      const habitWeight = totalHabits;

      const workoutWeight =
        plannedWorkoutSets > 0 ? 1 : 0;

      const totalWeight =
        taskWeight +
        habitWeight +
        workoutWeight;

      const taskScore =
        taskWeight > 0
          ? completedTasks / taskWeight
          : 0;

      const habitScore =
        habitWeight > 0
          ? completedHabits / habitWeight
          : 0;

      const workoutScore =
        workoutWeight > 0
          ? workoutPercentage / 100
          : 0;

      const weightedScore =
        totalWeight > 0
          ? (
              taskScore * taskWeight +
              habitScore * habitWeight +
              workoutScore * workoutWeight
            ) / totalWeight
          : 0;

      const percentage =
        totalWeight > 0
          ? Math.round(weightedScore * 100)
          : 0;

      daily.push({
        date: dateKey,

        day: current.toLocaleDateString(
          "en-US",
          {
            weekday: "short",
          }
        ),

        percentage,

        tasks: {
          total: dayTasks.length,
          completed: completedTasks,
        },

        habits: {
          total: totalHabits,
          completed: completedHabits,
        },

        workout: {
          sessions: workoutCount,
          completedSets: completedWorkoutSets,
          plannedSets: plannedWorkoutSets,
          percentage: workoutPercentage,
        },

        timetable: {
          scheduled: scheduledActivities,
        },
      });
    }

    /*
     * -----------------------------------------
     * TOTALS
     * -----------------------------------------
     */

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) => task.completed
    ).length;

    const totalHabitCheckins =
      habitCompletions.length;

    const totalWorkoutSessions =
      workoutSessions.length;

    const totalWorkoutSets =
      workoutSessions.reduce(
        (total, session) =>
          total +
          session.sets.filter(
            (set) => set.completed
          ).length,
        0
      );

    const totalPlannedWorkoutSets =
      workoutSessions.reduce(
        (total, session) =>
          total +
          session.workoutDay.exercises.reduce(
            (sum, exercise) =>
              sum + exercise.sets,
            0
          ),
        0
      );

    const workoutCompletion =
      totalPlannedWorkoutSets > 0
        ? Math.min(
            100,
            Math.round(
              (totalWorkoutSets /
                totalPlannedWorkoutSets) *
                100
            )
          )
        : 0;

    /*
     * -----------------------------------------
     * HABIT PERFORMANCE
     * -----------------------------------------
     */

    const habitPerformance = habits.map(
      (habit) => {
        const completions =
          habitCompletions.filter(
            (completion) =>
              completion.habitId === habit.id
          );

        const successfulDays =
          completions.filter(
            (completion) =>
              completion.count >= habit.target
          ).length;

        const consistency =
          days > 0
            ? Math.round(
                (successfulDays / days) * 100
              )
            : 0;

        return {
          id: habit.id,
          name: habit.name,
          target: habit.target,
          successfulDays,
          consistency,
        };
      }
    );

    /*
     * -----------------------------------------
     * WORKOUT PERFORMANCE
     * -----------------------------------------
     */

    const workoutHistory =
      workoutSessions.map((session) => {
        const plannedSets =
          session.workoutDay.exercises.reduce(
            (total, exercise) =>
              total + exercise.sets,
            0
          );

        const completedSets =
          session.sets.filter(
            (set) => set.completed
          ).length;

        const percentage =
          plannedSets > 0
            ? Math.min(
                100,
                Math.round(
                  (completedSets /
                    plannedSets) *
                    100
                )
              )
            : 0;

        return {
          id: session.id,

          date: formatDate(
            new Date(session.date)
          ),

          workout: session.workoutDay.name,

          durationMin: session.durationMin,

          completedSets,

          plannedSets,

          totalSets: session.sets.length,

          percentage,
        };
      });

    /*
     * -----------------------------------------
     * BEST / WEAKEST DAY
     * -----------------------------------------
     */

    const sortedDays = [...daily].sort(
      (a, b) =>
        b.percentage - a.percentage
    );

    const bestDay =
      sortedDays.length > 0 &&
      sortedDays[0].percentage > 0
        ? sortedDays[0]
        : null;

    const weakestDay =
      sortedDays.length > 0
        ? sortedDays[sortedDays.length - 1]
        : null;

    /*
     * -----------------------------------------
     * OVERALL PROGRESS
     * -----------------------------------------
     */

    const overallProgress =
      daily.length > 0
        ? Math.round(
            daily.reduce(
              (total, day) =>
                total + day.percentage,
              0
            ) / daily.length
          )
        : 0;

    /*
     * -----------------------------------------
     * CURRENT STREAK
     * -----------------------------------------
     */

    let currentStreak = 0;

    for (
      let i = daily.length - 1;
      i >= 0;
      i--
    ) {
      if (daily[i].percentage >= 50) {
        currentStreak++;
      } else {
        break;
      }
    }

    /*
     * -----------------------------------------
     * RESPONSE
     * -----------------------------------------
     */

    return NextResponse.json({
      period: {
        days,
        start: formatDate(start),
        end: formatDate(end),
      },

      overview: {
        progress: overallProgress,

        tasks: {
          total: totalTasks,
          completed: completedTasks,
          remaining:
            totalTasks - completedTasks,
        },

        habits: {
          checkins: totalHabitCheckins,
          active: habits.length,
        },

        workouts: {
          sessions: totalWorkoutSessions,
          completedSets: totalWorkoutSets,
          plannedSets: totalPlannedWorkoutSets,
          completion: workoutCompletion,
        },

        streak: currentStreak,
      },

      daily,

      habits: habitPerformance,

      workouts: workoutHistory,

      highlights: {
        bestDay,
        weakestDay,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/progress error:",
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
        error: "Failed to load progress data",
      },
      {
        status: 500,
      }
    );
  }
}