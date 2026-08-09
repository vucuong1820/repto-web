const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Program and exercise names are user-typed and land in both the document body
 * and the Open Graph meta tags. Everything derived from a payload goes through
 * here first.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[&<>"']/g, (char) => ENTITIES[char])
}
