import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const foods = await prisma.food.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error("GET /api/diet/foods error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load foods" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Food name is required" },
        { status: 400 }
      );
    }

    const food = await prisma.food.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        servingUnit: body.servingUnit ?? "g",
        calories: Number(body.calories ?? 0),
        protein: Number(body.protein ?? 0),
        carbs: Number(body.carbs ?? 0),
        fats: Number(body.fats ?? 0),
        custom: body.custom ?? true,
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("POST /api/diet/foods error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create food" },
      { status: 500 }
    );
  }
}