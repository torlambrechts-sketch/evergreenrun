import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/coach", label: "Note" },
  { href: "/plan", label: "Week" },
  { href: "/score", label: "Score" },
  { href: "/runs", label: "Runs" },
  { href: "/strength", label: "Strength" },
  { href: "/feel", label: "Check-in" },
  { href: "/profile", label: "Profile" },
];

/** Compact top nav for signed-in users on small screens (desktop uses the sidebar). */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex items-center gap-3 px-4 py-2">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm font-extrabold tracking-tight">Evergreen</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="shrink-0">
          <button type="submit" className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
