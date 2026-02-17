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
 * find contiguous blocks at each overlap level (max, max-1, etc.).
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

    // Extract contiguous blocks at each overlap level (max down to 2)
    for (let count = maxCount; count >= 2; count--) {
      const slots = Array.from(slotMap.entries())
        .filter(([, names]) => names.size >= count)
        .sort((a, b) => a[0] - b[0]);

      let blockStart = -1;
      let blockNames: Set<string> = new Set();
      let prevSlot = -1;

      for (const [slot, names] of slots) {
        if (blockStart === -1 || slot !== prevSlot + SLOT_MINUTES) {
          if (blockStart !== -1) {
            const key = `${day}-${blockStart}-${prevSlot}`;
            if (!seenBlocks.has(key)) {
              seenBlocks.add(key);
              const namesArr = Array.from(blockNames);
              results.push({
                day,
                startTime: minutesToTime(blockStart),
                endTime: minutesToTime(prevSlot + SLOT_MINUTES),
                availableCount: namesArr.length,
                availableNames: namesArr,
                durationMinutes: prevSlot + SLOT_MINUTES - blockStart,
              });
            }
          }
          blockStart = slot;
          blockNames = new Set(names);
        } else {
          // Intersect names to get people available for the whole block
          for (const n of blockNames) {
            if (!names.has(n)) blockNames.delete(n);
          }
        }
        prevSlot = slot;
      }

      if (blockStart !== -1) {
        const key = `${day}-${blockStart}-${prevSlot}`;
        if (!seenBlocks.has(key)) {
          seenBlocks.add(key);
          const namesArr = Array.from(blockNames);
          results.push({
            day,
            startTime: minutesToTime(blockStart),
            endTime: minutesToTime(prevSlot + SLOT_MINUTES),
            availableCount: namesArr.length,
            availableNames: namesArr,
            durationMinutes: prevSlot + SLOT_MINUTES - blockStart,
          });
        }
      }
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
