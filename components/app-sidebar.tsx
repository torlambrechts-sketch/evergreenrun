"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  NotebookPen,
  CalendarRange,
  Gauge,
  Footprints,
  Dumbbell,
  HeartPulse,
  User,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Home", Icon: House },
  { href: "/coach", label: "Weekly note", Icon: NotebookPen },
  { href: "/plan", label: "This week", Icon: CalendarRange },
  { href: "/score", label: "Durability", Icon: Gauge },
  { href: "/runs", label: "Runs", Icon: Footprints },
  { href: "/strength", label: "Strength", Icon: Dumbbell },
  { href: "/feel", label: "Check-in", Icon: HeartPulse },
];

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const initial = (user.name || user.email || "R").charAt(0).toUpperCase();

  return (
    <aside className="hidden w-56 flex-none flex-col gap-1 border-r border-border bg-sidebar px-3.5 py-5 md:flex">
      <Link href="/dashboard" className="mb-4 flex items-center gap-2.5 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-[1.05rem] font-extrabold tracking-tight">Evergreen</span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent font-bold text-accent-foreground"
                  : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-3">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#5ad1b0] text-sm font-extrabold text-primary-foreground">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8rem] font-bold leading-tight">
              {user.name || "Your profile"}
            </span>
            <span className="block truncate text-[0.68rem] text-muted-foreground">
              {user.email}
            </span>
          </span>
          <User size={15} className="flex-none text-muted-foreground" />
        </Link>
        <form action="/auth/signout" method="post" className="px-2 pt-1">
          <button
            type="submit"
            className="text-[0.72rem] font-semibold text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
