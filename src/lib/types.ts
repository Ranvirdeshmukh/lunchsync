export interface TimeWindow {
  day: string; // "2026-02-19"
  startTime: string; // "13:00"
  endTime: string; // "17:00"
}

export interface Response {
  name: string;
  rawInput: string;
  windows: TimeWindow[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  shortCode: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdBy: string;
  creatorToken: string;
  confirmedTime: string | null;
  location?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface OverlapSlot {
  day: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  availableNames: string[];
}

export interface BestTime {
  day: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  availableNames: string[];
  durationMinutes: number;
}
