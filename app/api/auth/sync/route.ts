import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await requireCurrentUser();

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error("POST /api/auth/sync error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to sync account" },
      { status: 500 }
    );
  }
}