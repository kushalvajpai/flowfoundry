import { Inbox, Sparkles, Filter, Database, Send, Check } from "lucide-react";

const pipelineStages = [
  {
    step: "01",
    title: "Lead Capture",
    icon: Inbox,
    description: "Ingests form fills, webhook events, and outbound signals with instantaneous payload validation.",
    technicalBadge: "Payload Ingestion",
    details: ["Schema parsing", "Anti-bot verification", "Deduplication key"],
  },
  {
    step: "02",
    title: "AI Analysis",
    icon: Sparkles,
    description: "Extracts firmographics, domain relevance, intent level, and budget authority using neural reasoning.",
    technicalBadge: "Semantic Enrichment",
    details: ["Entity resolution", "Intent classification", "Firmographic synthesis"],
  },
  {
    step: "03",
    title: "Qualification Logic",
    icon: Filter,
    description: "Computes deterministic composite score against custom ICP rules to assign actionable tiers.",
    technicalBadge: "Deterministic Tiering",
    details: ["0-100 ICP alignment", "Disqualification filters", "Confidence rating"],
  },
  {
    step: "04",
    title: "Secure Ledger",
    icon: Database,
    description: "Persists immutable record with audit trails, raw payloads, and AI scoring rationale.",
    technicalBadge: "State Preservation",
    details: ["Encrypted at rest", "Immutable timestamps", "Audit telemetry"],
  },
  {
    step: "05",
    title: "CRM & Dispatch",
    icon: Send,
    description: "Dispatches Tier-1 prospects into CRM sequences, Slack alerts, and personalized automated follow-ups.",
    technicalBadge: "Bi-directional Sync",
    details: ["HubSpot/Salesforce webhook", "Rep routing rules", "Triggered communications"],
  },
];

export function EnginePipeline() {
  return (
    <section id="pipeline" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            CORE ENGINE LIFECYCLE
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            From raw signal to closed opportunity.
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            Every inbound interaction flows through an automated 5-stage pipeline engineered for speed, high qualification accuracy, and complete auditability.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="border border-[#E5E5E0] rounded-[3px] bg-white p-4 flex flex-col justify-between hover:border-[#C8C8C0] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="font-semibold text-[#1E3A2F]">{stage.step}</span>
                    <span className="text-[10px] text-[#5C5C57] bg-[#F3F3EF] px-1.5 py-0.5 rounded-[2px]">
                      {stage.technicalBadge}
                    </span>
                  </div>

                  <div className="h-8 w-8 rounded-[2px] border border-[#E5E5E0] bg-[#F3F3EF] flex items-center justify-center text-[#1A1A1A] mb-3">
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1.5">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-[#5C5C57] leading-relaxed mb-4">
                    {stage.description}
                  </p>
                </div>

                <div className="border-t border-[#F3F3EF] pt-3 space-y-1">
                  {stage.details.map((detail) => (
                    <div key={detail} className="flex items-center gap-1.5 text-[11px] text-[#5C5C57]">
                      <Check className="h-3 w-3 text-[#1E3A2F]" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
