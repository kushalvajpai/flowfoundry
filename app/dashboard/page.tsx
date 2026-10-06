"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Search,
  RefreshCw,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Building,
  Mail,
  ExternalLink,
  SlidersHorizontal,
  PanelRight,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Plus,
  ArrowUpDown,
  Laptop,
  Briefcase,
  FileText,
  AlertCircle,
  Trash2,
  ShieldAlert,
  KeyRound,
  Shield,
  User,
} from "lucide-react";
import type { DashboardResponse } from "@/types/dashboard";
import type { LeadDbRow, LeadStatus } from "@/types/lead";

const mockContacts = [
  { name: "Natali Craig", role: "Senior AE", avatar: "NC", status: "online", color: "bg-blue-500" },
  { name: "Drew Cano", role: "Enterprise Rep", avatar: "DC", status: "busy", color: "bg-purple-500" },
  { name: "Andi Lane", role: "Solutions Architect", avatar: "AL", status: "online", color: "bg-emerald-500" },
  { name: "Koray Okumus", role: "RevOps Lead", avatar: "KO", status: "away", color: "bg-amber-500" },
  { name: "Kate Morrison", role: "Pipeline Engineer", avatar: "KM", status: "offline", color: "bg-rose-500" },
  { name: "Melody Macy", role: "Inbound Specialist", avatar: "MM", status: "online", color: "bg-teal-500" },
];

export default function DashboardPage() {
  const router = useRouter();

  // SnowUI Theme State (Light by default, matches user screenshot)
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  // Sync with document element
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Sidebar Toggles
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = React.useState<"overview" | "ecommerce" | "projects" | "orders">("overview");

  // State
  const [data, setData] = React.useState<DashboardResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Filters & Search
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [classification, setClassification] = React.useState<string>("ALL");
  const [industry, setIndustry] = React.useState<string>("ALL");
  const [status, setStatus] = React.useState<string>("ALL");
  const [dateRange, setDateRange] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [sortBy, setSortBy] = React.useState<"created_at" | "lead_score" | "company_name">("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Selected lead for detail inspection drawer
  const [selectedLead, setSelectedLead] = React.useState<LeadDbRow | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // Velocity chart active tab
  const [chartMetric, setChartMetric] = React.useState<"total" | "hot" | "warm">("total");

  // Role Logic: "admin" vs "customer"
  const [userRole, setUserRole] = React.useState<"admin" | "customer">("admin");

  // Deletion & Password Protection State
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{
    action: "delete_single" | "purge_all";
    leadId?: string;
    targetName?: string;
  } | null>(null);
  const [adminPassword, setAdminPassword] = React.useState("");
  const [confirmPhrase, setConfirmPhrase] = React.useState("");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = React.useState<string | null>(null);

  const handleOpenDelete = (action: "delete_single" | "purge_all", leadId?: string, targetName?: string) => {
    if (userRole !== "admin") {
      alert("Permission denied: Customer role is restricted to read-only access. Switch to Admin mode to delete records.");
      return;
    }
    setDeleteTarget({ action, leadId, targetName });
    setAdminPassword("");
    setConfirmPhrase("");
    setDeleteError(null);
    setDeleteSuccessMsg(null);
    setDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    if (userRole !== "admin") {
      setDeleteError("Customer role cannot delete database records.");
      return;
    }
    if (!adminPassword.trim()) {
      setDeleteError("Admin password is required.");
      return;
    }
    if (deleteTarget.action === "purge_all" && confirmPhrase.trim().toUpperCase() !== "DELETE") {
      setDeleteError('You must type "DELETE" to confirm complete database purge.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/admin/leads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: userRole,
          password: adminPassword,
          action: deleteTarget.action,
          leadId: deleteTarget.leadId,
          confirmationText: confirmPhrase,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.error || "Failed to execute delete operation.");
      } else {
        setDeleteSuccessMsg(json.message || "Operation completed successfully.");
        if (selectedLead && deleteTarget.action === "delete_single" && selectedLead.id === deleteTarget.leadId) {
          setSelectedLead(null);
        }
        setTimeout(() => {
          setDeleteModalOpen(false);
          fetchData(true);
        }, 900);
      }
    } catch {
      setDeleteError("Network error contacting delete service endpoint.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch dashboard data
  const fetchData = React.useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.set("search", debouncedSearch);
      if (classification !== "ALL") queryParams.set("classification", classification);
      if (industry !== "ALL") queryParams.set("industry", industry);
      if (status !== "ALL") queryParams.set("status", status);
      if (dateRange !== "all") queryParams.set("dateRange", dateRange);
      queryParams.set("page", page.toString());
      queryParams.set("pageSize", pageSize.toString());
      queryParams.set("sortBy", sortBy);
      queryParams.set("sortOrder", sortOrder);

      const res = await fetch(`/api/dashboard?${queryParams.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: Failed to fetch dashboard data`);
      }

      const json: DashboardResponse = await res.json();
      if (!json.success && json.error) {
        throw new Error(json.error);
      }

      setData(json);
    } catch (err) {
      console.error("[Dashboard] Fetch failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, classification, industry, status, dateRange, page, pageSize, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Status update handler
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update lead status");
      }

      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }

      fetchData(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating lead status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const handleSort = (column: "created_at" | "lead_score" | "company_name") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const metrics = data?.metrics || {
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    unclassifiedLeads: 0,
    averageLeadScore: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    meetingsBooked: 0,
    wonLeads: 0,
    lostLeads: 0,
    leadsPerDay: 0,
    leadsPerWeek: 0,
    leadsPerMonth: 0,
    hotPercentage: 0,
    warmPercentage: 0,
    coldPercentage: 0,
    conversionToContacted: 0,
    conversionToMeeting: 0,
    conversionToWon: 0,
  };

  const leads = data?.leads || [];

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark bg-[#141416] text-[#F8FAFC]" : "bg-[#F7F9FB] text-[#1C1C1C]"} flex overflow-hidden font-sans transition-colors duration-200`}>
      
      {/* ========================================================================= */}
      {/* LEFT NAVIGATION SIDEBAR (SnowUI Pattern)                                  */}
      {/* ========================================================================= */}
      <aside
        className={`${
          isLeftSidebarOpen ? "w-64" : "w-16"
        } shrink-0 border-r ${
          theme === "dark" ? "border-white/[0.08] bg-[#1B1B1E]" : "border-black/[0.06] bg-white"
        } flex flex-col justify-between transition-all duration-200 z-30 select-none`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-4 justify-between border-b border-inherit">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] flex items-center justify-center font-bold text-sm shadow-sm">
                FF
              </div>
              {isLeftSidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-semibold text-sm tracking-tight text-inherit">FlowFoundry</span>
                  <span className="text-[10px] text-zinc-400 font-mono tracking-wider">SNOW-UI SPEC</span>
                </div>
              )}
            </Link>
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="text-zinc-400 hover:text-inherit p-1 rounded-md"
              title="Toggle sidebar"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${!isLeftSidebarOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {/* Favorites */}
            <div>
              {isLeftSidebarOpen && (
                <div className="px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Favorites
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "overview"
                      ? theme === "dark"
                        ? "bg-white/[0.08] text-white"
                        : "bg-black/[0.05] text-[#1C1C1C]"
                      : "text-zinc-400 hover:text-inherit hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {isLeftSidebarOpen && <span>Overview</span>}
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "projects"
                      ? theme === "dark"
                        ? "bg-white/[0.08] text-white"
                        : "bg-black/[0.05] text-[#1C1C1C]"
                      : "text-zinc-400 hover:text-inherit hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  {isLeftSidebarOpen && <span>Projects</span>}
                </button>
              </div>
            </div>

            {/* Dashboards */}
            <div>
              {isLeftSidebarOpen && (
                <div className="px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Dashboards
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "overview"
                      ? theme === "dark"
                        ? "bg-white/[0.08] text-white font-semibold"
                        : "bg-black/[0.05] text-[#1C1C1C] font-semibold"
                      : "text-zinc-400 hover:text-inherit"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  {isLeftSidebarOpen && <span>Default</span>}
                </button>
                <button
                  onClick={() => setActiveTab("ecommerce")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "ecommerce"
                      ? theme === "dark"
                        ? "bg-white/[0.08] text-white font-semibold"
                        : "bg-black/[0.05] text-[#1C1C1C] font-semibold"
                      : "text-zinc-400 hover:text-inherit"
                  }`}
                >
                  <Briefcase className="h-4 w-4" />
                  {isLeftSidebarOpen && <span>eCommerce</span>}
                </button>
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "projects"
                      ? theme === "dark"
                        ? "bg-white/[0.08] text-white font-semibold"
                        : "bg-black/[0.05] text-[#1C1C1C] font-semibold"
                      : "text-zinc-400 hover:text-inherit"
                  }`}
                >
                  <Laptop className="h-4 w-4" />
                  {isLeftSidebarOpen && <span>Projects</span>}
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "orders"
                      ? theme === "dark"
                        ? "bg-white/[0.08] text-white font-semibold"
                        : "bg-black/[0.05] text-[#1C1C1C] font-semibold"
                      : "text-zinc-400 hover:text-inherit"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  {isLeftSidebarOpen && <span>Online Courses / AI</span>}
                </button>
              </div>
            </div>

            {/* Pages */}
            <div>
              {isLeftSidebarOpen && (
                <div className="px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Pages
                </div>
              )}
              <div className="space-y-1">
                <Link
                  href="/audit"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-inherit hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <Plus className="h-4 w-4 text-emerald-500" />
                  {isLeftSidebarOpen && <span>New Audit Intake</span>}
                </Link>
                <Link
                  href="/#architecture"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-inherit hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {isLeftSidebarOpen && <span>Architecture Topology</span>}
                </Link>
              </div>
            </div>

            {/* Contacts list */}
            {isLeftSidebarOpen && (
              <div>
                <div className="px-3 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Contacts
                </div>
                <div className="space-y-1.5">
                  {mockContacts.slice(0, 4).map((c) => (
                    <div key={c.name} className="flex items-center gap-2.5 px-3 py-1 text-xs">
                      <div className={`h-6 w-6 rounded-full ${c.color} text-white flex items-center justify-center font-bold text-[10px]`}>
                        {c.avatar}
                      </div>
                      <span className="text-zinc-500 dark:text-zinc-400 truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="p-3 border-t border-inherit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                OP
              </div>
              {isLeftSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-inherit">Lead Operator</span>
                  <span className="text-[10px] text-zinc-400">admin@flowfoundry.io</span>
                </div>
              )}
            </div>
            {isLeftSidebarOpen && (
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-rose-500 p-1.5 rounded"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT (SnowUI Dashboard)                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className={`h-16 shrink-0 border-b ${
          theme === "dark" ? "border-white/[0.08] bg-[#141416]/90" : "border-black/[0.06] bg-white/90"
        } backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="lg:hidden p-1 text-zinc-500 hover:text-inherit"
            >
              <Layers className="h-4 w-4" />
            </button>
            <span className="hover:text-inherit cursor-pointer">Dashboards</span>
            <span>/</span>
            <span className="font-semibold text-inherit capitalize">{activeTab}</span>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads, companies..."
                className={`w-full h-8 pl-8 pr-8 rounded-lg text-xs border ${
                  theme === "dark"
                    ? "border-white/[0.08] bg-white/[0.05] text-white placeholder-zinc-500 focus:border-blue-500"
                    : "border-black/[0.06] bg-black/[0.02] text-[#1C1C1C] placeholder-zinc-400 focus:border-zinc-400"
                } focus:outline-none`}
              />
              <span className="absolute right-2.5 top-2 text-[10px] font-mono text-zinc-400 border border-inherit px-1 rounded">
                ⌘K
              </span>
            </div>

            {/* Light / Dark Mode Toggle Button (Matching SnowUI dual themes!) */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2 rounded-lg border transition-colors ${
                theme === "dark"
                  ? "border-white/[0.08] bg-white/[0.05] text-amber-300 hover:bg-white/[0.1]"
                  : "border-black/[0.06] bg-black/[0.02] text-zinc-700 hover:bg-black/[0.05]"
              }`}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Refresh Sync */}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className={`p-2 rounded-lg border transition-colors ${
                theme === "dark"
                  ? "border-white/[0.08] bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]"
                  : "border-black/[0.06] bg-black/[0.02] text-zinc-700 hover:bg-black/[0.05]"
              }`}
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            </button>

            {/* Role Switcher: Customer vs Admin Logic */}
            <div
              className={`flex items-center p-0.5 rounded-lg border text-xs font-medium ${
                theme === "dark" ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06] bg-black/[0.02]"
              }`}
            >
              <button
                onClick={() => setUserRole("customer")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                  userRole === "customer"
                    ? theme === "dark"
                      ? "bg-white/10 text-white font-semibold"
                      : "bg-white text-zinc-900 shadow-sm font-semibold"
                    : "text-zinc-400 hover:text-inherit"
                }`}
                title="Customer Mode: Read-only access, deletion disabled"
              >
                <User className="h-3 w-3" />
                <span>Customer</span>
              </button>
              <button
                onClick={() => setUserRole("admin")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                  userRole === "admin"
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-inherit"
                }`}
                title="Admin Mode: Full management, record deletion & purge permissions"
              >
                <Shield className="h-3 w-3" />
                <span>Admin</span>
              </button>
            </div>

            {/* Database Purge Button (Active & Visible in Admin Mode) */}
            {userRole === "admin" ? (
              <button
                onClick={() => handleOpenDelete("purge_all", undefined, "All PostgreSQL Leads")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-colors"
                title="Purge all leads in database (Admin password protected)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Purge DB</span>
              </button>
            ) : (
              <span
                className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-mono"
                title="Customer role has read-only access. Deletion is restricted."
              >
                Read-Only
              </span>
            )}

            {/* Notifications Toggle */}
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`relative p-2 rounded-lg border transition-colors ${
                theme === "dark"
                  ? "border-white/[0.08] bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]"
                  : "border-black/[0.06] bg-black/[0.02] text-zinc-700 hover:bg-black/[0.05]"
              }`}
              title="Toggle notifications panel"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
            </button>

            {/* Right Panel Toggle Icon */}
            <button
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`p-2 rounded-lg border transition-colors ${
                isRightSidebarOpen
                  ? "border-blue-500 text-blue-500"
                  : theme === "dark"
                  ? "border-white/[0.08] bg-white/[0.05] text-zinc-300"
                  : "border-black/[0.06] bg-black/[0.02] text-zinc-700"
              }`}
              title="Toggle right panel"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-inherit">Overview</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Real-time pipeline analytics & autonomous CRM dispatch</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Today</span>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 1: 4 PASTEL KPI CARDS (The hallmark of SnowUI)                         */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Views / Total Leads (Ice Blue) */}
            <div className="snow-kpi-blue p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-inherit/70">
                <span>Views / Total Leads</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  +11.01% <TrendingUp className="h-3 w-3 inline" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-inherit">
                  {metrics.totalLeads?.toLocaleString() ?? 0}
                </span>
                <span className="text-[11px] text-inherit/60 font-mono">Durable records</span>
              </div>
            </div>

            {/* Card 2: Visits / Qualified Leads (Lilac / Purple) */}
            <div className="snow-kpi-purple p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-inherit/70">
                <span>Visits / Qualified Leads</span>
                <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-0.5">
                  -0.03% <TrendingDown className="h-3 w-3 inline" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-inherit">
                  {metrics.qualifiedLeads?.toLocaleString() ?? 0}
                </span>
                <span className="text-[11px] text-inherit/60 font-mono">HOT + WARM</span>
              </div>
            </div>

            {/* Card 3: New Users / Meetings Booked (Soft Mint / Blue) */}
            <div className="snow-kpi-blue p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-inherit/70">
                <span>New Users / Meetings</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  +15.03% <TrendingUp className="h-3 w-3 inline" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-inherit">
                  {metrics.meetingsBooked?.toLocaleString() ?? 0}
                </span>
                <span className="text-[11px] text-inherit/60 font-mono">AE Booked</span>
              </div>
            </div>

            {/* Card 4: Active Users / Pipeline Score (Soft Lavender) */}
            <div className="snow-kpi-purple p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium text-inherit/70">
                <span>Active Users / Avg Score</span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  +6.08% <TrendingUp className="h-3 w-3 inline" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-inherit">
                  {metrics.averageLeadScore ? `${metrics.averageLeadScore}/100` : "0/100"}
                </span>
                <span className="text-[11px] text-inherit/60 font-mono">Deterministic</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 2: DUAL ANALYTICS VISUALIZATION (SnowUI Curved Chart + Channel Bars)   */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Ingestion & Pipeline Velocity Over Time */}
            <div className="lg:col-span-8 snow-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setChartMetric("total")}
                      className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                        chartMetric === "total"
                          ? "border-blue-500 text-inherit"
                          : "border-transparent text-zinc-400 hover:text-inherit"
                      }`}
                    >
                      Total Inbound
                    </button>
                    <button
                      onClick={() => setChartMetric("hot")}
                      className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                        chartMetric === "hot"
                          ? "border-purple-500 text-inherit"
                          : "border-transparent text-zinc-400 hover:text-inherit"
                      }`}
                    >
                      Qualified (HOT)
                    </button>
                    <button
                      onClick={() => setChartMetric("warm")}
                      className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
                        chartMetric === "warm"
                          ? "border-emerald-500 text-inherit"
                          : "border-transparent text-zinc-400 hover:text-inherit"
                      }`}
                    >
                      Operating Status
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> This year
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" /> Last year
                    </span>
                  </div>
                </div>

                {/* Smooth Curved Line Area Chart (Custom Responsive SVG) */}
                <div className="mt-6 h-60 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="snowBlueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={theme === "dark" ? "0.3" : "0.15"} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="snowPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity={theme === "dark" ? "0.3" : "0.15"} />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle grid lines */}
                    <line x1="0" y1="40" x2="700" y2="40" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="700" y2="90" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />
                    <line x1="0" y1="140" x2="700" y2="140" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="3 3" />

                    {/* Last year baseline curve */}
                    <path
                      d="M0,160 Q100,140 200,150 T400,120 T600,110 T700,90"
                      fill="none"
                      stroke={theme === "dark" ? "#3B3B42" : "#E2E8F0"}
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    {/* Primary smooth curve */}
                    <path
                      d="M0,150 C120,130 180,60 300,70 C420,80 480,30 580,45 C640,55 670,25 700,20 L700,190 L0,190 Z"
                      fill="url(#snowBlueGrad)"
                    />
                    <path
                      d="M0,150 C120,130 180,60 300,70 C420,80 480,30 580,45 C640,55 670,25 700,20"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                    />

                    {/* Active data points */}
                    <circle cx="300" cy="70" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="2" />
                    <circle cx="580" cy="45" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="2" />
                    <circle cx="700" cy="20" r="4" fill="#3B82F6" stroke="#fff" strokeWidth="2" />
                  </svg>

                  {/* Horizontal Month Labels */}
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono mt-3">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Traffic / Inbound by Channel */}
            <div className="lg:col-span-4 snow-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-4">
                  Traffic by Channel
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      name: "Website Audit Forms",
                      count: metrics.totalLeads?.toLocaleString() ?? "0",
                      pct: metrics.totalLeads > 0 ? 100 : 0,
                      color: "bg-blue-500",
                    },
                    {
                      name: "HOT Pipeline Yield",
                      count: metrics.hotLeads?.toLocaleString() ?? "0",
                      pct: Math.round(metrics.hotPercentage || 0),
                      color: "bg-purple-500",
                    },
                    {
                      name: "WARM Pipeline Yield",
                      count: metrics.warmLeads?.toLocaleString() ?? "0",
                      pct: Math.round(metrics.warmPercentage || 0),
                      color: "bg-teal-500",
                    },
                    {
                      name: "Direct API Webhooks",
                      count: "0",
                      pct: 0,
                      color: "bg-amber-500",
                    },
                  ].map((ch) => (
                    <div key={ch.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-inherit">{ch.name}</span>
                        <span className="font-mono text-zinc-400">{ch.count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className={`h-full ${ch.color} rounded-full`} style={{ width: `${ch.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-inherit mt-6 flex justify-between items-center text-xs text-zinc-400">
                <span>Multi-Source Ingestion</span>
                <span className="font-mono font-semibold text-emerald-500">100% Idempotent</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 3: SUPPORTING WIDGETS (Traffic by Device / Location from SnowUI)        */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Traffic by Device / Inbound by Industry (Pastel Rounded Bars) */}
            <div className="snow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
                  Traffic by Segment / Industry
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">Live Breakdown</span>
              </div>

              {/* Rounded Bar Chart (Computed dynamically from real database leads) */}
              <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2">
                {(() => {
                  const total = leads.length || 1;
                  const b2bCount = leads.filter(
                    (l) => l.industry?.includes("B2B") || l.industry?.includes("SaaS")
                  ).length;
                  const retailCount = leads.filter(
                    (l) => l.industry?.includes("Retail") || l.industry?.includes("Commerce")
                  ).length;
                  const fintechCount = leads.filter((l) => l.industry?.includes("Fintech")).length;
                  const healthCount = leads.filter((l) => l.industry?.includes("Health")).length;
                  const logisticsCount = leads.filter((l) => l.industry?.includes("Logistics")).length;
                  const otherCount = Math.max(
                    0,
                    leads.length - (b2bCount + retailCount + fintechCount + healthCount + logisticsCount)
                  );

                  return [
                    {
                      label: "B2B SaaS",
                      height: `${Math.max(12, Math.round((b2bCount / total) * 100))}%`,
                      color: "bg-[#86E3CE]",
                    },
                    {
                      label: "Retail/Ecom",
                      height: `${Math.max(12, Math.round((retailCount / total) * 100))}%`,
                      color: "bg-[#B4A0E5]",
                    },
                    {
                      label: "Fintech",
                      height: `${Math.max(8, Math.round((fintechCount / total) * 100))}%`,
                      color: "bg-[#95D0D6]",
                    },
                    {
                      label: "HealthTech",
                      height: `${Math.max(8, Math.round((healthCount / total) * 100))}%`,
                      color: "bg-[#9AD0F5]",
                    },
                    {
                      label: "Logistics",
                      height: `${Math.max(8, Math.round((logisticsCount / total) * 100))}%`,
                      color: "bg-[#B4A0E5]",
                    },
                    {
                      label: "Other",
                      height: `${Math.max(8, Math.round((otherCount / total) * 100))}%`,
                      color: "bg-[#86E3CE]",
                    },
                  ];
                })().map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full max-w-[36px] bg-zinc-100 dark:bg-zinc-800 rounded-t-xl h-full flex items-end">
                      <div
                        className={`w-full rounded-t-xl ${bar.color} transition-all duration-500`}
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono truncate w-full text-center">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Traffic by Location / Lead Qualification Intent (Donut Chart) */}
            <div className="snow-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
                  Lead Intent Distribution
                </h3>
                <span className="text-[11px] font-mono text-emerald-500">
                  HOT + WARM: {Math.round((metrics.hotPercentage || 0) + (metrics.warmPercentage || 0))}%
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-2">
                {/* SVG Donut Chart */}
                <div className="relative h-40 w-40 flex items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <path
                      className="text-zinc-100 dark:text-zinc-800"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* HOT Segment (Blue) */}
                    <path
                      stroke="#3B82F6"
                      strokeDasharray={`${metrics.hotPercentage || 0}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* WARM Segment (Purple) */}
                    <path
                      stroke="#A855F7"
                      strokeDasharray={`${metrics.warmPercentage || 0}, 100`}
                      strokeDashoffset={`-${metrics.hotPercentage || 0}`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* COLD Segment (Teal) */}
                    <path
                      stroke="#86E3CE"
                      strokeDasharray={`${metrics.coldPercentage || 0}, 100`}
                      strokeDashoffset={`-${(metrics.hotPercentage || 0) + (metrics.warmPercentage || 0)}`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-bold font-mono text-inherit">
                      {Math.round(metrics.hotPercentage || 0)}%
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono">High Intent</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3 text-xs w-full max-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="font-medium text-inherit">HOT (Enterprise)</span>
                    </div>
                    <span className="font-mono text-zinc-400">{Math.round(metrics.hotPercentage || 0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                      <span className="font-medium text-inherit">WARM (Consultative)</span>
                    </div>
                    <span className="font-mono text-zinc-400">{Math.round(metrics.warmPercentage || 0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#86E3CE]" />
                      <span className="font-medium text-inherit">COLD (Nurture)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 4: SNOWUI DATA TABLE (Order List / Lead Ingestion Table)               */}
          {/* ========================================================================= */}
          <div className="snow-card p-6 space-y-4">
            {/* Table Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
              <div>
                <h3 className="text-base font-bold text-inherit">Order List / Lead Inquiries</h3>
                <p className="text-xs text-zinc-400">Live PostgreSQL records with bi-directional CRM telemetry</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {(["ALL", "HOT", "WARM", "COLD"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setClassification(t);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      classification === t
                        ? theme === "dark"
                          ? "bg-white text-black font-semibold"
                          : "bg-black text-white font-semibold"
                        : "text-zinc-400 hover:text-inherit"
                    }`}
                  >
                    {t === "ALL" ? "All Leads" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => fetchData()}
                  className="px-2 py-0.5 rounded bg-red-500 text-white font-medium hover:bg-red-600 text-[11px]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Action Bar (Search, Filters, Inbound button) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by name, company..."
                    className={`w-full h-8 pl-8 pr-3 rounded-lg text-xs border ${
                      theme === "dark"
                        ? "border-white/[0.08] bg-white/[0.05] text-white placeholder-zinc-500 focus:border-blue-500"
                        : "border-black/[0.06] bg-black/[0.02] text-[#1C1C1C] placeholder-zinc-400 focus:border-zinc-400"
                    } focus:outline-none`}
                  />
                </div>

                {/* Industry Filter */}
                <select
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value);
                    setPage(1);
                  }}
                  className={`h-8 px-2.5 rounded-lg text-xs border ${
                    theme === "dark"
                      ? "border-white/[0.08] bg-white/[0.05] text-white"
                      : "border-black/[0.06] bg-black/[0.02] text-[#1C1C1C]"
                  } focus:outline-none`}
                >
                  <option value="ALL">All Industries</option>
                  {(data?.availableIndustries || [
                    "B2B SaaS / Software",
                    "Fintech & Financial Services",
                    "Healthcare & Life Sciences",
                    "Manufacturing & Logistics",
                    "Professional & Advisory Services",
                  ]).map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className={`h-8 px-2.5 rounded-lg text-xs border ${
                    theme === "dark"
                      ? "border-white/[0.08] bg-white/[0.05] text-white"
                      : "border-black/[0.06] bg-black/[0.02] text-[#1C1C1C]"
                  } focus:outline-none`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="MEETING_BOOKED">Meeting Booked</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>

                {/* Date Range */}
                <select
                  value={dateRange}
                  onChange={(e) => {
                    setDateRange(e.target.value);
                    setPage(1);
                  }}
                  className={`h-8 px-2.5 rounded-lg text-xs border ${
                    theme === "dark"
                      ? "border-white/[0.08] bg-white/[0.05] text-white"
                      : "border-black/[0.06] bg-black/[0.02] text-[#1C1C1C]"
                  } focus:outline-none`}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/audit"
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Inbound Lead</span>
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-inherit text-zinc-400 text-[11px] font-mono uppercase tracking-wider select-none">
                    <th className="py-3 px-3 w-8">
                      <input type="checkbox" className="rounded border-zinc-400" />
                    </th>
                    <th className="py-3 px-3">Order / ID</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-inherit"
                      onClick={() => handleSort("company_name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>User / Prospect</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-inherit"
                      onClick={() => handleSort("company_name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Project / Company</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-inherit"
                      onClick={() => handleSort("lead_score")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Score & Tier</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Status</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-inherit"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {loading && !data ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        <RefreshCw className="h-4 w-4 animate-spin inline mr-2" /> Loading records...
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        No lead inquiries matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead, idx) => {
                      const initials = lead.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      const isHot = lead.classification === "HOT";
                      const isWarm = lead.classification === "WARM";

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" className="rounded border-zinc-400" />
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                            #LD-{9800 + idx}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                                {initials || "FF"}
                              </div>
                              <div>
                                <div className="font-semibold text-inherit">{lead.full_name}</div>
                                <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                                  {lead.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-inherit">{lead.company_name}</div>
                            <div className="text-[11px] text-zinc-400">{lead.industry}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                  isHot
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : isWarm
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                                }`}
                              >
                                {lead.classification || "PENDING"}
                              </span>
                              <span className="font-mono text-xs font-semibold text-inherit">
                                {lead.lead_score || "--"}/100
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  lead.status === "QUALIFIED"
                                    ? "bg-emerald-500"
                                    : lead.status === "MEETING_BOOKED"
                                    ? "bg-blue-500"
                                    : lead.status === "CONTACTED"
                                    ? "bg-purple-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              {lead.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                            {new Date(lead.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="p-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-zinc-400 hover:text-inherit"
                                title="Inspect Lead Telemetry"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {userRole === "admin" && (
                                <button
                                  onClick={() =>
                                    handleOpenDelete(
                                      "delete_single",
                                      lead.id,
                                      `${lead.company_name} (${lead.full_name})`
                                    )
                                  }
                                  className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors"
                                  title="Delete Lead (Admin Only)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-inherit text-xs text-zinc-400">
                <span>
                  Showing {leads.length} of {data.totalFilteredCount} inquiries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-inherit hover:bg-black/[0.05] dark:hover:bg-white/[0.05] disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-mono text-inherit">
                    {page} / {data.totalPages}
                  </span>
                  <button
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    className="p-1.5 rounded border border-inherit hover:bg-black/[0.05] dark:hover:bg-white/[0.05] disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDEBAR (Notifications, Activities, Contacts from SnowUI)          */}
      {/* ========================================================================= */}
      {isRightSidebarOpen && (
        <aside
          className={`w-72 shrink-0 border-l ${
            theme === "dark" ? "border-white/[0.08] bg-[#1B1B1E]" : "border-black/[0.06] bg-white"
          } hidden xl:flex flex-col justify-between transition-all duration-200 z-20 select-none overflow-y-auto`}
        >
          <div className="p-5 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <span className="text-xs font-bold uppercase tracking-wider text-inherit">Notifications</span>
              <button
                onClick={() => setIsRightSidebarOpen(false)}
                className="text-zinc-400 hover:text-inherit p-1 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Live Notifications Feed */}
            <div className="space-y-3">
              {leads.length > 0 ? (
                leads.slice(0, 4).map((l) => (
                  <div key={l.id} className="flex items-start gap-2.5 text-xs">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-inherit leading-snug">
                        {l.full_name} ({l.company_name}) qualified as {l.classification || "PENDING"} ({l.lead_score ?? "--"}/100)
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-zinc-400">No recent notifications</p>
              )}
            </div>

            {/* Live Activities Feed */}
            <div className="pt-4 border-t border-inherit">
              <div className="text-xs font-bold uppercase tracking-wider text-inherit mb-3">Recent Activity</div>
              <div className="space-y-3">
                {leads.length > 0 ? (
                  leads.slice(0, 5).map((l) => (
                    <div key={`act-${l.id}`} className="flex items-start gap-2.5 text-xs">
                      <div className="h-6 w-6 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {l.full_name[0] || "L"}
                      </div>
                      <div>
                        <p className="font-medium text-inherit leading-snug">
                          {l.status.replace("_", " ")}: {l.company_name}
                        </p>
                        <span className="text-[10px] text-zinc-400 font-mono">{l.industry}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-zinc-400">No activity yet</p>
                )}
              </div>
            </div>

            {/* Contacts Panel */}
            <div className="pt-4 border-t border-inherit">
              <div className="text-xs font-bold uppercase tracking-wider text-inherit mb-3">Contacts</div>
              <div className="space-y-2">
                {mockContacts.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`h-6 w-6 rounded-full ${c.color} text-white flex items-center justify-center font-bold text-[10px]`}>
                        {c.avatar}
                      </div>
                      <span className="font-medium text-inherit">{c.name}</span>
                    </div>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        c.status === "online"
                          ? "bg-emerald-500"
                          : c.status === "busy"
                          ? "bg-rose-500"
                          : "bg-zinc-400"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-inherit text-center text-[11px] text-zinc-400 font-mono">
            FlowFoundry Telemetry • RFC-0419
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* DETAIL MODAL / DRAWER (SnowUI Slide-Over)                                 */}
      {/* ========================================================================= */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className={`h-full w-full max-w-lg ${
            theme === "dark" ? "bg-[#1E1E22] text-white border-white/[0.08]" : "bg-white text-[#1C1C1C] border-black/[0.06]"
          } border-l sm:border sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-inherit">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                  <Building className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">{selectedLead.company_name}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{selectedLead.full_name} &bull; {selectedLead.industry}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-inherit hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Top Summary Badges */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl border border-inherit bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">Lead Score</span>
                  <span className="text-lg font-bold font-mono text-inherit mt-0.5 block">
                    {selectedLead.lead_score ? `${selectedLead.lead_score}/100` : "Unscored"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-inherit bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">Classification</span>
                  <span className="text-sm font-bold font-mono text-amber-500 mt-1 block">
                    {selectedLead.classification || "PENDING"}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-inherit bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">Priority</span>
                  <span className="text-sm font-bold font-mono text-inherit mt-1 block">
                    {selectedLead.estimated_priority || "STANDARD"}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="p-4 rounded-xl border border-inherit bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                <label className="text-xs font-semibold block text-inherit">
                  Pipeline Status Lifecycle
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["NEW", "CONTACTED", "QUALIFIED", "MEETING_BOOKED", "WON", "LOST"] as LeadStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus(selectedLead.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                          selectedLead.status === st
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-black/[0.05] dark:bg-white/[0.05] text-zinc-400 hover:text-inherit"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Contact Coordinates */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-1.5 text-inherit">
                  <Mail className="h-3.5 w-3.5 text-zinc-400" /> Contact Information
                </h4>
                <div className="p-3 rounded-xl border border-inherit space-y-1.5 text-zinc-500 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <a href={`mailto:${selectedLead.email}`} className="text-blue-500 hover:underline">
                      {selectedLead.email}
                    </a>
                  </div>
                  {selectedLead.phone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="text-inherit">{selectedLead.phone}</span>
                    </div>
                  )}
                  {selectedLead.website && (
                    <div className="flex justify-between">
                      <span>Website:</span>
                      <a
                        href={selectedLead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1"
                      >
                        {selectedLead.website} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Operational Profile */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-1.5 text-inherit">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" /> Operational Scale
                </h4>
                <div className="p-3 rounded-xl border border-inherit space-y-1.5 text-zinc-500 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Employees:</span>
                    <span className="text-inherit">{selectedLead.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Volume:</span>
                    <span className="font-mono text-inherit">{selectedLead.monthly_lead_volume}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Tools:</span>
                    <span className="text-inherit">{selectedLead.current_tools}</span>
                  </div>
                </div>
              </div>

              {/* Problem Statement */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-1.5 text-inherit">
                  <FileText className="h-3.5 w-3.5 text-zinc-400" /> Stated Bottleneck
                </h4>
                <div className="p-3 rounded-xl border border-inherit bg-black/[0.02] dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {selectedLead.biggest_problem}
                </div>
              </div>

              {/* Administrative Danger Zone */}
              {userRole === "admin" && (
                <div className="pt-4 border-t border-inherit">
                  <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-red-500 flex items-center gap-1.5 text-xs">
                        <Trash2 className="h-3.5 w-3.5" /> Administrative Actions
                      </span>
                      <button
                        onClick={() =>
                          handleOpenDelete(
                            "delete_single",
                            selectedLead.id,
                            `${selectedLead.company_name} (${selectedLead.full_name})`
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-sm transition-colors"
                      >
                        Delete Record
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Permanently delete this record from PostgreSQL. Requires admin password confirmation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSWORD PROTECTION & DELETION MODAL                                      */}
      {/* ========================================================================= */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md ${
              theme === "dark" ? "bg-[#1E1E22] text-white border-white/[0.08]" : "bg-white text-[#1C1C1C] border-black/[0.08]"
            } border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-500">
                    {deleteTarget.action === "purge_all" ? "Purge Entire Database" : "Confirm Lead Deletion"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {deleteTarget.action === "purge_all"
                      ? "Permanently delete all PostgreSQL lead records"
                      : `Target: ${deleteTarget.targetName || deleteTarget.leadId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="text-zinc-400 hover:text-inherit p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Warning Text */}
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
              {deleteTarget.action === "purge_all"
                ? "CRITICAL WARNING: This will permanently wipe all lead records, scores, and qualification history. This action cannot be reversed."
                : "This record will be permanently deleted from Supabase PostgreSQL. This action cannot be reversed."}
            </div>

            {/* Error & Success Messages */}
            {deleteError && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 text-xs">
                {deleteError}
              </div>
            )}
            {deleteSuccessMsg && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs">
                {deleteSuccessMsg}
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-3 pt-1">
              {/* Admin Password Input */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-inherit">
                  Admin Security Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    disabled={isDeleting}
                    className={`w-full h-9 pl-9 pr-3 rounded-lg text-xs border ${
                      theme === "dark"
                        ? "border-white/[0.1] bg-white/[0.05] text-white focus:border-red-500"
                        : "border-black/[0.1] bg-black/[0.02] text-[#1C1C1C] focus:border-red-500"
                    } focus:outline-none`}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                  Default: configured in .env.local (ADMIN_PASSWORD)
                </p>
              </div>

              {/* Purge All Double-Confirmation Input */}
              {deleteTarget.action === "purge_all" && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-inherit">
                    Type <span className="font-mono text-red-500 font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    placeholder="DELETE"
                    disabled={isDeleting}
                    className={`w-full h-9 px-3 rounded-lg text-xs font-mono border ${
                      theme === "dark"
                        ? "border-white/[0.1] bg-white/[0.05] text-white focus:border-red-500"
                        : "border-black/[0.1] bg-black/[0.02] text-[#1C1C1C] focus:border-red-500"
                    } focus:outline-none`}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-inherit hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={
                  isDeleting ||
                  !adminPassword.trim() ||
                  (deleteTarget.action === "purge_all" && confirmPhrase.trim().toUpperCase() !== "DELETE")
                }
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3" />
                    <span>{deleteTarget.action === "purge_all" ? "Purge All Data" : "Confirm Delete"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
