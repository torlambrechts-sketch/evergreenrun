import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/coach", label: "Note" },
  { href: "/plan", label: "Plan" },
  { href: "/score", label: "Score" },
  { href: "/runs", label: "Runs" },
  { href: "/strength", label: "Strength" },
  { href: "/feel", label: "Check-in" },
  { href: "/profile", label: "Profile" },
];

/** Consistent top nav for signed-in users. Rendered from the root layout. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-2">
        <Link href="/dashboard" className="shrink-0 text-sm font-semibold tracking-tight">
          Evergreen Run
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="shrink-0">
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
