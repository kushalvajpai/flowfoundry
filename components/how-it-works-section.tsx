import { Search, Sliders, PlayCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    phase: "01",
    icon: Search,
    title: "Automation Audit & Pipeline Mapping",
    description:
      "We inspect your current lead acquisition channels, qualification criteria, and CRM handoff bottlenecks. Our team drafts a custom architecture blueprint mapping every touchpoint from submission to AE calendar.",
    deliverables: ["Inbound bottleneck analysis", "Deterministic ICP qualification matrix", "Data governance & privacy specification"],
  },
  {
    phase: "02",
    icon: Sliders,
    title: "Engine Calibration & Stack Integration",
    description:
      "We connect your website forms and webhook streams to the FlowFoundry engine, configure custom firmographic scoring rules, and establish resilient bi-directional sync with HubSpot, Salesforce, or your custom CRM.",
    deliverables: ["Universal webhook & API connectors", "Zero-retention AI prompt calibration", "Fail-safe CRM synchronization"],
  },
  {
    phase: "03",
    icon: PlayCircle,
    title: "Autonomous Ingestion & Real-Time Dispatch",
    description:
      "Your engine goes live. Incoming leads are captured, enriched, scored, and routed in under 500 milliseconds. Sales reps receive pre-briefed discovery calls while low-intent leads receive automated nurture sequences.",
    deliverables: ["Sub-second lead routing", "Automated AE discovery dossiers", "Full cryptographic audit trail"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            HOW IT WORKS
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            From architecture assessment to live execution.
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            FlowFoundry is designed to augment your existing sales stack, not replace it. We deploy without disruption to your daily operations.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.phase}
                className="relative rounded-[3px] border border-[#E5E5E0] bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#1E3A2F]">
                      PHASE {step.phase}
                    </span>
                    <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 text-[#1E3A2F]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#1A1A1A]">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E5E0]">
                  <div className="text-[10px] font-mono text-[#5C5C57] uppercase tracking-wider mb-2">
                    Key Outputs
                  </div>
                  <ul className="space-y-1.5 font-mono text-xs text-[#5C5C57]">
                    {step.deliverables.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-[#1E3A2F]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit Callout Banner */}
        <div className="mt-8 rounded-[3px] border border-[#E5E5E0] bg-[#F3F3EF] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-[#1A1A1A]">
              Start with Phase 01: Request an Automation Audit
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-[#5C5C57] max-w-xl">
              We review your inbound volume, CRM routing logic, and qualification rules to identify immediate automation opportunities.
            </p>
          </div>
          <Link href="/audit" className="shrink-0">
            <Button variant="primary" size="md">
              Get an Automation Audit
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
