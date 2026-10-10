// Formation from the student's ADE selection as a short slug for anonymous
// analytics ("BUT MMI" → "but-mmi"). Only the formation level is ever sent:
// year, TD and TP groups are too small to stay anonymous.
export function toFormationSlug(label) {
  return String(label ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/g, '')
}
