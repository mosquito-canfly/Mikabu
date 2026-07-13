import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Reads the Supabase session via cookies(), so this route must run on the
// Node.js runtime rather than the edge runtime.
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // A head-only count touches the database (registering activity with
    // Supabase) without transferring any row data.
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Health check query failed:", error);
      return NextResponse.json({ ok: false, error: "Database check failed." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected error." }, { status: 500 });
  }
}
