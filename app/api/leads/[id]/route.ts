import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { updateLead } from "@/lib/leads";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const updated = updateLead(Number(id), body);
  if (!updated) return Response.json({ error: "Lead not found" }, { status: 404 });
  return Response.json(updated);
}
