import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();

    const plans = await prisma.dietPlan.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      include: {
        meals: {
          orderBy: {
            order: "asc",
          },
          include: {
            foods: {
              include: {
                food: true,
              },
            },
          },
        },
        targets: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/diet error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to load diet plans" },
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
        { error: "Diet plan name is required" },
        { status: 400 }
      );
    }

    const plan = await prisma.dietPlan.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        active: body.active ?? true,
      },
      include: {
        meals: true,
        targets: true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/diet error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create diet plan" },
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
        { error: "Diet plan ID is required" },
        { status: 400 }
      );
    }

    const existingPlan = await prisma.dietPlan.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Diet plan not found" },
        { status: 404 }
      );
    }

    const plan = await prisma.dietPlan.update({
      where: {
        id: existingPlan.id,
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

    return NextResponse.json(plan);
  } catch (error) {
    console.error("PATCH /api/diet error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update diet plan" },
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
        { error: "Diet plan ID is required" },
        { status: 400 }
      );
    }

    const plan = await prisma.dietPlan.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Diet plan not found" },
        { status: 404 }
      );
    }

    // Archive instead of hard deleting.
    // This protects historical nutrition data later.
    await prisma.dietPlan.update({
      where: {
        id: plan.id,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({
      success: true,
      archived: true,
    });
  } catch (error) {
    console.error("DELETE /api/diet error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete diet plan" },
      { status: 500 }
    );
  }
}