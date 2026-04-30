const STEPS = [
  { n: "01", title: "Find", body: "Scans Google Maps for local service businesses with poor ratings or missing websites." },
  { n: "02", title: "Audit", body: "Visits each site and generates a real score: SSL, speed, mobile, CTA, content." },
  { n: "03", title: "Analyze", body: "Extracts customer complaints from public reviews to identify pain points." },
  { n: "04", title: "Pitch", body: "Builds a custom offer tied to the exact problems found — not a generic template." },
  { n: "05", title: "Reach", body: "Generates a cold call script, SMS, and email. Personalized per business." },
  { n: "06", title: "Track", body: "Logs every lead through the pipeline. Flags stale contacts. Runs 24/7." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-6 border-t border-panel">
      <div className="max-w-6xl mx-auto">
        <p className="text-muted text-xs tracking-[0.25em] uppercase text-center mb-3">Pipeline</p>
        <h2 className="text-2xl md:text-3xl font-mono font-bold text-center text-white mb-16">
          How the system works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="text-neon text-xs font-mono pt-1 flex-shrink-0">{s.n}</span>
              <div>
                <p className="text-white text-sm font-mono font-semibold mb-1">{s.title}</p>
                <p className="text-muted text-xs leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
