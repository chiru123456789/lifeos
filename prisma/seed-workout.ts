import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🏋️ Creating LifeOS home lean-bulk workout...");

  // ------------------------------------------------------------
  // USER
  // ------------------------------------------------------------

  const user = await prisma.user.findFirst();

  if (!user) {
    throw new Error(
      "No LifeOS user found. Sign in to LifeOS once before running the workout seed."
    );
  }

  console.log(`👤 Seeding workout for user: ${user.email ?? user.id}`);

  // ------------------------------------------------------------
  // REMOVE OLD WORKOUT PROGRAMS
  // ------------------------------------------------------------

  // Removing the program cascades to workout days,
  // workout exercises, sessions and sets.
  await prisma.workoutProgram.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // ------------------------------------------------------------
  // WORKOUT PROGRAM
  // ------------------------------------------------------------

  const program = await prisma.workoutProgram.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
      name: "Home Lean Bulk",
      description: "Resistance bands + pull-up bar",
      active: true,
    },
  });

  // ------------------------------------------------------------
  // EXERCISES
  // ------------------------------------------------------------

  const exercises = [
    ["Band Chest Press", "Chest", "Resistance Band"],
    ["Band Incline Press", "Chest", "Resistance Band"],
    ["Band Shoulder Press", "Shoulders", "Resistance Band"],
    ["Band Lateral Raise", "Shoulders", "Resistance Band"],
    ["Band Triceps Extension", "Arms", "Resistance Band"],
    ["Pull-Up", "Back", "Pull-Up Bar"],
    ["Band Lat Pulldown", "Back", "Resistance Band"],
    ["Band Row", "Back", "Resistance Band"],
    ["Band Face Pull", "Shoulders", "Resistance Band"],
    ["Band Biceps Curl", "Arms", "Resistance Band"],
    ["Band Hammer Curl", "Arms", "Resistance Band"],
    ["Band Squat", "Legs", "Resistance Band"],
    ["Bulgarian Split Squat", "Legs", "Bodyweight"],
    ["Band Romanian Deadlift", "Legs", "Resistance Band"],
    ["Band Glute Bridge", "Legs", "Resistance Band"],
    ["Calf Raise", "Legs", "Bodyweight"],
    ["Push-Up", "Chest", "Bodyweight"],
    ["Pike Push-Up", "Shoulders", "Bodyweight"],
    ["Plank", "Core", "Bodyweight"],
    ["Hanging Knee Raise", "Core", "Pull-Up Bar"],
  ];

  const exerciseMap: Record<string, string> = {};

  for (const [name, category, equipment] of exercises) {
    const exercise = await prisma.exercise.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        name,
        category,
        equipment,
        custom: true,
      },
    });

    exerciseMap[name] = exercise.id;
  }

  // ------------------------------------------------------------
  // WORKOUT DAYS
  // ------------------------------------------------------------

  const days = [
    {
      name: "Push",
      exercises: [
        ["Band Chest Press", 3, "8-12"],
        ["Band Incline Press", 3, "8-12"],
        ["Band Shoulder Press", 3, "8-12"],
        ["Band Lateral Raise", 3, "12-15"],
        ["Band Triceps Extension", 3, "10-15"],
      ],
    },
    {
      name: "Pull",
      exercises: [
        ["Pull-Up", 3, "5-10"],
        ["Band Lat Pulldown", 3, "8-12"],
        ["Band Row", 3, "8-12"],
        ["Band Face Pull", 3, "12-15"],
        ["Band Biceps Curl", 3, "10-15"],
        ["Band Hammer Curl", 3, "10-15"],
      ],
    },
    {
      name: "Legs",
      exercises: [
        ["Band Squat", 4, "8-12"],
        ["Bulgarian Split Squat", 3, "8-12"],
        ["Band Romanian Deadlift", 3, "8-12"],
        ["Band Glute Bridge", 3, "10-15"],
        ["Calf Raise", 4, "12-20"],
      ],
    },
    {
      name: "Rest",
      exercises: [],
    },
    {
      name: "Upper",
      exercises: [
        ["Push-Up", 3, "8-15"],
        ["Pull-Up", 3, "5-10"],
        ["Band Chest Press", 3, "8-12"],
        ["Band Row", 3, "8-12"],
        ["Band Shoulder Press", 3, "8-12"],
        ["Band Biceps Curl", 2, "10-15"],
        ["Band Triceps Extension", 2, "10-15"],
      ],
    },
    {
      name: "Lower + Core",
      exercises: [
        ["Band Squat", 3, "10-15"],
        ["Bulgarian Split Squat", 3, "8-12"],
        ["Band Romanian Deadlift", 3, "8-12"],
        ["Calf Raise", 3, "15-20"],
        ["Plank", 3, "30-60 sec"],
        ["Hanging Knee Raise", 3, "8-15"],
      ],
    },
    {
      name: "Rest",
      exercises: [],
    },
  ];

  // ------------------------------------------------------------
  // CREATE DAYS + EXERCISES
  // ------------------------------------------------------------

  for (let i = 0; i < days.length; i++) {
    const day = days[i];

    const workoutDay = await prisma.workoutDay.create({
      data: {
        programId: program.id,
        name: day.name,
        dayNumber: i + 1,
      },
    });

    for (let j = 0; j < day.exercises.length; j++) {
      const [name, sets, reps] = day.exercises[j];

      await prisma.workoutExercise.create({
        data: {
          workoutDayId: workoutDay.id,
          exerciseId: exerciseMap[name],
          order: j,
          sets: Number(sets),
          targetReps: String(reps),
          restSeconds: 90,
        },
      });
    }
  }

  console.log("🔥 Home Lean Bulk workout created!");
  console.log(`📋 Program: ${program.name}`);
  console.log("🏠 Equipment: Resistance bands + pull-up bar");
}

main()
  .catch((error) => {
    console.error("❌ Workout seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });