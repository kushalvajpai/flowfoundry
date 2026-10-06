import { Clock, Shield, Filter, FileText, CheckCircle, Database } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Sub-Second Inbound Engagement",
    description:
      "Engage high-intent prospects while their interest is at its peak. Fast response times directly prevent deal decay to faster-moving competitors.",
    impact: "Immediate first-touch confirmation & scheduling link",
  },
  {
    icon: Filter,
    title: "Protected Sales Capacity",
    description:
      "Filter out tire-kickers, students, and out-of-market inquiries automatically. Account Executives only spend time on qualified buyers ready for discovery.",
    impact: "100% of AE discovery slots dedicated to ICP accounts",
  },
  {
    icon: Database,
    title: "Elimination of Manual Entry",
    description:
      "Automatically extract company headcount, industry classification, buyer seniority, and tech stack dependencies without manual research.",
    impact: "Zero manual copy-pasting between forms and CRM",
  },
  {
    icon: FileText,
    title: "Transparent & Explainable Scoring",
    description:
      "Every qualification decision includes a detailed rationale based on your explicit criteria, eliminating black-box AI confusion for your sales leaders.",
    impact: "Clear 0-100 scoring telemetry and audit trail",
  },
  {
    icon: Shield,
    title: "Enterprise Privacy & Zero Retention",
    description:
      "Lead data is processed via ephemeral instances under zero-retention API contracts. Your proprietary prospect details are never stored or used to train models.",
    impact: "Full data sovereignty & compliance-ready architecture",
  },
  {
    icon: CheckCircle,
    title: "Frictionless Integration",
    description:
      "Connect seamlessly to your existing CRM (HubSpot, Salesforce), form tools, calendar systems, and Slack without requiring a major rip-and-replace project.",
    impact: "No migration required; works with your current stack",
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            BUSINESS BENEFITS
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            Engineered for measurable operational efficiency.
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            Eliminate operational drag across your revenue organization with reliable automation that works quietly in the background.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="rounded-[3px] border border-[#E5E5E0] bg-white p-5 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors"
              >
                <div>
                  <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 w-fit text-[#1E3A2F]">
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#1A1A1A]">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E5E5E0]">
                  <div className="font-mono text-xs text-[#1A1A1A] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A2F]" />
                    <span>{benefit.impact}</span>
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
