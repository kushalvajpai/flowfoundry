import Link from "next/link";
import { ShieldCheck, GitCommit, ArrowRight, Layers } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E0] bg-[#FAFAF8] text-[#5C5C57] py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-[#E5E5E0]">
          {/* Brand Column (2 cols) */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-[#1A1A1A]">
              <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[#1E3A2F] text-white">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-[#1A1A1A]">FlowFoundry</span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-[#5C5C57] max-w-sm leading-relaxed">
              FlowFoundry builds intelligent automation and marketing systems that help businesses eliminate repetitive work, capture more opportunities, and operate more efficiently.
            </p>
            <div className="mt-5 flex items-center gap-3 text-xs font-mono text-[#5C5C57]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A2F]" />
                Pipeline Operational
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <GitCommit className="h-3.5 w-3.5 text-[#5C5C57]" />
                v2026.2
              </span>
            </div>
          </div>

          {/* Navigation Column 1: Platform */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#1A1A1A]">
              Platform
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="#problem" className="hover:text-[#1A1A1A] transition-colors">
                  The Problem
                </Link>
              </li>
              <li>
                <Link href="#what-we-do" className="hover:text-[#1A1A1A] transition-colors">
                  What We Do
                </Link>
              </li>
              <li>
                <Link href="#pipeline" className="hover:text-[#1A1A1A] transition-colors">
                  Engine Pipeline
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#benefits" className="hover:text-[#1A1A1A] transition-colors">
                  Benefits
                </Link>
              </li>
              <li>
                <Link href="#use-cases" className="hover:text-[#1A1A1A] transition-colors">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Audit & Services */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#1A1A1A]">
              Solutions
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link href="/audit" className="text-[#1E3A2F] hover:underline flex items-center gap-1 font-medium transition-colors">
                  Automation Audit
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="#pipeline" className="hover:text-[#1A1A1A] transition-colors">
                  AI Lead Qualification
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors">
                  CRM Synchronization
                </Link>
              </li>
              <li>
                <Link href="#use-cases" className="hover:text-[#1A1A1A] transition-colors">
                  B2B SaaS Lead Routing
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 3: Trust & Governance */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#1A1A1A]">
              Governance
            </h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-[#1A1A1A]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1E3A2F] shrink-0" />
                Zero Retention AI Contracts
              </li>
              <li className="text-[#5C5C57]">Strict Non-Disclosure Guarantee</li>
              <li className="text-[#5C5C57]">SOC-2 Ready Practices</li>
              <li className="text-[#5C5C57]">Cryptographic Audit Trails</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C5C57] gap-3">
          <p>© {new Date().getFullYear()} FlowFoundry Systems. All rights reserved.</p>
          <p className="font-mono text-[11px] text-[#5C5C57]">
            AI Lead-to-Customer Engine • Production Grade
          </p>
        </div>
      </div>
    </footer>
  );
}
