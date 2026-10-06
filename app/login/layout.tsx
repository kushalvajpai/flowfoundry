import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operator Login",
  description: "Administrative access for FlowFoundry Lead Operations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
