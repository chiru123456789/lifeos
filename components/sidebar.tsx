"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Clock3,
  Flame,
  Dumbbell,
  Utensils,
  ListChecks,
  Calendar,
  BarChart3,
  Settings,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Today", href: "/today", icon: CalendarDays },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Timetable", href: "/timetable", icon: Clock3 },
  { name: "Habits", href: "/habits", icon: Flame },
  { name: "Workout", href: "/workout", icon: Dumbbell },
  { name: "Diet", href: "/diet", icon: Utensils },
  { name: "Rules", href: "/rules", icon: ListChecks },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Progress", href: "/progress", icon: BarChart3 },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-slate-950 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            LIFEOS
          </Link>

          <button
            onClick={onMobileClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/settings"
            onClick={onMobileClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
              pathname.startsWith("/settings")
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}