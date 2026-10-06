import { Clock, UserX, Network, CopyX } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Slow First-Response Latency",
    description:
      "Inbound inquiries waiting hours or days for initial review often go cold. High-intent buyers evaluate multiple solutions and engage with the team that responds first.",
    impact: "Diminishing lead velocity & conversion loss",
  },
  {
    icon: UserX,
    title: "Unqualified Meeting Fatigue",
    description:
      "Sales representatives spend valuable discovery time speaking with low-intent prospects or organizations that fail your fundamental Ideal Customer Profile (ICP) criteria.",
    impact: "Wasted sales rep capacity & cluttered calendars",
  },
  {
    icon: Network,
    title: "Fragmented Tooling Silos",
    description:
      "Disconnection between form builders, enrichment tools, email cadences, and CRMs creates dropped leads, duplicate contacts, and broken attribution data.",
    impact: "Data leakage & poor executive pipeline visibility",
  },
  {
    icon: CopyX,
    title: "Repetitive Manual Operations",
    description:
      "Teams burn valuable hours manually copy-pasting lead firmographics, drafting generic outreach templates, and hand-updating CRM lifecycle stages.",
    impact: "High administrative overhead & error-prone data",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            THE OPERATIONAL BOTTLENECK
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            Manual lead management breaks down at scale.
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            When revenue teams rely on manual handoffs and fragmented tools, high-value opportunities slip through the cracks while operational costs steadily climb.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.title}
                className="border border-[#E5E5E0] rounded-[3px] bg-white p-5 hover:border-[#C8C8C0] transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="rounded-[2px] border border-[#E5E5E0] bg-[#F3F3EF] p-2 text-[#1A1A1A] shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-sm font-semibold text-[#1A1A1A]">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-[#5C5C57] leading-relaxed">
                      {problem.description}
                    </p>
                    <div className="pt-2 text-[11px] font-mono text-[#1E3A2F]">
                      → {problem.impact}
                    </div>
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
