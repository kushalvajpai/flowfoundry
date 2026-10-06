import { Cpu, ShieldCheck, Zap, GitFork, Gauge, Scale } from "lucide-react";

const capabilities = [
  {
    title: "Multi-Source Lead Capture",
    description: "Accepts streaming webhooks, website forms, outbound scraping results, and API batches with sub-millisecond receipt acknowledgment.",
    icon: GitFork,
    metric: "< 10ms",
    metricLabel: "Receipt Ack",
  },
  {
    title: "Deep AI Firmographic Analysis",
    description: "Extracts verified company size, tech stack dependencies, industry verticals, and buyer role seniority using structured JSON schema output.",
    icon: Cpu,
    metric: "40+ Points",
    metricLabel: "Enrichment Vectors",
  },
  {
    title: "Deterministic ICP Scoring",
    description: "Combines empirical qualification rules (budget, authority, timeline) with AI intent heuristics to prevent false-positive pipeline inflation.",
    icon: Scale,
    metric: "0-100",
    metricLabel: "Deterministic Score",
  },
  {
    title: "Bi-Directional CRM Sync",
    description: "Synchronizes enriched records to HubSpot or Salesforce with automatic deduplication, territory assignment, and immediate task generation.",
    icon: Zap,
    metric: "100%",
    metricLabel: "Idempotent Sync",
  },
  {
    title: "Auditable Governance Ledger",
    description: "Maintains full historical logs of lead scoring rationales, webhook payloads, and transmission timestamps for enterprise compliance.",
    icon: ShieldCheck,
    metric: "Immutable",
    metricLabel: "Audit Logs",
  },
  {
    title: "High-Throughput Processing",
    description: "Engineered on serverless edge primitives capable of scaling from dozens to tens of thousands of simultaneous lead events without backlog.",
    icon: Gauge,
    metric: "10k+ / min",
    metricLabel: "Capacity Limit",
  },
];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            CAPABILITIES
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            Engineered for Precision & Enterprise Scale
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            Every subsystem is built with strict error boundaries, type safety, and verifiable benchmarks.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="rounded-[3px] border border-[#E5E5E0] bg-white p-5 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 text-[#1E3A2F]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-semibold text-[#1A1A1A]">
                        {cap.metric}
                      </div>
                      <div className="text-[10px] font-mono text-[#5C5C57] uppercase tracking-wider">
                        {cap.metricLabel}
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#1A1A1A]">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
