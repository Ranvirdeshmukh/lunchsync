import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { findBestTimes } from "@/lib/overlap";
import { Response } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const sessionDoc = await adminDb.collection("sessions").doc(code).get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const session = sessionDoc.data()!;

    // Fetch all responses
    const responsesSnap = await adminDb
      .collection("sessions")
      .doc(code)
      .collection("responses")
      .get();

    const responses: Response[] = responsesSnap.docs.map((doc) => ({
      name: doc.id,
      rawInput: doc.data().rawInput,
      windows: doc.data().windows || [],
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt,
    }));

    // Compute overlaps
    const bestTimes = findBestTimes(
      responses.map((r) => ({ name: r.name, windows: r.windows }))
    );

    // Strip creatorToken before sending to client
    const { creatorToken: _token, ...safeSession } = session;

    return NextResponse.json({
      session: { ...safeSession, shortCode: code },
      responses,
      bestTimes,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
