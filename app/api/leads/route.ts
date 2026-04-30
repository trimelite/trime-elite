import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { readLeads, addLead } from "@/lib/leads";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(readLeads());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const lead = addLead({
      name: body.name ?? "",
      business: body.business ?? "",
      website: body.website ?? "",
      rating: body.rating ?? null,
      issues: body.issues ?? "",
      score: body.score ?? null,
    });
    return Response.json(lead, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
