import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          completed: "asc",
        },
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        priority: body.priority ?? "Medium",
        category: body.category ?? "Personal",
        completed: body.completed ?? false,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create task" },
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
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const task = await prisma.task.update({
      where: {
        id: existingTask.id,
      },
      data: {
        ...(body.title !== undefined && {
          title: body.title.trim(),
        }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.dueDate !== undefined && {
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        }),
        ...(body.priority !== undefined && {
          priority: body.priority,
        }),
        ...(body.category !== undefined && {
          category: body.category,
        }),
        ...(body.completed !== undefined && {
          completed: body.completed,
        }),
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH /api/tasks error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update task" },
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
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: {
        id: existingTask.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tasks error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}