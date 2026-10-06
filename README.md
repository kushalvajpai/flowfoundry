# FlowFoundry — AI Lead-to-Customer Engine

Enterprise B2B automation platform that ingests business leads, evaluates intent, and routes qualified prospects into revenue workflows.

---

## Environment Variables

FlowFoundry requires server-side environment variables to dispatch leads to downstream integration webhooks.

### Required Variables

| Variable | Description | Security Scope |
|---|---|---|
| `N8N_LEAD_WEBHOOK_URL` | The HTTPS webhook endpoint URL of your n8n workflow | **Server-side only** (never expose to browser) |

### Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Set your active n8n webhook URL in `.env.local`:
   ```env
   N8N_LEAD_WEBHOOK_URL=https://your-n8n-instance.com/webhook/flowfoundry-leads
   ```
3. Never commit `.env` or `.env.local` to git.

---

## Lead Ingestion Flow

```text
Browser Form / External Inbound
   ↓ (POST /api/leads)
Server Validation (Zod Schema)
   ↓
Business Logic (Sanitized logging & payload preparation)
   ↓ (POST HTTPS with timeout & error handling)
n8n Webhook Ingestion
   ↓ (2xx response)
Client Success Notification -> /thank-you
```

---

## Development & Testing

```bash
# Start development server
npm run dev

# Run strict TypeScript check
npm run type-check

# Run linter
npm run lint

# Run production build
npm run build

# Run automated regression test suite
npm run test
```
