"use client";

import * as React from "react";
import {
  UserPlus,
  Inbox,
  Sparkles,
  Database,
  MailCheck,
  Briefcase,
  Trophy,
  ArrowRight,
  ArrowDown,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Code2,
} from "lucide-react";

interface WorkflowStage {
  id: string;
  name: string;
  icon: React.ElementType;
  badge: string;
  subtitle: string;
  duration: string;
  description: string;
  technicalDetails: {
    input: string;
    transformation: string;
    output: string;
    status: string;
  };
  samplePayload: {
    [key: string]: string | number | boolean;
  };
}

const stages: WorkflowStage[] = [
  {
    id: "lead",
    name: "Lead",
    icon: UserPlus,
    badge: "STAGE 01",
    subtitle: "Inbound Prospect Interest",
    duration: "T = 0ms",
    description:
      "A prospect submits a high-intent request via an enterprise contact form, demo scheduler, or partner co-marketing referral.",
    technicalDetails: {
      input: "Raw HTTP POST / form payload",
      transformation: "Edge TLS termination & IP verification",
      output: "Raw ingest envelope with client fingerprint",
      status: "Ingested",
    },
    samplePayload: {
      source: "website_demo_request",
      company: "Acme Logistics Inc.",
      contactEmail: "d.chen@acmelogistics.com",
      statedNeed: "Automate regional dispatch & CRM routing",
      annualInboundEst: "2,500 leads/mo",
    },
  },
  {
    id: "capture",
    name: "Capture",
    icon: Inbox,
    badge: "STAGE 02",
    subtitle: "Streaming Ingestion & Sanitization",
    duration: "+45ms",
    description:
      "The engine parses the incoming payload, validates schemas with Zod, filters bot patterns, and assigns an idempotent idempotency key.",
    technicalDetails: {
      input: "Raw ingest envelope",
      transformation: "Zod runtime schema check & anti-spam scoring",
      output: "Sanitized lead entity with UUIDv7 ID",
      status: "Validated & Deduped",
    },
    samplePayload: {
      leadId: "ld_01h8x7k9e23",
      schemaValidated: true,
      botProbability: 0.01,
      duplicateFound: false,
      ingestCluster: "edge-us-east-1",
    },
  },
  {
    id: "qualification",
    name: "AI Qualification",
    icon: Sparkles,
    badge: "STAGE 03",
    subtitle: "Firmographic & ICP Scoring",
    duration: "+210ms",
    description:
      "AI models enrich company revenue, tech stack, and buyer seniority, applying deterministic rule sets to assign an objective 0-100 ICP score.",
    technicalDetails: {
      input: "Sanitized lead entity",
      transformation: "Entity resolution + deterministic rule matrix",
      output: "Qualification tier & confidence rationale",
      status: "Tier 1 — High Value",
    },
    samplePayload: {
      icpScore: 94,
      qualificationTier: "Tier 1 - Enterprise",
      companySize: "250-500 employees",
      buyerRole: "VP Revenue Operations",
      budgetAuthority: "High (Executive level)",
    },
  },
  {
    id: "crm",
    name: "CRM",
    icon: Database,
    badge: "STAGE 04",
    subtitle: "Bi-Directional Ledger Synchronization",
    duration: "+115ms",
    description:
      "Enriched prospect data and qualification rationales sync instantly into HubSpot or Salesforce with automatic territory assignment.",
    technicalDetails: {
      input: "Qualified prospect dossier",
      transformation: "Bi-directional CRM API upsert & owner routing",
      output: "CRM Contact & Deal record created",
      status: "Synchronized",
    },
    samplePayload: {
      crmDestination: "HubSpot Enterprise",
      assignedOwner: "Sarah Jenkins (Enterprise AE)",
      dealCreated: true,
      territory: "North America - Logistics",
      auditTraceId: "trc_994b238a0f",
    },
  },
  {
    id: "followup",
    name: "Follow-up",
    icon: MailCheck,
    badge: "STAGE 05",
    subtitle: "Contextual Outreach & Scheduling",
    duration: "+80ms",
    description:
      "The engine triggers an immediate, personalized follow-up addressing the prospect's exact logistics pain point with custom calendar links.",
    technicalDetails: {
      input: "CRM deal context & enriched pain points",
      transformation: "Context-aware email dispatch & booking token",
      output: "Personalized communication delivered",
      status: "Dispatched (< 500ms)",
    },
    samplePayload: {
      deliveryChannel: "Executive Direct Email",
      templateType: "Tailored Logistics Automation Brief",
      bookingLinkActive: true,
      deliveryStatus: "Delivered (200 OK)",
    },
  },
  {
    id: "sales",
    name: "Sales",
    icon: Briefcase,
    badge: "STAGE 06",
    subtitle: "Prepared Discovery Meeting",
    duration: "Meeting Scheduled",
    description:
      "The Account Executive steps into the discovery call equipped with a pre-meeting dossier detailing verified firmographics and intent signals.",
    technicalDetails: {
      input: "Completed calendar booking",
      transformation: "Automated meeting dossier synthesized for AE",
      output: "High-conviction discovery conversation",
      status: "Call Prepared",
    },
    samplePayload: {
      meetingTime: "Tomorrow, 10:30 AM EST",
      attendees: "D. Chen (VP RevOps), S. Jenkins (FF AE)",
      qualificationBrief: "Focus: Eliminating 15 hrs/wk manual entry",
      calendarInvited: true,
    },
  },
  {
    id: "customer",
    name: "Customer",
    icon: Trophy,
    badge: "STAGE 07",
    subtitle: "Closed-Won Account & Onboarding",
    duration: "Closed-Won",
    description:
      "The deal is finalized. The engine updates the CRM lifecycle stage and automatically triggers client provisioning and onboarding workflows.",
    technicalDetails: {
      input: "Executed contract & billing confirmation",
      transformation: "Automated onboarding trigger & workspace setup",
      output: "Active customer in production",
      status: "Onboarding Live",
    },
    samplePayload: {
      accountStatus: "Active Customer",
      contractTier: "Enterprise Annual",
      onboardingWorkflow: "Automated Kickoff Sequence Sent",
      timeToFirstValue: "Accelerated",
    },
  },
];

