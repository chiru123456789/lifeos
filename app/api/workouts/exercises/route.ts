import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const exercises = await prisma.exercise.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("GET /api/workouts/exercises error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load exercises" },
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
        { error: "Exercise name is required" },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        name: body.name.trim(),
        category: body.category ?? "General",
        equipment: body.equipment?.trim() || null,
        description: body.description?.trim() || null,
        custom: body.custom ?? true,
      },
    });

    return NextResponse.json(exercise, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/workouts/exercises error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    );
  }
}