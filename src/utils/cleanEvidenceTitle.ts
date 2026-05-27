export function cleanEvidenceTitle(title: string, fallback = 'Evidence Exhibit'): string {
  const normalized = title
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cleaned = normalized
    .replace(/^.*?\b(who|whose|by|from|regarding)\b\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || fallback;
}
