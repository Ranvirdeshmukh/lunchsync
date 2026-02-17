import { TimeWindow, BestTime } from "./types";

interface PersonWindows {
  name: string;
  windows: TimeWindow[];
}

const SLOT_MINUTES = 15;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Find the best overlapping time slots across all responses.
 * Uses a slot-based approach: discretize into 15-min slots, count overlaps,
 * find contiguous blocks at each overlap level.
 */
export function findBestTimes(responses: PersonWindows[]): BestTime[] {
  if (responses.length === 0) return [];

  // Collect all unique days
  const allDays = new Set<string>();
  for (const r of responses) {
    for (const w of r.windows) {
      allDays.add(w.day);
    }
  }

  const results: BestTime[] = [];
  const seenBlocks = new Set<string>();

  for (const day of allDays) {
    // Map of slot (minute offset) -> set of available people
    const slotMap = new Map<number, Set<string>>();

    for (const r of responses) {
      const dayWindows = r.windows.filter((w) => w.day === day);
      for (const w of dayWindows) {
        const start = timeToMinutes(w.startTime);
        const end = timeToMinutes(w.endTime);
        for (let slot = start; slot < end; slot += SLOT_MINUTES) {
          if (!slotMap.has(slot)) slotMap.set(slot, new Set());
          slotMap.get(slot)!.add(r.name);
        }
      }
    }

    if (slotMap.size === 0) continue;

    // Find max overlap count
    let maxCount = 0;
    for (const names of slotMap.values()) {
      maxCount = Math.max(maxCount, names.size);
    }

    // For each overlap level, find contiguous blocks where EXACTLY
    // that many people overlap (same set of people throughout)
    for (let count = maxCount; count >= 2; count--) {
      // Get sorted slots where exactly `count` people are available
      const slots = Array.from(slotMap.entries())
        .filter(([, names]) => names.size === count)
        .sort((a, b) => a[0] - b[0]);

      let blockStart = -1;
      let blockNames: string[] = [];
      let prevSlot = -1;

      function saveBlock() {
        if (blockStart === -1) return;
        const key = `${day}-${blockStart}-${prevSlot}-${blockNames.sort().join(",")}`;
        if (seenBlocks.has(key)) return;
        seenBlocks.add(key);
        results.push({
          day,
          startTime: minutesToTime(blockStart),
          endTime: minutesToTime(prevSlot + SLOT_MINUTES),
          availableCount: blockNames.length,
          availableNames: [...blockNames],
          durationMinutes: prevSlot + SLOT_MINUTES - blockStart,
        });
      }

      for (const [slot, names] of slots) {
        const currentNames = Array.from(names).sort();
        if (
          blockStart === -1 ||
          slot !== prevSlot + SLOT_MINUTES ||
          currentNames.join(",") !== blockNames.sort().join(",")
        ) {
          saveBlock();
          blockStart = slot;
          blockNames = currentNames;
        }
        prevSlot = slot;
      }
      saveBlock();
    }
  }

  // Sort: most people available -> longest duration -> earlier day/time
  results.sort((a, b) => {
    if (b.availableCount !== a.availableCount)
      return b.availableCount - a.availableCount;
    if (b.durationMinutes !== a.durationMinutes)
      return b.durationMinutes - a.durationMinutes;
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    return a.startTime.localeCompare(b.startTime);
  });

  return results;
}
