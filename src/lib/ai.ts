import Anthropic from "@anthropic-ai/sdk";
import { TimeWindow } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseAvailability(
  rawInput: string,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<TimeWindow[]> {
  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a scheduling assistant. Parse the following natural language availability into structured time windows.

Context:
- Today is ${dayOfWeek}, ${today}
- The scheduling range is ${dateRangeStart} to ${dateRangeEnd}
- Default availability window when no end time is specified: assume 3 hours from start time
- If only a day is mentioned with no times, assume 11:00-17:00 (typical lunch/afternoon range)
- Use 24-hour time format (e.g., "13:00" not "1:00 PM")
- "After X" means from X onwards, use X to X+3hours
- "Before X" means from 09:00 to X
- "Morning" = 09:00-12:00, "Afternoon" = 12:00-17:00, "Evening" = 17:00-21:00, "Lunch" = 11:30-13:30

User input: "${rawInput}"

Respond ONLY with a JSON array of time windows. No other text. Example:
[{"day": "2026-02-19", "startTime": "13:00", "endTime": "16:00"}]

If the input is completely unparseable, respond with an empty array: []`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Extract JSON array from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const windows: TimeWindow[] = JSON.parse(jsonMatch[0]);

    // Validate the parsed windows
    return windows.filter(
      (w) =>
        w.day &&
        w.startTime &&
        w.endTime &&
        /^\d{4}-\d{2}-\d{2}$/.test(w.day) &&
        /^\d{2}:\d{2}$/.test(w.startTime) &&
        /^\d{2}:\d{2}$/.test(w.endTime)
    );
  } catch {
    return [];
  }
}
