import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDayLabel,
  formatFriendTime,
  formatMessageTime,
  formatShortDate,
  isSameDay,
} from "./formatDate";

const NOW = new Date(2026, 10, 24, 15, 30);

function timeString(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDateString(date: Date, includeYear: boolean) {
  return date.toLocaleDateString(undefined, {
    ...(includeYear ? { year: "numeric" as const } : {}),
    month: "short",
    day: "numeric",
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isSameDay", () => {
  it("compares calendar days, not exact timestamps", () => {
    expect(
      isSameDay(new Date(2026, 10, 24, 0, 1), new Date(2026, 10, 24, 23, 59)),
    ).toBe(true);
    expect(isSameDay(new Date(2026, 10, 24), new Date(2026, 10, 25))).toBe(
      false,
    );
  });

  it("accepts ISO strings", () => {
    expect(isSameDay("2026-11-24T10:00:00", "2026-11-24T22:00:00")).toBe(true);
  });
});

describe("formatMessageTime", () => {
  it("uses a two-digit hour and minute", () => {
    const date = new Date(2026, 10, 24, 9, 5);

    expect(formatMessageTime(date)).toBe(timeString(date));
  });
});

describe("formatShortDate", () => {
  it("includes the year, month, and day", () => {
    const date = new Date(2025, 0, 15);

    expect(formatShortDate(date)).toBe(
      date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("accepts strings", () => {
    const date = new Date(2025, 0, 15);

    expect(formatShortDate(date.toISOString())).toBe(formatShortDate(date));
  });
});

describe("formatDayLabel", () => {
  it("labels today and yesterday", () => {
    expect(formatDayLabel(NOW)).toBe("Today");
    expect(formatDayLabel(new Date(2026, 10, 23, 8, 0))).toBe("Yesterday");
  });

  it("omits the year for dates in the current year", () => {
    const date = new Date(2026, 0, 15);

    expect(formatDayLabel(date)).toBe(shortDateString(date, false));
    expect(formatDayLabel(date)).not.toContain("2026");
  });

  it("includes the year for older dates", () => {
    const date = new Date(2025, 0, 15);

    expect(formatDayLabel(date)).toBe(shortDateString(date, true));
    expect(formatDayLabel(date)).toContain("2025");
  });
});

describe("formatFriendTime", () => {
  it("shows the time for today", () => {
    const date = new Date(2026, 10, 24, 8, 45);

    expect(formatFriendTime(date)).toBe(timeString(date));
  });

  it("shows the date for earlier days", () => {
    const date = new Date(2026, 10, 20);

    expect(formatFriendTime(date)).toBe(shortDateString(date, false));
  });

  it("includes the year for dates outside the current year", () => {
    const date = new Date(2024, 5, 1);

    expect(formatFriendTime(date)).toBe(shortDateString(date, true));
  });
});
