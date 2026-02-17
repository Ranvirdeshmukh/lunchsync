import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseAvailability } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { shortCode, name, rawInput, userId } = await req.json();

    if (!shortCode || !name || !rawInput) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify session exists
    const sessionDoc = await adminDb
      .collection("sessions")
      .doc(shortCode)
      .get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const session = sessionDoc.data()!;

    // Check for name collision — if a response with this name exists
    // and was created by a different userId, append a number
    let finalName = name;
    const existingDoc = await adminDb
      .collection("sessions")
      .doc(shortCode)
      .collection("responses")
      .doc(name)
      .get();

    if (existingDoc.exists && userId) {
      const existingUserId = existingDoc.data()?.userId;
      if (existingUserId && existingUserId !== userId) {
        // Name collision — find an available variant
        for (let i = 2; i <= 10; i++) {
          const variant = `${name} ${i}`;
          const variantDoc = await adminDb
            .collection("sessions")
            .doc(shortCode)
            .collection("responses")
            .doc(variant)
            .get();
          if (!variantDoc.exists) {
            finalName = variant;
            break;
          }
        }
      }
    }

    // Parse natural language with AI
    const windows = await parseAvailability(
      rawInput,
      session.dateRangeStart,
      session.dateRangeEnd
    );

    const now = new Date().toISOString();

    await adminDb
      .collection("sessions")
      .doc(shortCode)
      .collection("responses")
      .doc(finalName)
      .set({
        rawInput,
        windows,
        userId: userId || null,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json(
      {
        name: finalName,
        windows,
        windowCount: windows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
