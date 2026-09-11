import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const rules = await prisma.rule.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { enabled: "desc" },
        { priority: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("GET /api/rules error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load rules" },
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
        { error: "Rule title is required" },
        { status: 400 }
      );
    }

    const rule = await prisma.rule.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        title: body.title.trim(),
        description: body.description?.trim() || null,
        type: body.type ?? "MUST_DO",
        priority: body.priority ?? "Medium",
        enabled: body.enabled ?? true,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("POST /api/rules error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create rule" },
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
        { error: "Rule ID is required" },
        { status: 400 }
      );
    }

    const existingRule = await prisma.rule.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Rule not found" },
        { status: 404 }
      );
    }

    const rule = await prisma.rule.update({
      where: {
        id: existingRule.id,
      },
      data: {
        ...(body.title !== undefined && {
          title: body.title.trim(),
        }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.type !== undefined && {
          type: body.type,
        }),
        ...(body.priority !== undefined && {
          priority: body.priority,
        }),
        ...(body.enabled !== undefined && {
          enabled: body.enabled,
        }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("PATCH /api/rules error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update rule" },
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
        { error: "Rule ID is required" },
        { status: 400 }
      );
    }

    const existingRule = await prisma.rule.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Rule not found" },
        { status: 404 }
      );
    }

    await prisma.rule.delete({
      where: {
        id: existingRule.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/rules error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}