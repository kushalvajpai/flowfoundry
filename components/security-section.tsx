import { Lock, EyeOff, FileText, CheckCircle2 } from "lucide-react";

export function SecuritySection() {
  return (
    <section id="security" className="py-16 md:py-20 border-b border-[#E5E5E0] bg-[#FAFAF8]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <div className="inline-block px-2 py-0.5 rounded-[2px] text-[11px] font-mono tracking-wider uppercase text-[#5C5C57] bg-[#F3F3EF] border border-[#E5E5E0]">
            DATA GOVERNANCE & PRIVACY
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-[-0.02em] text-[#1A1A1A] leading-tight">
            Enterprise Security at Every Layer
          </h2>
          <p className="text-sm sm:text-base text-[#5C5C57] leading-relaxed">
            Data integrity and customer privacy are fundamental. FlowFoundry isolates lead data with bank-grade encryption, zero AI data retention policies, and granular auditability.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[3px] border border-[#E5E5E0] bg-white p-5 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors">
            <div>
              <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 w-fit text-[#1E3A2F]">
                <Lock className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#1A1A1A]">
                Zero Model Training Retention
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                AI qualification runs strictly on ephemeral instances. No lead identities, company intelligence, or corporate emails are ever retained for model retraining.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E5E0] text-[11px] font-mono text-[#1E3A2F] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Strict API contract guarantee
            </div>
          </div>

          <div className="rounded-[3px] border border-[#E5E5E0] bg-white p-5 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors">
            <div>
              <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 w-fit text-[#1E3A2F]">
                <EyeOff className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#1A1A1A]">
                PII Masking & Tokenization
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                Sensitive identifiers can be hashed or tokenized prior to enrichment. Raw PII remains locked in your primary CRM or secure storage ledger.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E5E0] text-[11px] font-mono text-[#1E3A2F] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> SHA-256 pseudonymization
            </div>
          </div>

          <div className="rounded-[3px] border border-[#E5E5E0] bg-white p-5 flex flex-col justify-between hover:border-[#1A1A1A]/30 transition-colors">
            <div>
              <div className="rounded-[2px] border border-[#E5E5E0] bg-[#FAFAF8] p-2 w-fit text-[#1E3A2F]">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm sm:text-base font-semibold text-[#1A1A1A]">
                Cryptographic Audit Trails
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-[#5C5C57] leading-relaxed">
                Every score, routing decision, and external CRM sync event creates an immutable log entry with timestamps, source IP hashes, and deterministic justification.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E5E5E0] text-[11px] font-mono text-[#1E3A2F] flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Full regulatory compliance
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
