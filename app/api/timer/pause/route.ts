import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

type PausePayload = {
  segment_id: string;
  ended_at: string;
};

function isPausePayload(value: unknown): value is PausePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.segment_id === "string" && typeof record.ended_at === "string";
}

export async function POST(req: Request) {
  const payload: unknown = await req.json().catch(() => null);

  if (!isPausePayload(payload) || !isUuid(payload.segment_id)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role is not configured" }, { status: 503 });
  }

  const { error } = await supabase
    .from("session_segments")
    .update({ ended_at: payload.ended_at })
    .eq("id", payload.segment_id)
    .is("ended_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new Response("OK");
}
