import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Clock, ShieldCheck, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Audit Request Received",
  description:
    "Your Automation Architecture Audit intake has been logged. Our solutions engineering team will review your inbound pipeline within 4 business hours.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ThankYouPage() {
  return (
    <div className="py-16 md:py-24 bg-[#FAFAF8] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#1E3A2F] text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <div className="mt-4">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#1E3A2F] bg-[#1E3A2F]/10 border border-[#1E3A2F]/20 font-semibold">
            AUDIT REQUEST INGESTED
          </div>
        </div>

        <h1 className="mt-4 font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
          Diagnostic Intake Received
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[#5C5C57] leading-relaxed">
          Your organization profile and operational metrics have been logged into our evaluation pipeline. Our senior automation team will construct an initial Architecture Diagnostic Rubric.
        </p>

        {/* SLA & Protocol Card */}
        <div className="mt-8 rounded-[3px] border border-[#E5E5E0] bg-white p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-[#1E3A2F] mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-[#1A1A1A]">4-Hour Analysis Window</h4>
              <p className="text-xs text-[#5C5C57]">We analyze your inbound velocity, tools, and qualification bottlenecks within 4 business hours.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileCheck className="h-4 w-4 text-[#1E3A2F] mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-[#1A1A1A]">Custom Blueprint Deliverable</h4>
              <p className="text-xs text-[#5C5C57]">You will receive a confidential PDF brief containing your recommended AI lead qualification architecture.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-[#1E3A2F] mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-[#1A1A1A]">Strict Data Privacy</h4>
              <p className="text-xs text-[#5C5C57]">All submitted firmographic signals are handled in compliance with SOC-2 confidentiality benchmarks.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button variant="outline" size="md">
              Return to Engine Overview
            </Button>
          </Link>
          <Link href="/#architecture">
            <Button variant="primary" size="md">
              Review System Topology
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
