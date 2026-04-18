"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarDays,
  BarChart3,
  Home,
  Plus,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: Home },
  { href: "/applications", label: "看板", icon: LayoutGrid },
  { href: "/calendar", label: "日历", icon: CalendarDays },
  { href: "/stats", label: "统计", icon: BarChart3 },
];

export function NavSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="w-56 shrink-0 border-r bg-background/60 backdrop-blur">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Briefcase className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">求职看板</div>
            <div className="text-xs text-muted-foreground">Job Tracker</div>
          </div>
        </div>

        <div className="px-3">
          <Link
            href="/applications/new"
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" /> 新建申请
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-muted text-foreground font-medium",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          单用户模式 · 本地 SQLite
        </div>
      </div>
    </aside>
  );
}
