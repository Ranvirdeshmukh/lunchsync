"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Session, Response, BestTime } from "@/lib/types";
import { findBestTimes } from "@/lib/overlap";
import { RespondForm } from "@/components/respond-form";
import { ResultsDisplay } from "@/components/results-display";
import { Button } from "@/components/ui/button";

export default function SessionPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [bestTimes, setBestTimes] = useState<BestTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initial fetch from API (includes overlap computation)
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${code}`);
      if (!res.ok) {
        setError("Session not found");
        return;
      }
      const data = await res.json();
      setSession(data.session);
      setResponses(data.responses);
      setBestTimes(data.bestTimes);
    } catch {
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Real-time listener for session doc (for confirmedTime updates)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sessions", code), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSession((prev) =>
          prev ? { ...prev, confirmedTime: data.confirmedTime ?? null } : prev
        );
      }
    });
    return () => unsub();
  }, [code]);

  // Real-time listener for responses subcollection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "sessions", code, "responses"),
      (snap) => {
        const newResponses: Response[] = snap.docs.map((d) => ({
          name: d.id,
          rawInput: d.data().rawInput,
          windows: d.data().windows || [],
          createdAt: d.data().createdAt,
          updatedAt: d.data().updatedAt,
        }));
        setResponses(newResponses);

        // Recompute overlaps client-side
        const newBestTimes = findBestTimes(
          newResponses.map((r) => ({ name: r.name, windows: r.windows }))
        );
        setBestTimes(newBestTimes);
      }
    );
    return () => unsub();
  }, [code]);

  // Creator auth via token (not name matching)
  const creatorToken =
    typeof window !== "undefined"
      ? localStorage.getItem(`mealsync-creator-${code}`) || ""
      : "";
  const isCreator = !!creatorToken;

  async function handleConfirm(time: BestTime) {
    if (!creatorToken) return;
    try {
      await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortCode: code,
          creatorToken,
          confirmedTime: JSON.stringify({
            day: time.day,
            startTime: time.startTime,
            endTime: time.endTime,
          }),
        }),
      });
    } catch (err) {
      console.error("Failed to confirm:", err);
    }
  }

  async function handleUnlock() {
    if (!creatorToken) return;
    try {
      await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortCode: code,
          creatorToken,
          confirmedTime: null,
        }),
      });
    } catch (err) {
      console.error("Failed to unlock:", err);
    }
  }

  function shareLink() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: session?.title || "mealSync", url }).catch(() => {
        // User cancelled or share failed — fall back to copy
        copyLink();
      });
    } else {
      copyLink();
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="inline-block w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Session not found</p>
          <p className="text-muted-foreground text-sm">
            This link may have expired or doesn&apos;t exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1 pt-4">
          <p className="text-xs text-[#1c093f] font-semibold uppercase tracking-wide">
            mealSync
          </p>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(session.dateRangeStart + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            &ndash;{" "}
            {new Date(session.dateRangeEnd + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Share link */}
        <div className="flex justify-center">
          <Button onClick={shareLink} size="sm" className="px-6">
            {copied ? "Copied!" : "Share link with your group"}
          </Button>
        </div>

        {/* Respond form */}
        {!session.confirmedTime && (
          <RespondForm
            shortCode={code}
            responses={responses}
            onSubmitted={fetchSession}
          />
        )}

        {/* Results */}
        <ResultsDisplay
          responses={responses}
          bestTimes={bestTimes}
          confirmedTime={session.confirmedTime}
          isCreator={isCreator}
          onConfirm={handleConfirm}
          onUnlock={handleUnlock}
        />
      </div>
    </main>
  );
}
