import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        enabled: true,
      },
      include: {
        completions: {
          orderBy: {
            date: "desc",
          },
          take: 60,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("GET /api/habits error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load habits" },
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
        { error: "Habit name is required" },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        frequency: body.frequency ?? "Daily",
        target: Number(body.target ?? 1),
        enabled: body.enabled ?? true,
      },
      include: {
        completions: true,
      },
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error("POST /api/habits error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create habit" },
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
        { error: "Habit ID is required" },
        { status: 400 }
      );
    }

    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: "Habit not found" },
        { status: 404 }
      );
    }

    const habit = await prisma.habit.update({
      where: {
        id: existingHabit.id,
      },
      data: {
        ...(body.name !== undefined && {
          name: body.name.trim(),
        }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.frequency !== undefined && {
          frequency: body.frequency,
        }),
        ...(body.target !== undefined && {
          target: Number(body.target),
        }),
        ...(body.enabled !== undefined && {
          enabled: body.enabled,
        }),
      },
      include: {
        completions: {
          orderBy: {
            date: "desc",
          },
          take: 60,
        },
      },
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error("PATCH /api/habits error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update habit" },
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
        { error: "Habit ID is required" },
        { status: 400 }
      );
    }

    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: "Habit not found" },
        { status: 404 }
      );
    }

    await prisma.habit.delete({
      where: {
        id: existingHabit.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/habits error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete habit" },
      { status: 500 }
    );
  }
}