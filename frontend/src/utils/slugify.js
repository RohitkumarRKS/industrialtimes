export const createSlug = (text) => {
  if (!text) return 'news';
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')                // Replace spaces/whitespace with hyphens
    .replace(/[^\p{L}\p{N}-]+/gu, '')    // Keep Unicode letters, numbers, and hyphens
    .replace(/-+/g, '-')                 // Collapse multiple hyphens
    .replace(/(^-|-$)/g, '');            // Strip leading/trailing hyphens
  return slug || 'news';
};
