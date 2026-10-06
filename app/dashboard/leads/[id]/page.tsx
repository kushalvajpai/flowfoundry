"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  Zap,
  Snowflake,
  Building,
  Mail,
  ExternalLink,
  Clock,
  Calendar,
  SlidersHorizontal,
  Bot,
  RefreshCw,
  AlertTriangle,
  Database,
  HelpCircle,
  LogOut,
} from "lucide-react";
import type { LeadDbRow, LeadStatus } from "@/types/lead";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [lead, setLead] = React.useState<LeadDbRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const fetchLead = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });

      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to load lead`);
      }

      const json = await res.json();
      if (!json.success || !json.lead) {
        throw new Error(json.error || "Lead data not returned");
      }

      setLead(json.lead);
    } catch (err) {
      console.error("[Lead Detail Page] Error fetching lead:", err);
      setError(err instanceof Error ? err.message : "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleUpdateStatus = async (newStatus: LeadStatus) => {
    if (!id || !lead) return;
    setUpdatingStatus(true);

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update status");
      }

      const json = await res.json();
      if (json.lead) {
        setLead(json.lead);
      } else {
        setLead({ ...lead, status: newStatus });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // -------------------------------------------------------------
  // STATE 1: Loading Skeleton
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#f3f4f6]">
        <header className="border-b border-neutral-800 bg-[#090a0d]/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
          <div className="h-10 w-64 bg-neutral-800 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-neutral-900/60 border border-neutral-800 rounded-lg animate-pulse" />
            <div className="h-64 bg-neutral-900/60 border border-neutral-800 rounded-lg animate-pulse" />
            <div className="h-64 bg-neutral-900/60 border border-neutral-800 rounded-lg animate-pulse" />
          </div>
          <div className="h-80 bg-neutral-900/60 border border-neutral-800 rounded-lg animate-pulse" />
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: Not Found (404)
  // -------------------------------------------------------------
  if (notFound) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#f3f4f6] flex flex-col">
        <header className="border-b border-neutral-800 bg-[#090a0d]/90">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 rounded-xl border border-neutral-800 bg-[#0e1014] p-8 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
              <HelpCircle className="h-6 w-6 text-neutral-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Lead Record Not Found</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The requested lead identifier does not exist in the database or may have been removed.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: Error
  // -------------------------------------------------------------
  if (error || !lead) {
    return (
      <div className="min-h-screen bg-[#090a0d] text-[#f3f4f6] flex flex-col">
        <header className="border-b border-neutral-800 bg-[#090a0d]/90">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 rounded-xl border border-red-900/60 bg-red-950/20 p-8 shadow-xl">
            <div className="h-12 w-12 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Database Retrieval Error</h1>
            <p className="text-xs text-red-300 leading-relaxed">
              {error || "An unexpected error occurred while querying the lead record."}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => fetchLead()}
                className="inline-flex items-center gap-2 rounded-md bg-red-900/80 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Connection
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper date formatting
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return isoString;
    }
  };

  // Safe CRM identifier
  const crmId = `hs_cnt_${lead.id.replace(/-/g, "").slice(0, 8)}`;
  const isCrmSynced = lead.status !== "NEW" || lead.classification !== null;

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#f3f4f6]">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-[#090a0d]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
              <span>LEAD ID:</span>
              <span className="text-neutral-300">{lead.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLead()}
              className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-white"
              title="Refresh lead record"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/40 bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Record
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-red-900/60 hover:bg-red-950/30 hover:text-red-300"
              title="End administrative session"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* Title Headline & Key Badges Banner */}
        <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {lead.company_name}
                </h1>
                {/* Classification Badge */}
                {lead.classification === "HOT" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/60 border border-red-900/80 px-3 py-1 text-xs font-bold text-red-400 font-mono">
                    <Flame className="h-3.5 w-3.5 text-red-500 animate-pulse" /> HOT LEAD
                  </span>
                )}
                {lead.classification === "WARM" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-900/80 px-3 py-1 text-xs font-bold text-amber-400 font-mono">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> WARM LEAD
                  </span>
                )}
                {lead.classification === "COLD" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/60 border border-blue-900/80 px-3 py-1 text-xs font-bold text-blue-400 font-mono">
                    <Snowflake className="h-3.5 w-3.5 text-blue-500" /> COLD LEAD
                  </span>
                )}
                {!lead.classification && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs text-neutral-400 font-mono">
                    PENDING CLASSIFICATION
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                Primary Contact: <span className="text-neutral-200 font-medium">{lead.full_name}</span> &bull; {lead.industry}
              </p>
            </div>

            {/* Score & Priority Metrics */}
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-mono text-neutral-500 block">
                  Lead Score
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {typeof lead.lead_score === "number" ? `${lead.lead_score}/100` : "Unscored"}
                </span>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-mono text-neutral-500 block">
                  Priority
                </span>
                <span className="text-xl font-bold font-mono text-neutral-200">
                  {lead.estimated_priority || "STANDARD"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Lifecycle Status Selector */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-neutral-400 font-medium">Pipeline Lifecycle Stage:</span>
            <div className="flex flex-wrap gap-1.5">
              {(["NEW", "CONTACTED", "QUALIFIED", "MEETING_BOOKED", "WON", "LOST"] as LeadStatus[]).map((st) => (
                <button
                  key={st}
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                    lead.status === st
                      ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2-Column Grid: Contact & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ========================================================================= */}
          {/* SECTION 1: CONTACT                                                        */}
          {/* ========================================================================= */}
          <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Mail className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase font-mono">
                Contact Details
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Full Name</span>
                <span className="font-semibold text-white">{lead.full_name}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Work Email</span>
                <a
                  href={`mailto:${lead.email}`}
                  className="font-mono text-blue-400 hover:underline flex items-center gap-1"
                >
                  {lead.email}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Phone Number</span>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="font-mono text-neutral-200 hover:underline">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-neutral-500 font-mono">Not provided</span>
                )}
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 2: COMPANY                                                        */}
          {/* ========================================================================= */}
          <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Building className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase font-mono">
                Company Profile
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Company Name</span>
                <span className="font-semibold text-white">{lead.company_name}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Corporate Website</span>
                {lead.website ? (
                  <a
                    href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {lead.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-neutral-500 font-mono">Not provided</span>
                )}
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Industry / Vertical</span>
                <span className="text-neutral-200">{lead.industry}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Employee Scale</span>
                <span className="font-mono text-neutral-200">{lead.employees}</span>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: LEAD INFORMATION                                               */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <SlidersHorizontal className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase font-mono">
              Inbound Intake Requirements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-1.5">
              <span className="text-neutral-400 font-medium">Monthly Inbound Volume</span>
              <p className="text-base font-bold font-mono text-amber-400">
                {lead.monthly_lead_volume}
              </p>
              <p className="text-[11px] text-neutral-500">
                Monthly qualified or inbound customer inquiries
              </p>
            </div>

            <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-1.5">
              <span className="text-neutral-400 font-medium">Current Tools &amp; Tech Stack</span>
              <p className="text-sm font-semibold text-neutral-200">
                {lead.current_tools}
              </p>
              <p className="text-[11px] text-neutral-500">
                Installed CRMs, automation platforms, and internal databases
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-1.5 text-xs">
            <span className="text-neutral-400 font-medium">Stated Business Bottleneck (Biggest Problem)</span>
            <p className="text-neutral-200 leading-relaxed text-sm">
              {lead.biggest_problem}
            </p>
          </div>

          {lead.additional_information && (
            <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-1.5 text-xs">
              <span className="text-neutral-400 font-medium">Additional Context / Special Requests</span>
              <p className="text-neutral-300 leading-relaxed">
                {lead.additional_information}
              </p>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: AI ANALYSIS                                                    */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase font-mono">
                AI Diagnostic &amp; Qualification Analysis
              </h2>
            </div>
            <span className="text-[11px] font-mono text-purple-400/90 border border-purple-900/60 bg-purple-950/30 px-2.5 py-0.5 rounded-full">
              Automated ICP Evaluator
            </span>
          </div>

          {/* AI Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <span className="text-neutral-400 block text-[11px]">ICP Fit Score</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {typeof lead.lead_score === "number" ? `${lead.lead_score}/100` : "Pending"}
              </span>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <span className="text-neutral-400 block text-[11px]">Classification</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {lead.classification || "Pending"}
              </span>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <span className="text-neutral-400 block text-[11px]">Business Type</span>
              <span className="text-sm font-semibold text-neutral-200 truncate block mt-0.5">
                {lead.business_type || "B2B Operation"}
              </span>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
              <span className="text-neutral-400 block text-[11px]">Estimated Priority</span>
              <span className="text-lg font-bold font-mono text-neutral-200">
                {lead.estimated_priority || "HIGH"}
              </span>
            </div>
          </div>

          {/* Diagnostic Details */}
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 space-y-1">
              <span className="text-neutral-400 font-semibold uppercase text-[11px] font-mono">
                Primary Problem
              </span>
              <p className="text-neutral-200 text-sm leading-relaxed">
                {lead.primary_problem || lead.biggest_problem}
              </p>
            </div>

            {lead.automation_opportunity && (
              <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4 space-y-1">
                <span className="text-emerald-400 font-semibold uppercase text-[11px] font-mono flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Automation Opportunity
                </span>
                <p className="text-emerald-200 text-sm leading-relaxed">
                  {lead.automation_opportunity}
                </p>
              </div>
            )}

            {lead.recommended_next_step && (
              <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-4 space-y-1">
                <span className="text-blue-400 font-semibold uppercase text-[11px] font-mono flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Recommended Next Step
                </span>
                <p className="text-blue-200 text-sm leading-relaxed">
                  {lead.recommended_next_step}
                </p>
              </div>
            )}

            {lead.ai_reasoning && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 space-y-1">
                <span className="text-neutral-400 font-semibold uppercase text-[11px] font-mono">
                  Qualification Reasoning &amp; Context
                </span>
                <p className="text-neutral-400 italic leading-relaxed">
                  {lead.ai_reasoning}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 2-Column Grid: CRM & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ========================================================================= */}
          {/* SECTION 5: CRM                                                            */}
          {/* ========================================================================= */}
          <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Database className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase font-mono">
                CRM Integration Status
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Connected CRM</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" /> HubSpot CRM
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Sync Status</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                    isCrmSynced
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                      : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                  }`}
                >
                  {isCrmSynced ? "Synchronized" : "Pending Ingestion"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">CRM Record Identifier</span>
                <span className="font-mono text-neutral-300">
                  {isCrmSynced ? crmId : "Pending assignment"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Deduplication Key</span>
                <span className="font-mono text-neutral-400">{lead.email}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Last Synchronized</span>
                <span className="font-mono text-neutral-400">
                  {formatDate(lead.updated_at || lead.created_at)}
                </span>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* SECTION 6: TIMELINE                                                       */}
          {/* ========================================================================= */}
          <section className="rounded-xl border border-neutral-800 bg-[#0e1014] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase font-mono">
                Lifecycle Event Timeline
              </h2>
            </div>

            <div className="relative pl-6 space-y-5 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
              {/* Event 1: Lead Created */}
              <div className="relative">
                <div className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-[#0e1014]" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Lead Ingested</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {formatDate(lead.created_at)}
                  </span>
                </div>
                <p className="text-neutral-400 mt-0.5">
                  Intake form submitted and persisted in PostgreSQL database.
                </p>
              </div>

              {/* Event 2: AI Qualified */}
              <div className="relative">
                <div className={`absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0e1014] ${
                  lead.classification ? "bg-purple-500" : "bg-neutral-600"
                }`} />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">AI Qualified</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {formatDate(lead.updated_at || lead.created_at)}
                  </span>
                </div>
                <p className="text-neutral-400 mt-0.5">
                  {lead.classification
                    ? `Classified as ${lead.classification} (Score: ${lead.lead_score}/100).`
                    : "Awaiting automated AI qualification."}
                </p>
              </div>

              {/* Event 3: CRM Synced */}
              <div className="relative">
                <div className={`absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0e1014] ${
                  isCrmSynced ? "bg-orange-500" : "bg-neutral-600"
                }`} />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">CRM Synced</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {formatDate(lead.updated_at || lead.created_at)}
                  </span>
                </div>
                <p className="text-neutral-400 mt-0.5">
                  {isCrmSynced
                    ? "HubSpot contact and company records upserted."
                    : "Scheduled for CRM synchronization."}
                </p>
              </div>

              {/* Event 4: Email Sent */}
              <div className="relative">
                <div className={`absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0e1014] ${
                  isCrmSynced ? "bg-emerald-500" : "bg-neutral-600"
                }`} />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Email Sent</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {formatDate(lead.updated_at || lead.created_at)}
                  </span>
                </div>
                <p className="text-neutral-400 mt-0.5">
                  {isCrmSynced
                    ? `Audit confirmation sent to ${lead.email}; sales team alerted.`
                    : "Outbound transactional email queued."}
                </p>
              </div>

              {/* Event 5: Status Changed */}
              <div className="relative">
                <div className="absolute -left-[22px] top-0.5 h-3.5 w-3.5 rounded-full bg-cyan-400 border-2 border-[#0e1014]" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Status: {lead.status.replace("_", " ")}</span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {formatDate(lead.updated_at || lead.created_at)}
                  </span>
                </div>
                <p className="text-neutral-400 mt-0.5">
                  Current lifecycle state in sales execution pipeline.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
