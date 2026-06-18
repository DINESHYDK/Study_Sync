"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDurationCompact, secondsBetween } from "@/lib/timer";
import { todayLocalDate } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";
import { useTimerStore } from "@/stores/useTimerStore";

// ── Constants ──────────────────────────────────────────────────────────────────

const RADIUS = 130;
const STROKE_WIDTH = 40;
const CENTER = 180;
const VIEW_SIZE = 360;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Arc-to-arc gap in SVG user units.
const GAP = (CIRCUMFERENCE / 360) * 1.2;
// Cycle through these six accent colours.
const PALETTE = [
  "#6c63ff", // violet  (primary)
  "#10b981", // emerald
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ec4899", // pink
  "#8b5cf6", // purple
];

// ── Types ──────────────────────────────────────────────────────────────────────

type Period = "today" | "week" | "month";

type SubjectSlice = {
  name: string;
  seconds: number;
  color: string;
  fraction: number;
};

// ── Date helpers ───────────────────────────────────────────────────────────────

function periodRange(period: Period): { from: string; to: string } {
  const today = todayLocalDate();

  if (period === "today") {
    return { from: today, to: today };
  }

  if (period === "week") {
    const d = new Date(`${today}T12:00:00`);
    const day = d.getDay(); // 0 = Sun
    const daysFromMon = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - daysFromMon);
    return { from: d.toISOString().slice(0, 10), to: today };
  }

  // month
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

// ── Arc math ───────────────────────────────────────────────────────────────────

/**
 * Computes stroke-dasharray/offset values for a donut arc given a fraction
 * of the full circle. The arc is rendered with a small inset gap at both ends
 * so adjacent arcs don't visually bleed into each other.
 *
 * @param fraction  0..1 share of the full circle
 * @returns { dashArray, dashOffset, rotateDeg }
 *   - dashArray  → stroke-dasharray value ("arcLen circumference")
 *   - dashOffset → stroke-dashoffset value (no additional rotation offset needed)
 *   - rotateDeg  → transform="rotate(deg, cx, cy)" to position the arc start
 */
function arcProps(fraction: number, startFraction: number) {
  const arcLen = Math.max(0, fraction * CIRCUMFERENCE - GAP * 2);
  const startDeg = startFraction * 360 - 90; // -90 → start at the top
  return {
    dashArray: `${arcLen} ${CIRCUMFERENCE}`,
    dashOffset: 0,
    rotateDeg: startDeg,
  };
}

// ── Animated donut arc ─────────────────────────────────────────────────────────

type ArcProps = {
  color: string;
  fraction: number;
  startFraction: number;
  delay: number;
  totalSeconds: number;
};

