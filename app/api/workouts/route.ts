import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const programs = await prisma.workoutProgram.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      include: {
        days: {
          orderBy: {
            dayNumber: "asc",
          },
          include: {
            exercises: {
              orderBy: {
                order: "asc",
              },
              include: {
                exercise: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error("GET /api/workouts error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load workouts" },
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
        { error: "Workout program name is required" },
        { status: 400 }
      );
    }

    const program = await prisma.workoutProgram.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("POST /api/workouts error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create workout program" },
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
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    const existingProgram = await prisma.workoutProgram.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: "Workout program not found" },
        { status: 404 }
      );
    }

    const program = await prisma.workoutProgram.update({
      where: {
        id: existingProgram.id,
      },
      data: {
        ...(body.name !== undefined && {
          name: body.name.trim(),
        }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.active !== undefined && {
          active: body.active,
        }),
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error("PATCH /api/workouts error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update workout program" },
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
        { error: "Program ID is required" },
        { status: 400 }
      );
    }

    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
      include: {
        days: {
          include: {
            sessions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: "Workout program not found" },
        { status: 404 }
      );
    }

    /*
     * Don't hard-delete workout programs.
     * Workout history must remain intact.
     * Archive by deactivating the program instead.
     */
    await prisma.workoutProgram.update({
      where: {
        id: program.id,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: false,
      archived: true,
    });
  } catch (error) {
    console.error("DELETE /api/workouts error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete workout program" },
      { status: 500 }
    );
  }
}