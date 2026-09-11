import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.mealId || !body.foodId) {
      return NextResponse.json(
        { error: "Meal and food are required" },
        { status: 400 }
      );
    }

    // Verify that the meal belongs to the signed-in user's diet plan.
    const meal = await prisma.meal.findFirst({
      where: {
        id: body.mealId,
        plan: {
          userId: user.id,
        },
      },
    });

    if (!meal) {
      return NextResponse.json(
        { error: "Meal not found" },
        { status: 404 }
      );
    }

    // Verify that the food also belongs to the signed-in user.
    const food = await prisma.food.findFirst({
      where: {
        id: body.foodId,
        userId: user.id,
      },
    });

    if (!food) {
      return NextResponse.json(
        { error: "Food not found" },
        { status: 404 }
      );
    }

    const mealFood = await prisma.mealFood.create({
      data: {
        mealId: meal.id,
        foodId: food.id,
        quantity: Number(body.quantity ?? 100),
      },
      include: {
        food: true,
      },
    });

    return NextResponse.json(mealFood, { status: 201 });
  } catch (error) {
    console.error("POST /api/diet/meals/foods error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add food to meal" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Meal food ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through Meal → DietPlan → User.
    const existingMealFood = await prisma.mealFood.findFirst({
      where: {
        id: body.id,
        meal: {
          plan: {
            userId: user.id,
          },
        },
      },
    });

    if (!existingMealFood) {
      return NextResponse.json(
        { error: "Meal food not found" },
        { status: 404 }
      );
    }

    const mealFood = await prisma.mealFood.update({
      where: {
        id: existingMealFood.id,
      },
      data: {
        ...(body.quantity !== undefined && {
          quantity: Number(body.quantity),
        }),
      },
      include: {
        food: true,
      },
    });

    return NextResponse.json(mealFood);
  } catch (error) {
    console.error("PATCH /api/diet/meals/foods error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update food quantity" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Meal food ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through Meal → DietPlan → User.
    const existingMealFood = await prisma.mealFood.findFirst({
      where: {
        id: body.id,
        meal: {
          plan: {
            userId: user.id,
          },
        },
      },
    });

    if (!existingMealFood) {
      return NextResponse.json(
        { error: "Meal food not found" },
        { status: 404 }
      );
    }

    await prisma.mealFood.delete({
      where: {
        id: existingMealFood.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/diet/meals/foods error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove food from meal" },
      { status: 500 }
    );
  }
}