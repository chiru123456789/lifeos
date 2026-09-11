import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.programId || !body.name?.trim()) {
      return NextResponse.json(
        { error: "Program and day name are required" },
        { status: 400 }
      );
    }

    // Verify the workout program belongs to the logged-in user.
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: body.programId,
        userId: user.id,
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: "Workout program not found" },
        { status: 404 }
      );
    }

    const day = await prisma.workoutDay.create({
      data: {
        programId: program.id,
        name: body.name.trim(),
        dayNumber: Number(body.dayNumber),
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(day, { status: 201 });
  } catch (error) {
    console.error("POST /api/workouts/days error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create workout day" },
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
        { error: "Workout day ID is required" },
        { status: 400 }
      );
    }

    // Verify the day belongs to a program owned by the logged-in user.
    const existingDay = await prisma.workoutDay.findFirst({
      where: {
        id: body.id,
        program: {
          userId: user.id,
        },
      },
    });

    if (!existingDay) {
      return NextResponse.json(
        { error: "Workout day not found" },
        { status: 404 }
      );
    }

    const day = await prisma.workoutDay.update({
      where: {
        id: existingDay.id,
      },
      data: {
        ...(body.name !== undefined && {
          name: body.name.trim(),
        }),
        ...(body.dayNumber !== undefined && {
          dayNumber: Number(body.dayNumber),
        }),
        ...(body.notes !== undefined && {
          notes: body.notes?.trim() || null,
        }),
      },
    });

    return NextResponse.json(day);
  } catch (error) {
    console.error("PATCH /api/workouts/days error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update workout day" },
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
        { error: "Workout day ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through the parent workout program.
    const existingDay = await prisma.workoutDay.findFirst({
      where: {
        id: body.id,
        program: {
          userId: user.id,
        },
      },
    });

    if (!existingDay) {
      return NextResponse.json(
        { error: "Workout day not found" },
        { status: 404 }
      );
    }

    await prisma.workoutDay.delete({
      where: {
        id: existingDay.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workouts/days error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete workout day" },
      { status: 500 }
    );
  }
}