export function WorkflowVisualization() {
  const [activeStageIndex, setActiveStageIndex] = React.useState<number>(2); // Default to AI Qualification
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);

  // Auto-cycle through stages if playback is on
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % stages.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeStage = stages[activeStageIndex];
  const ActiveIcon = activeStage.icon;

  return (
    <section id="engine" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
              WORKFLOW VISUALIZATION
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
              The AI Lead-to-Customer Engine
            </h2>
            <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
              Explore how raw inbound interest moves through seven continuous automation stages to deliver closed customer accounts with zero manual drag.
            </p>
          </div>

          {/* Autoplay / Manual Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-[#E5E5E0] bg-white text-xs font-mono text-[#1A1A1A] hover:bg-[#F3F3EF] transition-colors"
              aria-label={isPlaying ? "Pause automated walkthrough" : "Start automated walkthrough"}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-[#1E3A2F]" />
                  <span>Pause Flow</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-[#1E3A2F]" />
                  <span>Auto-Play Flow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Pipeline Flow Bar (Horizontal) */}
        <div className="mt-10 hidden lg:block">
          <div className="relative flex items-center justify-between rounded-[3px] border border-[#E5E5E0] bg-white p-3">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = idx === activeStageIndex;
              const isPast = idx < activeStageIndex;

              return (
                <React.Fragment key={stage.id}>
                  {/* Step Node */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveStageIndex(idx);
                    }}
                    className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-[3px] transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2F] ${
                      isActive
                        ? "bg-[#F3F3EF] border border-[#D4D4CE]"
                        : "hover:bg-[#FAFAF8] border border-transparent"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-[3px] border transition-colors ${
                        isActive
                          ? "border-[#1E3A2F] bg-[#1E3A2F] text-white"
                          : isPast
                          ? "border-[#C2D6CC] bg-[#EBF2EE] text-[#1E3A2F]"
                          : "border-[#E5E5E0] bg-white text-[#5C5C57]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="text-center">
                      <span className="block text-[10px] font-mono text-[#5C5C57] uppercase tracking-wider">
                        {stage.badge}
                      </span>
                      <span
                        className={`block text-xs font-medium tracking-tight ${
                          isActive ? "text-[#1A1A1A] font-semibold" : "text-[#5C5C57]"
                        }`}
                      >
                        {stage.name}
                      </span>
                    </div>
                  </button>

                  {/* Flow Connector Arrow */}
                  {idx < stages.length - 1 && (
                    <div className="flex items-center text-[#A3A39D] mx-1">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Stepper (Scrollable) */}
        <div className="mt-6 flex lg:hidden items-center gap-2 overflow-x-auto pb-3 no-scrollbar">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isActive = idx === activeStageIndex;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStageIndex(idx);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-[3px] border px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? "border-[#1E3A2F] bg-[#F3F3EF] text-[#1A1A1A] font-medium"
                    : "border-[#E5E5E0] bg-white text-[#5C5C57]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#1E3A2F]" : "text-[#5C5C57]"}`} />
                <span>{stage.name}</span>
                <span className="font-mono text-[10px] text-[#A3A39D]">
                  {stage.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Telemetry Inspector */}
        <div className="mt-6 rounded-[3px] border border-[#E5E5E0] bg-white p-5 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Stage Overview (Left 5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#1E3A2F] bg-[#EBF2EE] px-2 py-0.5 rounded-[2px] border border-[#C2D6CC]">
                      {activeStage.badge}
                    </span>
                    <span className="font-mono text-xs text-[#5C5C57] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activeStage.duration}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#1E3A2F] flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {activeStage.technicalDetails.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-[#E5E5E0] bg-[#F3F3EF] text-[#1A1A1A]">
                    <ActiveIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">
                      {activeStage.name}
                    </h3>
                    <p className="text-xs text-[#5C5C57]">
                      {activeStage.subtitle}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-[#5C5C57] leading-relaxed">
                  {activeStage.description}
                </p>

                {/* Subsystem Pipeline Specs */}
                <div className="mt-5 space-y-2 rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] p-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-[#5C5C57] gap-1">
                    <span className="text-[#8C8C85]">Inbound Form:</span>
                    <span className="text-[#1A1A1A]">{activeStage.technicalDetails.input}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-[#5C5C57] gap-1 border-t border-[#E5E5E0] pt-1.5">
                    <span className="text-[#8C8C85]">Transformation:</span>
                    <span className="text-[#1A1A1A]">{activeStage.technicalDetails.transformation}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-[#5C5C57] gap-1 border-t border-[#E5E5E0] pt-1.5">
                    <span className="text-[#8C8C85]">Artifact:</span>
                    <span className="text-[#1E3A2F]">{activeStage.technicalDetails.output}</span>
                  </div>
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="mt-6 pt-3 border-t border-[#E5E5E0] flex items-center justify-between">
                <button
                  type="button"
                  disabled={activeStageIndex === 0}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStageIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="px-2.5 py-1 rounded-[2px] text-xs font-mono text-[#5C5C57] hover:text-[#1A1A1A] hover:bg-[#F3F3EF] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  ← Prev Stage
                </button>

                <div className="text-xs font-mono text-[#5C5C57]">
                  Step {activeStageIndex + 1} of {stages.length}
                </div>

                <button
                  type="button"
                  disabled={activeStageIndex === stages.length - 1}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStageIndex((prev) => Math.min(stages.length - 1, prev + 1));
                  }}
                  className="px-2.5 py-1 rounded-[2px] text-xs font-mono text-[#5C5C57] hover:text-[#1A1A1A] hover:bg-[#F3F3EF] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Next Stage →
                </button>
              </div>
            </div>

            {/* Stage Payload Telemetry (Right 7 Cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#E5E5E0] px-3.5 py-2 bg-white">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5 text-[#5C5C57]" />
                    <span className="font-mono text-xs text-[#1A1A1A]">
                      stage_{activeStage.id}_telemetry.json
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#1E3A2F] bg-[#EBF2EE] px-1.5 py-0.5 rounded-[2px] border border-[#C2D6CC]">
                    REALTIME PAYLOAD
                  </span>
                </div>

                <div className="p-3.5 font-mono text-xs overflow-x-auto leading-relaxed text-[#1A1A1A]">
                  <pre className="text-[11px] text-[#1A1A1A]">
                    <code>
                      {`{\n`}
                      {Object.entries(activeStage.samplePayload).map(([key, value], i, arr) => (
                        <div key={key} className="pl-4">
                          <span className="text-[#5C5C57]">&quot;{key}&quot;</span>:{" "}
                          <span
                            className={
                              typeof value === "number"
                                ? "text-[#8C6D1F]"
                                : typeof value === "boolean"
                                ? "text-[#1E3A2F]"
                                : "text-[#1A1A1A]"
                            }
                          >
                            {typeof value === "string" ? `"${value}"` : String(value)}
                          </span>
                          {i < arr.length - 1 ? "," : ""}
                        </div>
                      ))}
                      {`}`}
                    </code>
                  </pre>
                </div>

                <div className="border-t border-[#E5E5E0] px-3.5 py-2 bg-white flex items-center justify-between text-[11px] font-mono text-[#5C5C57]">
                  <span>Cryptographic signature: verified</span>
                  <span>Zero retention: active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Pipeline Flow for Mobile Summary */}
        <div className="mt-6 block sm:hidden rounded-[3px] border border-[#E5E5E0] bg-white p-3">
          <div className="text-xs font-mono text-[#5C5C57] mb-2 uppercase tracking-wider text-center">
            Complete Linear Sequence
          </div>
          <div className="flex flex-col items-center gap-1 font-mono text-xs text-[#1A1A1A]">
            <span>Lead</span>
            <ArrowDown className="h-3 w-3 text-[#A3A39D]" />
            <span>Capture</span>
            <ArrowDown className="h-3 w-3 text-[#A3A39D]" />
            <span>AI Qualification</span>
            <ArrowDown className="h-3 w-3 text-[#A3A39D]" />
            <span>CRM</span>
            <ArrowDown className="h-3 w-3 text-[#A3A39D]" />
            <span>Follow-up</span>
            <ArrowDown className="h-3 w-3 text-[#A3A39D]" />
            <span>Sales</span>
            <ArrowDown className="h-3 w-3 text-[#A3A39D]" />
            <span className="text-[#1E3A2F] font-semibold">Customer</span>
          </div>
        </div>
      </div>
    </section>
  );
}
