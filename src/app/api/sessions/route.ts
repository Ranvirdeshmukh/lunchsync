import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateShortCode } from "@/lib/shortcode";

export async function POST(req: NextRequest) {
  try {
    const { title, dateRangeStart, dateRangeEnd, createdBy } = await req.json();

    if (!title || !dateRangeStart || !dateRangeEnd || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const shortCode = generateShortCode();
    const now = new Date().toISOString();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    await adminDb.collection("sessions").doc(shortCode).set({
      shortCode,
      title,
      dateRangeStart,
      dateRangeEnd,
      createdBy,
      confirmedTime: null,
      createdAt: now,
      expiresAt,
    });

    return NextResponse.json({ shortCode }, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
