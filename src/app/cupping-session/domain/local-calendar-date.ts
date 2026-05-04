/** Fecha local del dispositivo en YYYY-MM-DD (sin desfase UTC de {@link Date#toISOString}). */
export function dateToIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayIsoLocal(): string {
  return dateToIsoLocal(new Date());
}

/** true si {@code isoDate} (YYYY-MM-DD) es estrictamente anterior a hoy en calendario local. */
export function isIsoDateStrictlyBeforeToday(isoDate: string): boolean {
  const t = todayIsoLocal();
  const s = (isoDate ?? '').slice(0, 10);
  if (s.length !== 10) {
    return true;
  }
  return s < t;
}
