"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Pipeline", href: "/#pipeline" },
  { label: "Architecture", href: "/#architecture" },
  { label: "Security", href: "/#security" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E5E5E0] bg-[#FAFAF8]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[#1A1A1A] hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2F]"
          aria-label="FlowFoundry Home"
        >
          <span className="h-4 w-4 bg-[#1E3A2F] rounded-[2px]" aria-hidden="true" />
          <span className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
            FlowFoundry
          </span>
        </Link>

        {/* Desktop Navigation: 3-4 text links max */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => {
            const isActive = item.href === "/dashboard" && pathname.startsWith("/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? "text-[#1E3A2F] font-semibold"
                    : "text-[#5C5C57] hover:text-[#1A1A1A]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Primary CTA Button: One button only, no pills */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/audit">
            <Button variant="primary" size="sm">
              Request Audit
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[#5C5C57] hover:text-[#1A1A1A] hover:bg-[#F3F3EF] rounded-[2px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1E3A2F]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-[#E5E5E0] bg-[#FAFAF8] px-4 py-4 md:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col space-y-3">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-medium text-[#5C5C57] hover:text-[#1A1A1A] py-1"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#E5E5E0]">
              <Link href="/audit" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full justify-center">
                  Request Audit
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
