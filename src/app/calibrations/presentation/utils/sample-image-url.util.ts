/** Solo http(s) para usar en <img src> (evita javascript:, etc.). */
export function isSafeHttpUrlForImgPreview(url: string | null | undefined): boolean {
  const u = url?.trim() ?? '';
  if (u.length < 8) {
    return false;
  }
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
