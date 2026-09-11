import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const entries = await prisma.timetableEntry.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("GET /api/timetable error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load timetable" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    const entry = await prisma.timetableEntry.create({
      data: {
        userId: user.id,
        title: body.title,
        startTime: body.start,
        endTime: body.end,
        category: body.category ?? "Personal",
        priority: body.priority ?? "Medium",
        dayOfWeek: Number(body.dayOfWeek ?? new Date().getDay()),
        enabled: body.enabled ?? true,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/timetable error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create timetable entry" },
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
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const existingEntry = await prisma.timetableEntry.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found" },
        { status: 404 }
      );
    }

    const entry = await prisma.timetableEntry.update({
      where: {
        id: existingEntry.id,
      },
      data: {
        title: body.title,
        startTime: body.start,
        endTime: body.end,
        category: body.category,
        priority: body.priority,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/timetable error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update timetable entry" },
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
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const existingEntry = await prisma.timetableEntry.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found" },
        { status: 404 }
      );
    }

    await prisma.timetableEntry.delete({
      where: {
        id: existingEntry.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/timetable error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete timetable entry" },
      { status: 500 }
    );
  }
}