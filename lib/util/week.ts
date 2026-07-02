/**
 * ISO week helpers. Evergreen Run rolls load up per ISO week (Monday start),
 * matching weekly_load.week_start. All math is done in UTC so a run's week is
 * stable regardless of where it is viewed.
 */

/** The Monday (UTC) of the ISO week containing `date`, as a YYYY-MM-DD string. */
export function isoWeekStart(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date.getTime());
  // getUTCDay: 0=Sun..6=Sat. Shift so Monday is the start.
  const day = d.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return monday.toISOString().slice(0, 10);
}

/** Exclusive end (next Monday) of the ISO week starting at `weekStart` (YYYY-MM-DD). */
export function isoWeekEnd(weekStart: string): string {
  const d = new Date(`${weekStart}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}
