import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Run agents inline so the response includes real counts
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

    await scraperAgent.run();
    leadAgent.run();
    scoringAgent.run();
    await outreachAgent.run();
    dealAgent.run();
    await contentAgent.run();

    const leads   = leadAgent.getLeads();
    const scored  = leads.filter((l: { score: number }) => l.score > 0).length;
    const outreach= leads.filter((l: { status: string }) => l.status === "contacted").length;
    const deals   = leads.filter((l: { dealStage: string }) => l.dealStage !== "none").length;

    return Response.json({
      ok: true,
      counts: { leads: leads.length, scored, outreach, deals },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Agent error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
