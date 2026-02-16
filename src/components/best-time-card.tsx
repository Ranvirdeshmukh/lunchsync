"use client";

import { BestTime } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BestTimeCardProps {
  bestTime: BestTime;
  totalPeople: number;
  onConfirm: (time: BestTime) => void;
  isCreator: boolean;
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

export function BestTimeCard({
  bestTime,
  totalPeople,
  onConfirm,
  isCreator,
}: BestTimeCardProps) {
  const allAvailable = bestTime.availableCount === totalPeople;

  return (
    <Card
      className={`border-2 ${allAvailable ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-blue-300"}`}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {allAvailable && (
              <Badge className="bg-emerald-600 mb-1">BEST TIME</Badge>
            )}
            <p className="text-lg font-semibold">{formatDay(bestTime.day)}</p>
            <p className="text-2xl font-bold">
              {formatTime(bestTime.startTime)} &ndash;{" "}
              {formatTime(bestTime.endTime)}
            </p>
            <p className="text-sm text-muted-foreground">
              {bestTime.availableCount} of {totalPeople} available:{" "}
              {bestTime.availableNames.join(", ")}
            </p>
          </div>
          {isCreator && (
            <Button
              size="sm"
              onClick={() => onConfirm(bestTime)}
              className="shrink-0"
            >
              Lock this time
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
