# FlowFoundry — Product Brain & System Philosophy

`brain.md` defines the product strategy, operational lifecycle, core mental models, governance policies, and engineering discipline for **FlowFoundry — AI Lead-to-Customer Engine**.

This document is the conceptual authority for why the platform exists and how it makes decisions. For technical schemas, database definitions, API contracts, and implementation blueprints, refer to [`architecture.md`](file:///s:/Lead%20Generation/architecture.md).

---

## 1. Project Identity & Purpose

FlowFoundry is an enterprise-grade B2B automation platform engineered to bridge the conversion gap between inbound demand generation and sales pipeline execution.

### The Problem Space
In modern B2B organizations, inbound lead handling suffers from three systemic failures:
1. **Speed-to-Lead Latency**: High-intent buyers expect immediate acknowledgment. Industry benchmarks demonstrate that qualification delays exceeding 5 minutes degrade conversion velocity by over 80%.
2. **SDR Capacity & Inconsistent Qualification**: Manual enrichment and qualification consume hours of sales representative time, leading to inconsistent scoring, missed ICP markers, and poor routing.
3. **Data Loss & Disconnected Tooling**: Point-to-point Zapier/Webhook integrations fail silently during network spikes or downstream CRM outages, resulting in lost prospects with zero auditability.

### The Mission
FlowFoundry solves this by serving as an autonomous, durable lead ingestion, qualification, and routing engine. It receives inbound prospects from forms and webhooks, guarantees zero data loss through immediate persistence, evaluates fit via heuristic and intelligence models, synchronizes bi-directionally with sales CRMs, and triggers targeted outreach within minutes—not hours.

---

## 2. Non-Negotiable System Principles

Every architectural choice, pull request, and operational workflow in FlowFoundry must adhere to these governing laws:

### Principle 1: A Lead Received is a Lead Saved
*Under no circumstance may an inbound lead be lost due to downstream failure.*
The ingestion boundary exists solely to accept, validate, and durably persist raw inbound payload. The web tier must never synchronously wait for external AI inference, CRM webhooks, or notification pipelines to return before acknowledging receipt. Downstream outages must result in queued retry jobs, never lost customer demand.

### Principle 2: Absolute Single Source of Truth
The central relational database (Supabase / PostgreSQL) is the sole system of record for all leads, qualification evaluations, routing decisions, and audit events. Downstream platforms (HubSpot, Slack, Resend) are secondary consumers and mirrors—never the primary store.

### Principle 3: Prudent Heuristic & AI Confidence
Confidence is a coarse heuristic metric, not a mathematical certainty. High confidence unlocks autonomous velocity. Low confidence or ambiguous signals must halt automated outreach and mandate human evaluation. Automated systems must never hallucinate certainty or force a classification when data is insufficient.

### Principle 4: CRM is a Subordinate Mirror
CRMs (e.g., HubSpot, Salesforce) are built for sales representatives, not data consistency. FlowFoundry manages ingestion, normalization, and scoring upstream. The engine updates the CRM via controlled synchronization, preventing circular update loops and eliminating field collisions.

### Principle 5: Dual-Layer Idempotency
Duplicate submissions—whether triggered by frustrated user double-clicks, mobile browser reloads, or automated network retries—must never create duplicate CRM deals, send double emails, or bill multiple AI qualification tokens.

### Principle 6: Human Authority Over Automation (The Race Condition Rule)
Human review decisions always supersede automated classifications. If an inbound lead is flagged for manual review, autonomous processing immediately pauses. If an automated score arrives while or after a human operator updates a lead record, the human decision takes absolute precedence.

### Principle 7: Resilient, Bounded Asynchrony
All background tasks must utilize bounded exponential backoff with a Dead Letter Queue (DLQ). When a downstream integration permanently rejects a payload, the failure must be captured with full operational context, alerting operators without polluting the main processing queue.

### Principle 8: Total System Auditability
Every state mutation, enrichment output, human override, and third-party API transaction must append an immutable audit record. The history of any lead from anonymous click to closed customer must be reconstructible at any time.

### Principle 9: Zero Tolerance for Synthetic Functionality
No fake code, mocked metrics, stubbed database connectors, or fabricated AI calls may exist in production pathways. Features are either implemented with production-grade reliability, cleanly disabled, or explicitly designated as planned roadmap items.

---

## 3. Single Source of Truth (SSOT) Ownership Matrix

To prevent data drift and split-brain scenarios across distributed tools, data ownership is strictly compartmentalized:

| Domain / State | Authoritative Owner | Secondary / Downstream Consumers | Permitted Writers |
| :--- | :--- | :--- | :--- |
| **Raw Lead Submission** | Central Database (`leads` table) | Downstream Queue, Audit Log | Ingestion API (`POST /api/leads`) |
| **Ingestion Idempotency** | Central Database (Unique Constraints) | Client Form, Edge API | Ingestion API |
| **ICP Qualification Score** | Central Database (`qualification` record) | CRM, Slack Notification, Analytics | AI Worker, Human Reviewer |
| **Manual Review Flag** | Central Database (`manual_review_required`) | Review Queue UI, Worker Coordinator | AI Worker (Sets flag), Human (Clears flag) |
| **Sales Pipeline Stage** | Central Database (Status) | CRM Deals, Pipeline Views | Sales Representative (via CRM sync), Engine |
| **External CRM Entity IDs** | Central Database (`hubspot_contact_id`) | Ingestion Engine, Webhook Listeners | CRM Sync Worker |
| **Transactional Email State**| Central Database (`dispatched_at`) | Email Service Provider | Email Worker |
| **System Telemetry / Logs** | Audit Event Store (`audit_events` table) | Operator Dashboard, Monitoring Tools | All Workers & System Services |

---

## 4. The Lead Lifecycle (Conceptual State Machine)

FlowFoundry manages leads through a deterministic, auditable state machine:

```
[Anonymous Inbound]
        │
        ▼
   (Received)
        │
        ├── [Validation Failure] ──► (Rejected: HTTP 400 Client Feedback)
        │
        ▼
   (Persisted: Status = "new")
        │
        ▼
   (Queued for Asynchronous Processing)
        │
        ▼
  (Enriching & Qualification)
        │
        ├── [Confidence < Threshold] ──► (Status = "review_required")
        │                                         │
        │                                  [Human Review]
        │                                         │
        │◄────────────────────────────────────────┘
        │
        ├── [Disqualified] ────────────► (Status = "disqualified") ──► (Archived / Nurture List)
        │
        ▼
  (Status = "qualified")
        │
        ├──► Synchronize to CRM (HubSpot Contact & Deal created)
        ├──► Notify Sales Team (Instant Slack/Email Alert)
        └──► Dispatch Tailored Follow-up (Resend SLA Confirmation)
        │
        ▼
   (Status = "routed" / "converted")
```

### State Definitions
1. **New (`new`)**: The lead has been syntactically validated and durably stored in the central database. An acknowledgment has been returned to the client. Background processing job is enqueued.
2. **Enriching (`enriching`)**: The background worker has claimed the job. Third-party firmographic lookup and AI intent analysis are underway.
3. **Review Required (`review_required`)**: The lead possesses conflicting signals, missing critical qualification inputs, or an AI confidence rating falling below the operational threshold. Automated customer outreach is halted until human intervention.
4. **Qualified (`qualified`)**: The lead meets ICP criteria. Routing parameters (tier, destination pipeline, priority score) are calculated.
5. **Disqualified (`disqualified`)**: The lead does not match ICP criteria (e.g., student, personal webmail domain, non-operational geography). Routed to low-touch nurture tracks.
6. **Routed (`routed`)**: The record has successfully synchronized to the downstream CRM, alerts have dispatched to account executives, and initial transactional email has been sent.

---

## 5. Subsystem Philosophies & Governance

### 5.1 Idempotency Philosophy
Network unpredictability is an inevitable reality in distributed web systems. Users submit forms twice on high-latency mobile networks; webhook providers replay messages when acknowledgments arrive late.
- **Client Responsibility**: Form interfaces must immediately disable submission triggers upon initial click and submit an immutable submission identifier.
- **Platform Responsibility**: The ingestion layer enforces deduplication at the edge and relational layers. Duplicate submissions must resolve gracefully: the system acknowledges the duplicate with success while suppressing redundant background processing, eliminating double CRM creation and duplicate outreach.

### 5.2 AI Qualification & Scoring Philosophy
Large Language Models are utilized as semantic interpretation engines, not black-box decision arbiters.
- **Strict Boundary**: AI analyzes unstructured problem statements, extracts firmographic intent, and calculates fit against an explicit ICP matrix.
- **Confidence Rating**: Every qualification output must output a coarse confidence rating (`HIGH`, `MEDIUM`, `LOW`) accompanied by bulleted rationale.
- **Pessimistic Routing**: If an AI evaluator encounters ambiguity, it must never hallucinate compliance. The correct output for ambiguous leads is `LOW` confidence and escalation to human operators.

### 5.3 Human-in-the-Loop Review Philosophy
Automation accelerates revenue; unchecked automation damages enterprise reputations.
- **The Quarantine Mechanism**: Leads triggering fraud checks, high-volume enterprise accounts with missing domains, or low-confidence AI scoring must enter a dedicated review quarantine.
- **SLA Commitment**: Human review items trigger real-time operator alerts to guarantee rapid resolution, ensuring enterprise high-value prospects receive white-glove onboarding without sacrificing speed.

### 5.4 HubSpot & CRM Philosophy
FlowFoundry treats the CRM as a downstream sales cockpit, not a general-purpose database.
- **One-Way Ingestion**: Leads are never authored directly into CRM deal stages without passing through FlowFoundry's qualification gate.
- **Field Ownership**: FlowFoundry owns technical enrichment, score values, and qualification tiers. Sales reps own interaction notes, stage progression, and closing milestones.
- **Loop Protection**: All updates propagated to the CRM store the upstream FlowFoundry Lead ID. Webhook listeners must verify origin IDs before processing updates to avoid self-triggering synchronization loops.

### 5.5 Transactional Email & Messaging Philosophy
Communication must be timely, professional, and restrained.
- **No Spam**: FlowFoundry triggers transactional communications only (e.g., audit submission receipts, calendar booking links, high-priority sales alerts).
- **Deliverability First**: Outbound communications must respect corporate domain reputations, utilizing verified DKIM/SPF channels with fail-fast suppression lists for undeliverable addresses.

### 5.6 Dashboard & Observability Philosophy
The internal operations dashboard is a lens, not an engine.
- **Read-Only Reporting**: Metrics displayed to operators must be derived directly from verified database records.
- **Telemetry Reality**: Performance metrics such as lead velocity, error rates, and median processing latency must reflect actual timestamp deltas—never hardcoded placeholders.

---

## 6. Engineering & Code Craft Discipline

In alignment with the **Minimal Code Engineering Rules**, development across FlowFoundry follows strict structural parsimony:

### Core Rules
1. **Minimum Necessary Code + Maximum Clarity**: Choose the simplest correct implementation. Never write 100 lines when 25 lines of readable, robust code solve the business requirement.
2. **Reuse Before Creating**: Inspect existing components, Zod schemas, and utility functions before introducing new files. Never duplicate validation logic across client and server.
3. **No Premature Abstractions**: Avoid generic interfaces, speculative factories, and multi-tier wrapper modules for single-use operations. Introduce abstractions only when three or more distinct concrete implementations demand them.
4. **Strict TypeScript & Zero `any`**: All domain models, API payloads, and integration interfaces must be strictly typed.
5. **No Synthetic Functionality**: Never commit fake metrics, mock delay functions in production paths, or pretend external integrations are functioning when they are unconfigured.

### AI Coding Agent Directives
When autonomous agents or developers modify this repository:
- **Inspect Before Editing**: Always verify file contents, existing exports, and dependencies before proposing alterations.
- **Respect Application Boundaries**: Do not invent new database tables or third-party SDK dependencies without updating `architecture.md` and obtaining approval.
- **Preserve Comments & Formatting**: Maintain existing documentation, licenses, and architecture notes.

---

## 7. Current Scope vs. Future Scope

To prevent scope creep and maintain complete architectural clarity, platform boundaries are explicitly delineated:

### Current Scope (Implemented in Codebase)
* **High-Trust Landing Page**: 8 mounted marketing sections establishing corporate positioning, platform value proposition, and technical credibility.
* **B2B Consultation / Audit Intake Form**: 11-field accessible form (`/audit`) with client-side Zod validation, responsive mobile UX, and in-flight click suppression.
* **Confirmation View**: `/thank-you` route confirming receipt and outlining the 24-hour turnaround SLA.
* **Ingestion Route Handler**: `POST /api/leads` endpoint performing rigorous server-side Zod schema validation, data sanitization, and structured error responses.
* **External Webhook Dispatcher**: Direct, synchronous HTTP POST forwarding to `N8N_LEAD_WEBHOOK_URL` with 10-second timeout enforcement and network failure handling.

### Future Scope (Target Architecture Roadmap)
* **Durable Database Persistence**: Supabase PostgreSQL integration for immediate inbound lead persistence before external forwarding.
* **Asynchronous Queue & Worker Engine**: Decoupling API ingestion from external network dependencies via BullMQ/Redis or database-backed task queues.
* **Dual-Layer Idempotency**: Client-supplied UUID tracking combined with database-level uniqueness constraints and time-window deduplication.
* **Autonomous AI Qualification Engine**: Real-time GPT-4 firmographic analysis, scoring, and rationale generation.
* **Automated CRM & Outreach Orchestration**: Native HubSpot contact/deal synchronization and Resend transactional confirmation emails.
* **Internal Operations Dashboard**: Live pipeline telemetry, manual review quarantine interface, and audit trail exploration.

---

## 8. Architectural Decision Record (ADR) Log

| ADR # | Title | Date | Status | Summary of Decision |
| :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | Synchronous n8n Forwarding via Next.js API | 2026-09-25 | **Active (Transitional)** | Valid leads are validated server-side and forwarded via synchronous HTTPS POST to `N8N_LEAD_WEBHOOK_URL` to enable immediate workflow automation without database infrastructure. |
| **ADR-002** | Adoption of Zod for Unified Validation | 2026-09-25 | **Active** | Standardized on Zod 3 for both client-side form checking and server-side API boundary parsing, guaranteeing complete input consistency. |
| **ADR-003** | Transition from Synchronous Ingress to Durable Queue | — | **Planned** | Planned replacement of direct n8n webhook call with Supabase PostgreSQL persistence and decoupled background queue workers (resolving Principle 1 violation). |
