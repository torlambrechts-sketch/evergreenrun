/** Cadence page header: a Space Mono eyebrow over a bold title, with optional action slot. */
export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 text-[1.7rem] font-extrabold leading-none tracking-tight">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
