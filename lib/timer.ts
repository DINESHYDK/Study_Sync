import { format, intervalToDuration } from "date-fns";

export function secondsBetween(startIso: string, endIso = new Date().toISOString()) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function formatClock(totalSeconds: number) {
  const normalized = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function formatDurationCompact(totalSeconds: number) {
  const normalized = Math.max(0, Math.floor(totalSeconds));
  const duration = intervalToDuration({ start: 0, end: normalized * 1000 });
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;

  if (hours === 0 && minutes === 0) {
    return `${normalized % 60}s`;
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatTimeRange(startIso: string, endIso: string | null) {
  const start = format(new Date(startIso), "h:mm a");
  const end = endIso ? format(new Date(endIso), "h:mm a") : "...";

  return `${start} - ${end}`;
}

export function segmentDurationSecs(segment: {
  started_at: string;
  ended_at: string | null;
  duration_secs: number | null;
}) {
  if (segment.duration_secs !== null) {
    return segment.duration_secs;
  }

  return secondsBetween(segment.started_at);
}

export function totalDurationSecs(
  segments: Array<{
    started_at: string;
    ended_at: string | null;
    duration_secs: number | null;
  }>,
) {
  return segments.reduce((total, segment) => total + segmentDurationSecs(segment), 0);
}
