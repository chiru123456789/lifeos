import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the logged-in user.
    const session = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        workoutDay: {
          program: {
            userId: user.id,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Workout session not found" },
        { status: 404 }
      );
    }

    const sets = await prisma.workoutSet.findMany({
      where: {
        sessionId: session.id,
      },
      include: {
        exercise: true,
      },
      orderBy: [
        {
          exerciseId: "asc",
        },
        {
          setNumber: "asc",
        },
      ],
    });

    return NextResponse.json(sets);
  } catch (error) {
    console.error("GET workout sets error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load workout sets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.sessionId || !body.exerciseId || !body.setNumber) {
      return NextResponse.json(
        { error: "Session, exercise and set number are required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the logged-in user.
    const session = await prisma.workoutSession.findFirst({
      where: {
        id: body.sessionId,
        workoutDay: {
          program: {
            userId: user.id,
          },
        },
      },
      include: {
        workoutDay: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Workout session not found" },
        { status: 404 }
      );
    }

    // Verify the exercise belongs to the logged-in user.
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: body.exerciseId,
        userId: user.id,
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      );
    }

    // If a workoutExerciseId is provided, verify that it belongs
    // to the same workout day and refers to the same exercise.
    if (body.workoutExerciseId) {
      const workoutExercise = await prisma.workoutExercise.findFirst({
        where: {
          id: body.workoutExerciseId,
          workoutDayId: session.workoutDayId,
          exerciseId: exercise.id,
          workoutDay: {
            program: {
              userId: user.id,
            },
          },
        },
      });

      if (!workoutExercise) {
        return NextResponse.json(
          { error: "Workout exercise not found" },
          { status: 404 }
        );
      }
    }

    const workoutSet = await prisma.workoutSet.create({
      data: {
        sessionId: session.id,
        exerciseId: exercise.id,
        workoutExerciseId: body.workoutExerciseId || null,
        setNumber: Number(body.setNumber),
        reps:
          body.reps !== undefined && body.reps !== ""
            ? Number(body.reps)
            : null,
        weight:
          body.weight !== undefined && body.weight !== ""
            ? Number(body.weight)
            : null,
        resistance:
          body.resistance !== undefined && body.resistance !== ""
            ? Number(body.resistance)
            : null,
        completed: body.completed ?? false,
        restSeconds:
          body.restSeconds !== undefined && body.restSeconds !== ""
            ? Number(body.restSeconds)
            : null,
        notes: body.notes?.trim() || null,
      },
      include: {
        exercise: true,
      },
    });

    return NextResponse.json(workoutSet, { status: 201 });
  } catch (error) {
    console.error("POST workout set error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save workout set" },
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
        { error: "Workout set ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through:
    // WorkoutSet → Session → WorkoutDay → Program → User
    const existingSet = await prisma.workoutSet.findFirst({
      where: {
        id: body.id,
        session: {
          workoutDay: {
            program: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!existingSet) {
      return NextResponse.json(
        { error: "Workout set not found" },
        { status: 404 }
      );
    }

    const workoutSet = await prisma.workoutSet.update({
      where: {
        id: existingSet.id,
      },
      data: {
        ...(body.reps !== undefined && {
          reps:
            body.reps === "" || body.reps === null
              ? null
              : Number(body.reps),
        }),
        ...(body.weight !== undefined && {
          weight:
            body.weight === "" || body.weight === null
              ? null
              : Number(body.weight),
        }),
        ...(body.resistance !== undefined && {
          resistance:
            body.resistance === "" || body.resistance === null
              ? null
              : Number(body.resistance),
        }),
        ...(body.completed !== undefined && {
          completed: body.completed,
        }),
        ...(body.restSeconds !== undefined && {
          restSeconds:
            body.restSeconds === "" || body.restSeconds === null
              ? null
              : Number(body.restSeconds),
        }),
        ...(body.notes !== undefined && {
          notes: body.notes?.trim() || null,
        }),
      },
      include: {
        exercise: true,
      },
    });

    return NextResponse.json(workoutSet);
  } catch (error) {
    console.error("PATCH workout set error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update workout set" },
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
        { error: "Workout set ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through:
    // WorkoutSet → Session → WorkoutDay → Program → User
    const existingSet = await prisma.workoutSet.findFirst({
      where: {
        id: body.id,
        session: {
          workoutDay: {
            program: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!existingSet) {
      return NextResponse.json(
        { error: "Workout set not found" },
        { status: 404 }
      );
    }

    await prisma.workoutSet.delete({
      where: {
        id: existingSet.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE workout set error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete workout set" },
      { status: 500 }
    );
  }
}