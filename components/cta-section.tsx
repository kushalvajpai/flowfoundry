import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-[#FAFAF8] relative border-b border-[#E5E5E0]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="rounded-[3px] border border-[#E5E5E0] bg-white p-8 sm:p-12 lg:p-14 text-center max-w-4xl mx-auto">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0] mx-auto mb-4">
            SCHEDULE YOUR AUDIT
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight max-w-2xl mx-auto">
            Stop losing qualified pipeline to manual bottlenecks.
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#5C5C57] max-w-2xl mx-auto leading-relaxed">
            Get an in-depth Automation Audit to analyze your inbound lead sources, qualification rules, and CRM routing for immediate automation opportunities.
          </p>

          {/* Action CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/audit" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get an Automation Audit
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="#pipeline" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Engine Pipeline
              </Button>
            </Link>
          </div>

          {/* What the Audit Includes */}
          <div className="mt-10 pt-6 border-t border-[#E5E5E0] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#1E3A2F] shrink-0 mt-0.5" />
              <div className="text-xs text-[#5C5C57]">
                <span className="font-semibold block text-[#1A1A1A]">Pipeline Diagnostics</span>
                Identify slow response areas, lead leakage, and manual handoff friction.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#1E3A2F] shrink-0 mt-0.5" />
              <div className="text-xs text-[#5C5C57]">
                <span className="font-semibold block text-[#1A1A1A]">Custom ICP Blueprint</span>
                Tailored qualification logic mapped to your specific sales criteria.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#1E3A2F] shrink-0 mt-0.5" />
              <div className="text-xs text-[#5C5C57]">
                <span className="font-semibold block text-[#1A1A1A]">Zero Pressure Guarantee</span>
                Direct engineering assessment with actionable architecture recommendations.
              </div>
            </div>
          </div>

          {/* Transparent Confidentiality Note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono text-[#5C5C57]">
            <ShieldAlert className="h-3.5 w-3.5 text-[#5C5C57]" />
            <span>Strict NDA & zero training data retention guarantee on all assessments</span>
          </div>
        </div>
      </div>
    </section>
  );
}
