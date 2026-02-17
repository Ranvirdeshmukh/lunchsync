import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateShortCode } from "@/lib/shortcode";
import { parseAvailability } from "@/lib/ai";
import { customAlphabet } from "nanoid";

const generateToken = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  24
);

export async function POST(req: NextRequest) {
  try {
    const { title, dateRangeStart, dateRangeEnd, createdBy, creatorAvailability } =
      await req.json();

    if (!title || !dateRangeStart || !dateRangeEnd || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const shortCode = generateShortCode();
    const creatorToken = generateToken();
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
      creatorToken,
      confirmedTime: null,
      createdAt: now,
      expiresAt,
    });

    // If creator provided availability, parse and save it as a response
    if (creatorAvailability && creatorAvailability.trim()) {
      const windows = await parseAvailability(
        creatorAvailability.trim(),
        dateRangeStart,
        dateRangeEnd
      );

      await adminDb
        .collection("sessions")
        .doc(shortCode)
        .collection("responses")
        .doc(createdBy)
        .set({
          rawInput: creatorAvailability.trim(),
          windows,
          createdAt: now,
          updatedAt: now,
        });
    }

    return NextResponse.json({ shortCode, creatorToken }, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
