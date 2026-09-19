function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const dateA = parseDate(a);
  const dateB = parseDate(b);

  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function formatMessageTime(value: Date | string): string {
  return parseDate(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(value: Date | string): string {
  const date = parseDate(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  }

  if (isSameDay(date, yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, {
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatFriendTime(value: Date | string): string {
  const date = parseDate(value);
  const today = new Date();

  if (isSameDay(date, today)) {
    return formatMessageTime(date);
  }

  return date.toLocaleDateString(undefined, {
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    month: "short",
    day: "numeric",
  });
}
