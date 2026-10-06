import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Operations & Analytics Dashboard",
  description:
    "Internal lead conversion telemetry, CRM routing status, and deterministic qualification analytics.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
