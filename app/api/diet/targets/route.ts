import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.planId) {
      return NextResponse.json(
        { error: "Diet plan ID is required" },
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

    const target = await prisma.nutritionTarget.upsert({
      where: {
        planId: plan.id,
      },
      update: {
        calories: Number(body.calories ?? 0),
        protein: Number(body.protein ?? 0),
        carbs: Number(body.carbs ?? 0),
        fats: Number(body.fats ?? 0),
      },
      create: {
        planId: plan.id,
        calories: Number(body.calories ?? 0),
        protein: Number(body.protein ?? 0),
        carbs: Number(body.carbs ?? 0),
        fats: Number(body.fats ?? 0),
      },
    });

    return NextResponse.json(target);
  } catch (error) {
    console.error("POST /api/diet/targets error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save nutrition targets" },
      { status: 500 }
    );
  }
}