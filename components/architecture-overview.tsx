import { Check } from "lucide-react";

export function ArchitectureOverview() {
  return (
    <section id="architecture" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
              SYSTEM TOPOLOGY
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
              Engine Architecture & Separation of Concerns
            </h2>
            <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
              Engineered with clean domain boundaries. Ingestion endpoints, AI inference modules, persistent storage, and CRM synchronizers remain decoupled to guarantee maximum availability and zero data loss.
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#5C5C57] bg-[#F3F3EF] px-3 py-1.5 rounded-[2px] border border-[#E5E5E0] self-start md:self-auto">
            SPECIFICATION // RFC-0419-LEAD-ENGINE
          </div>
        </div>

        {/* Blueprint Diagram / Visual Architecture */}
        <div className="mt-10 rounded-[3px] border border-[#E5E5E0] bg-white p-5 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Box 1: Edge & Ingestion */}
            <div className="p-4 rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#5C5C57]">
                  <span>LAYER 01</span>
                  <span className="text-[#1E3A2F] font-semibold">EDGE INGESTION</span>
                </div>
                <h3 className="mt-2.5 text-sm font-semibold text-[#1A1A1A]">
                  Ingress & Validation Gateway
                </h3>
                <p className="mt-1.5 text-xs text-[#5C5C57] leading-relaxed">
                  Accepts webhooks, JSON payloads, and form submissions. Enforces strict Zod runtime validation, sanitizes inputs, and issues cryptographic idempotency tokens.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E5E5E0] font-mono text-[11px] text-[#5C5C57] space-y-1">
                <div>• Endpoint: /api/leads</div>
                <div>• Rate Limiting: Sliding Window</div>
                <div>• Schema: Zod LeadSubmissionSchema</div>
              </div>
            </div>

            {/* Box 2: Analysis & Scoring */}
            <div className="p-4 rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#5C5C57]">
                  <span>LAYER 02</span>
                  <span className="text-[#1E3A2F] font-semibold">AI COGNITIVE ENGINE</span>
                </div>
                <h3 className="mt-2.5 text-sm font-semibold text-[#1A1A1A]">
                  Contextual Qualification & Scoring
                </h3>
                <p className="mt-1.5 text-xs text-[#5C5C57] leading-relaxed">
                  Evaluates prospect domain, annual revenue estimates, seniority, and urgent pain points. Produces deterministic confidence scores (0-100) and qualification tiers.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E5E5E0] font-mono text-[11px] text-[#5C5C57] space-y-1">
                <div>• Deterministic ICP Weights</div>
                <div>• Zero-Data-Retention LLM Prompts</div>
                <div>• Score Output: HOT, WARM, COLD</div>
              </div>
            </div>

            {/* Box 3: Storage & CRM Dispatch */}
            <div className="p-4 rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#5C5C57]">
                  <span>LAYER 03</span>
                  <span className="text-[#1E3A2F] font-semibold">DISPATCH & SYNC</span>
                </div>
                <h3 className="mt-2.5 text-sm font-semibold text-[#1A1A1A]">
                  Ledger & Bi-directional Dispatch
                </h3>
                <p className="mt-1.5 text-xs text-[#5C5C57] leading-relaxed">
                  Stores enriched lead profiles with complete audit trails. Instantly triggers CRM routing (HubSpot/Salesforce) and customized immediate executive outreach.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E5E5E0] font-mono text-[11px] text-[#5C5C57] space-y-1">
                <div>• Audit Ledger: Full Traceability</div>
                <div>• Webhook Dispatcher: Exponential Backoff</div>
                <div>• Routing: Geo / Account Executive Matrix</div>
              </div>
            </div>
          </div>

          {/* Technical Quality Standards */}
          <div className="mt-6 pt-4 border-t border-[#E5E5E0] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#5C5C57]">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#1E3A2F]" />
              Strict TypeScript (tsc --noEmit clean)
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#1E3A2F]" />
              Clean decoupled service layer
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#1E3A2F]" />
              Minimum code / zero bloated dependencies
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#1E3A2F]" />
              Accessible WCAG 2.1 AA standards
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
