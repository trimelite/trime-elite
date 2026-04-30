import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scraperAgent  = require("../../../../agents/scraperAgent");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const leadAgent     = require("../../../../agents/leadAgent");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scoringAgent  = require("../../../../agents/scoringAgent");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outreachAgent = require("../../../../agents/outreachAgent");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dealAgent     = require("../../../../agents/dealAgent");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const contentAgent  = require("../../../../agents/contentAgent");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { read }      = require("../../../../agents/logger");

    await scraperAgent.run();
    leadAgent.run();
    scoringAgent.run();
    await outreachAgent.run();
    dealAgent.run();
    await contentAgent.run();

    const leads    = leadAgent.getLeads() as { score: number; status: string; dealStage: string }[];
    const scored   = leads.filter(l => l.score > 0).length;
    const outreach = leads.filter(l => l.status === "contacted").length;
    const deals    = leads.filter(l => l.dealStage !== "none").length;

    // Return snapshot inline — no second fetch needed
    return Response.json({
      ok: true,
      counts: { leads: leads.length, scored, outreach, deals },
      snapshot: {
        leads:     read("leads.json")          ?? [],
        outreach:  read("outreach-drafts.json") ?? [],
        deals:     read("deals.json")           ?? [],
        content:   read("content.json"),
        followups: read("followups.json")       ?? [],
        posts:     read("posts.json")           ?? [],
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Agent error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
