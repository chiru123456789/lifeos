import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

function getToday() {
  const today = new Date();

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.habitId) {
      return NextResponse.json(
        { error: "Habit ID is required" },
        { status: 400 }
      );
    }

    // Verify that this habit belongs to the logged-in user.
    const habit = await prisma.habit.findFirst({
      where: {
        id: body.habitId,
        userId: user.id,
      },
    });

    if (!habit) {
      return NextResponse.json(
        { error: "Habit not found" },
        { status: 404 }
      );
    }

    const date = getToday();

    const existing = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: habit.id,
          date,
        },
      },
    });

    if (existing) {
      await prisma.habitCompletion.delete({
        where: {
          id: existing.id,
        },
      });

      return NextResponse.json({
        completed: false,
      });
    }

    const completion = await prisma.habitCompletion.create({
      data: {
        habitId: habit.id,
        date,
        count: habit.target,
      },
    });

    return NextResponse.json({
      completed: true,
      completion,
    });
  } catch (error) {
    console.error("POST /api/habits/checkin error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update habit check-in" },
      { status: 500 }
    );
  }
}