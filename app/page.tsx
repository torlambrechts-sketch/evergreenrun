import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Evergreen Run</h1>
        <p className="text-muted-foreground">
          Durability-first running for runners 35+. Every week, know how to keep
          running without overdoing it.
        </p>
      </div>
      <Link href="/login" className={buttonVariants({ size: "lg" })}>
        Get started
      </Link>
    </main>
  );
}
