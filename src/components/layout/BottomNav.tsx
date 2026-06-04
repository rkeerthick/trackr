"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  Wallet, Calculator, RefreshCw, Users, Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Home",         icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight  },
  { href: "/analytics",    label: "Analytics",    icon: PieChart        },
  { href: "/budgets",      label: "Budgets",      icon: Target          },
  { href: "/loans",        label: "Loans",        icon: Wallet          },
  { href: "/splits",       label: "Splits",       icon: Calculator      },
  { href: "/recurring",    label: "Recurring",    icon: RefreshCw       },
  { href: "/contacts",     label: "Contacts",     icon: Users           },
  { href: "/settings",     label: "Settings",     icon: Settings        },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav
        className="flex overflow-x-auto no-scrollbar rounded-2xl px-2 py-2"
        style={{
          background:   "#1E2B3C",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)",
          border:       "1px solid rgba(255,255,255,0.08)",
          maxWidth:     "100%",
        }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-shrink-0 rounded-xl px-3 py-1.5 transition-all duration-150"
              style={{
                minWidth:   60,
                background: active ? "rgba(58,123,213,0.18)" : "transparent",
                color:      active ? "#3A7BD5" : "#8FA8C0",
              }}
            >
              <Icon size={19} />
              <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "inherit" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
