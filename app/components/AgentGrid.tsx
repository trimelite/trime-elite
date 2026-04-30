"use client";

const AGENTS = [
  { key: "LeadFinder",      label: "Lead Finder",  icon: "◎", description: "Searches Google Maps for businesses with low ratings or no website. Filters by niche and city." },
  { key: "WebsiteAuditor",  label: "Auditor",      icon: "◈", description: "Visits each site and scores it 0–100 on speed, mobile, SSL, CTA, and content quality." },
  { key: "ReviewAnalyzer",  label: "Analyzer",     icon: "◉", description: "Pulls public review snippets and extracts the top customer pain points using AI." },
  { key: "OutreachAgent",   label: "Outreach",     icon: "◐", description: "Writes personalized cold call scripts, SMS messages, and emails per lead." },
  { key: "OfferGenerator",  label: "Offer Gen",    icon: "◑", description: "Builds a custom pitch based on the exact issues found in the audit." },
  { key: "CRMAgent",        label: "CRM",          icon: "◒", description: "Tracks lead status through the pipeline: new → contacted → converted." },
];

export default function AgentGrid() {
  return (
    <section id="agents" className="py-24 px-6 max-w-6xl mx-auto">
      <p className="text-muted text-xs tracking-[0.25em] uppercase text-center mb-3">Active Agents</p>
      <h2 className="text-2xl md:text-3xl font-mono font-bold text-center text-white mb-12">
        Six agents. One pipeline.
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((a) => (
          <div
            key={a.key}
            className="bg-panel border border-panel rounded-xl p-5 flex flex-col gap-3 hover:border-neon2/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-neon2 text-lg leading-none">{a.icon}</span>
              <span className="text-white text-sm font-mono font-semibold">{a.label}</span>
            </div>
            <p className="text-muted text-xs leading-relaxed">{a.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
