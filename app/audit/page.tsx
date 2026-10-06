"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadSubmissionSchema, type ValidatedLeadInput } from "@/lib/validations/lead";

const industries = [
  "B2B SaaS / Software",
  "Fintech & Financial Services",
  "Healthcare & Life Sciences",
  "Manufacturing & Logistics",
  "Professional & Advisory Services",
  "E-Commerce & Retail",
  "Other Enterprise Vertical",
];

const employeeRanges = ["1-10", "11-50", "51-200", "201-1,000", "1,000+"];
const volumeRanges = ["< 100", "100 - 500", "501 - 2,000", "2,001 - 10,000", "10,000+"];

export default function AuditPage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState<ValidatedLeadInput>({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    employees: "",
    monthlyLeadVolume: "",
    biggestProblem: "",
    currentTools: "",
    additionalInformation: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = React.useState<"idle" | "submitting" | "error">("idle");
  const [serverError, setServerError] = React.useState<string | null>(null);

  const isSubmitting = submissionStatus === "submitting";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate clicks

    setServerError(null);
    setErrors({});

    // Client-side schema validation
    const result = leadSubmissionSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString() || "form";
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmissionStatus("submitting");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmissionStatus("error");
        if (data.errors) {
          setErrors(data.errors);
        }
        setServerError(data.message || data.error || "Unable to process your request");
        return;
      }

      // Success state -> redirect to /thank-you
      router.push("/thank-you");
    } catch {
      setSubmissionStatus("error");
      setServerError("Network connection error. Please verify connectivity and retry.");
    }
  };

  return (
    <div className="py-12 md:py-20 bg-[#FAFAF8] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="border-b border-[#E5E5E0] pb-8 space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            TECHNICAL AUDIT INTAKE
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            Request an Automation Architecture Audit
          </h1>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            Our principal automation engineers evaluate your inbound lead flow, qualification latency, and CRM dispatch topology. Complete this diagnostic intake to initiate the review.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-[#5C5C57]">
            <span className="flex items-center gap-1.5 text-[#1A1A1A]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1E3A2F]" />
              NDA Protected
            </span>
            <span>•</span>
            <span>4-Hour Diagnostic SLA</span>
            <span>•</span>
            <span>Zero Sales Spam</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {serverError && (
          <div
            role="alert"
            className="mt-6 p-4 rounded-[3px] border border-red-200 bg-red-50 text-red-800 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Diagnostic Form Container */}
        <div className="mt-8 rounded-[3px] border border-[#E5E5E0] bg-white p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* Group 1: Contact & Entity */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-mono uppercase tracking-wider text-[#1A1A1A] border-b border-[#E5E5E0] pb-2 w-full font-semibold">
                01 // Executive & Organization Details
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Katherine Pierce"
                    value={formData.fullName}
                    onChange={handleChange}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.fullName ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  />
                  {errors.fullName && (
                    <p id="fullName-error" className="mt-1 text-[11px] text-red-600">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="katherine@enterprise.com"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.email ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-[11px] text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    placeholder="Acme Systems"
                    value={formData.companyName}
                    onChange={handleChange}
                    aria-invalid={!!errors.companyName}
                    aria-describedby={errors.companyName ? "companyName-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.companyName ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  />
                  {errors.companyName && (
                    <p id="companyName-error" className="mt-1 text-[11px] text-red-600">
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="website" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Website (Optional)
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    placeholder="https://acme.com"
                    value={formData.website}
                    onChange={handleChange}
                    aria-invalid={!!errors.website}
                    aria-describedby={errors.website ? "website-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.website ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  />
                  {errors.website && (
                    <p id="website-error" className="mt-1 text-[11px] text-red-600">
                      {errors.website}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    value={formData.phone}
                    onChange={handleChange}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.phone ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  />
                  {errors.phone && (
                    <p id="phone-error" className="mt-1 text-[11px] text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Group 2: Scale & Operations */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-mono uppercase tracking-wider text-[#1A1A1A] border-b border-[#E5E5E0] pb-2 w-full font-semibold">
                02 // Scale & Inbound Scope
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label htmlFor="industry" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    required
                    value={formData.industry}
                    onChange={handleChange}
                    aria-invalid={!!errors.industry}
                    aria-describedby={errors.industry ? "industry-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.industry ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  >
                    <option value="">Select industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p id="industry-error" className="mt-1 text-[11px] text-red-600">
                      {errors.industry}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="employees" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Employees <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employees"
                    name="employees"
                    required
                    value={formData.employees}
                    onChange={handleChange}
                    aria-invalid={!!errors.employees}
                    aria-describedby={errors.employees ? "employees-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.employees ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  >
                    <option value="">Select head count</option>
                    {employeeRanges.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                  {errors.employees && (
                    <p id="employees-error" className="mt-1 text-[11px] text-red-600">
                      {errors.employees}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="monthlyLeadVolume" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                    Monthly Leads <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="monthlyLeadVolume"
                    name="monthlyLeadVolume"
                    required
                    value={formData.monthlyLeadVolume}
                    onChange={handleChange}
                    aria-invalid={!!errors.monthlyLeadVolume}
                    aria-describedby={errors.monthlyLeadVolume ? "monthlyLeadVolume-error" : undefined}
                    className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:bg-white focus:ring-1 ${
                      errors.monthlyLeadVolume ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                    }`}
                  >
                    <option value="">Select volume</option>
                    {volumeRanges.map((vol) => (
                      <option key={vol} value={vol}>{vol}</option>
                    ))}
                  </select>
                  {errors.monthlyLeadVolume && (
                    <p id="monthlyLeadVolume-error" className="mt-1 text-[11px] text-red-600">
                      {errors.monthlyLeadVolume}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Group 3: Architecture & Challenges */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-mono uppercase tracking-wider text-[#1A1A1A] border-b border-[#E5E5E0] pb-2 w-full font-semibold">
                03 // Revenue Architecture & Diagnostic Context
              </legend>

              <div className="pt-1">
                <label htmlFor="currentTools" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Current Stack / CRM / Tools <span className="text-red-500">*</span>
                </label>
                <input
                  id="currentTools"
                  name="currentTools"
                  type="text"
                  required
                  placeholder="e.g. HubSpot Enterprise, Segment, Zapier, Clay, Apollo"
                  value={formData.currentTools}
                  onChange={handleChange}
                  aria-invalid={!!errors.currentTools}
                  aria-describedby={errors.currentTools ? "currentTools-error" : undefined}
                  className={`w-full h-9 rounded-[3px] border bg-[#FAFAF8] px-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                    errors.currentTools ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                  }`}
                />
                {errors.currentTools && (
                  <p id="currentTools-error" className="mt-1 text-[11px] text-red-600">
                    {errors.currentTools}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="biggestProblem" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Biggest Business Problem <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="biggestProblem"
                  name="biggestProblem"
                  required
                  rows={3}
                  placeholder="Describe your critical bottleneck (e.g. SDRs wasting 15 hrs/wk manually researching unqualified inbound; 30-min response lag causing deal drop-off; lack of ICP scoring)..."
                  value={formData.biggestProblem}
                  onChange={handleChange}
                  aria-invalid={!!errors.biggestProblem}
                  aria-describedby={errors.biggestProblem ? "biggestProblem-error" : undefined}
                  className={`w-full rounded-[3px] border bg-[#FAFAF8] p-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 ${
                    errors.biggestProblem ? "border-red-500 focus:ring-red-500" : "border-[#E5E5E0] focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                  }`}
                />
                {errors.biggestProblem && (
                  <p id="biggestProblem-error" className="mt-1 text-[11px] text-red-600">
                    {errors.biggestProblem}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="additionalInformation" className="block text-xs font-medium text-[#1A1A1A] mb-1">
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additionalInformation"
                  name="additionalInformation"
                  rows={2}
                  placeholder="Any special security, SOC-2, VPC isolation, or custom routing requirements..."
                  value={formData.additionalInformation}
                  onChange={handleChange}
                  className="w-full rounded-[3px] border border-[#E5E5E0] bg-[#FAFAF8] p-3 text-xs text-[#1A1A1A] placeholder:text-[#5C5C57]/60 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#1E3A2F] focus:border-[#1E3A2F]"
                />
              </div>
            </fieldset>

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-[11px] font-mono text-[#5C5C57]">
                Deterministic validation enabled. Confidential enterprise evaluation.
              </p>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="sm:w-auto w-full min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Validating & Dispatching...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Audit Request</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
