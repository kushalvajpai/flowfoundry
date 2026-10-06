import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Automation Architecture Audit",
  description:
    "Submit your inbound lead flow, qualification latency, and tech stack for evaluation by FlowFoundry principal automation engineers. Receive a custom architecture rubric.",
  openGraph: {
    title: "Request Automation Architecture Audit | FlowFoundry",
    description:
      "Submit your inbound lead flow, qualification latency, and tech stack for evaluation by FlowFoundry principal automation engineers.",
    url: "https://flowfoundry.io/audit",
  },
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
