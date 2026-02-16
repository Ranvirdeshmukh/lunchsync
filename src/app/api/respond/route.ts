import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseAvailability } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { shortCode, name, rawInput } = await req.json();

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

    // Parse natural language with AI
    const windows = await parseAvailability(
      rawInput,
      session.dateRangeStart,
      session.dateRangeEnd
    );

    const now = new Date().toISOString();

    // Upsert response (name as doc ID = automatic overwrite)
    await adminDb
      .collection("sessions")
      .doc(shortCode)
      .collection("responses")
      .doc(name)
      .set({
        rawInput,
        windows,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({ name, windows }, { status: 200 });
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
