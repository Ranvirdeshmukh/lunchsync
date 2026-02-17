"use client";

import { Response, BestTime } from "@/lib/types";
import { BestTimeCard } from "./best-time-card";
import { TimelineBar, TimelineHeader } from "./timeline-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ResultsDisplayProps {
  responses: Response[];
  bestTimes: BestTime[];
  confirmedTime: string | null;
  isCreator: boolean;
  onConfirm: (time: BestTime) => void;
  onUnlock: () => void;
}

function formatDay(day: string): string {
  const date = new Date(day + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function ResultsDisplay({
  responses,
  bestTimes,
  confirmedTime,
  isCreator,
  onConfirm,
  onUnlock,
}: ResultsDisplayProps) {
  const [copiedResult, setCopiedResult] = useState(false);

  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Waiting for responses... Share the link with your group!
          </p>
        </CardContent>
      </Card>
    );
  }

  // If a time is confirmed, show that prominently
  if (confirmedTime) {
    let parsed: { day: string; startTime: string; endTime: string } | null =
      null;
    try {
      parsed = JSON.parse(confirmedTime);
    } catch {
      // ignore
    }

    function copyResult() {
      if (!parsed) return;
      const text = `${formatDay(parsed.day)}, ${formatTime(parsed.startTime)} – ${formatTime(parsed.endTime)}`;
      navigator.clipboard.writeText(text);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    }

    return (
      <div className="space-y-4">
        <Card className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Confirmed
            </p>
            {parsed ? (
              <>
                <p className="text-xl font-bold">{formatDay(parsed.day)}</p>
                <p className="text-3xl font-bold">
                  {formatTime(parsed.startTime)} &ndash;{" "}
                  {formatTime(parsed.endTime)}
                </p>
              </>
            ) : (
              <p className="text-xl font-bold">{confirmedTime}</p>
            )}
            <p className="text-muted-foreground">See you there!</p>
            <div className="flex justify-center gap-2 pt-1">
              {parsed && (
                <Button variant="outline" size="sm" onClick={copyResult}>
                  {copiedResult ? "Copied!" : "Copy to share"}
                </Button>
              )}
              {isCreator && (
                <Button variant="outline" size="sm" onClick={onUnlock}>
                  Unlock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <ResponsesList responses={responses} />
      </div>
    );
  }

  // Collect all unique days from responses
  const allDays = new Set<string>();
  for (const r of responses) {
    for (const w of r.windows) {
      allDays.add(w.day);
    }
  }
  const sortedDays = Array.from(allDays).sort();

  return (
    <div className="space-y-4">
      {/* Best times */}
      {bestTimes.length > 0 && (
        <div className="space-y-2">
          {bestTimes.slice(0, 5).map((bt, i) => (
            <BestTimeCard
              key={i}
              bestTime={bt}
              totalPeople={responses.length}
              onConfirm={onConfirm}
              isCreator={isCreator}
            />
          ))}
        </div>
      )}

      {bestTimes.length === 0 && responses.length >= 2 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No overlapping times found yet. More responses may help!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline visualization per day */}
      {sortedDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedDays.map((day) => (
              <div key={day} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {formatDay(day)}
                </p>
                <TimelineHeader />
                {responses.map((r, i) => (
                  <TimelineBar
                    key={r.name}
                    name={r.name}
                    windows={r.windows}
                    day={day}
                    colorIndex={i}
                  />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ResponsesList responses={responses} />
    </div>
  );
}

function ResponsesList({ responses }: { responses: Response[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Responses ({responses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {responses.map((r) => (
            <div key={r.name} className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                {r.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{r.name}</p>
                <p className="text-sm text-muted-foreground">
                  &quot;{r.rawInput}&quot;
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
