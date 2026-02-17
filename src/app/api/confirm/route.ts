import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { shortCode, confirmedTime, creatorToken } = await req.json();

    if (!shortCode || !creatorToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // Verify creator identity
    const session = sessionDoc.data()!;
    if (session.creatorToken !== creatorToken) {
      return NextResponse.json(
        { error: "Only the session creator can confirm or unlock times" },
        { status: 403 }
      );
    }

    // confirmedTime = null means unlock, otherwise lock
    await adminDb.collection("sessions").doc(shortCode).update({
      confirmedTime: confirmedTime ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming time:", error);
    return NextResponse.json(
      { error: "Failed to confirm time" },
      { status: 500 }
    );
  }
}
