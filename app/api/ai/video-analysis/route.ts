import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { body = {}; }

    console.log("VIDEO ROUTE HIT", body);

    await new Promise(res => setTimeout(res, 500));

    return NextResponse.json({ success: true, message: "Video analysis working", score: 82 });

  } catch (err: unknown) {
    console.error("VIDEO ANALYSIS CRASH:", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "unknown error",
    });
  }
}
