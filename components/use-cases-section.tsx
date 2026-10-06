import { Laptop, Briefcase, Building2, Share2 } from "lucide-react";

const useCases = [
  {
    icon: Laptop,
    category: "Software & Technology",
    title: "B2B SaaS Inbound Qualification",
    summary:
      "Automates demo requests and trial upgrades by enriching firmographics and routing high-value accounts directly to the right regional Account Executives.",
    workflow: [
      "Inbound demo form submitted",
      "Instant enrichment of company size & funding stage",
      "Tier 1 enterprise leads route directly to Senior AE calendar",
      "Self-service or nurture sequences dispatched to SMB leads",
    ],
  },
  {
    icon: Building2,
    category: "Professional Services",
    title: "Consulting & Advisory Intake",
    summary:
      "Screens inbound client inquiries against minimum budget thresholds, engagement timeline, and service capability fit before scheduling partner time.",
    workflow: [
      "Prospective client submits project scope brief",
      "AI evaluates project scope against practice capabilities",
      "Deterministic check against engagement budget floor",
      "Pre-qualified dossier delivered to managing partner",
    ],
  },
  {
    icon: Briefcase,
    category: "Agencies & Solutions",
    title: "High-Ticket B2B Agency Intake",
    summary:
      "Eliminates back-and-forth discovery emails by automatically capturing project requirements, verifying decision-maker seniority, and scheduling discovery calls.",
    workflow: [
      "Inbound RFP or consultation request ingested",
      "Automatic verification of decision-maker role & authority",
      "Personalized agency portfolio brief dispatched",
      "Discovery meeting booked with tailored agenda",
    ],
  },
  {
    icon: Share2,
    category: "Growth & Marketing",
    title: "Multi-Source Lead Harmonization",
    summary:
      "Unifies disparate lead channels—LinkedIn forms, webinars, ad landing pages, and partner co-marketing—into a single normalized qualification engine.",
    workflow: [
      "Ingests disparate schemas from ads, webhooks & forms",
      "Normalizes and deduplicates against CRM records",
      "Scores prospect intent based on engagement depth",
      "Synchronizes clean contact and activity record to CRM",
    ],
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            USE CASES
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            Built for high-velocity B2B revenue operations.
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            Whether you are managing complex enterprise inbound or scaling a multi-channel demand engine, FlowFoundry adapts to your business model.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {useCases.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.title}
                className="rounded-[3px] border border-[#E5E5E0] bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#5C5C57] uppercase tracking-wider">
                      {uc.category}
                    </span>
                    <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 text-[#1E3A2F]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-[#1A1A1A]">
                    {uc.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                    {uc.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E5E0]">
                  <div className="text-[10px] font-mono text-[#5C5C57] uppercase tracking-wider mb-2.5">
                    Operational Flow
                  </div>
                  <ul className="space-y-2">
                    {uc.workflow.map((item, idx) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-[#1A1A1A]">
                        <span className="font-mono text-[11px] text-[#1E3A2F] font-semibold mt-0.5 w-4 shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="text-[#5C5C57]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
