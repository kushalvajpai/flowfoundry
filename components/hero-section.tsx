import Link from "next/link";
import { ArrowRight, Check, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative pt-12 pb-16 md:pt-16 md:pb-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Asymmetric 60/40 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: 60% — Editorial Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
              <span>SYSTEM SPEC 2026.1</span>
              <span className="text-[#A3A39D]">/</span>
              <span>AUTONOMOUS REVENUE ENGINE</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.85rem] font-normal tracking-[-0.02em] text-[#1A1A1A] leading-[1.12]">
              Turn raw enterprise inbound into qualified revenue pipeline in milliseconds.
            </h1>

            <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed max-w-xl">
              FlowFoundry is an enterprise AI engine built for modern B2B revenue operations. We ingest unstructured leads, enrich firmographics, qualify purchase intent with deterministic reasoning, and synchronize high-value prospects directly into your CRM.
            </p>

            {/* CTAs: Solid fill or simple outline, sharp corners */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/audit">
                <Button variant="primary" size="md">
                  Request Automation Audit
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="md">
                  View Live Console
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
              <Link href="/#architecture">
                <Button variant="ghost" size="md">
                  System Topology
                </Button>
              </Link>
            </div>

            {/* Quiet Confidence Metadata */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#5C5C57]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1E3A2F]" />
                <span>Deterministic qualification rules</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1E3A2F]" />
                <span>SOC-2 Type II compliant</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#1E3A2F]" />
                <span>Zero model training on customer data</span>
              </span>
            </div>
          </div>

          {/* Right Column: 40% — Real Product UI Snippet (Data Table & Telemetry) */}
          <div className="lg:col-span-5">
            <div className="border border-[#E5E5E0] rounded-[3px] bg-white text-[#1A1A1A]">
              
              {/* Product Card Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#E5E5E0] bg-[#FAFAF8]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1E3A2F]" />
                  <span className="text-[11px] font-mono font-medium text-[#1A1A1A] tracking-wider uppercase">
                    INBOUND QUALIFICATION QUEUE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#5C5C57]">PostgreSQL Live</span>
              </div>

              {/* Data Table Snippet */}
              <div className="divide-y divide-[#E5E5E0] text-xs">
                
                {/* Row 1: High Intent / HOT */}
                <div className="p-3 hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#1A1A1A]">Elena Rostova</div>
                      <div className="text-[11px] text-[#5C5C57] font-mono">Rostova Logistics · 2k-10k leads/mo</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-semibold bg-[#EBF2EE] text-[#1E3A2F] border border-[#C2D6CC]">
                        88/100 · HOT
                      </span>
                      <div className="text-[10px] font-mono text-[#5C5C57] mt-0.5">312ms</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#5C5C57] pt-1.5 border-t border-[#F3F3EF]">
                    <span>HubSpot: Synced (hs_9421)</span>
                    <span className="text-[#1E3A2F]">AE Routed</span>
                  </div>
                </div>

                {/* Row 2: Medium Intent / WARM */}
                <div className="p-3 hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#1A1A1A]">Marcus Vance</div>
                      <div className="text-[11px] text-[#5C5C57] font-mono">Vance Health Tech · 500-2k leads/mo</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-medium bg-[#FDF6E2] text-[#8C6D1F] border border-[#EBDCA3]">
                        64/100 · WARM
                      </span>
                      <div className="text-[10px] font-mono text-[#5C5C57] mt-0.5">340ms</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#5C5C57] pt-1.5 border-t border-[#F3F3EF]">
                    <span>HubSpot: Synced (hs_9422)</span>
                    <span>Nurture Sequence</span>
                  </div>
                </div>

                {/* Row 3: Lower Intent / COLD */}
                <div className="p-3 hover:bg-[#FAFAF8] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-[#1A1A1A]">Sarah Lin</div>
                      <div className="text-[11px] text-[#5C5C57] font-mono">Nexus Cloud · &lt; 500 leads/mo</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-medium bg-[#F3F3EF] text-[#5C5C57] border border-[#E5E5E0]">
                        38/100 · COLD
                      </span>
                      <div className="text-[10px] font-mono text-[#5C5C57] mt-0.5">290ms</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#5C5C57] pt-1.5 border-t border-[#F3F3EF]">
                    <span>HubSpot: Synced (hs_9423)</span>
                    <span>Self-Serve Docs</span>
                  </div>
                </div>

              </div>

              {/* Product Card Footer */}
              <div className="px-3.5 py-2 border-t border-[#E5E5E0] bg-[#FAFAF8] text-[11px] font-mono text-[#5C5C57] flex items-center justify-between">
                <span>Avg qualification latency: 314ms</span>
                <span className="text-[#1E3A2F]">Idempotent retry active</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Trust Row: Bordered, 4 sharp columns separated by hairline dividers */}
        <div className="mt-12 border border-[#E5E5E0] rounded-[3px] bg-white divide-y sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-2 md:grid-cols-4 divide-[#E5E5E0]">
          <div className="p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#5C5C57]">
              Capture Latency
            </div>
            <div className="mt-1 text-xl font-mono font-semibold text-[#1A1A1A]">
              &lt; 350ms
            </div>
            <div className="mt-1 text-xs text-[#5C5C57]">
              Zero queue degradation
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#5C5C57]">
              AI Match Accuracy
            </div>
            <div className="mt-1 text-xl font-mono font-semibold text-[#1A1A1A]">
              98.4%
            </div>
            <div className="mt-1 text-xs text-[#5C5C57]">
              Grounded on ICP rules
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#5C5C57]">
              CRM Sync Delivery
            </div>
            <div className="mt-1 text-xl font-mono font-semibold text-[#1A1A1A]">
              99.99%
            </div>
            <div className="mt-1 text-xs text-[#5C5C57]">
              Idempotent retries
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#5C5C57]">
              Data Governance
            </div>
            <div className="mt-1 text-xl font-mono font-semibold text-[#1A1A1A]">
              SOC-2 / GDPR
            </div>
            <div className="mt-1 text-xs text-[#5C5C57]">
              Zero training retention
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
