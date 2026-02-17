"use client";

import { TimeWindow } from "@/lib/types";

interface TimelineBarProps {
  name: string;
  windows: TimeWindow[];
  day: string;
}

const DAY_START = 8 * 60; // 8:00 AM
const DAY_END = 22 * 60; // 10:00 PM
const DAY_RANGE = DAY_END - DAY_START;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const COLORS = [
  "bg-[#1e40af]",
  "bg-[#34c759]",
  "bg-[#ff9500]",
  "bg-[#8b5cf6]",
  "bg-[#f97316]",
  "bg-[#3b82f6]",
  "bg-[#ef4444]",
  "bg-[#fbbf24]",
];

export function TimelineBar({
  name,
  windows,
  day,
  colorIndex,
}: TimelineBarProps & { colorIndex: number }) {
  const dayWindows = windows.filter((w) => w.day === day);
  const color = COLORS[colorIndex % COLORS.length];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium w-20 truncate shrink-0">
        {name}
      </span>
      <div className="flex-1 h-8 bg-muted rounded-md relative overflow-hidden">
        {dayWindows.map((w, i) => {
          const start = Math.max(timeToMinutes(w.startTime), DAY_START);
          const end = Math.min(timeToMinutes(w.endTime), DAY_END);
          const left = ((start - DAY_START) / DAY_RANGE) * 100;
          const width = ((end - start) / DAY_RANGE) * 100;

          return (
            <div
              key={i}
              className={`absolute top-1 bottom-1 rounded ${color} opacity-80`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${w.startTime} - ${w.endTime}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function TimelineHeader() {
  const hours = [8, 10, 12, 14, 16, 18, 20];
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0" />
      <div className="flex-1 relative h-5">
        {hours.map((h) => {
          const left = ((h * 60 - DAY_START) / DAY_RANGE) * 100;
          const label =
            h === 12
              ? "12p"
              : h > 12
                ? `${h - 12}p`
                : `${h}a`;
          return (
            <span
              key={h}
              className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
