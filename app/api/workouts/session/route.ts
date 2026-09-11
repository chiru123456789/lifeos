import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.workoutSession.findMany({
      include: {
        workoutDay: {
          include: {
            program: true,
          },
        },
        sets: {
          include: {
            exercise: true,
          },
          orderBy: {
            setNumber: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET workout sessions error:", error);

    return NextResponse.json(
      { error: "Failed to load workout history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.workoutDayId) {
      return NextResponse.json(
        { error: "Workout day is required" },
        { status: 400 }
      );
    }

    const session = await prisma.workoutSession.create({
      data: {
        workoutDayId: body.workoutDayId,
        durationMin:
          body.durationMin !== undefined && body.durationMin !== ""
            ? Number(body.durationMin)
            : null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST workout session error:", error);

    return NextResponse.json(
      { error: "Failed to create workout session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Workout session ID is required" },
        { status: 400 }
      );
    }

    const session = await prisma.workoutSession.update({
      where: {
        id: body.id,
      },
      data: {
        ...(body.durationMin !== undefined && {
          durationMin:
            body.durationMin === "" || body.durationMin === null
              ? null
              : Number(body.durationMin),
        }),
        ...(body.notes !== undefined && {
          notes: body.notes?.trim() || null,
        }),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("PATCH workout session error:", error);

    return NextResponse.json(
      { error: "Failed to update workout session" },
      { status: 500 }
    );
  }
}