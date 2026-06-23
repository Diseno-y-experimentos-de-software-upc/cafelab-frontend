/** Fecha local del usuario en YYYY-MM-DD (para input type="date"). */
export function todayLocalYyyyMmDd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Normaliza respuesta API (ISO o YYYY-MM-DD) al formato del input date. */
export function toYyyyMmDdDateInput(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') {
    return '';
  }
  const s = String(value).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}
