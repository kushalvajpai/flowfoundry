import { Layers, Sparkles, Send, RefreshCw, Check } from "lucide-react";

const solutions = [
  {
    icon: Layers,
    title: "Unified Inbound Ingestion",
    description:
      "Consolidates website forms, booking flows, webhook events, and partner referrals into a unified streaming ingress with payload sanitization and deduplication.",
    capabilities: ["Universal webhook receiver", "Bot & spam filtering", "Idempotent event processing"],
  },
  {
    icon: Sparkles,
    title: "Contextual AI & Deterministic Scoring",
    description:
      "Analyzes company firmographics, buyer seniority, and operational intent against your exact Ideal Customer Profile rules to assign objective qualification tiers.",
    capabilities: ["Automated firmographic enrichment", "0-100 ICP rule matrix", "Clear qualification rationales"],
  },
  {
    icon: Send,
    title: "Instant Context-Aware Follow-up",
    description:
      "Dispatches immediate, personalized email responses and calendar booking invitations customized to the prospect's industry and declared requirements.",
    capabilities: ["Dynamic scheduling links", "Personalized discovery briefings", "Zero-delay delivery"],
  },
  {
    icon: RefreshCw,
    title: "Bi-Directional CRM Synchronization",
    description:
      "Pushes enriched records, scoring rationale, and activity logs directly into HubSpot or Salesforce, routing prospects to the right account executive instantly.",
    capabilities: ["Territory & AE routing", "Clean field mapping", "Complete cryptographic audit logs"],
  },
];

export function WhatWeDoSection() {
  return (
    <section id="what-we-do" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
              WHAT FLOWFOUNDRY DOES
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
              Intelligent automation built for precision revenue operations.
            </h2>
            <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
              We design and implement custom automation infrastructure that eliminates manual handoffs, accelerates deal velocity, and gives sales teams vetted pipeline they can close.
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#5C5C57] bg-[#F3F3EF] px-3 py-1.5 rounded-[2px] border border-[#E5E5E0] self-start md:self-auto">
            SYSTEM CORE // REVENUE PIPELINE
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {solutions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="border border-[#E5E5E0] rounded-[3px] bg-white p-5 hover:border-[#C8C8C0] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="rounded-[2px] border border-[#E5E5E0] bg-[#F3F3EF] p-2 text-[#1A1A1A] shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#5C5C57] leading-relaxed">
                      {item.description}
                    </p>
                    <ul className="space-y-1.5 pt-2 border-t border-[#F3F3EF]">
                      {item.capabilities.map((cap) => (
                        <li key={cap} className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                          <Check className="h-3.5 w-3.5 text-[#1E3A2F]" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
