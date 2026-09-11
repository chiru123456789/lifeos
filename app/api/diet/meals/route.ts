import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.planId || !body.name?.trim()) {
      return NextResponse.json(
        { error: "Diet plan and meal name are required" },
        { status: 400 }
      );
    }

    // Verify that the diet plan belongs to the signed-in user.
    const plan = await prisma.dietPlan.findFirst({
      where: {
        id: body.planId,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Diet plan not found" },
        { status: 404 }
      );
    }

    const meal = await prisma.meal.create({
      data: {
        planId: plan.id,
        name: body.name.trim(),
        mealTime: body.mealTime ?? "12:00",
        order: Number(body.order ?? 0),
      },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("POST /api/diet/meals error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create meal" },
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
        { error: "Meal ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through the parent diet plan.
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id: body.id,
        plan: {
          userId: user.id,
        },
      },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { error: "Meal not found" },
        { status: 404 }
      );
    }

    const meal = await prisma.meal.update({
      where: {
        id: existingMeal.id,
      },
      data: {
        ...(body.name !== undefined && {
          name: body.name.trim(),
        }),
        ...(body.mealTime !== undefined && {
          mealTime: body.mealTime,
        }),
        ...(body.order !== undefined && {
          order: Number(body.order),
        }),
        ...(body.completed !== undefined && {
          completed: Boolean(body.completed),
        }),
      },
      include: {
        foods: {
          include: {
            food: true,
          },
        },
      },
    });

    return NextResponse.json(meal);
  } catch (error) {
    console.error("PATCH /api/diet/meals error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update meal" },
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
        { error: "Meal ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through the parent diet plan.
    const existingMeal = await prisma.meal.findFirst({
      where: {
        id: body.id,
        plan: {
          userId: user.id,
        },
      },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { error: "Meal not found" },
        { status: 404 }
      );
    }

    await prisma.meal.delete({
      where: {
        id: existingMeal.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/diet/meals error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete meal" },
      { status: 500 }
    );
  }
}