function DonutArc({ color, fraction, startFraction, delay, totalSeconds }: ArcProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const { dashArray, rotateDeg } = arcProps(fraction, startFraction);

  // Animate from "0 CIRCUMFERENCE" to the real dashArray using a CSS transition.
  // We use a ref so the transition fires after the first paint.
  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;

    // Force the browser to see the initial "invisible" state first.
    el.style.strokeDasharray = `0 ${CIRCUMFERENCE}`;

    const id = window.setTimeout(() => {
      el.style.transition = `stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1) ${delay}s`;
      el.style.strokeDasharray = dashArray;
    }, 30);

    return () => window.clearTimeout(id);
    // Re-run whenever data changes so the animation replays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashArray, delay, totalSeconds]);

  return (
    <circle
      ref={circleRef}
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      strokeDasharray={`0 ${CIRCUMFERENCE}`}
      strokeLinecap="butt"
      transform={`rotate(${rotateDeg}, ${CENTER}, ${CENTER})`}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SubjectChart({ fixedDate }: { fixedDate?: string }) {
  const { supabase, isConfigured } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const storeSegments = useTimerStore((state) => state.segments);
  const [period, setPeriod] = useState<Period>("today");
  const [slices, setSlices] = useState<SubjectSlice[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isLoading, setLoading] = useState(true);

  // When a fixed date is provided, derive a one-day range from it.
  const { from: effectiveFrom, to: effectiveTo } = fixedDate
    ? { from: fixedDate, to: fixedDate }
    : periodRange(period);

  const loadData = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    setSlices([]); // reset so arcs re-animate on period change

    try {
      if (!isConfigured) {
        setLoading(false);
        return;
      }

      // Step 1: get session IDs in the date range.
      const { data: sessions, error: sessErr } = await supabase
        .from("study_sessions")
        .select("id")
        .eq("user_id", profile.id)
        .gte("date", effectiveFrom)
        .lte("date", effectiveTo);

      if (sessErr) {
        toast.error(sessErr.message);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setSlices([]);
        setTotalSeconds(0);
        return;
      }

      // Step 2: fetch all segments for those sessions.
      const { data: segments, error: segErr } = await supabase
        .from("session_segments")
        .select("subject_name, duration_secs, started_at, ended_at")
        .in(
          "session_id",
          sessions.map((s) => s.id),
        );

      if (segErr) {
        toast.error(segErr.message);
        return;
      }

      // Step 3: group by subject, summing durations.
      const grouped: Record<string, number> = {};
      for (const seg of segments ?? []) {
        const name = seg.subject_name?.trim() || "General";
        const secs =
          seg.duration_secs !== null
            ? seg.duration_secs
            : seg.ended_at === null
              ? secondsBetween(seg.started_at)
              : 0;
        grouped[name] = (grouped[name] ?? 0) + secs;
      }

      // Step 4: sort desc and cap at 5 named subjects + "Other".
      const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
      const top5 = sorted.slice(0, 5);
      const otherSecs = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
      if (otherSecs > 0) top5.push(["Other", otherSecs]);

      const grandTotal = top5.reduce((s, [, v]) => s + v, 0);
      if (grandTotal === 0) {
        setSlices([]);
        setTotalSeconds(0);
        return;
      }

      const built: SubjectSlice[] = top5.map(([name, secs], i) => ({
        name,
        seconds: secs,
        color: PALETTE[i % PALETTE.length],
        fraction: secs / grandTotal,
      }));

      setSlices(built);
      setTotalSeconds(grandTotal);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, profile, supabase, effectiveFrom, effectiveTo, storeSegments]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const periodLabel: Record<Period, string> = {
    today: fixedDate ?? "Today",
    week: "This Week",
    month: "This Month",
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Subject Breakdown</CardTitle>
        {!fixedDate && (
          <Select onValueChange={(v) => setPeriod(v as Period)} value={period}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-40 w-40 animate-pulse rounded-full bg-secondary/60" />
          </div>
        ) : slices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No study data for {periodLabel[period].toLowerCase()}.
            <br />
            Start studying to see your breakdown.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {/* ── SVG Doughnut — centred ──────────────────────────────────── */}
            <div className="relative shrink-0">
              <svg
                aria-label="Subject breakdown donut chart"
                height={VIEW_SIZE}
                role="img"
                viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
                width={VIEW_SIZE}
              >
                {/* Background track */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  fill="none"
                  r={RADIUS}
                  stroke="hsl(var(--secondary))"
                  strokeWidth={STROKE_WIDTH}
                />

                {/* Data arcs */}
                {(() => {
                  let cumulStart = 0;
                  return slices.map((slice, i) => {
                    const start = cumulStart;
                    cumulStart += slice.fraction;
                    return (
                      <DonutArc
                        key={slice.name}
                        color={slice.color}
                        delay={i * 0.08}
                        fraction={slice.fraction}
                        startFraction={start}
                        totalSeconds={totalSeconds}
                      />
                    );
                  });
                })()}

                {/* Center label */}
                <text
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  fontFamily="var(--font-jetbrains-mono)"
                  fontSize="20"
                  fontWeight="700"
                  textAnchor="middle"
                  x={CENTER}
                  y={CENTER - 8}
                >
                  {formatDurationCompact(totalSeconds)}
                </text>
                <text
                  dominantBaseline="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="11"
                  textAnchor="middle"
                  x={CENTER}
                  y={CENTER + 12}
                >
                  {periodLabel[period].toUpperCase()}
                </text>
              </svg>
            </div>

            {/* ── Legend — centred below the chart ────────────────────────── */}
            <ul className="grid w-full max-w-sm gap-3">
              {slices.map((slice) => {
                const pct = Math.round(slice.fraction * 100);
                return (
                  <li
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.5 text-sm"
                    key={slice.name}
                  >
                    {/* Color dot */}
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    {/* Subject name */}
                    <span className="min-w-0 truncate font-medium">{slice.name}</span>
                    {/* Percentage */}
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                    {/* Duration */}
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDurationCompact(slice.seconds)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
