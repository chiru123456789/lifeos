import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.workoutDayId || !body.exerciseId) {
      return NextResponse.json(
        { error: "Workout day and exercise are required" },
        { status: 400 }
      );
    }

    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutDayId: body.workoutDayId,
        exerciseId: body.exerciseId,
        order: Number(body.order ?? 0),
        sets: Number(body.sets ?? 3),
        targetReps: body.targetReps ?? "8-12",
        restSeconds: Number(body.restSeconds ?? 90),
        notes: body.notes?.trim() || null,
      },
      include: {
        exercise: true,
      },
    });

    return NextResponse.json(workoutExercise, { status: 201 });
  } catch (error) {
    console.error("POST exercise manage error:", error);

    return NextResponse.json(
      { error: "Failed to add exercise to workout" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Workout exercise ID is required" },
        { status: 400 }
      );
    }

    const workoutExercise = await prisma.workoutExercise.update({
      where: {
        id: body.id,
      },
      data: {
        ...(body.order !== undefined && {
          order: Number(body.order),
        }),
        ...(body.sets !== undefined && {
          sets: Number(body.sets),
        }),
        ...(body.targetReps !== undefined && {
          targetReps: body.targetReps,
        }),
        ...(body.restSeconds !== undefined && {
          restSeconds: Number(body.restSeconds),
        }),
        ...(body.notes !== undefined && {
          notes: body.notes?.trim() || null,
        }),
      },
      include: {
        exercise: true,
      },
    });

    return NextResponse.json(workoutExercise);
  } catch (error) {
    console.error("PATCH exercise manage error:", error);

    return NextResponse.json(
      { error: "Failed to update workout exercise" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Workout exercise ID is required" },
        { status: 400 }
      );
    }

    await prisma.workoutExercise.delete({
      where: {
        id: body.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE exercise manage error:", error);

    return NextResponse.json(
      { error: "Failed to remove exercise" },
      { status: 500 }
    );
  }
}