/**
 * The dark evergreen brand panel shown beside the auth forms. Copy stays true to
 * Evergreen Run — durability, kindness — not race/streak language.
 */
export function BrandPanel({
  heading,
  points,
}: {
  heading: string;
  points?: string[];
}) {
  return (
    <div
      className="relative hidden w-[44%] flex-col overflow-hidden p-11 text-white md:flex"
      style={{ background: "linear-gradient(165deg,#123f39,#0c2a26)" }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(90,209,176,.22), transparent 65%)",
        }}
      />
      <div className="relative flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#5ad1b0]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#0c2a26]" />
        </span>
        <span className="text-lg font-extrabold">Evergreen Run</span>
      </div>

      <div className="relative mt-auto">
        <h2 className="text-[2rem] font-extrabold leading-[1.14] tracking-tight text-balance">
          {heading}
        </h2>
        {points && (
          <ul className="mt-6 grid gap-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#5ad1b0]/15">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5ad1b0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                </span>
                <span className="text-[0.95rem] font-medium text-[#d3e7e2]">{p}</span>
              </li>
            ))}
          </ul>
        )}
        {!points && (
          <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-[#9fc7bf]">
            Adaptive, kind guidance and a durability score — so you know how to
            keep running without overdoing it.
          </p>
        )}
      </div>
    </div>
  );
}
