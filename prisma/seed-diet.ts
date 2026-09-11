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
  console.log("🍚 Creating LifeOS lean-bulk diet...");

  // ------------------------------------------------------------
  // USER
  // ------------------------------------------------------------

  const user = await prisma.user.findFirst();

  if (!user) {
    throw new Error(
      "No LifeOS user found. Sign in to LifeOS once before running the diet seed."
    );
  }

  console.log(`👤 Seeding diet for user: ${user.email ?? user.id}`);

  // ------------------------------------------------------------
  // REMOVE OLD DIET PLANS
  // ------------------------------------------------------------

  // Removing the plan cascades to meals, meal foods and targets.
  await prisma.dietPlan.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // ------------------------------------------------------------
  // FOODS
  // ------------------------------------------------------------

  const foodData = [
    {
      name: "Nandini Toned Milk",
      servingUnit: "ml",
      calories: 58,
      protein: 3.1,
      carbs: 4.8,
      fats: 3.0,
    },
    {
      name: "Egg",
      servingUnit: "egg",
      calories: 72,
      protein: 6.3,
      carbs: 0.4,
      fats: 4.8,
    },
    {
      name: "White Rice",
      servingUnit: "g",
      calories: 130,
      protein: 2.7,
      carbs: 28.2,
      fats: 0.3,
    },
    {
      name: "Oats",
      servingUnit: "g",
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fats: 6.9,
    },
    {
      name: "Banana",
      servingUnit: "g",
      calories: 89,
      protein: 1.1,
      carbs: 22.8,
      fats: 0.3,
    },
    {
      name: "Peanut Butter",
      servingUnit: "g",
      calories: 588,
      protein: 25.0,
      carbs: 20.0,
      fats: 50.0,
    },
    {
      name: "Peanuts",
      servingUnit: "g",
      calories: 567,
      protein: 25.8,
      carbs: 16.1,
      fats: 49.2,
    },
    {
      name: "Almonds",
      servingUnit: "g",
      calories: 579,
      protein: 21.2,
      carbs: 21.6,
      fats: 49.9,
    },
    {
      name: "Cashews",
      servingUnit: "g",
      calories: 553,
      protein: 18.2,
      carbs: 30.2,
      fats: 43.9,
    },
    {
      name: "Paneer",
      servingUnit: "g",
      calories: 265,
      protein: 18.3,
      carbs: 6.1,
      fats: 20.8,
    },
    {
      name: "Curd",
      servingUnit: "g",
      calories: 61,
      protein: 3.5,
      carbs: 4.7,
      fats: 3.3,
    },
    {
      name: "Chapati",
      servingUnit: "piece",
      calories: 120,
      protein: 3.5,
      carbs: 18.0,
      fats: 3.0,
    },
    {
      name: "Potato",
      servingUnit: "g",
      calories: 77,
      protein: 2.0,
      carbs: 17.5,
      fats: 0.1,
    },
    {
      name: "Sweet Potato",
      servingUnit: "g",
      calories: 86,
      protein: 1.6,
      carbs: 20.1,
      fats: 0.1,
    },
    {
      name: "Mixed Vegetables",
      servingUnit: "g",
      calories: 65,
      protein: 2.5,
      carbs: 12.0,
      fats: 0.8,
    },
    {
      name: "Banana Shake",
      servingUnit: "ml",
      calories: 110,
      protein: 3.5,
      carbs: 18.0,
      fats: 3.0,
    },
  ];

  const foods: Record<string, string> = {};

  for (const item of foodData) {
    const food = await prisma.food.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        ...item,
        custom: false,
      },
    });

    foods[item.name] = food.id;
  }

  // ------------------------------------------------------------
  // DIET PLAN
  // ------------------------------------------------------------

  const plan = await prisma.dietPlan.create({
    data: {
      user: {
        connect: {
          id: user.id,
        },
      },
      name: "Lean Bulk — 3800 kcal",
      description:
        "High-calorie home diet for lean bulking with eggs, milk and vegetarian foods.",
      active: true,
    },
  });

  // ------------------------------------------------------------
  // NUTRITION TARGET
  // ------------------------------------------------------------

  await prisma.nutritionTarget.create({
    data: {
      planId: plan.id,
      calories: 3800,
      protein: 150,
      carbs: 572,
      fats: 98.625,
    },
  });

  // ------------------------------------------------------------
  // HELPER
  // ------------------------------------------------------------

  async function createMeal(
    name: string,
    mealTime: string,
    order: number,
    items: { food: string; quantity: number }[],
  ) {
    const meal = await prisma.meal.create({
      data: {
        planId: plan.id,
        name,
        mealTime,
        order,
      },
    });

    for (const item of items) {
      await prisma.mealFood.create({
        data: {
          mealId: meal.id,
          foodId: foods[item.food],
          quantity: item.quantity,
        },
      });
    }

    return meal;
  }

  // ------------------------------------------------------------
  // MEALS
  // ------------------------------------------------------------

  await createMeal(
    "Breakfast",
    "08:30",
    1,
    [
      { food: "Oats", quantity: 100 },
      { food: "Nandini Toned Milk", quantity: 500 },
      { food: "Banana", quantity: 200 },
      { food: "Peanut Butter", quantity: 30 },
      { food: "Egg", quantity: 3 },
    ],
  );

  await createMeal(
    "Mid-Morning",
    "11:00",
    2,
    [
      { food: "Banana", quantity: 150 },
      { food: "Peanuts", quantity: 40 },
      { food: "Nandini Toned Milk", quantity: 300 },
    ],
  );

  await createMeal(
    "Lunch",
    "13:30",
    3,
    [
      { food: "White Rice", quantity: 350 },
      { food: "Paneer", quantity: 150 },
      { food: "Curd", quantity: 200 },
      { food: "Mixed Vegetables", quantity: 150 },
      { food: "Potato", quantity: 150 },
    ],
  );

  await createMeal(
    "Pre-Workout",
    "17:00",
    4,
    [
      { food: "Banana", quantity: 150 },
      { food: "Peanut Butter", quantity: 25 },
      { food: "Nandini Toned Milk", quantity: 300 },
    ],
  );

  await createMeal(
    "Dinner",
    "20:00",
    5,
    [
      { food: "White Rice", quantity: 300 },
      { food: "Paneer", quantity: 120 },
      { food: "Egg", quantity: 3 },
      { food: "Mixed Vegetables", quantity: 150 },
      { food: "Curd", quantity: 150 },
    ],
  );

  await createMeal(
    "Before Bed",
    "23:00",
    6,
    [
      { food: "Nandini Toned Milk", quantity: 400 },
      { food: "Almonds", quantity: 25 },
      { food: "Cashews", quantity: 20 },
      { food: "Banana", quantity: 100 },
    ],
  );

  console.log("🔥 Lean-bulk diet created!");
  console.log(`📋 Plan: ${plan.name}`);
  console.log("🎯 Target: 3800 kcal / 150g protein");
  console.log("🍳 Eggs + milk included");
  console.log("🚫 No bread / poha / soya chunks / dal");
}

main()
  .catch((error) => {
    console.error("❌ Diet seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });