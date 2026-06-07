"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, initials } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  Users, Calculator, RefreshCw, Wallet, Trophy,
  Settings, LogOut, ChevronLeft, Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/app.store";

const NAV = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight  },
  { href: "/analytics",    label: "Analytics",    icon: PieChart        },
  { href: "/budgets",      label: "Budgets",      icon: Target          },
  { href: "/goals",        label: "Goals",        icon: Trophy          },
  { href: "/loans",        label: "Loans",        icon: Wallet          },
  { href: "/splits",       label: "Splits",       icon: Calculator      },
  { href: "/recurring",    label: "Recurring",    icon: RefreshCw       },
  { href: "/contacts",     label: "Contacts",     icon: Users           },
  { href: "/ai-chat",      label: "AI Assistant", icon: Sparkles        },
];

const BG      = "#1E2B3C";
const ACTIVE  = "#3A7BD5";
const MUTED   = "#8FA8C0";
const HOVER   = "rgba(255,255,255,0.08)";

interface Props {
  user: { name?: string | null; email?: string | null };
}

function NavItem({
  href, label, icon: Icon, active, collapsed,
}: {
  href: string; label: string; icon: React.ElementType;
  active: boolean; collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2 w-full"
      )}
      style={{
        background: active ? ACTIVE : "transparent",
        color:      active ? "white" : MUTED,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = HOVER;
          (e.currentTarget as HTMLElement).style.color      = "white";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color      = MUTED;
        }
      }}
    >
      <Icon size={16} />
      {!collapsed && (
        <em style={{ fontStyle: "normal", color: "inherit" }}>{label}</em>
      )}
    </Link>
  );
}

export default function Sidebar({ user }: Props) {
  const pathname  = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle    = useAppStore((s) => s.toggleSidebar);

  const settingsActive = pathname === "/settings";

  return (
    <aside
      className={cn(
        "flex flex-col h-full flex-shrink-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[200px]"
      )}
      style={{ background: BG }}
    >
      {/* Logo row */}
      <div className={cn(
        "flex items-center py-5 flex-shrink-0",
        collapsed ? "justify-center px-0" : "justify-between px-4"
      )}>
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "white" }}>
            Trackr
          </span>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-white/10"
          style={{ color: MUTED }}
        >
          <ChevronLeft size={15} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto space-y-0.5", collapsed ? "px-0" : "px-2")}>
        {NAV.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + "/")}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom */}
      <div className={cn("pb-4 space-y-0.5 flex-shrink-0", collapsed ? "px-0" : "px-2")}>
        {/* Settings */}
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={settingsActive}
          collapsed={collapsed}
        />

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150",
            collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2 w-full"
          )}
          style={{ color: MUTED }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = HOVER;
            (e.currentTarget as HTMLElement).style.color      = "white";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color      = MUTED;
          }}
        >
          <LogOut size={16} />
          {!collapsed && <em style={{ fontStyle: "normal", color: "inherit" }}>Sign out</em>}
        </button>

        {/* User chip */}
        <div
          className={cn(
            "flex items-center mt-2 rounded-lg",
            collapsed ? "justify-center py-2" : "gap-2 px-3 py-2"
          )}
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
            style={{ background: ACTIVE, color: "white" }}
          >
            {user.name ? initials(user.name) : "?"}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[12px] font-medium truncate" style={{ color: "white" }}>
                {user.name ?? "User"}
              </p>
              <p className="text-[10px] truncate" style={{ color: MUTED }}>
                {user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
