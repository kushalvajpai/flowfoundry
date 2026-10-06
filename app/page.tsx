import { HeroSection } from "@/components/hero-section";
import { ProblemSection } from "@/components/problem-section";
import { WhatWeDoSection } from "@/components/what-we-do-section";
import { WorkflowVisualization } from "@/components/workflow-visualization";
import { EnginePipeline } from "@/components/engine-pipeline";
import { ArchitectureOverview } from "@/components/architecture-overview";
import { CapabilitiesSection } from "@/components/capabilities-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { BenefitsSection } from "@/components/benefits-section";
import { UseCasesSection } from "@/components/use-cases-section";
import { SecuritySection } from "@/components/security-section";
import { CtaSection } from "@/components/cta-section";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Problem section */}
      <ProblemSection />

      {/* 3. What FlowFoundry does */}
      <WhatWeDoSection />

      {/* 4. AI Lead-to-Customer Engine interactive visualization */}
      <WorkflowVisualization />

      {/* 5. Core Engine Lifecycle Pipeline */}
      <EnginePipeline />

      {/* 6. System Topology & Architecture Overview */}
      <ArchitectureOverview />

      {/* 7. Platform Capabilities */}
      <CapabilitiesSection />

      {/* 8. How it works */}
      <HowItWorksSection />

      {/* 9. Benefits */}
      <BenefitsSection />

      {/* 10. Use cases */}
      <UseCasesSection />

      {/* 11. Security & Governance */}
      <SecuritySection />

      {/* 12. Call to Action */}
      <CtaSection />
    </div>
  );
}
