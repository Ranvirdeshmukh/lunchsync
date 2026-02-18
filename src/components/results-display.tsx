"use client";

import { Response, BestTime } from "@/lib/types";
import { BestTimeCard } from "./best-time-card";
import { TimelineBar, TimelineHeader } from "./timeline-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ResultsDisplayProps {
  responses: Response[];
  bestTimes: BestTime[];
  confirmedTime: string | null;
  isCreator: boolean;
  sessionTitle?: string;
  sessionLocation?: string;
  onConfirm: (time: BestTime) => void;
  onUnlock: () => void;
}

export function formatDay(day: string): string {
  const date = new Date(day + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function generateGoogleCalendarUrl(
  parsed: { day: string; startTime: string; endTime: string },
  title?: string,
  location?: string
): string {
  const start = parsed.day.replace(/-/g, "") + "T" + parsed.startTime.replace(":", "") + "00";
  const end = parsed.day.replace(/-/g, "") + "T" + parsed.endTime.replace(":", "") + "00";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "mealSync meetup",
    dates: `${start}/${end}`,
  });
  if (location) params.set("location", location);
  return `https://calendar.google.com/calendar/r/eventnew?${params.toString()}`;
}

function generateIcsBlob(
  parsed: { day: string; startTime: string; endTime: string },
  title?: string,
  location?: string
): Blob {
  const start = parsed.day.replace(/-/g, "") + "T" + parsed.startTime.replace(":", "") + "00";
  const end = parsed.day.replace(/-/g, "") + "T" + parsed.endTime.replace(":", "") + "00";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mealSync//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title || "mealSync meetup"}`,
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return new Blob([ics], { type: "text/calendar;charset=utf-8" });
}

export function ResultsDisplay({
  responses,
  bestTimes,
  confirmedTime,
  isCreator,
  sessionTitle,
  sessionLocation,
  onConfirm,
  onUnlock,
}: ResultsDisplayProps) {
  const [copiedResult, setCopiedResult] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showResponses, setShowResponses] = useState(false);

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

    function downloadIcs() {
      if (!parsed) return;
      const blob = generateIcsBlob(parsed, sessionTitle, sessionLocation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mealsync-event.ics";
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div className="space-y-3">
        <Card className="border-2 border-[#34c759] bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-sm font-medium text-[#34c759] uppercase tracking-wide">
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
            {sessionLocation && (
              <p className="text-sm text-muted-foreground">{sessionLocation}</p>
            )}
            <p className="text-muted-foreground">See you there!</p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {parsed && (
                <>
                  <Button variant="outline" size="sm" onClick={copyResult}>
                    {copiedResult ? "Copied!" : "Copy to share"}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={generateGoogleCalendarUrl(parsed, sessionTitle, sessionLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Calendar
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadIcs}>
                    Download .ics
                  </Button>
                </>
              )}
              {isCreator && (
                <Button variant="outline" size="sm" onClick={onUnlock}>
                  Unlock
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <ResponsesList responses={responses} expanded={showResponses} onToggle={() => setShowResponses(!showResponses)} />
      </div>
    );
  }

  const allDays = new Set<string>();
  for (const r of responses) {
    for (const w of r.windows) {
      allDays.add(w.day);
    }
  }
  const sortedDays = Array.from(allDays).sort();

  const INITIAL_CARDS = 3;
  const visibleTimes = showAllTimes ? bestTimes : bestTimes.slice(0, INITIAL_CARDS);

  return (
    <div className="space-y-3">
      {bestTimes.length > 0 && (
        <div className="space-y-2">
          {visibleTimes.map((bt, i) => (
            <BestTimeCard
              key={i}
              bestTime={bt}
              totalPeople={responses.length}
              onConfirm={onConfirm}
              isCreator={isCreator}
            />
          ))}
          {bestTimes.length > INITIAL_CARDS && (
            <button
              onClick={() => setShowAllTimes(!showAllTimes)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            >
              {showAllTimes
                ? `Show fewer`
                : `Show ${bestTimes.length - INITIAL_CARDS} more options`}
            </button>
          )}
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

      {sortedDays.length > 0 && (
        <Card>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between px-6 py-3 text-left"
          >
            <span className="text-sm font-semibold">View full availability</span>
            {showTimeline ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showTimeline && (
            <CardContent className="pt-0 space-y-4">
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
          )}
        </Card>
      )}

      <ResponsesList responses={responses} expanded={showResponses} onToggle={() => setShowResponses(!showResponses)} />
    </div>
  );
}

function ResponsesList({
  responses,
  expanded,
  onToggle,
}: {
  responses: Response[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            Responses ({responses.length})
          </span>
          <div className="flex -space-x-1.5">
            {responses.slice(0, 5).map((r) => (
              <div
                key={r.name}
                className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-medium ring-2 ring-card"
              >
                {r.name[0].toUpperCase()}
              </div>
            ))}
            {responses.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-medium ring-2 ring-card">
                +{responses.length - 5}
              </div>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <CardContent className="pt-0">
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
      )}
    </Card>
  );
}
